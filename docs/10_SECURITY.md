# Security

## Authentication and Authorization
- Use JWT tokens for stateless API authentication
- Protect routes by role: student, coach, and admin
- Refresh tokens or short-lived tokens can be added for production

## Data Protection
- Store passwords as hashed values using a secure algorithm like bcrypt
- Never log raw credentials or secret keys
- Encrypt sensitive environment variables in deployment settings when possible

## Input Sanitization
- Validate request payloads on the server using a schema validation library
- Reject unexpected or malformed fields
- Sanitize user-generated content before storing or rendering

## API Security
- Rate limit sensitive endpoints to prevent abuse
- Use HTTPS in production for all traffic
- Return generic error messages for authentication failures

## AI and Dependency Security
- Keep AI provider keys in environment variables, never in source control
- Use dependency auditing tools and update packages regularly
- Restrict database access to trusted hosts or private network ranges

## Deployment Security
- Maintain separate environment variables for development, staging, and production
- Use secure storage and secret management in the hosting provider
- Review firewall and network rules for the backend server and database
