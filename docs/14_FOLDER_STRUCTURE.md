# Recommended Folder Structure

## Project Organization
A clean folder structure helps keep the MERN application maintainable and GitHub-ready.

```
/ (project root)
  README.md
  .gitignore
  package.json
  docs/
    01_PROJECT_SPEC.md
    02_REQUIREMENTS.md
    03_FEATURES.md
    04_USER_STORIES.md
    05_UI_UX.md
    06_ARCHITECTURE.md
    07_DATABASE.md
    08_API.md
    09_AI_PROMPTS.md
    10_SECURITY.md
    11_TESTING.md
    12_DEPLOYMENT.md
    13_ROADMAP.md
    14_FOLDER_STRUCTURE.md
    15_COPILOT_RULES.md
  client/
    public/
    src/
      components/
      pages/
      services/
      hooks/
      styles/
  server/
    src/
      controllers/
      middleware/
      models/
      routes/
      services/
      utils/
    tests/
  scripts/
  tests/

```

## Folder Responsibilities
- `client/`: React application and frontend assets
- `server/`: Express backend, API routes, and data access logic
- `docs/`: project documentation, planning, and report material
- `tests/`: cross-cutting or integration tests that span client and server
- `scripts/`: utility scripts for setup, seeding, or deployment

## Best Practices
- Keep frontend and backend code separated in distinct folders
- Use descriptive folder names for services, controllers, and components
- Keep documentation in the `docs/` folder and refer from README
- Store environment-specific settings in `.env` files excluded from git
