# project-inventory-en-demo

A small learning demo: paste the output of `supabase projects list --output json` and see your Supabase projects grouped by organization, with paused projects, age, "dormant candidate" marks and a rough monthly cost per organization. Plain HTML + JavaScript. No server, no access token, no Supabase project needed. What you paste stays in the browser.

> **A personal learning project.** Not an official tool of any company. The rules (what counts as a "dormant candidate", the cost estimate) are my own reading of the docs and pricing page.

This is the code for the Dev.to article (organizations vs projects, a real project transfer, and this board): TODO-DEVTO-URL

## Files

| File | What it is |
|---|---|
| `app/inventory.js` | Parsing and calculation, no DOM |
| `app/index.html`, `app/app.js` | The board |
| `app/test.js`, `app/package.json` | 13 checks (`node app/test.js`) |
| `sample/projects.sample.json` | **Fake** projects in the shape the CLI prints |

## Cost

- Running the board costs nothing.
- The monthly figure on screen is an **estimate**: plan fee (Pro $25, Team $599, from the pricing page on 2026-10-27) + $10 per active project (Micro compute) - $10 included in paid plans. Paused projects are not counted (docs: paused projects are not charged). Free organizations show $0. Not checked against an invoice; tax, add-ons and usage overage are not included.

## Run

```bash
# from the repository root (the "Load sample data" button reads ../sample/)
python3 -m http.server 8000
# open http://localhost:8000/app/
node app/test.js
# your own data:
supabase projects list --output json | pbcopy    # macOS; paste into the page
```

## Limits (read this)

- The CLI output has **no plan** and **no last-used date**. You choose each organization's plan on the page. "Dormant candidate" means: paused and at least 90 days old. It is a reason to look, **not proof** that nobody uses the project. Ask the owner before deleting anything.
- The output has the organization id, not its name.

## What was verified (2026-10-27) and what was not

- Verified: `node app/test.js` passes; the page in a clean copy (sample data, plan choice, free-limit warning, broken JSON, missing plan); the parser reads the real CLI output of my account (3 projects in 2 organizations; I looked at counts only).
- Not verified: hundreds of projects, phone-width layout, opening the page as a file, output that includes organizations you do not own.

## Cleanup

Stop the local server. Nothing else was created.

## License

MIT (see `LICENSE`).
