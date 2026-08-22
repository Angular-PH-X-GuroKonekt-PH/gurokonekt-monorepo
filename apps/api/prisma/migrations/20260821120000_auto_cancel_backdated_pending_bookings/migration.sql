-- Issue #374: a PENDING booking whose session_date_time has already passed can
-- never become a real session, so it must be cancelled automatically and both
-- participants notified. Runs in-database via pg_cron so it fires even when no
-- API instance is awake.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- session_date_time is `timestamp without time zone` holding UTC values (Prisma
-- writes UTC), so every comparison must use UTC rather than the server's now().
CREATE OR REPLACE FUNCTION public.cancel_backdated_pending_bookings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cancelled_count integer;
BEGIN
  WITH expired AS (
    UPDATE bookings
       SET status        = 'CANCELLED',
           cancel_reason = 'Automatically cancelled: the requested session date passed without mentor action',
           updated_at    = (now() AT TIME ZONE 'utc')
     WHERE status = 'PENDING'
       AND is_deleted = false
       AND session_date_time < (now() AT TIME ZONE 'utc')
    RETURNING id, mentee_id, mentor_id, session_date_time
  ),
  recipients AS (
    SELECT id AS booking_id,
           mentee_id AS user_id,
           'Booking Request Expired'::text AS title,
           'Your booking request was automatically cancelled because the requested session date passed before the mentor responded.'::text AS message
      FROM expired
    UNION ALL
    SELECT id,
           mentor_id,
           'Booking Request Expired'::text,
           'A pending booking request was automatically cancelled because its requested session date passed without a response.'::text
      FROM expired
  ),
  inserted AS (
    INSERT INTO notifications (id, user_id, title, message, type, status, reference_id, created_at, updated_at)
    SELECT gen_random_uuid()::text,
           user_id,
           title,
           message,
           'BOOKING'::notification_type,
           'UNREAD'::notification_status,
           booking_id,
           (now() AT TIME ZONE 'utc'),
           (now() AT TIME ZONE 'utc')
      FROM recipients
    RETURNING 1
  )
  SELECT count(*)::integer INTO cancelled_count FROM expired;

  RETURN cancelled_count;
END;
$$;

-- pg_cron is a managed-platform extension. It exists on Supabase but NOT on a
-- plain postgres image, which is what `docker compose up -d` gives local dev and
-- CI. Guard on availability so the migration still applies there — the function
-- above is created either way and can be invoked manually or by a test.
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS pg_cron';

    -- Re-running the migration must not stack duplicate schedules.
    EXECUTE $unschedule$
      SELECT cron.unschedule('cancel-backdated-pending-bookings')
       WHERE EXISTS (
         SELECT 1 FROM cron.job WHERE jobname = 'cancel-backdated-pending-bookings'
       )
    $unschedule$;

    -- Every 15 minutes: small enough that a backdated request is never actionable
    -- for long, cheap enough to be a no-op scan the rest of the time.
    EXECUTE $schedule$
      SELECT cron.schedule(
        'cancel-backdated-pending-bookings',
        '*/15 * * * *',
        'SELECT public.cancel_backdated_pending_bookings();'
      )
    $schedule$;
  ELSE
    RAISE NOTICE 'pg_cron is not available on this server; skipping job schedule. This is expected on local development and CI.';
  END IF;
END
$do$;
