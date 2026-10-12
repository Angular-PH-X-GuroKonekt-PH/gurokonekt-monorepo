# Mentor Booking Email Design

## Goal

When a mentee successfully creates a booking, immediately email only the booked mentor. Record the application email attempt in PostgreSQL so its current outcome is inspectable. Booking creation must remain successful when SMTP sending fails.

This is the first application-email delivery slice. It does not add retries, a worker, Railway Cron, or changes to Supabase Auth emails.

## User-visible behavior

- A successful new booking triggers one email to the booked mentor.
- The email identifies the mentee and contains the requested date/time, the mentor's configured session duration when available, the mentee's booking notes when present, status `Pending`, and a link to the mentor booking overview.
- No other mentor receives the email.
- An SMTP failure does not roll back or report failure for the successfully created booking.
- Reprocessing the same booking-created event cannot create a second delivery record or send a duplicate email.

## Persistence

Add an `EmailDeliveryStatus` Prisma enum with `PENDING`, `SENT`, and `FAILED`.

Add an `EmailDelivery` model containing:

- `id`: UUID primary key.
- `eventKey`: unique business-event key. This feature uses `booking-created:<bookingId>`.
- `eventType`: string value `BOOKING_CREATED_MENTOR`.
- `bookingId`: optional foreign key to `Booking`.
- `recipientEmail`: the intended recipient.
- `status`: defaults to `PENDING`.
- `attemptCount`: defaults to zero.
- `providerMessageId`: nullable SMTP message identifier.
- `lastError`: nullable sanitized failure message.
- `attemptedAt`, `sentAt`, `createdAt`, and `updatedAt` timestamps.

The table stores no email body, password, SMTP credentials, security token, or deactivation link.

## Components

### `MailService`

Add `sendBookingCreatedEmail`. It renders the subject and HTML, escapes user-provided text, sends through the existing Nodemailer transporter, returns Nodemailer's send result on acceptance, and throws on transport failure. Existing mail methods are not migrated in this slice.

### `EmailDeliveryService`

Add a focused service that receives an existing delivery ID and the booking-email template data. It calls `MailService`, then:

- marks the row `SENT`, records one attempt, `attemptedAt`, `sentAt`, and `providerMessageId` when SMTP accepts the message; or
- marks the row `FAILED`, records one attempt, `attemptedAt`, and a sanitized `lastError` when SMTP throws.

The service logs operational errors through NestJS but does not throw email or delivery-status update failures back into the completed booking request.

### `BookingService`

Extend the approved-mentor lookup with the mentor email, name, timezone, and configured session duration needed by the email. Do not add the mentor email to the returned booking payload.

Create the `Booking` and its `PENDING EmailDelivery` row in the same Prisma transaction. After commit, call `EmailDeliveryService` synchronously for the immediate first attempt. Existing in-app notifications remain independent and continue using their current best-effort behavior.

### Module wiring

Export `EmailDeliveryService` from a small email-delivery module that imports `PrismaModule` and `MailModule`. Import that module into `BookingModule`.

## Data flow

1. Validate that the target is an approved mentor, that the requested time is future-dated, and that no booking conflict exists.
2. In one PostgreSQL transaction, create the pending booking and the unique `PENDING` email-delivery row.
3. Commit the transaction.
4. Attempt SMTP delivery immediately.
5. Update the delivery row to `SENT` or `FAILED`.
6. Create the existing in-app notifications.
7. Return the successful booking response regardless of the SMTP result.

If creation of the booking or its required delivery record fails before commit, neither record is committed and the existing booking-creation error response is returned.

## Duplicate prevention

The database unique constraint on `eventKey` is the final guard. A booking-created notification uses `booking-created:<bookingId>`, because creation is a one-time event for a booking. No schedule version is needed for this feature.

The implementation must treat an existing event key as already registered and must not issue a second SMTP send for that booking event.

## Error semantics

- `SENT` means the SMTP server accepted the message; it does not prove inbox delivery.
- Synchronous SMTP rejection, authentication failure, connection failure, or timeout produces `FAILED` when the database status update succeeds.
- Error text is sanitized and truncated before storage; stack traces and credentials are not persisted.
- If SMTP succeeds but the `SENT` update fails, the service logs the database problem and leaves the row in its last stored state. This narrow ambiguity cannot be eliminated without provider idempotency or a worker and is accepted for this first slice.
- There is no automatic retry. Failed and abandoned pending rows remain available for inspection and a later retry implementation.

## Configuration

Reuse the current SMTP environment variables. Add one frontend base URL environment variable for the email link, using the repository's established deployment naming if one exists; otherwise use `WEB_APP_URL`. The link targets `/booking-overview`. Missing configuration should fall back only to an explicitly documented local-development URL, not an arbitrary production address.

## Testing

Use Jest and test first.

- `MailService` sends only to the provided mentor address, escapes user-supplied fields, contains the required booking information, returns the provider message ID, and propagates transporter failure.
- `EmailDeliveryService` changes `PENDING` to `SENT` on SMTP acceptance.
- `EmailDeliveryService` changes `PENDING` to `FAILED` with a sanitized error on SMTP failure and does not throw to its caller.
- `BookingService` atomically creates the booking and one `PENDING` delivery record with `booking-created:<bookingId>`.
- `BookingService` calls immediate delivery only after the transaction resolves.
- SMTP failure still produces the normal successful booking response.
- The unique event key prevents a second delivery row for the same booking-created event.

Run the focused API tests, Prisma validation/generation checks, API type checking or build, and then the repository test suite. Any unrelated existing failures must be reported rather than concealed.

## Out of scope

- Retries, backoff, Railway Cron, an always-running worker, Redis, or BullMQ.
- Delivery and bounce webhooks.
- An administrator UI for email records.
- Migrating existing mentor-approval, rejection, deactivation, or account-deactivation SMTP calls.
- Changing Supabase registration, verification, OTP, or password-reset email behavior.
- Booking-decision and booking-reschedule emails.
