# AI Changelog Action

A GitHub Action that automatically generates changelogs from your commits using Google's Gemini AI. It analyzes the last N commits, groups them by week, and creates meaningful changelog entries.

## Features

- 📅 **Weekly Grouping**: Automatically groups commits by ISO weeks (UTC timezone)
- 🤖 **AI-Powered**: Uses Google Gemini 2.5 Flash to generate meaningful changelog entries
- 🔄 **Smart Merging**: Merges new entries with existing changelog without duplicates
- 📊 **Categorization**: Groups changes by Features, Bug Fixes, Performance, Documentation, etc.
- 📤 **Output-Based**: Returns changelog content as output for flexible integration

## Usage

### Basic Example

```yaml
name: Generate Changelog
on:
  push:
    branches: [main]

jobs:
  changelog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Important: fetch all history for commits

      - name: Generate Changelog
        id: changelog
        uses: jmatelowski/ai-actions@v1
        with:
          GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}
```

## Inputs

| Input            | Description                  | Required | Default        |
| ---------------- | ---------------------------- | -------- | -------------- |
| `GOOGLE_API_KEY` | Google Gemini API key        | ✅ Yes   | -              |
| `COMMITS_COUNT`  | Number of commits to analyze | ❌ No    | `10`           |
| `CHANGELOG_PATH` | Path to changelog file       | ❌ No    | `CHANGELOG.md` |

## Outputs

| Output              | Description                                        |
| ------------------- | -------------------------------------------------- |
| `changelog-content` | The generated/merged changelog in markdown         |
| `changelog-updated` | Whether the changelog was updated (`true`/`false`) |

## Setup

### 1. Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your repository secrets as `GOOGLE_API_KEY`

### 2. Configure Repository

Add the secret to your repository:

- Go to Settings → Secrets and variables → Actions
- Click "New repository secret"
- Name: `GOOGLE_API_KEY`
- Value: Your API key

## How It Works

1. **Fetch Commits**: Retrieves the last N commits from your repository
2. **Group by Week**: Groups commits by ISO week (Monday-Sunday, UTC)
3. **Read Existing**: Reads existing changelog file (if specified)
4. **AI Analysis**: Sends commit data + old changelog to Gemini AI
5. **Generate & Merge**: AI creates categorized entries and merges with existing content
6. **Output**: Returns complete changelog as action output

## Example Output

```markdown
# Changelog

## [2025-11-25]

### Features

- Added user authentication with JWT tokens
- Implemented dark mode toggle

### Bug Fixes

- Fixed memory leak in data processing
- Resolved issue with file uploads

### Performance

- Optimized database queries for 50% faster loading
```

## Requirements

- Node.js runtime (handled by GitHub Actions)
- Git history (use `fetch-depth: 0` in checkout action)
- Google Gemini API key
