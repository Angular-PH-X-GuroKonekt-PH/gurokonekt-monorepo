# Gurokonekt API

This is the backend API for **Gurokonekt**, built using **NestJS**, **Nx monorepo**, **Prisma**, and **Supabase**. It provides user management, file uploads (avatars & documents), and Mentee/Mentor profile management.

---

## Table of Contents

* [Installation](#installation)
* [Environment Variables](#environment-variables)
* [Running the API](#running-the-api)
* [Prisma Setup](#prisma-setup)
* [Endpoints](#endpoints)

  * [Upload](#upload)

    * [Upload Avatar](#upload-avatar)
    * [Upload Document](#upload-document)
    * [Delete Avatar / Document](#delete-avatar--document)
  * [Mentee](#mentee)

    * [Get Profile](#get-profile)
    * [Update Profile](#update-profile)
    * [Delete Account](#delete-account)
* [Nx Commands](#nx-commands)
* [Notes / Tips](#notes--tips)

---

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd gurokonekt-monorepo

# Install dependencies
npm install
```

---

## Environment Variables

Create a `.env` file in `apps/api`:

```env
# Supabase
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-supabase-key>
DATABASE_URL="postgresql://[USER]:[YOUR-PASSWORD]@[HOST]:[PORT]/[DATABASE]?pgbouncer=true"
DIRECT_URL="postgresql://[USER]:[YOUR-PASSWORD]@[HOST]:[PORT]/[DATABASE]"
```

---

## Running the API

### Development

```bash
# Serve the API
npx nx serve api
```

### Build

```bash
npx nx build api
```

> ⚠️ **Note:** Prisma client should not be bundled with Webpack. Use `nx build` with TypeScript compilation.

---

## Prisma Setup

1. Generate Prisma client:

```bash
npx prisma generate
```

2. Apply migrations:

```bash
npx prisma migrate dev --name init
```

3. PrismaService is global and exported in `PrismaModule`:

```ts
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

All modules needing DB access import `PrismaModule`.

---

## Endpoints

### Upload

**Base URL:** `/upload`

#### Upload Avatar

```http
POST /upload/avatar
Content-Type: multipart/form-data
Body: file=<File>
Headers:
  userId: <current-user-id>
```

Response:

```json
{
  "status": "Success",
  "message": "File uploaded successfully",
  "data": {
    "publicUrl": "<url>",
    "storagePath": "avatars/<userId>/<filename>",
    "fileType": "image/png",
    "fileSize": 12345,
    "fileName": "avatar.png"
  }
}
```

#### Upload Document

```http
POST /upload/document
Content-Type: multipart/form-data
Body: file=<File>
Headers:
  userId: <current-user-id>
```

Response format is similar to avatar.

#### Delete Avatar / Document

```http
DELETE /upload/avatar
DELETE /upload/document
Content-Type: application/json
Body:
{
  "storagePaths": [
    "avatars/<userId>/<filename>",
    "avatars/<userId>/<filename2>"
  ]
}
```

Response:

```json
{
  "status": "Success",
  "message": "File deleted successfully",
  "data": {
    "deleted": true,
    "path": ["avatars/<userId>/<filename>"]
  }
}
```

---

### Mentee

**Base URL:** `/mentee`

#### Get Profile

```http
GET /mentee/profile
Headers:
  menteeId: <current-user-id>
```

Response:

```json
{
  "status": "Success",
  "message": "Profile retrieved",
  "data": { ...MenteeProfile }
}
```

#### Update Profile

```http
PATCH /mentee/profile
Headers:
  menteeId: <current-user-id>
Body: JSON
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Learning NestJS",
  "language": "English",
  "learningGoals": ["API Development"],
  "areasOfInterest": ["Backend", "Database"],
  "preferredSessionType": "Online",
  "availability": ["Mon-Fri 9-5"]
}
```

#### Delete Account (Soft-delete)

```http
DELETE /mentee/account
Headers:
  menteeId: <current-user-id>
Body: JSON
{
  "adminOverride": false
}
```

---

## Nx Commands

| Command                  | Description                        |
| ------------------------ | ---------------------------------- |
| `nx serve api`           | Run API in development mode        |
| `nx build api`           | Build API (TypeScript compilation) |
| `npx prisma generate`    | Generate Prisma Client             |
| `npx prisma migrate dev` | Apply Prisma migrations            |

---

## Notes / Tips

* Prisma should **not be bundled with Webpack**; mark as external or skip bundling.
* `PrismaService` is global and shared across modules.
* File uploads use **Supabase storage**, `File` objects from frontend.
* Delete endpoints validate if the file path exists; you can add extra logic to detect avatars vs documents.
* Mentee endpoints handle **profile management and account soft-delete**.
