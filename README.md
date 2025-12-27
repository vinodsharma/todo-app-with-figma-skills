# Todo App

A modern, full-stack todo application built with Next.js, featuring categories, priorities, due dates, and a beautiful UI.

**[Try the Live App](https://todo-app-production.vercel.app)**

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)

---

## Features

- **Authentication** - Email/password and Google OAuth sign-in
- **Todo Management** - Create, edit, delete, and complete todos
- **Categories** - Organize todos with color-coded categories
- **Priorities** - Set High, Medium, or Low priority levels
- **Due Dates** - Track deadlines with overdue indicators
- **Dark Mode** - System-aware theme with manual toggle
- **Responsive Design** - Works on desktop and mobile

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Database | [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/) |
| Authentication | [NextAuth.js](https://next-auth.js.org/) |
| Deployment | [Vercel](https://vercel.com/) |

---

## Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [Docker](https://www.docker.com/) (recommended) or PostgreSQL installed locally

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/vinodsharma/todo-app-with-figma-skills.git
   cd todo-app-with-figma-skills
   ```

2. **Start the application**
   ```bash
   docker compose up
   ```

3. **Open the app**

   Visit [http://localhost:3000](http://localhost:3000)

### Manual Setup

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/vinodsharma/todo-app-with-figma-skills.git
   cd todo-app-with-figma-skills
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your configuration:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/todoapp"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"

   # Optional: Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

3. **Set up the database**
   ```bash
   npx prisma migrate dev
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**

   Visit [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── (auth)/          # Authentication pages
│   ├── api/             # API routes
│   └── page.tsx         # Main dashboard
├── components/          # React components
│   ├── ui/              # shadcn/ui components
│   └── ...              # Feature components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and configurations
└── types/               # TypeScript types
prisma/
└── schema.prisma        # Database schema
```

---

## Contributing

We welcome contributions! Here's how you can help:

### Reporting Issues

- Check [existing issues](https://github.com/vinodsharma/todo-app-with-figma-skills/issues) first
- Use issue templates when available
- Include steps to reproduce bugs

### Feature Requests

Browse our [milestones](https://github.com/vinodsharma/todo-app-with-figma-skills/milestones) to see planned features:

- **Quick Wins - Core UX** - Low effort, high impact improvements
- **Power Features - Task Management** - Advanced task capabilities
- **Pro Capabilities - Advanced Workflows** - Power user features

### Development Workflow

1. **Fork the repository**

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow existing code style
   - Add tests if applicable
   - Update documentation as needed

4. **Test your changes**
   ```bash
   npm run build
   npm run lint
   ```

5. **Submit a pull request**
   - Target the `staging` branch
   - Describe your changes clearly
   - Link related issues

### Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `staging` | Pre-production testing |
| `feature/*` | New features |
| `fix/*` | Bug fixes |

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com/)
3. Configure environment variables
4. Deploy

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Random secret for sessions | Yes |
| `NEXTAUTH_URL` | App URL (e.g., https://your-app.vercel.app) | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Vercel](https://vercel.com/) for hosting
- [Prisma](https://www.prisma.io/) for the excellent ORM
