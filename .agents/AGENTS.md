# WormHole Canvas Workspace Rules

## Core Guidelines

1. **Maintain Rebranding & Translation**:
   - The application name must remain **WormHole** (never "OpenTune").
   - The language of the user interface, alerts, text files, and documentation must remain **English** (no Spanish).
   - Maintain the local Vercel serverless function compatibility in `/api/*` and preserve the trailing-slash/query action rewrites in `vercel.json`.

2. **Automated Upstream Syncing**:
   - The script `scripts/sync_upstream.py` manages the automated fetching, checkout, and replacement patterns.
   - If manual sync or upstream updates are requested, run `python scripts/sync_upstream.py` to pull, translate, and rebrand static files, rather than merging files with conflicts manually.
