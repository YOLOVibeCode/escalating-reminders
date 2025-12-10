# UI Theme & Component Library Specification

> **Version**: 1.0.0  
> **Last Updated**: December 2024

---

## Overview

This document specifies the UI theme, component library, and design system for the Escalating Reminders web application.

---

## Component Library: shadcn/ui

### Data Grids: TanStack Table

**TanStack Table** (formerly React Table) is used for all data tables and grids.

#### Why TanStack Table?

| Feature | TanStack Table | Alternatives |
|---------|----------------|--------------|
| **Headless** | ✅ Framework agnostic | Some are React-only |
| **TypeScript** | ✅ Excellent TS support | Varies |
| **Performance** | ✅ Virtualization built-in | Some require plugins |
| **Features** | ✅ Sorting, filtering, pagination, grouping | Varies |
| **Bundle Size** | ✅ Small, tree-shakeable | Some are large |
| **Flexibility** | ✅ Fully customizable | Some are opinionated |
| **License** | ✅ MIT (Open Source) | Varies |

#### Key Features

- **Sorting**: Multi-column sorting
- **Filtering**: Column-level and global filtering
- **Pagination**: Server-side and client-side
- **Virtualization**: Handle large datasets efficiently
- **Column Resizing**: User-adjustable column widths
- **Row Selection**: Single and multi-select
- **Grouping**: Group rows by column values
- **Customizable**: Full control over rendering

#### Integration with shadcn/ui

TanStack Table works perfectly with shadcn/ui components:

```typescript
// Example: Reminders table
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';

const RemindersTable = ({ reminders }) => {
  const table = useReactTable({
    data: reminders,
    columns: reminderColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map(headerGroup => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <TableCell key={header.id}>
                {header.column.columnDef.header}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map(row => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map(cell => (
              <TableCell key={cell.id}>
                {cell.renderValue()}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
```

#### Installation

```bash
npm install @tanstack/react-table
```

#### Use Cases in Escalating Reminders

1. **Reminders List**: Sortable, filterable table of all reminders
2. **Notification Logs**: History of sent notifications
3. **Agent Subscriptions**: Manage notification agents
4. **Trusted Contacts**: Contact management table
5. **Audit Trail**: System activity logs

### Why shadcn/ui?

| Criteria | shadcn/ui | Alternatives |
|----------|-----------|--------------|
| **License** | ✅ MIT (Open Source) | Varies |
| **Next.js Support** | ✅ Native support | Some require adapters |
| **Tailwind CSS** | ✅ Built on Tailwind | Some use CSS-in-JS |
| **TypeScript** | ✅ Full TypeScript | Varies |
| **Customization** | ✅ Copy components to codebase | Limited in some libraries |
| **Accessibility** | ✅ Radix UI primitives | Varies |
| **Bundle Size** | ✅ Only what you use | Can be large |

### Key Benefits

1. **Copy, Don't Install**: Components are copied into your codebase, giving you full control
2. **Tailwind Native**: Built on Tailwind CSS, matches our stack perfectly
3. **Accessible**: Built on Radix UI primitives (WCAG compliant)
4. **TypeScript First**: Full TypeScript support
5. **Customizable**: Easy to modify and extend
6. **No Runtime Dependencies**: Components are just React + Tailwind

### Installation

