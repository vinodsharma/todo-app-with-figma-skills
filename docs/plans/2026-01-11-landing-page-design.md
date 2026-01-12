# Landing Page Design

**Date:** 2026-01-11
**Goal:** Create a modern, professional landing page that showcases all features and converts visitors to sign-ups.

## Overview

A landing page that balances conversion (CTAs, social proof) with comprehensive feature showcase. Visual style matches the existing app: clean, minimal, monochromatic with shadcn/ui components.

## Design Decisions

| Decision | Choice |
|----------|--------|
| Visual style | Match app: monochromatic, Geist font, shadcn/ui |
| Feature showcase | Hero mockup + static screenshots |
| Theme | Dark mode default with toggle |
| Sections | Hero, Features, How it Works, Feature Grid, Theme Showcase, Testimonials, FAQ, CTA, Footer |
| Future-proofing | Placeholder for Pricing & Integrations |

---

## Page Structure

```
Navigation Bar
  └─ Logo | Features | FAQ | Sign In | Get Started (CTA)

Hero Section
  └─ Headline + Subheadline + 2 CTAs + Hero Mockup

Features Section (6 key features)
  └─ Alternating left-right layout with screenshots

How It Works (3 steps)
  └─ Sign Up → Create → Get Done

Full Feature Grid (6 categories)
  └─ Comprehensive feature list

Dark/Light Mode Showcase
  └─ Side-by-side comparison

Social Proof (3 testimonials)
  └─ Dummy data for now

FAQ Section (5 questions)
  └─ Accordion-style

CTA Footer
  └─ Final call-to-action

Footer
  └─ Links + Coming Soon placeholders
```

---

## Section 1: Navigation Bar

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] Todo App     Features  FAQ     Sign In  [Get Started]│
└─────────────────────────────────────────────────────────────┘
```

**Elements:**
- Logo: "Todo App" text (matches header)
- Links: Features (anchor), FAQ (anchor)
- Sign In: Ghost button → `/login`
- Get Started: Primary button → `/register`
- Sticky on scroll with backdrop blur

---

## Section 2: Hero Section

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   The todo app that                    ┌─────────────────┐  │
│   gets out of your way                 │   [Hero Mockup] │  │
│                                        │   App screenshot│  │
│   Organize tasks with categories,      │   dark mode     │  │
│   priorities, due dates, and           └─────────────────┘  │
│   recurring schedules. Simple yet                           │
│   powerful.                                                 │
│                                                             │
│   [Get Started Free]  [View Demo]                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Content:**
- **Headline:** "The todo app that gets out of your way"
- **Subheadline:** "Organize tasks with categories, priorities, due dates, and recurring schedules. Simple yet powerful."
- **Primary CTA:** "Get Started Free" → `/register`
- **Secondary CTA:** "View Demo" → scroll to features

**Hero Mockup:**
- Composite showing app in dark mode with list view
- Slight perspective/shadow for depth
- Use screenshot: `06-main-view-dark.png` as base

**Styling:**
- Headline: `text-5xl font-bold`
- Subheadline: `text-xl text-muted-foreground`
- Primary button: Solid, `rounded-lg`
- Secondary button: Ghost/outline variant

---

## Section 3: Features Section

**Layout:** Alternating left-right pattern

**6 Key Features:**

| # | Feature | Screenshot | Description |
|---|---------|------------|-------------|
| 1 | **Categories & Organization** | Sidebar crop | Color-coded categories to keep your tasks organized. Drag and drop to reorder. |
| 2 | **Calendar View** | `04-calendar-view-light.png` | Visualize your schedule with month and week views. Click any date to add tasks. |
| 3 | **Recurring Tasks** | Todo with repeat icon | Set daily, weekly, or monthly schedules. Skip or stop anytime. |
| 4 | **Bulk Actions** | `08-bulk-actions-dark.png` | Select multiple todos and complete, archive, or delete in one click. |
| 5 | **Activity History** | `07-activity-sidebar-dark.png` | Full audit trail of all your changes. Never lose track of what happened. |
| 6 | **Dark Mode** | Light/dark comparison | Seamless theme switching with system detection. Easy on the eyes. |

**Styling:**
- Section title: `text-3xl font-semibold` centered
- Feature cards: Subtle border, rounded corners
- Screenshots: Rounded with shadow
- Alternating: Image left/text right, then swap

---

## Section 4: How It Works

**Layout:** 3 horizontal steps

```
   ┌─────────┐         ┌─────────┐         ┌─────────┐
   │    ①   │  ────▶  │    ②   │  ────▶  │    ③   │
   │  Sign Up │         │  Create │         │ Get Done│
   └─────────┘         └─────────┘         └─────────┘
