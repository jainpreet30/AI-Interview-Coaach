# API Specification

## Base URI
`/api/v1`

## Authentication
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

## Users
- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`
- `GET /api/v1/users` (admin)
- `PUT /api/v1/users/:id/role` (admin)

## Question Bank
- `GET /api/v1/questions`
- `GET /api/v1/questions/:id`
- `POST /api/v1/questions` (coach/admin)
- `PUT /api/v1/questions/:id` (coach/admin)
- `DELETE /api/v1/questions/:id` (admin)

## Interview Sessions
- `POST /api/v1/sessions` — start a new interview session
- `GET /api/v1/sessions/:id` — fetch session details
- `PUT /api/v1/sessions/:id/answer` — submit an answer and receive AI feedback
- `POST /api/v1/sessions/:id/complete` — complete the session
- `GET /api/v1/sessions` — list user sessions

## Feedback and Analytics
- `GET /api/v1/feedback/:sessionId`
- `GET /api/v1/analytics/me`
- `GET /api/v1/analytics/users/:userId` (coach/admin)

## Example Request
`POST /api/v1/auth/login`
{
  "email": "student@example.com",
  "password": "StrongPassword123"
}

## Example Response
{
  "token": "eyJhbGci...",
  "user": {
    "id": "64b...",
    "name": "Student Name",
    "role": "student"
  }
}

## Error Handling
- 400 Bad Request — validation errors and missing fields
- 401 Unauthorized — invalid or missing token
- 403 Forbidden — access denied for the current role
- 404 Not Found — resource does not exist
- 500 Internal Server Error — unexpected failures

## API Principles
- Use consistent JSON response format
- Validate all incoming data on the server
- Keep routes RESTful and descriptive
- Version the API so future updates remain compatible
