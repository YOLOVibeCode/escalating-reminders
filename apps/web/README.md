# Escalating Reminders - Web Application

Next.js 14 web application for Escalating Reminders.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand (client), React Query (server)
- **UI Components**: @er/ui-components (shared package)

## Development

```bash
# Install dependencies (from root)
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
apps/web/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── features/          # Feature modules
│   ├── components/        # Shared components
│   ├── hooks/            # Custom React hooks
│   └── services/         # API clients, utilities
├── __tests__/            # Tests
└── public/               # Static assets
```

## Environment Variables

See `.env.example` for required environment variables.

## Testing

```bash
npm test
npm run test:coverage
```

