# Deployment Plan

## Hosting Strategy
- Frontend: deploy the React application to Vercel, Netlify, or a static web host
- Backend: deploy the Express API to Render, Heroku, AWS, or another Node-compatible host
- Database: use MongoDB Atlas or another managed MongoDB service

## CI/CD Pipeline
- Store source code in GitHub repository
- Use GitHub Actions to run linting, tests, and build steps on push
- Deploy frontend and backend automatically when main branch changes pass tests

## Environment Configuration
- Store secrets in environment variables: `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `AI_API_KEY`
- Use separate settings for development and production
- Keep configuration out of source control with `.env` files excluded

## Deployment Checklist
- Confirm the backend is reachable from the frontend host
- Configure CORS for the frontend origin in the API server
- Enable HTTPS for all production endpoints
- Set up monitoring or health checks if the host provider supports them

## Demo and Presentation
- Prepare a live deployment URL for demonstration
- Capture screenshots of the app in use for the GTU report
- Include deployment architecture and configuration notes in the final documentation
