# Architecture

## MERN Architecture Overview
The project uses the MERN stack:
- MongoDB as the primary document database
- Express.js to expose a REST API and handle backend business logic
- React for the frontend user interface and client-side routing
- Node.js as the runtime environment for the server

## High-Level Layers
- Client layer: React app, routed pages, UI components, API client
- API layer: Express routes, authentication middleware, request validation
- Service layer: business logic for interview sessions, AI orchestration, analytics
- Data layer: MongoDB collections and schema models
- Integration layer: AI provider connector, environment-managed secrets

## Component Responsibilities
- Frontend: user flows, forms, dashboards, session interfaces
- Backend: user management, session lifecycle, question CRUD, feedback storage
- AI integration: composition of prompts, submission to AI service, parsing of responses
- Database: persistence of users, interview history, question library, analytics

## Deployment Architecture
- Frontend served as a static React build on Vercel, Netlify, or cloud storage
- Backend hosted on Render, Heroku, AWS Elastic Beanstalk, or a container service
- MongoDB hosted on Atlas or a managed cluster with secure network access
- CI/CD pipeline deploys main branch changes automatically after tests pass

## Modularity and Extensibility
- Use separate `client` and `server` folders for clean separation
- Keep API contract stable with versioned route prefixes
- Abstract AI provider code so the model backend can be swapped later
- Use environment-based configuration for deployment, secrets, and feature toggles
