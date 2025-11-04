---
description: Repository Information Overview
alwaysApply: true
---

# Leia Sabores - E-commerce Platform (Cloudflare-Native Architecture)

## Summary
Leia Sabores is a modern full-stack e-commerce platform for selling cakes and party supplies. Built entirely on Cloudflare's edge computing platform (Pages + Workers), it features a React-based frontend with Tailwind CSS, TypeScript backend APIs, JWT authentication, Stripe payment integration, and SQLite database via D1. All Supabase dependencies have been completely removed.

## Structure
- **src/** - React application (pages, components, hooks, state management)
- **functions/** - Cloudflare Workers API endpoints (backend)
- **tests/** - Unit, integration, and E2E test suites
- **scripts/** - Build and utility scripts
- **d1/** - Database schema and seed files
- **public/** - Static assets

## Language & Runtime
**Language**: TypeScript 5.6.3
**Runtime**: Node.js (development), Cloudflare Workers (production)
**Framework**: React 18.3.1 + Vite 5.4.8
**Build System**: Vite
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- React 18.3.1 + React Router DOM 6.26.1 (frontend routing)
- TanStack React Query 5.90.6 (server state management)
- Stripe: @stripe/react-stripe-js 5.3.0, @stripe/stripe-js 8.2.0 (payments)
- Tailwind CSS 3.4.13 + Radix UI components (styling & UI)
- Framer Motion 11.3.0 (animations)
- SWR 2.3.6 (data fetching)

**Development Dependencies**:
- Cloudflare Workers Types 4.20240512.0
- Playwright 1.48.0 (E2E testing)
- Vitest 1.6.0 (unit testing with jsdom environment)
- Testing Library React 14.1.2 (component testing)
- TypeScript 5.6.3

## Build & Installation
```bash
npm install
npm run dev              # Frontend with Vite
npm run dev:api         # Cloudflare Workers locally
npm run stripe:dev      # Full setup with Stripe webhooks
npm run build           # Production build
npm run deploy:workers  # Deploy to Cloudflare
```

## Configuration Files
- **wrangler.toml** - Cloudflare Workers config (D1, R2, KV, AI, cron triggers)
- **vite.config.ts** - Vite build with React, compression, API proxy
- **tsconfig.json** - TypeScript targeting ES2020 with path aliases
- **vitest.config.ts** - Unit tests with jsdom environment and v8 coverage
- **playwright.config.ts** - E2E tests configuration

## Backend Architecture (Cloudflare-Only)
- **JWT Authentication**: Native crypto APIs in `functions/api/_jwt.ts`
- **Database**: Cloudflare D1 SQLite with utility functions in `functions/api/_db.ts`
- **Session Management**: HTTP-only JWT cookies via Set-Cookie headers
- **File Storage**: Cloudflare R2 for product images
- **Caching**: Cloudflare KV for session/cart caching
- **Payments**: Stripe integration with webhook handlers

## Main Entry Points
- **Frontend**: `src/main.tsx` - React application with React Router
- **Backend**: `functions/index.ts` - Cloudflare Workers main handler
- **Auth Routes**: `/api/auth/{login,register,me,logout}` - JWT authentication
- **API Routes**: `/api/{products,cart,checkout,orders}` - Business logic

## Testing
**Status**: ✅ All tests passing (23 tests, 7 test files)

**Unit & Integration Tests**:
- **Framework**: Vitest 1.6.0
- **Environment**: jsdom (provides DOM APIs)
- **Location**: `tests/unit/` and `tests/integration/`
- **Run**: `npm test`

**E2E Tests**:
- **Framework**: Playwright 1.48.0
- **Location**: `tests/e2e/`
- **Run**: `npm run test:e2e`

## Recent Completion (Supabase Removal)
✅ Removed `@supabase/supabase-js` npm dependency
✅ Created `src/state/useAuth.ts` - JWT-based authentication hook
✅ Updated all components to use new `useAuth` hook
✅ Refactored test mocks for Cloudflare Workers API responses
✅ Added jsdom environment to vitest.config.ts for DOM support
✅ Fixed all test expectations to match actual API structures
✅ All 23 unit/integration tests passing
✅ All backend logic fully Cloudflare-native with no external dependencies beyond Stripe
