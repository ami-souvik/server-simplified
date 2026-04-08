# GEMINI.md

## Purpose

This document defines coding standards, formatting rules, linting guidelines, UI styling principles, and **task annotation rules** for the project. All generated and written code MUST follow these rules.

---

## 🧹 Code Formatting (Prettier)

All code must strictly adhere to the following Prettier configuration:

```json
{
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": false,
    "printWidth": 100,
    "tabWidth": 2,
    "useTabs": false
}
```

### Rules

- Always use **semicolons**.
- Use **double quotes** for strings.
- Include trailing commas where valid in ES5 (objects, arrays, etc.).
- Maximum line width is **100 characters**.
- Use **2 spaces** for indentation (no tabs).
- Keep code clean, consistent, and readable.

---

## 📏 ESLint Rules (Next.js)

Follow Next.js recommended ESLint configuration:

### Base Config

- `next/core-web-vitals`

### General Rules

- No unused variables (`no-unused-vars`)
- Prefer `const` over `let` when possible
- Avoid `any` in TypeScript (use strict types)
- Use arrow functions for components and callbacks
- Ensure accessibility rules (`jsx-a11y`) are followed
- No console logs in production code

### React / Next.js Rules

- Use **functional components only**
- Use **React hooks properly** (no conditional hooks)
- Prefer **server components** when possible
- Use **dynamic imports** for heavy components
- Optimize images using `next/image`
- Use `next/link` for navigation
- Avoid inline styles; prefer Tailwind or CSS modules
- For middleware implementation, follow this: The "middleware" file convention is deprecated and has been renamed to proxy. Please use "proxy" instead.
- **No `@ts-ignore`**: Do not use `@ts-ignore` or `@ts-nocheck` to suppress TypeScript errors.
- **Proper Typing**: Always fix TypeScript errors by providing the correct types, interfaces, or type assertions if necessary. If a third-party library has missing type definitions, use module augmentation in a `.d.ts` file.
- **AI SDK Integration**: When using the Vercel AI SDK, ensure that the types match the actual version installed in the project. If `useChat` parameters like `metadata` or `body` show errors, investigate the actual type definitions in `node_modules` or augment the types if they are missing but supported.
- **Emotional Editorial Design**: Maintain the "Emotional Editorial" design system (vibrant colors, glassmorphism, modern typography) in all UI components. Use high contrast for readability and smooth animations for a premium feel.

---

## 🧩 Project Structure Guidelines

- Use **feature-based folder structure**

- Separate:
    - `components/`
    - `features/`
    - `hooks/`
    - `lib/`
    - `services/`

- Keep components **small and reusable**

- Use proper naming conventions:
    - Components: `PascalCase`
    - Functions/variables: `camelCase`

---

# 🧠 Task Annotation Guidelines (NEW)

## 🎯 Purpose

The codebase must act as a **source of truth for pending work**.
Whenever implementation is incomplete, deferred, or suboptimal, developers and LLMs MUST leave structured task comments.

These annotations are later consumed by automation (e.g., grep-based scanning, Qlarify agents).

---

## 🏷️ Supported Tags

Use the following standardized tags:

- `TASK:` → General task
- `TODO:` → Minor or optional work
- `FIXME:` → Bugs or incorrect behavior

---

## 🔥 Mandatory Scenarios for Adding Tasks

### 1. Backend Not Implemented

If frontend or API usage assumes backend work that is not implemented:

```ts
// TASK[P1]: Implement backend API for user analytics aggregation
```

---

### 2. Incomplete Feature Implementation

If a feature is partially implemented:

```ts
// TASK[P1]: Complete payment retry handling for failed transactions
```

---

### 3. Temporary / Placeholder Logic

```ts
// TASK[P2]: Replace mock data with real API integration
```

---

### 4. Expensive or Non-Optimized Operations

If code is functional but inefficient:

```ts
// TASK[P2]: Optimize this loop to reduce O(n^2) complexity
```

```ts
// TASK[P3]: Add caching layer to reduce repeated DB calls
```

---

### 5. Missing Edge Case Handling

```ts
// FIXME[P1]: This breaks when user has no active subscription
```

---

### 6. Refactoring / Code Quality Improvements

```ts
// TODO[P3]: Refactor this into reusable hook
```

