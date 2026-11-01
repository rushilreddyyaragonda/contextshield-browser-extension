# ContextShield Chrome Extension

A browser extension for investigating online claims, discovering missing context, and evaluating evidence — all locally, with no remote API.

## Overview

ContextShield helps you examine online claims, identify missing context, distinguish factual assertions from opinions, inspect available source information, and make more informed judgments about what you read.

All analysis runs locally in your browser using deterministic, rule-based heuristics. No remote API, AI service, account, or backend server is required.

## Architecture

```
contextshield-chrome/
├── manifest.json          — MV3 manifest
├── popup.html / .css / .js — Toolbar popup
├── background.js          — Service worker (context menu, message routing)
├── content.js / .css      — Content script (selection, page analysis, annotations)
├── workspace.html / .css / .js — Research workspace (inspect, compare, sources, notes, history)
├── options.html / .js     — Settings page
├── lib/
│   ├── claim-analyzer.js  — Rule-based claim classification
│   ├── context-detector.js — Context-gap detection
│   ├── source-inspector.js — Page metadata and link extraction
│   ├── comparison-engine.js — Two-passage comparison
│   └── storage-manager.js — Local storage management
├── icons/                 — Extension icons
└── README.md
```

## Permissions

- **activeTab** — Access the current tab only when you explicitly trigger an action (inspect text, analyze page).
- **contextMenus** — Add "Inspect selection with ContextShield" to the right-click menu.
- **storage** — Save settings, notes, and inspection history locally.

No broad host permissions are requested. Content scripts run on `http://*/*` and `https://*/*` but only act on explicit user requests.

## Installation

1. Download and extract the ZIP archive.
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked**.
5. Select the extracted folder containing `manifest.json`.
6. Pin ContextShield to your toolbar for convenient access.

## Features

- **Claim Inspector** — Classify selected text as factual claim, opinion, prediction, question, instruction, generalization, or numerical assertion.
- **Context Gap Detector** — Identify missing time context, missing attribution, unclear numerical comparisons, broad generalizations, unclear source trails, correlation-as-causation, missing comparison groups, and potentially outdated information.
- **Source Inspector** — Extract page metadata (title, author, dates, canonical URL) and list source links with internal/external classification.
- **Contradiction Workspace** — Compare two passages for differing numbers, dates, entities, negation, geography, and quantifiers.
- **Research Notes** — Save annotations with verification status (user-managed, not auto-verified).
- **History** — Review past inspections, re-inspect, or delete records.
- **Export** — Export all data to JSON or Markdown with clear distinction between automated observations and manual assessments.
- **Settings** — Toggle history, annotations, context menu; configure text limits; clear all data.

## Privacy

- All analysis runs locally. No article text, browsing history, notes, or selections are transmitted.
- No third-party analytics, advertising, tracking pixels, or telemetry.
- No account required.
- Strict Content Security Policy: `script-src 'self'; object-src 'self'; connect-src 'none'`.
- No `eval()`, no dynamic remote code, no injected scripts into webpages (content script only communicates via Chrome messaging).

## Limitations

- Rule-based classification is imperfect. Labels say "Possible factual claim" or "Likely opinion" — not definitive truth assessments.
- Context-gap detection produces suggestions for investigation, not proof that a statement is false.
- Surface-level comparison cannot reliably identify semantic contradictions.
- Does not work on browser-internal pages (`chrome://`, `about:`) or the Chrome Web Store.
- Does not bypass paywalls, CAPTCHA, or website restrictions.
- Not published on the Chrome Web Store — manual installation only.

## Testing

Analysis logic tests are in `tests/` and can be run with Node.js:

```bash
node tests/run-tests.js
```

## Version

1.0.0

## License

Original computer science project by Rushil Reddy Yaragonda.
