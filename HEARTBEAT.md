# HEARTBEAT.md

# Keep this lightweight. Heartbeat runs ~every 30 minutes.
# Goal: catch blockers early, avoid wasted cron runs, and only DM Saroj when action is needed.

## Checks

### 1) Browser Relay attached-tab check (X / Notion / Pinterest)
- If Chrome Browser Relay has **0 attached tabs**, DM Saroj:
  - “Relay is ON but no tab attached. Please attach it on x.com (badge ON) so automation can run.”

### 2) Gateway / browser control health
- If browser control service is timing out / unreachable, restart OpenClaw gateway and re-check.
- If still failing, DM Saroj with the exact error headline + what to do (attach tab / restart).

### 3) Project X: avoid wasting runs when X API is blocked
- Look at last Project X block outcome.
- If repeated `402 CreditsDepleted`, ensure blocks are using **Browser Relay fallback**.
- If Relay isn’t attached, DM Saroj (once) rather than retrying blindly.

### 4) AMDD: engine + mode sanity
- Confirm AMDD engine PID exists and process is alive.
- Confirm engine is **ARMED paper** (not dry run). If not, restart ARMED.

### 5) AMDD: data freshness guard
- Confirm latest universe CSV + bars snapshot parquet are **fresh (<60 min for today’s run)**.
- If stale/missing, DM Saroj with what’s stale.

### 6) Project Snipe: dashboard + command queue sanity
- Confirm Project Snipe dashboard is reachable on **:8510**.
- If down, restart it.
- If command queue is growing (commands.jsonl) but nothing is consuming it, note it in next digest.

## Daily digest (only once/day)
- Send Saroj a single short digest (AMDD + Project X + Project Snipe): what ran, what broke, and 1–2 next actions.