---

## ⚡ Priority System

Always include priority when possible:

- `P1` → Critical (blocking / bugs / core feature missing)
- `P2` → Important (performance / improvements)
- `P3` → Nice-to-have (refactor / cleanup)

---

## 🧾 Task Format Standard

```ts
// TASK[P<priority>]: <clear actionable description>
```

Examples:

```ts
// TASK[P1]: Implement backend webhook handler for Stripe events
// TASK[P2]: Optimize API response time by batching DB queries
// TODO[P3]: Improve UI loading skeleton
// FIXME[P1]: Fix crash when token is undefined
```

---

## 🧠 LLM Behavior Rules (CRITICAL)

When generating or modifying code, the LLM MUST:

### ✅ Always Add Tasks When:

- Backend dependency is missing
- Feature is partially implemented
- Logic is mocked or hardcoded
- Expensive operations are detected
- Proper architecture is deferred

---

### ❌ Never Ignore:

- Performance issues
- Missing integrations
- Silent failures or edge cases

---

### 🧩 Example (Expected Behavior)

```ts
const users = await fetchUsers();

// TASK[P2]: Add pagination support to avoid loading all users at once
return users;
```

---

## 🔄 Integration with Task Scanner

All task annotations MUST be compatible with:

```bash
grep -r -n -E "TASK:|TODO:|FIXME:" ./app
```

---

## 🎨 UI & Design System (Based on Reference Images)

The UI should follow a **minimal, soft, and modern SaaS dashboard aesthetic**.

### Core Design Principles

- Clean, airy layout with **ample whitespace**
- Soft shadows and subtle depth
- Rounded corners (medium to large radius)
- Calm, non-distracting color palette
- Focus on usability over decoration

---

### 🌈 Colors

Use soft, muted tones from the reference images:

- Background: `#F8F9FB` (Light Gray/Blue)
- Main Container: `#FFFFFF`
- Text Primary: `#111827` (Dark Gray)
- Text Secondary: `#6B7280` (Medium Gray)
- Text Teritery: `#9CA3AF` (Light Gray)
- Accent Colors:
    - **Purple (Work)**: Background `#F3E8FF`, Text `#7C3AED`
    - **Yellow (Campaign)**: Background `#FEF3C7`, Text `#D97706`
    - **Blue (Research)**: Background `#E0F2FE`, Text `#0284C7`
    - **Pink (Study)**: Background `#FCE7F3`, Text `#DB2777`

---

### 🧱 Layout

- Sidebar navigation on the left
- Main content area with card-based layout
- Use consistent spacing scale (8px grid system)
- Maintain visual hierarchy using typography and spacing

---

### 🔲 Components

#### Cards (Main Featured)

- Rounded corners: `rounded-[20px] or rounded-[24px]`
- Border: `border border-stone-100`
- Shadow: `shadow-sm` or `shadow-md shadow-stone-200/20`
- Padding: `p-6`

#### Buttons

- Primary: Solid dark background (`#111827`), white text, `rounded-lg`
- Secondary: Ghost or outline, subtle gray text
- Hover: Light background (`#F9FAFB`) for ghost buttons

---

### 🔤 Typography

- Use modern sans-serif (Inter preferred)
- Clear hierarchy:
    - Heading: bold, larger size
    - Subheading: medium weight
    - Body: regular

---

## ⚡ Performance Guidelines

- Use server-side rendering when beneficial
- Lazy load components
- Optimize images and assets
- Minimize bundle size
- Avoid unnecessary re-renders

---

## ✅ Code Quality Checklist

Before committing:

- Code passes ESLint
- Code is formatted with Prettier
- No unused imports or variables
- Components are reusable and clean
- UI matches design system
- No console logs or debug code
- ✅ Task annotations added where required

---

## 🚀 Summary

Write code that is:

- Clean
- Consistent
- Scalable
- Performant
- Self-documenting (via TASK annotations)

Follow both **engineering discipline** and **design simplicity** at all times.

---

If you want next step, I’d strongly suggest we **connect this directly with your Qlarify pipeline**:

👉 Auto-detect tasks → convert to tickets → trigger code agent → auto PR

That’s where this becomes a _serious product_, not just a dev convenience.
