# Todo App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-stack todo application with user authentication, categories, priorities, and due dates.

**Architecture:** Next.js App Router with PostgreSQL database via Prisma ORM. NextAuth.js handles email/password and Google OAuth. Frontend uses shadcn/ui components with Tailwind CSS. Docker Compose orchestrates the development environment.

**Tech Stack:** Next.js 14+, TypeScript, PostgreSQL, Prisma, NextAuth.js, Tailwind CSS, shadcn/ui, Docker, Playwright MCP

---

## Progress Tracker

| Milestone | Status | Tasks |
|-----------|--------|-------|
| 1. Project Setup | [ ] | 1-6 |
| 2. Authentication | [ ] | 7-12 |
| 3. Core API | [ ] | 13-18 |
| 4. UI Components | [ ] | 19-24 |
| 5. Integration & E2E Testing | [ ] | 25-28 |

---

## Milestone 1: Project Setup

### Task 1: Initialize Next.js Project
Create Next.js app with TypeScript, Tailwind, ESLint, App Router, and src directory.

### Task 2: Create Docker Configuration
- `Dockerfile` - Node 20 Alpine, install deps, run dev server
- `docker-compose.yml` - App service + PostgreSQL 15 with healthcheck
- `.env.example` - DATABASE_URL, NEXTAUTH_SECRET, Google OAuth credentials

### Task 3: Install and Configure Prisma
- Initialize Prisma with PostgreSQL
- Define schema: User, Account, Session, VerificationToken (NextAuth), Category, Todo
- Todo has: title, completed, priority (enum), dueDate, categoryId
- Category has: name, color, userId
- Create `src/lib/prisma.ts` singleton

### Task 4: Initialize shadcn/ui
Install components: button, input, checkbox, select, calendar, popover, dropdown-menu, avatar, card, badge, dialog, label, separator, sonner

### Task 5: Build and Test Docker Setup
- Build containers
- Run initial migration
- Verify app loads at localhost:3000

### Task 6: Create Base Layout Structure
- `src/components/providers.tsx` - SessionProvider + Toaster
- `src/app/layout.tsx` - Root layout with Providers
- `src/app/(auth)/layout.tsx` - Centered auth pages
- `src/app/page.tsx` - Main dashboard (protected)

---

## Milestone 2: Authentication

### Task 7: Install Auth Dependencies
next-auth, @auth/prisma-adapter, bcryptjs

### Task 8: Configure NextAuth.js
- `src/lib/auth.ts` - NextAuthOptions with:
  - PrismaAdapter
  - CredentialsProvider (email/password with bcrypt)
  - GoogleProvider
  - JWT session strategy
  - Callbacks for userId in session
- `src/app/api/auth/[...nextauth]/route.ts` - Route handler
- `src/types/next-auth.d.ts` - Type augmentation for user.id

### Task 9: Create Registration API
`POST /api/auth/register` - Validate input, check existing user, hash password, create user

### Task 10: Create Login Page
- `src/components/auth/login-form.tsx` - Email/password form, Google button, signIn calls
- `src/app/(auth)/login/page.tsx`

### Task 11: Create Registration Page
- `src/components/auth/register-form.tsx` - Name/email/password form, fetch register API, auto sign-in
- `src/app/(auth)/register/page.tsx`

### Task 12: Add Auth Middleware
`src/middleware.ts` - Protect all routes except /login, /register, /api, static files

---

## Milestone 3: Core API

### Task 13: Todos API - List & Create
`src/app/api/todos/route.ts`
- `GET` - List user's todos with optional filters (categoryId, completed, priority)
- `POST` - Create todo with title, priority, dueDate, categoryId

### Task 14: Todos API - Update & Delete
`src/app/api/todos/[id]/route.ts`
- `PATCH` - Update todo fields (verify ownership)
- `DELETE` - Delete todo (verify ownership)

### Task 15: Categories API - List & Create
`src/app/api/categories/route.ts`
- `GET` - List user's categories with todo counts
- `POST` - Create category with name, color (check duplicates)

### Task 16: Categories API - Delete
`src/app/api/categories/[id]/route.ts`
- `DELETE` - Delete category (verify ownership)

### Task 17: Create API Types
`src/types/index.ts` - Todo, Category, CreateTodoInput, UpdateTodoInput, CreateCategoryInput

### Task 18: Create API Client Hooks
- `src/hooks/use-todos.ts` - useTodos(categoryId?) → todos, createTodo, updateTodo, deleteTodo, toggleTodo
- `src/hooks/use-categories.ts` - useCategories() → categories, createCategory, deleteCategory

---

## Milestone 4: UI Components

### Task 19: Create Header Component
`src/components/header.tsx` - Logo, user avatar dropdown with sign out

### Task 20: Create Category Sidebar
- `src/components/add-category-dialog.tsx` - Dialog with name input and color picker
- `src/components/category-sidebar.tsx` - "All" button, category list with counts, delete buttons, add dialog

### Task 21: Create Todo Form
`src/components/todo-form.tsx` - Title input, priority select, date picker popover, category select, add button

### Task 22: Create Todo Item Component
`src/components/todo-item.tsx` - Checkbox, title, category badge, due date (with overdue styling), priority badge, delete button

### Task 23: Create Todo List Component
`src/components/todo-list.tsx` - Loading skeleton, empty state, active todos section, completed todos section

### Task 24: Build Dashboard Page
`src/app/page.tsx` - Compose Header, CategorySidebar, TodoForm, TodoList with state for selectedCategoryId

---

## Milestone 5: Integration & E2E Testing

### Task 25: Test Auth Flow with Playwright MCP
- Navigate to /register, fill form, submit, verify dashboard
- Navigate to /login, fill form, submit, verify dashboard
- Verify protected route redirects

### Task 26: Test Todo CRUD with Playwright MCP
- Create todo via form, verify appears in list
- Click checkbox, verify completed state
- Hover and delete, verify removed

### Task 27: Test Category Management with Playwright MCP
- Open add category dialog, fill and submit, verify in sidebar
- Click category, verify filtered todos
- Delete category, verify removed

### Task 28: Final Integration Test
Full user journey: register → create categories → create todos → toggle/delete → sign out → sign in → verify persistence

---

## Completion Checklist

- [ ] Docker Compose runs successfully
- [ ] User can register with email/password
- [ ] User can sign in with email/password
- [ ] User can sign in with Google (if configured)
- [ ] Unauthenticated users redirected to login
- [ ] User can create todos with title, priority, due date, category
- [ ] User can toggle todo completion
- [ ] User can delete todos
- [ ] User can create categories with name and color
- [ ] User can filter todos by category
- [ ] User can delete categories
- [ ] All data persists after sign out/in
- [ ] UI tested with Playwright MCP