```

**Steps:**

| Step | Icon | Title | Description |
|------|------|-------|-------------|
| 1 | UserPlus | **Sign Up** | Create your free account in seconds with email or Google |
| 2 | PenLine | **Create** | Add todos with priorities, due dates, categories, and recurrence |
| 3 | CheckCircle | **Get Done** | Check off tasks, track progress, and stay organized |

**Styling:**
- Background: `bg-muted/30`
- Step numbers: Circled, primary color
- Icons: Lucide icons
- CTA below: "Get Started Free"

---

## Section 5: Full Feature Grid

**Layout:** 3-column grid (2 tablet, 1 mobile)

**Feature Categories:**

### Task Management
- Create, edit, delete todos
- Subtasks support
- Three priority levels
- Rich descriptions
- Bulk operations

### Organization
- Color-coded categories
- Drag & drop reorder
- Archive & restore
- Smart filters
- Todo counts per category

### Scheduling
- Due dates with calendar picker
- Recurring tasks (daily/weekly/monthly)
- Calendar view (month/week)
- Overdue alerts
- Quick reschedule

### Search & Filter
- Full-text search
- Filter by priority
- Filter by status
- Filter by due date
- Multi-column sorting

### Power User
- Keyboard shortcuts
- Quick actions on hover
- Range selection (Shift+click)
- Activity history log
- Undo support

### Appearance
- Dark mode
- Light mode
- System theme detection
- Fully responsive
- Mobile-friendly

**Styling:**
- Cards with icon header
- Checkmark list items
- Subtle borders

---

## Section 6: Dark/Light Mode Showcase

**Layout:** Side-by-side comparison

**Content:**
- **Headline:** "Works the Way You Do"
- **Subheadline:** "Seamless dark and light modes for any environment"

**Screenshots:**
- Light: `03-main-view-light.png`
- Dark: `06-main-view-dark.png`

**Bullet Points:**
- Follows system preference automatically
- Easy manual toggle anytime
- Preference saved to your account

**Styling:**
- Screenshots in rounded frames with shadow
- Optional: Interactive toggle to highlight one

---

## Section 7: Social Proof (Testimonials)

**Layout:** 3 cards in a row

**Testimonials:**

| # | Quote | Name | Role |
|---|-------|------|------|
| 1 | "Finally, a todo app that doesn't try to do too much. Clean, fast, and just works." | Sarah M. | Designer |
| 2 | "The recurring tasks feature is a game changer. I never forget weekly reviews anymore." | James K. | Product Manager |
| 3 | "Dark mode and keyboard shortcuts make this my daily driver. So fast!" | Alex R. | Developer |

**Styling:**
- 5-star rating (amber) at top
- Quote in `text-lg`
- Avatar: Initials circle (SM, JK, AR)
- Name: `font-medium`
- Role: `text-muted-foreground text-sm`

---

## Section 8: FAQ Section

**Layout:** Accordion (shadcn/ui)

**Questions:**

| Question | Answer |
|----------|--------|
| **Is it free to use?** | Yes! Todo App is completely free with all features. Optional paid plans coming in the future. |
| **How is my data protected?** | Securely stored in PostgreSQL with encryption. Industry-standard auth with NextAuth.js. Your todos are private. |
| **Is there a mobile app?** | Fully responsive for mobile browsers. Native iOS/Android apps on the roadmap. |
| **Can I import from other apps?** | Import functionality coming soon. Planning support for Todoist, Things, and CSV. |
| **Will there be paid plans?** | Exploring premium features like team collaboration and integrations. Sign up to be notified. |

**Styling:**
- `Accordion` component from shadcn/ui
- Chevron icon on right
- Smooth expand/collapse

---

## Section 9: CTA Footer

**Layout:** Centered with gradient background

**Content:**
- **Headline:** "Ready to Get Organized?"
- **Subheadline:** "Start managing your tasks today. It's free."
- **Primary CTA:** "Get Started Free" → `/register`
- **Secondary CTA:** "Sign In" → `/login`

**Styling:**
- Accent gradient background
- Large centered text
- Buttons side-by-side

---

## Section 10: Footer

**Layout:** Multi-column

**Columns:**

| Column 1 | Column 2 (Product) | Column 3 (Coming Soon) |
|----------|-------------------|------------------------|
| Todo App logo | Features | Pricing |
| "The simple todo app that gets out of your way." | FAQ | Integrations |
| | Sign In | Mobile Apps |
| | Register | |

**Bottom Bar:**
- Left: "© 2026 Todo App. All rights reserved."
- Right: Theme toggle

**Styling:**
- `bg-muted/50` background
- "Coming Soon" items muted/disabled
- Theme toggle matches app

---

## Technical Implementation

**Route:** `/` (replace current authenticated home, add auth redirect)

**New Files:**
```
src/app/(marketing)/
  ├── layout.tsx        # Marketing layout (no sidebar)
  ├── page.tsx          # Landing page
  └── components/
      ├── navbar.tsx
      ├── hero.tsx
      ├── features.tsx
      ├── how-it-works.tsx
      ├── feature-grid.tsx
      ├── theme-showcase.tsx
      ├── testimonials.tsx
      ├── faq.tsx
      ├── cta-footer.tsx
      └── footer.tsx
```

**Routing Logic:**
- `/` → Landing page (unauthenticated) or redirect to `/dashboard` (authenticated)
- `/dashboard` → Main app (move current page.tsx here)
- `/login`, `/register` → Auth pages (unchanged)

**Assets:**
- Screenshots from `.playwright-mcp/` folder
- Optimize and move to `public/images/`

**Dependencies:**
- No new dependencies needed
- Uses existing shadcn/ui components

---

## Screenshots Reference

| File | Usage |
|------|-------|
| `03-main-view-light.png` | Theme showcase (light) |
| `04-calendar-view-light.png` | Calendar feature |
| `06-main-view-dark.png` | Hero mockup, Theme showcase (dark) |
| `07-activity-sidebar-dark.png` | Activity history feature |
| `08-bulk-actions-dark.png` | Bulk actions feature |
| `09-login-page-dark.png` | Reference only |
