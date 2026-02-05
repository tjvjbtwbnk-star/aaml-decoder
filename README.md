# AAML Decoder v2.0

AI-Native Arbitration Markup Language decoder with dual export modes: Typst PDF and Web HTML.

**Live Demo:** [Your Railway URL here]

## Quick Start (Local)

```bash
# Requires Node.js 18+ and Typst CLI
npm install
npm start
```

Open http://localhost:3000

### Installing Typst (for local development)

```bash
# macOS
brew install typst

# Linux
curl -fsSL https://typst.community/typst-install/install.sh | sh
```

## Features

- **PDF Export**: Professional A4 documents with hierarchical numbering, page-aware footnotes, and exhibit list
- **Web Export**: Interactive HTML with clickable reference popups

## Sample Data

This demo includes 178 sample legal documents (exhibits, authorities, witness statements) from a fictional construction arbitration case. Use these to test the reference resolution system.

## AAML v1.1.1 Syntax

```markdown
# Heading

The Claimant submits this Memorial. [[contract|cl. 1.1]]

References: [[identifier]] or [[identifier|pinpoint]]
```

Reference by filename, UID, or alias.

## Deploy Your Own

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

Or manually:

1. Fork this repo
2. Connect to Railway/Render/Fly.io
3. Deploy (Dockerfile included)

## LCIA GAR Hackathon 2026

Built for the LCIA Global Arbitration Review AI Hackathon.

---

*AAML Decoder by Lucas Deferrari*
