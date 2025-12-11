# Frontend Best Practices

> **Version**: 1.0.0  
> **Last Updated**: December 2024  
> **Technologies**: Next.js 14 (App Router), React Query v5, TypeScript, shadcn/ui

---

## Table of Contents

1. [Next.js 14 App Router](#nextjs-14-app-router)
2. [React Query (TanStack Query)](#react-query-tanstack-query)
3. [Component Architecture](#component-architecture)
4. [State Management](#state-management)
5. [API Client Integration](#api-client-integration)
6. [Error Handling](#error-handling)
7. [Performance Optimization](#performance-optimization)
8. [Testing](#testing)

---

## Next.js 14 App Router

### File Structure

```
apps/web/src/
├── app/                    # App Router pages (server components by default)
│   ├── (auth)/             # Route groups for organization
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/        # Protected routes
│   │   ├── dashboard/
│   │   ├── reminders/
│   │   └── agents/
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # Shared components (client components)
│   ├── ui/                # shadcn/ui components
│   └── layout/            # Layout components
├── features/              # Feature-based modules
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── utils/
│   └── reminders/
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
│   ├── api-client.ts      # API client setup
│   ├── query-client.ts    # React Query setup
│   └── auth.ts            # Auth utilities
└── services/              # Service layer
```

### Best Practices

1. **Server Components by Default**
   - Use Server Components unless you need interactivity
   - Mark client components with `'use client'` directive
   - Fetch data in Server Components when possible

2. **Route Groups**
   - Use `(groupName)` for organization without affecting URL
   - Group related routes together (e.g., `(auth)`, `(dashboard)`)

3. **Layouts**
   - Use nested layouts for shared UI
   - Keep layouts minimal and focused

4. **Metadata**
   - Use `Metadata` API for SEO
   - Define metadata in layout.tsx or page.tsx

5. **Loading States**
   - Use `loading.tsx` for route-level loading
   - Use Suspense boundaries for component-level loading

6. **Error Handling**
   - Use `error.tsx` for route-level errors
   - Use Error Boundaries for component-level errors

---

## React Query (TanStack Query)

### Setup

```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
```

### Best Practices

1. **Query Keys**
   - Use hierarchical, predictable keys
   - Include all dependencies in the key
   ```typescript
   ['reminders', { status: 'active', page: 1 }]
   ['reminders', reminderId]
   ['agents', 'subscriptions']
   ```

2. **Query Functions**
   - Keep query functions pure
   - Handle errors in query functions
   - Return typed data

3. **Mutations**
   - Invalidate related queries on success
   - Optimistically update cache when appropriate
   - Show loading states during mutations

4. **Error Handling**
   - Use `onError` callbacks for global error handling
   - Display user-friendly error messages
   - Log errors for debugging

5. **Loading States**
   - Use `isLoading` for initial load
   - Use `isFetching` for background refetches
   - Show skeleton loaders, not spinners

6. **Pagination**
   - Use `keepPreviousData` for smooth pagination
   - Implement infinite queries for infinite scroll

---

## Component Architecture

### Component Types

1. **Server Components** (default)
   - Fetch data directly
   - No client-side JavaScript
   - Can import Server-only modules

2. **Client Components** (`'use client'`)
   - Interactive components
   - Use hooks (useState, useEffect, etc.)
   - Access browser APIs

3. **Shared Components**
   - Reusable across features
   - Located in `components/`
   - Well-documented with TypeScript

### Component Structure

```typescript
// components/reminder-card.tsx
'use client';

import { Reminder } from '@er/types';
import { Card } from '@er/ui-components';

interface ReminderCardProps {
  reminder: Reminder;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ReminderCard({ reminder, onEdit, onDelete }: ReminderCardProps) {
  // Component implementation
}
```

### Best Practices

1. **Single Responsibility**
   - One component, one purpose
   - Keep components small (< 200 lines)

2. **Props Interface**
   - Always define explicit props interface
   - Use TypeScript for type safety
   - Document props with JSDoc

3. **Composition over Configuration**
   - Prefer composition patterns
   - Use children prop when appropriate
   - Avoid prop drilling

4. **Naming Conventions**
   - PascalCase for components
   - Descriptive, domain-specific names
   - Avoid generic names (Card, Button → ReminderCard, SubmitButton)

---

## State Management

### Local State

- Use `useState` for component-specific state
- Use `useReducer` for complex state logic

### Server State (React Query)

- All API data managed by React Query
- No manual state management for server data
- Automatic caching and synchronization

### Global Client State

- Use Zustand for global client state (auth tokens, UI preferences)
- Keep global state minimal
- Prefer React Query for server state

### Example: Auth State

```typescript
// lib/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  clearTokens: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      setTokens: (tokens) => set(tokens),
      clearTokens: () => set({ accessToken: null, refreshToken: null }),
    }),
    { name: 'auth-storage' }
  )
);
```

---

## API Client Integration

### Setup

```typescript
// lib/api-client.ts
import { createApiClient } from '@er/api-client';
import { useAuthStore } from './auth-store';

export const apiClient = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3801/v1',
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  onTokenRefresh: (tokens) => {
    useAuthStore.getState().setTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || useAuthStore.getState().refreshToken || '',
    });
  },
  onUnauthorized: () => {
    useAuthStore.getState().clearTokens();
    // Redirect to login
  },
});
```

### Usage in Components

```typescript
// features/reminders/hooks/use-reminders.ts
import { useReminders } from '@er/api-client';
import { apiClient } from '@/lib/api-client';

export function useRemindersList(filters?: ReminderFilters) {
  const { useReminders } = createApiHooks(apiClient);
  return useReminders(filters);
}
```

---

## Error Handling

### Error Boundaries

```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### API Error Handling

```typescript
// In React Query hooks
const { data, error, isLoading } = useReminders();

if (error) {
  // Display user-friendly error message
  return <ErrorMessage message={error.message} />;
}
```

### Form Validation

- Use Zod for schema validation
- Display field-level errors
- Show summary of errors

---

## Performance Optimization

### Code Splitting

```typescript
// Lazy load heavy components
import dynamic from 'next/dynamic';

const ReminderEditor = dynamic(() => import('./reminder-editor'), {
  loading: () => <Skeleton />,
});
```

### Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={200}
  priority // For above-the-fold images
/>
```

### Memoization

```typescript
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

### React Query Optimization

- Use `staleTime` to prevent unnecessary refetches
- Use `gcTime` to control cache duration
- Use `select` to transform data without re-renders

---

## Testing

### Component Testing

```typescript
// __tests__/reminder-card.test.tsx
import { render, screen } from '@testing-library/react';
import { ReminderCard } from '@/components/reminder-card';

describe('ReminderCard', () => {
  it('renders reminder title', () => {
    const reminder = { id: '1', title: 'Test Reminder' };
    render(<ReminderCard reminder={reminder} />);
    expect(screen.getByText('Test Reminder')).toBeInTheDocument();
  });
});
```

### React Query Testing

```typescript
// Use QueryClientProvider in tests
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

render(
  <QueryClientProvider client={queryClient}>
    <Component />
  </QueryClientProvider>
);
```

---

## Summary Checklist

- ✅ Use Server Components by default
- ✅ Mark client components with `'use client'`
- ✅ Use React Query for all server state
- ✅ Use Zustand for minimal global client state
- ✅ Implement proper error boundaries
- ✅ Use TypeScript for all components
- ✅ Follow naming conventions (PascalCase for components)
- ✅ Keep components small and focused
- ✅ Use route groups for organization
- ✅ Implement proper loading states
- ✅ Optimize with code splitting and memoization
- ✅ Write tests for components

---

*This document should be updated as best practices evolve.*

