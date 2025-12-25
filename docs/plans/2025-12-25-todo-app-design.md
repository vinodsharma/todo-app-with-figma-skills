# Todo App Design

## Overview

A full-stack todo application with user authentication, categories, priorities, and due dates.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js (Email/password + Google OAuth)
- **Runtime:** Docker for development and testing

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   └── page.tsx          # Main todo list view
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   └── todos/
│   └── layout.tsx
├── components/
│   ├── ui/                   # shadcn components
│   ├── todo-item.tsx
│   ├── todo-list.tsx
│   ├── todo-form.tsx
│   └── category-sidebar.tsx
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   └── utils.ts
prisma/
└── schema.prisma
```

## Data Model

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  password      String?   # null for OAuth users
  image         String?
  accounts      Account[]
  sessions      Session[]
  todos         Todo[]
  categories    Category[]
  createdAt     DateTime  @default(now())
}

model Category {
  id        String   @id @default(cuid())
  name      String
  color     String   @default("#6b7280")
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  todos     Todo[]
  createdAt DateTime @default(now())

  @@unique([userId, name])
}

model Todo {
  id         String    @id @default(cuid())
  title      String
  completed  Boolean   @default(false)
  priority   Priority  @default(MEDIUM)
  dueDate    DateTime?
  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}
```

## Authentication

- **Providers:** Credentials (email/password) + Google OAuth
- **Session strategy:** JWT (stateless)
- **Password:** bcrypt with 12 salt rounds, minimum 8 characters
- **Protected routes:** Middleware checks session on `/dashboard` routes

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/todos` | List user's todos (with filters) |
| POST | `/api/todos` | Create todo |
| PATCH | `/api/todos/[id]` | Update todo |
| DELETE | `/api/todos/[id]` | Delete todo |
| GET | `/api/categories` | List user's categories |
| POST | `/api/categories` | Create category |
| DELETE | `/api/categories/[id]` | Delete category |

**Query params for GET /api/todos:**
- `?categoryId=xxx` - filter by category
- `?completed=true|false` - filter by status
- `?priority=LOW|MEDIUM|HIGH` - filter by priority

## UI Layout

```
┌─────────────────────────────────────────────────┐
│  Header: Logo, User avatar, Sign out            │
├──────────────┬──────────────────────────────────┤
│  Sidebar     │  Main Content                    │
│              │                                  │
│  Categories: │  ┌─ Add Todo Form ─────────────┐ │
│  • All       │  │ [Title] [Date] [Priority]   │ │
│  • Work      │  └─────────────────────────────┘ │
│  • Personal  │                                  │
│  • Shopping  │  ┌─ Todo List ─────────────────┐ │
│              │  │ ☐ Buy groceries    High  📅 │ │
│  [+ Add]     │  │ ☑ Call mom        Med       │ │
│              │  │ ☐ Finish report   Low   📅  │ │
│              │  └─────────────────────────────┘ │
└──────────────┴──────────────────────────────────┘
```

## shadcn/ui Components

**To install:**
```
button, input, checkbox, select, calendar, popover,
dropdown-menu, avatar, card, badge, dialog, label,
separator, toast
```

**Component mapping:**

| UI Element | shadcn Component(s) |
|------------|---------------------|
| Todo checkbox | `Checkbox` |
| Todo title input | `Input` |
| Priority selector | `Select` with colored `Badge` |
| Due date picker | `Popover` + `Calendar` |
| Category selector | `Select` |
| Add/Delete buttons | `Button` |
| User menu | `DropdownMenu` + `Avatar` |
| Category list | `Button` variants in sidebar |
| Todo item container | `Card` or custom flex div |
| Confirmations | `Dialog` |
| Notifications | `Toast` (via sonner) |

**Priority colors:**
- High: `destructive` (red)
- Medium: `warning` (amber/yellow)
- Low: `secondary` (gray)
