# API Testing Guide

This guide explains how to test the API endpoints using either curl or Postman.

## Base URL

All endpoints are relative to the base URL:
```
http://localhost:3000
```

**Important:** All endpoints are prefixed with `/api`, so the actual path becomes `http://localhost:3000/api/[endpoint]`.

## API Documentation

Interactive API documentation is available through Swagger UI:
```
http://localhost:3000/api-docs
```

This provides a complete interface to test all endpoints with example requests and responses.

## User Endpoints

### Create a User

**Endpoint:** `POST /api/users`

**Curl:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "countryOrTimezone": "UTC",
    "acceptedTerms": true,
    "passwordHash": "hashed_password_here",
    "profileType": "mentee"
  }'
```

**Postman:**
- Method: POST
- URL: `http://localhost:3000/api/users`
- Headers: Content-Type: application/json
- Body (raw, JSON):
```json
{
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "countryOrTimezone": "UTC",
  "acceptedTerms": true,
  "passwordHash": "hashed_password_here",
  "profileType": "mentee"
}
```

### Get All Users

**Endpoint:** `GET /api/users`

**With query parameters:**
- `limit`: Number of users to return (default: 10)
- `offset`: Number of users to skip (default: 0)
- `search`: Search term for firstName, lastName, or email
- `includeArchived`: Include archived users (default: false)
- `sortBy`: Field to sort by (default: createdAt)
- `sortOrder`: Sort order (ASC or DESC, default: DESC)

**Curl:**
```bash
# Get all active users
curl -X GET http://localhost:3000/api/users

# Get users with pagination and search
curl -X GET "http://localhost:3000/api/users?limit=5&offset=0&search=john&includeArchived=false&sortBy=firstName&sortOrder=ASC"
```

**Postman:**
- Method: GET
- URL: `http://localhost:3000/api/users`
- Or with parameters: `http://localhost:3000/api/users?limit=5&offset=0&search=john`

### Get a Specific User

**Endpoint:** `GET /api/users/{id}`

**Curl:**
```bash
curl -X GET http://localhost:3000/api/users/user-id-here
```

**Postman:**
- Method: GET
- URL: `http://localhost:3000/api/users/user-id-here`

### Update a User

**Endpoint:** `PATCH /api/users/{id}`

**Curl:**
```bash
curl -X PATCH http://localhost:3000/api/users/user-id-here \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

**Postman:**
- Method: PATCH
- URL: `http://localhost:3000/api/users/user-id-here`
- Headers: Content-Type: application/json
- Body (raw, JSON):
```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

### Archive a User

**Endpoint:** `PATCH /api/users/{id}/archive`

**Curl:**
```bash
curl -X PATCH http://localhost:3000/api/users/user-id-here/archive \
  -H "Content-Type: application/json" \
  -d '{
    "isArchived": true,
    "archivedAt": "2025-12-03T10:00:00Z"
  }'
```

**Postman:**
- Method: PATCH
- URL: `http://localhost:3000/api/users/user-id-here/archive`
- Headers: Content-Type: application/json
- Body (raw, JSON):
```json
{
  "isArchived": true,
  "archivedAt": "2025-12-03T10:00:00Z"
}
```

### Delete a User

**Endpoint:** `DELETE /api/users/{id}`

**Note:** This performs a soft delete (archives the user).

**Curl:**
```bash
curl -X DELETE http://localhost:3000/api/users/user-id-here
```

**Postman:**
- Method: DELETE
- URL: `http://localhost:3000/api/users/user-id-here`

## Authentication Endpoints

### Login

**Endpoint:** `POST /api/auth/login`

**Curl:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123"
  }'
```

### Signup

**Endpoint:** `POST /api/auth/signup`

**Curl:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane.doe@example.com",
    "fullName": "Jane Doe",
    "password": "password123"
  }'
```

## Running the API

To start the API server:

```bash
npm run start
```

Or in development mode with auto-reload:

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/api-docs`.