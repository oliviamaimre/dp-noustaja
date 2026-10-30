# CLAUDE.md

## Deployment

- This app is deployed on Render automatically from the `main` branch of this GitHub repo.
- The app runs on Render, not on this computer.

## Database

- The database is a Render PostgreSQL database, available only through the `DATABASE_URL` environment variable on Render.
- Do not set up a local database.
- Do not set up a local server.

## Workflow

- Before every push, run `npm run build` to make sure the app builds.
- After each finished task, commit and push to GitHub so that Render deploys the new version.
