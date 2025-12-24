# UI Testing Conventions - Automation-Friendly Selectors

This document defines the standards for making all UI elements testable via Playwright and Browser MCP automation.

---

## Core Principles

### 1. **Accessible Names First**
- Use semantic HTML with proper `label` associations (`htmlFor` + `id`)
- Use ARIA labels (`aria-label`, `aria-labelledby`) when labels aren't visible
- Use `name` attributes on form inputs (required for form submission)

### 2. **Stable Test IDs as Fallback**
- Every interactive element MUST have a `data-testid` attribute
- Test IDs follow the pattern: `{page-context}-{element-type}-{purpose}`
- Examples:
  - `login-email-input`
  - `reminder-title-input`
  - `onboarding-next-button`
  - `profile-save-button`

### 3. **No Dynamic Selectors**
- ❌ Never use: `Math.random()`, `Date.now()`, `toISOString()` for IDs
- ❌ Never use: CSS selectors based on text content alone
- ✅ Always use: Stable `data-testid` + accessible names
- ✅ Prefer: `getByRole`, `getByLabelText`, `getByTestId` in tests

### 4. **Deterministic Defaults**
- Date/time inputs should have predictable defaults (e.g., 1 hour from now, not random)
- Form state should be consistent across page loads
- Avoid `window.localStorage` for critical form state (use React state + API)

---

## Selector Naming Convention

### Format: `{page}-{element}-{purpose}`

**Page Context:**
- `login` - Login page
- `register` - Registration page
- `onboarding` - Onboarding wizard
- `reminder` - Reminder pages (list, detail, new)
- `profile` - Profile settings
- `escalation` - Escalation profile pages
- `agent` - Agent configuration pages
- `admin` - Admin pages

**Element Types:**
- `input` - Text inputs, email, password, etc.
- `select` - Dropdown selects
- `textarea` - Multi-line text inputs
- `button` - Buttons (submit, cancel, action)
- `link` - Navigation links
- `dialog` - Modal dialogs
- `card` - Card containers
- `error` - Error messages
- `loading` - Loading states

**Purpose:**
- Descriptive purpose: `email`, `password`, `title`, `submit`, `cancel`, `delete`, etc.

### Examples:

```tsx
// ✅ Good
<Input data-testid="login-email-input" />
<Button data-testid="reminder-submit-button">Create</Button>
<select data-testid="onboarding-importance-select">...</select>

// ❌ Bad
<Input id={`input-${Date.now()}`} />
<Button>Submit</Button> // No test ID
```

---

## Required Attributes Checklist

### For Every Form Input:
- ✅ `id` attribute (for label association)
- ✅ `name` attribute (for form submission)
- ✅ `data-testid` attribute (for stable testing)
- ✅ Associated `<label htmlFor={id}>` element
- ✅ `type` attribute (email, password, text, etc.)
- ✅ `autoComplete` attribute (for better UX + testing)

### For Every Button:
- ✅ `data-testid` attribute
- ✅ `type` attribute (`button`, `submit`, `reset`)
- ✅ `aria-label` if button text isn't descriptive
- ✅ `disabled` state should be testable

### For Every Select/Dropdown:
- ✅ `id` + `name` attributes
- ✅ `data-testid` attribute
- ✅ Associated `<label htmlFor={id}>` element

### For Every Link:
- ✅ `data-testid` attribute (if used in tests)
- ✅ `href` attribute
- ✅ Accessible text content

### For Every Dialog/Modal:
- ✅ `data-testid` on dialog container
- ✅ `aria-label` or `aria-labelledby` on dialog
- ✅ Test IDs on dialog actions (confirm, cancel, close)

---

## Page-by-Page Checklist

### Auth Pages
- [x] `/login` - Login form (email, password, OAuth buttons)
- [x] `/register` - Registration form (displayName, email, password)
- [ ] `/oauth/callback` - OAuth callback handling

### Dashboard Pages
- [x] `/dashboard` - Dashboard layout (navigation, logout)
- [x] `/onboarding` - Onboarding wizard (multi-step form)
- [x] `/reminders` - Reminder list
- [x] `/reminders/new` - Create reminder form
- [x] `/reminders/[id]` - Reminder detail/edit
- [x] `/settings/profile` - Profile edit form
- [x] `/settings/escalation-profiles/new` - Create escalation profile
- [x] `/settings/escalation-profiles/[id]/edit` - Edit escalation profile
- [x] `/agents/[id]/configure` - Agent configuration form

