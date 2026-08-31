# CuWO4.github.io

Personal GitHub Pages site. Shows cards for all public repositories of the
[CuWO4](https://github.com/CuWO4) account, sorted by stars.

A scheduled GitHub Action (`update-repos.yml`) runs daily (and on every push to
`main`) to fetch repo metadata — name, description, language, default-branch
commit count, and last update time — and writes it to `data/repos.json`. The
frontend (`index.html`, `style.css`, `script.js`) renders that JSON as a plain,
dark (GitHub-like) grid of clickable cards.

## Layout

- `index.html` / `style.css` / `script.js` — static frontend, no framework.
- `data/repos.json` — generated data, committed by the workflow.
- `scripts/update_repos.py` — fetches data from the GitHub REST API.
- `.github/workflows/update-repos.yml` — daily cron + push-triggered build.

## Setup

1. Create a GitHub repository named `CuWO4.github.io` and push this directory
   to its `main` branch.
2. The workflow uses the automatic `GITHUB_TOKEN`; no secrets are required.
3. GitHub Pages: enable deployment from `main` branch root (or set the Pages
   source to `Deploy from a branch`).
