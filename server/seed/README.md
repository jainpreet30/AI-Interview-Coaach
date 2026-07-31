# Seed data for AI Interview Coach (server/seed)

This folder contains a development seed script that populates the database with sample users, questions, sessions, feedback reports, and analytics events.

Files
- seed.cjs — CommonJS seed script. Reads MONGODB_URI from `server/.env` and inserts idempotent sample data.

Usage
1. Ensure `server/.env` contains a working `MONGODB_URI` (do NOT commit secrets):

   MONGODB_URI=mongodb://<user>:<pass>@.../interview-coach?ssl=true&replicaSet=...&authSource=admin&retryWrites=true&w=majority

2. From the `server/` folder run:

   npm run seed

   (This executes `node seed/seed.cjs` and will print inserted document IDs and totals.)

Notes and safety
- The script is idempotent for the provided sample data: it skips duplicate questions (by prompt), skips creating an admin user if the email exists, and uses `seedTag` for session/feedback/analytics deduplication.
- Do NOT commit real secrets. If you accidentally published credentials, rotate them immediately.
- The admin account created by the seed uses email `admin@example.com` and password `Passw0rd!` (hashed when `bcrypt` is available). Change or remove this account for production.

Recommended workflow
- Keep this script for local development and CI seeding (with test DB credentials).
- For production deployments, seed data should be handled through migration tooling or secure deployment-time scripts that do not embed secrets.