### Admin Pages
- [ ] `/admin/dashboard` - Admin dashboard
- [ ] `/admin/users` - User list
- [ ] `/admin/users/[id]` - User detail
- [ ] `/admin/reminders` - Admin reminder list
- [ ] `/admin/agents` - Admin agent management
- [ ] `/admin/audit` - Audit log
- [ ] `/admin/billing` - Billing management
- [ ] `/admin/system` - System status

---

## Playwright Test Helpers

### Recommended Selector Strategy (in order of preference):

1. **`getByRole`** - Use for buttons, links, form inputs with labels
   ```ts
   await page.getByRole('button', { name: 'Sign in' }).click();
   await page.getByRole('textbox', { name: 'Email address' }).fill('test@example.com');
   ```

2. **`getByLabelText`** - Use for form inputs with proper labels
   ```ts
   await page.getByLabelText('Email address').fill('test@example.com');
   await page.getByLabelText('Password').fill('password123');
   ```

3. **`getByTestId`** - Use as fallback for complex or dynamic elements
   ```ts
   await page.getByTestId('login-submit-button').click();
   await page.getByTestId('reminder-title-input').fill('Call dentist');
   ```

4. **`getByPlaceholderText`** - Use sparingly (less stable)
   ```ts
   await page.getByPlaceholderText('you@example.com').fill('test@example.com');
   ```

---

## Common Patterns

### Form Submission
```tsx
<form onSubmit={handleSubmit} data-testid="reminder-form">
  <Input
    id="title"
    name="title"
    data-testid="reminder-title-input"
    required
  />
  <Button type="submit" data-testid="reminder-submit-button">
    Create
  </Button>
</form>
```

### Dialog/Modal
```tsx
<Dialog data-testid="snooze-dialog">
  <DialogTrigger>
    <Button data-testid="snooze-trigger-button">Snooze</Button>
  </DialogTrigger>
  <DialogContent>
    <Input data-testid="snooze-duration-input" />
    <Button data-testid="snooze-confirm-button">Confirm</Button>
    <Button data-testid="snooze-cancel-button">Cancel</Button>
  </DialogContent>
</Dialog>
```

### Navigation Links
```tsx
<Link href="/reminders" data-testid="nav-reminders-link">
  Reminders
</Link>
```

### Error Messages
```tsx
{error && (
  <div data-testid="form-error-message" role="alert">
    <p>{error}</p>
  </div>
)}
```

---

## Anti-Patterns to Avoid

### ❌ Dynamic IDs
```tsx
// BAD
<Input id={`input-${Date.now()}`} />
<Input id={`field-${Math.random()}`} />
```

### ❌ Missing Labels
```tsx
// BAD
<Input placeholder="Email" /> // No label, no test ID
```

### ❌ Text-Only Selectors
```tsx
// BAD - Don't rely on text content alone
await page.click('text=Submit'); // Fragile if text changes
```

### ❌ CSS Class Selectors
```tsx
// BAD - Classes can change
await page.click('.btn-primary'); // Fragile
```

---

## Testing Checklist

Before marking a page as "automation-friendly":

- [ ] All form inputs have `id`, `name`, `data-testid`, and associated `<label>`
- [ ] All buttons have `data-testid` and `type` attributes
- [ ] All selects have `id`, `name`, `data-testid`, and associated `<label>`
- [ ] All dialogs/modals have `data-testid` on container and actions
- [ ] All error messages have `data-testid` and `role="alert"`
- [ ] All navigation links have `data-testid` (if used in tests)
- [ ] No dynamic IDs or random values in selectors
- [ ] Date/time inputs have deterministic defaults
- [ ] Loading states are testable (`data-testid="loading"` or similar)
- [ ] Form validation errors are testable

---

## Browser MCP Compatibility

All selectors should work with Browser MCP's element selection:
- Use `getByRole` for semantic elements
- Use `getByLabelText` for form inputs
- Use `getByTestId` for complex or dynamic elements
- Ensure elements are visible and interactable (not hidden by CSS)

---

*Last updated: December 2025*
