# MEMORY.md - Long-Term Memory (Lean)

## People
- **Saroj**: CEO of **Paisa**. Email: **sarojhumagain23@gmail.com**.
- **Muna**: Saroj’s sister (Canada). Phone: **+1 437 605 2317**.
- **Morgan (me)**: Saroj’s ops/right-hand manager.

## Non-negotiables / preferences
- Address: **Saroj** ("Boss" is OK sometimes).
- **Slack DMs: no threads** unless Saroj asks.
- **Agents: use Slack channels for agent communications/updates** (public, one channel per agent):
  - Developer: `channel:C0AFEJ6JB9R` (#agent-developer)
  - Designer: `channel:C0AFHH4CGS1` (#agent-designer)
  - Accountant: `channel:C0AF5GHTD0X` (#agent-accountant)
  - Intern: `channel:C0AFM09SMBL` (#agent-intern)
  - R&D: `channel:C0AFJTY6RDL` (#agent-rnd)
  - Trader: `channel:C0AK11T6ZDH` (#agent-trader)
- **Privacy:** don’t share Saroj-private context in group chats.
- **Browser automation default:** use isolated browser; use **Chrome Browser Relay only if Saroj explicitly asks**.
- **Project X auth:** use local OAuth2 at `/Users/saroj/.openclaw/workspace/x-auth` (tokens in `x-auth/secrets/x-oauth.json`).
- **Voice calls:** follow `workspace/morgan-relay/VOICE_CALL_POLICY.md`.
- **Trading (always):** only enter new trades when the **market is open**.

## Trader agent — core lessons to remember (from YouTube video https://youtu.be/ZkSQyidxvl4)
- **Mindset:** you’re a risk manager; **capital preservation first**, profit second.
- **Predetermine risk (1R)** per trade as the max $ loss you can tolerate psychologically; beginners start tiny ($5–$20) to build consistency.
- **Minimum R:R filter:** only take trades with **≥ 2:1 reward-to-risk** (winners at least 2R); this allows profitability even with ~40% win rate.
- **Position sizing (shares/units):** `size = dollar_risk / (entry - stop)`.
- **Golden rule:** **when in doubt, lower risk** (uncertainty/stress/high emotion/lack of confidence); avoid revenge-trading risk escalation.
- **Gap model (stocks):** gap = overnight price change; gap sets bias (often trade in direction of gap). Focus on gaps that clear **above resistance / below support**, can **end trends / trap** participants, and have room to next level.
- **Don’t “trade the gap” blindly:** gap sets bias; still require an **intraday setup** (retracement/buy setup, consolidation/breakout, etc.).
- **Early open structure:** high–low approach off first candle (often 5m): long above high / stop below low; short below low / stop above high.
- **Trade management:** respect stops; avoid overly tight stops that cause shakeouts; at targets either take profits (often ≥50%) or trail stops (pivot or bar-by-bar).
- **Plan + iteration:** build a written trading plan (requirements, entries, stops, management, stop-trading rules), then **Prepare → Execute → Analyze → Refine**.
- **Psychology:** most problems come from **greed vs fear**; use rules + reduced risk + stepping away to stay disciplined.

## Trader agent — charting + execution process (from YouTube video https://youtu.be/3EQNWL7lCL8)
- **Top-down bias:** start **Weekly → Daily → 1H → 5m → 2m**.
- **Filter for “clean” market structure:** skip tickers that look choppy/unclear on 1H.
- **Weekly S/R zones:** draw zones from prior weekly candles (ignore current unfinished candle).
- **Daily context:** mark **gaps** + look for major candle patterns (engulfing/harami).
- **1H confirmation:** keep only S/R levels that show repeated reactions; define the **trend**.
- **Directional rule:** trade **only with the higher-timeframe trend** (e.g., calls only in bullish trend).
- **5m key levels:** previous day **high/low**, premarket **high/low**, plus HTF zones.
- **Entry trigger (2m):** wait for confluence: rejection at support + bullish candle signal (e.g., engulfing) + break/retest + **price above 9 EMA**; enter on break of consolidation.
- **Stop placement:** initial stop at **consolidation low** (invalidates setup).
- **Management:** no fixed target; **trail stop** using 9 EMA / structure (consolidation lows/highs). Watch **HOD/LOD** as key inflection levels.
- **Exit:** when breakout fails (e.g., returns inside consolidation / closes below 9 EMA / breaks key structure).
- **Execution preference:** manual exits to avoid getting wicked out; don’t stop out just on wicks unless strength confirms.

## Ops model
- Be decisive: pick sensible defaults; escalate only when real tradeoffs/resources are needed.

## Project X (X.com) — automation schedule + minimal oversight
Goal: run daily X activity blocks via **Chrome Browser Relay web UI** (no X API) with minimal manual oversight.

### Daily activity blocks (Australia/Perth)
- **05:30** — Block **10/10** (early warmup: scan + 6–10 replies, optional original)
- **07:10** — Block **1/10** (thread 6–10 tweets OR 2 singles + 8–12 replies + 5 big-tech replies)
- **09:45** — Block **2/10** (reply burst 8–12 + 5 big-tech; fallback 1 original)
- **12:20** — Block **3/10** (midday original + 6–10 replies + 5 big-tech; fallback 2nd original)
- **15:45** — Block **4/10** (follow up to 20 verified + 8–12 replies + 5 big-tech; fallback original)
- **17:30** — Block **9/10** (late afternoon reply burst + 5 big-tech; fallback original)
- **19:30** — Block **5/10** (evening original + reply burst + 5 big-tech; fallback 2nd original)
- **22:00** — Block **6/10** (US morning; original or replies-first; then 8–12 replies + 5 big-tech)
- **01:00** — Block **7/10** (US midday; replies-first 8–12 + 5 big-tech; fallback original)
- **04:00** — Block **8/10** (US afternoon; original + 8–12 replies + 5 big-tech; fallback extra original)

### Oversight rules
- If **Relay has 0 attached tabs**, stop and DM Saroj once with attach instructions (don’t spin).
- Ensure Project X cron deliveries announce to **Slack DM (D0AC9602SQ2)** or **#C0ADPRZ1X0W** (no WhatsApp).
- Prefer to keep one Relay-attached Chrome tab open on **https://x.com/home** during runs.

## Slack allowlist / identity
- Saroj Slack user id: `U0AC72FGG5C`.

## 1Password
- Primary vault name: **paisa**.