```bash
# Install shadcn/ui CLI
npx shadcn-ui@latest init

# Add components as needed
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

---

## Admin Dashboard Template

### Recommended: Next.js + shadcn Admin Dashboard

**Source**: [next-shadcn-admin-dashboard](https://next-shadcn-admin-dashboard.vercel.app/)

#### Why This Template?

1. **Perfect Stack Match**:
   - ✅ Next.js 14 (App Router)
   - ✅ shadcn/ui components
   - ✅ Tailwind CSS
   - ✅ TypeScript

2. **Features Included**:
   - Dashboard layout with sidebar navigation
   - Data tables with sorting/filtering
   - Forms and form validation
   - Authentication UI patterns
   - Responsive design
   - Dark mode support (optional)

3. **Open Source**: 
   - MIT License (or similar permissive license)
   - Can be used commercially
   - Can be modified freely

4. **Production Ready**:
   - Well-structured code
   - Best practices
   - Accessible components

#### Integration Strategy

1. **Use as Starting Point**: Clone the template structure
2. **Customize for Our Domain**: Adapt to Escalating Reminders features
3. **Extend with Our Components**: Build reminder-specific components in `@er/ui-components`
4. **Maintain Design Consistency**: Follow the template's design patterns

---

## Design System

### Color Palette

```typescript
// Based on shadcn/ui default theme
const colors = {
  // Light mode
  background: 'hsl(0 0% 100%)',
  foreground: 'hsl(222.2 84% 4.9%)',
  primary: 'hsl(222.2 47.4% 11.2%)',
  secondary: 'hsl(210 40% 96.1%)',
  accent: 'hsl(210 40% 96.1%)',
  muted: 'hsl(210 40% 96.1%)',
  destructive: 'hsl(0 84.2% 60.2%)',
  border: 'hsl(214.3 31.8% 91.4%)',
  input: 'hsl(214.3 31.8% 91.4%)',
  ring: 'hsl(222.2 84% 4.9%)',
  
  // Status colors for reminders
  reminder: {
    low: 'hsl(142 76% 36%)',      // Green
    medium: 'hsl(38 92% 50%)',    // Yellow/Orange
    high: 'hsl(0 84% 60%)',       // Red
    critical: 'hsl(0 72% 51%)',    // Dark Red
  },
};
```

### Typography

- **Font Family**: Inter (or system font stack)
- **Headings**: Bold, clear hierarchy
- **Body**: Readable, 16px base size
- **Code**: Monospace for technical content

### Spacing

- **Base Unit**: 4px
- **Scale**: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128

### Component Patterns

#### Reminders Data Table (TanStack Table)

```typescript
// apps/web/src/components/features/reminders/RemindersTable.tsx
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel } from '@tanstack/react-table';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { Reminder } from '@er/types';

const columns = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => row.original.title,
  },
  {
    accessorKey: 'importance',
    header: 'Importance',
    cell: ({ row }) => (
      <Badge variant={getImportanceVariant(row.original.importance)}>
        {row.original.importance}
      </Badge>
    ),
  },
  {
    accessorKey: 'dueDate',
    header: 'Due Date',
    cell: ({ row }) => formatDate(row.original.dueDate),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => row.original.status,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button size="sm" variant="outline">Edit</Button>
        <Button size="sm" variant="destructive">Delete</Button>
      </div>
    ),
  },
];

