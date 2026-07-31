# AI Interview Coach

AI Interview Coach is a final-year MERN project designed to provide students and early-career professionals with an AI-powered interview practice platform. It combines a modern React frontend, Express.js backend, MongoDB persistence, and AI-driven feedback.

## What is included
- Professional project documentation in the `docs/` folder
- Requirements, architecture, database design, API specification, and deployment plan
- A proposed MERN folder structure for clean development
- A 15-day roadmap tailored for GTU final year project delivery

## Next Steps
1. Review the documentation in `docs/` to understand project scope and architecture.
2. Configure backend environment variables in `server/.env`:
   - `MONGODB_URI` for MongoDB Atlas or local MongoDB.
   - `AI_API_KEY` for OpenAI, plus optional `AI_MODEL`.
3. Run the server and client locally:
   - Backend: `cd server && npm install && npm run dev`
   - Frontend: `cd client && npm install && npm run dev`
4. Seed the database with sample data:
   - `cd server && npm run seed`
5. Validate the interview workflow by creating a new practice session and answering questions.
6. Add automated tests and CI for both backend and frontend.
7. Deploy the backend, frontend, and MongoDB to a cloud environment.

## Project status
- Backend: Express API, MongoDB models, authentication, and AI evaluation support implemented.
- Frontend: React + Vite interview workflow, protected routes, and AI feedback UI completed.
- AI integration: OpenAI support plus a local fallback generator for question creation and answer evaluation.
- Seed data: `server/seed/seed.cjs` and `server/seed/README.md` are available for rapid local setup.

## Recommended next steps
- Verify your MongoDB Atlas network access and `MONGODB_URI` connection:
  - In Atlas, open Network Access and add your current IP address or `0.0.0.0/0` for temporary testing.
  - Confirm your Atlas cluster user exists and has permissions for the `interview-coach` database.
  - Use the Atlas connection string wizard to get a working `mongodb+srv://` or `mongodb://` URI and save it in `server/.env`.
- Use `npm run seed` in `server/` to populate the database with sample questions and a demo admin account.
- Add automated tests:
  - Backend: Jest + Supertest for routes and controllers.
  - Frontend: React Testing Library for pages and components.
- Add GitHub Actions to run linting and tests on every push.
- Deploy the backend to a service like Render, Heroku, or Railway and the frontend to Vercel or Netlify.
- Keep secrets out of source control and manage them through environment variables in deployment.

## Running the project locally
- Backend:
  1. `cd server`
  2. `npm install`
  3. copy `.env.example` to `.env` and update the values
  4. `npm run dev`
- Frontend:
  1. `cd client`
  2. `npm install`
  3. `npm run dev`

The client proxies API requests to `http://localhost:5000` while developing.

## Documentation guide
- Start with `docs/01_PROJECT_SPEC.md` and `docs/02_REQUIREMENTS.md`
- Follow `docs/13_ROADMAP.md` to manage development across 15 days
- Use `docs/14_FOLDER_STRUCTURE.md` when organizing files during implementation

## Report material
The `docs/` folder is designed to support GTU project report chapters and presentation material.

---

This repository is now ready to be extended into a production-grade MERN project.
