# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Environment

**Docker is required** for all development, running, and testing of this application. Never run the application or tests directly on the host machine.

## Testing Requirements

- **UI Testing:** Always use Playwright MCP tools (`mcp__plugin_playwright_playwright__*`) for testing UI interactions
- Use `browser_navigate` to open the app, `browser_snapshot` to inspect state, and `browser_click`/`browser_type` to interact
- Verify UI state through accessibility snapshots rather than screenshots when possible

## Architecture

- **Framework:** Next.js 14+ with App Router
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js (Email/password + Google OAuth)