export function RemindersTable({ reminders }: { reminders: Reminder[] }) {
  const [sorting, setSorting] = useState([]);
  const [filtering, setFiltering] = useState('');

  const table = useReactTable({
    data: reminders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter: filtering,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFiltering,
  });

  return (
    <div>
      <Input
        placeholder="Filter reminders..."
        value={filtering}
        onChange={(e) => setFiltering(e.target.value)}
        className="max-w-sm mb-4"
      />
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <div
                      className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: ' ↑',
                        desc: ' ↓',
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map(row => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

#### Reminder Card
```typescript
// Example component structure
<Card>
  <CardHeader>
    <CardTitle>{reminder.title}</CardTitle>
    <CardDescription>{reminder.description}</CardDescription>
  </CardHeader>
  <CardContent>
    <Badge variant={getImportanceVariant(reminder.importance)}>
      {reminder.importance}
    </Badge>
    <div>{formatDate(reminder.dueDate)}</div>
  </CardContent>
  <CardFooter>
    <Button>Snooze</Button>
    <Button variant="destructive">Dismiss</Button>
  </CardFooter>
</Card>
```

#### Escalation Profile Editor
```typescript
// Multi-step form using shadcn/ui components
<Form>
  <FormField name="tier1" />
  <FormField name="tier2" />
  <FormField name="tier3" />
  <Button type="submit">Save Profile</Button>
</Form>
```

---

## Component Architecture

### Structure

```
apps/web/src/
├── components/
│   ├── ui/                    # shadcn/ui components (copied)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── layout/                # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── DashboardLayout.tsx
│   └── features/              # Feature-specific components
│       ├── reminders/
│       │   ├── ReminderCard.tsx
│       │   ├── ReminderForm.tsx
│       │   └── ReminderList.tsx
│       └── escalation/
│           └── EscalationProfileEditor.tsx
```

### Component Guidelines

1. **Use shadcn/ui Base Components**: Start with shadcn/ui, extend as needed
2. **Build Domain Components**: Create reminder/escalation-specific components
3. **Compose, Don't Duplicate**: Build complex components from simple ones
4. **Accessibility First**: All components must be keyboard navigable and screen-reader friendly
5. **TypeScript Strict**: Full type safety for all props

---

## Responsive Design

### Breakpoints

```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
};
```

### Mobile-First Approach

1. Design for mobile first
2. Progressive enhancement for larger screens
3. Touch-friendly targets (min 44x44px)
4. Responsive tables (scroll or card view on mobile)

---

## Dark Mode (Optional)

### Implementation

- Use CSS variables for colors
- Toggle via user preference or system setting
- Persist preference in localStorage
- Smooth transitions between modes

### When to Implement

- **MVP**: Light mode only
- **Post-MVP**: Add dark mode based on user feedback

---

## Accessibility Standards

### Requirements

1. **WCAG 2.1 AA Compliance**: Minimum standard
2. **Keyboard Navigation**: All interactive elements accessible via keyboard
3. **Screen Reader Support**: Proper ARIA labels and roles
4. **Color Contrast**: Minimum 4.5:1 for text
5. **Focus Indicators**: Clear focus states for all interactive elements

### Testing

- Automated: axe-core, Lighthouse
- Manual: Keyboard navigation, screen reader testing
- User Testing: Include users with disabilities

---

## Animation & Transitions

### Principles

1. **Purposeful**: Animations should enhance UX, not distract
2. **Fast**: Keep transitions under 300ms
3. **Smooth**: Use CSS transitions, avoid JavaScript animations where possible
4. **Respectful**: Honor `prefers-reduced-motion`

### Common Patterns

- Page transitions: Fade in (200ms)
- Modal open/close: Scale + fade (300ms)
- Button hover: Subtle scale (150ms)
- Loading states: Skeleton screens

---

## Implementation Plan

### Phase 1: Setup (Week 1)

1. ✅ Install shadcn/ui CLI
2. ✅ Initialize shadcn/ui in project
3. ✅ Install TanStack Table: `npm install @tanstack/react-table`
4. ✅ Add base components (Button, Card, Input, Table, etc.)
5. ✅ Set up Tailwind theme with our colors
6. ✅ Create layout components (Sidebar, Header)
7. ✅ Create reusable table wrapper component with TanStack Table

### Phase 2: Dashboard (Week 2)

1. Adapt admin dashboard template structure
2. Create reminder list view
3. Create reminder detail view
4. Implement basic forms

### Phase 3: Features (Week 3+)

1. Build reminder-specific components
2. Create escalation profile editor
3. Add notification settings UI
4. Implement agent management UI

---

## Resources

### shadcn/ui
- **Website**: https://ui.shadcn.com/
- **GitHub**: https://github.com/shadcn-ui/ui
- **Documentation**: https://ui.shadcn.com/docs
- **License**: MIT

### TanStack Table
- **Website**: https://tanstack.com/table
- **GitHub**: https://github.com/TanStack/table
- **Documentation**: https://tanstack.com/table/latest
- **License**: MIT
- **React Integration**: https://tanstack.com/table/latest/docs/framework/react/overview

### Admin Dashboard Template
- **Demo**: https://next-shadcn-admin-dashboard.vercel.app/
- **GitHub**: (Check template repository)
- **License**: (Verify permissive license)

### Design Inspiration
- **shadcn/ui Examples**: https://ui.shadcn.com/examples
- **Tailwind UI**: https://tailwindui.com/ (for patterns, not components)

---

## Alternatives Considered

### Material-UI (MUI)
- ❌ Larger bundle size
- ❌ Different design language
- ❌ More opinionated

### Ant Design
- ❌ Larger bundle size
- ❌ Less customizable
- ❌ Different design language

### Chakra UI
- ⚠️ Good alternative, but shadcn/ui better for Next.js
- ⚠️ More runtime dependencies

### Headless UI
- ⚠️ Good for accessibility, but requires more styling work
- ✅ shadcn/ui uses Radix UI (similar, but with styles)

---

## Conclusion

**shadcn/ui + TanStack Table + Next.js Admin Dashboard Template** is the optimal choice because:

1. ✅ Perfect stack alignment (Next.js, Tailwind, TypeScript)
2. ✅ Open source and permissive license (MIT for both)
3. ✅ Production-ready template
4. ✅ Highly customizable
5. ✅ Accessible by default
6. ✅ Small bundle size
7. ✅ Active community and maintenance
8. ✅ Powerful data grid capabilities (TanStack Table)
9. ✅ Headless architecture (full control over UI)
10. ✅ Excellent TypeScript support

This combination provides a solid foundation while allowing full customization for our specific domain needs.

---

*This specification should be reviewed and updated as the UI evolves.*

