# E2E Tests Quick Start

## Installation

```bash
# Install dependencies (from monorepo root)
npm install

# Install Playwright browsers
cd apps/web
npx playwright install
```

## Running Tests

```bash
# Run all tests (respects layer dependencies)
npm run e2e

# Run specific layer
npm run e2e:critical      # Must pass first
npm run e2e:auth
npm run e2e:dashboard
npm run e2e:navigation
npm run e2e:features
npm run e2e:integration
npm run e2e:error

# Debug mode
npm run e2e:ui            # Interactive UI
npm run e2e:headed        # See browser
```

## Prerequisites

1. **Web app running**: `npm run dev` (port 3800)
2. **API running**: Default port 3801
3. **Test users seeded**:
   - User: `testuser@example.com` / `TestUser123!`
   - Admin: `admin@example.com` / `AdminPass123!`

## Test Structure

- **129 total tests** across 7 layers
- **Fail-fast**: Each layer depends on previous
- **Layer 0** runs first (serial, stops on failure)
- **Layers 1-4, 6** run in parallel within layer
- **Layer 5** runs serial (complex workflows)

## First Run

```bash
# 1. Start web app
npm run dev

# 2. Start API (in another terminal)
cd ../api
npm run dev

# 3. Run critical tests first
npm run e2e:critical

# 4. If critical passes, run all
npm run e2e
```

## Troubleshooting

**"Element not found" errors**
- Add `data-testid` attributes to components
- Update selectors in test files

**"Timeout" errors**
- Ensure web app is running
- Increase timeout in playwright.config.ts if needed

**"Login failed"**
- Verify test users exist in database
- Check API authentication endpoints

## Next Steps

1. Add `data-testid` attributes to all interactive elements
2. Seed test database with test users
3. Run Layer 0 tests: `npm run e2e:critical`
4. Fix any failures
5. Continue with remaining layers

See [README.md](./README.md) for full documentation.
