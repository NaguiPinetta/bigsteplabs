# 📚 BigStepLabs 2.0

> AI-Integrated Learning Management System with Modular Content & Conversational Agents

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A Supabase account
- Git

### 1. Setup Database

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the migration files in order:
   ```sql
   -- In your Supabase SQL editor, run these files in order:
   -- 1. supabase/migrations/001_initial_schema.sql
   -- 2. supabase/migrations/002_rls_policies.sql
   -- 3. supabase/migrations/003_storage_setup.sql
   -- 4. supabase/migrations/004_seed_data.sql
   ```

### 2. Environment Setup

Create a `.env` file in the project root:

```bash
########################################
# 🚀 SUPABASE CONFIGURATION
########################################
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here

# ⚠️ Backend use only — do not expose to frontend!
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

########################################
# 🤖 AI CONFIGURATION (Optional)
########################################
VITE_OPENAI_API_KEY=sk-proj-your_openai_key_here
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Visit http://localhost:5173/ and test your setup!

## 🧪 Testing Your Setup

1. **Database Connection Test:** Visit `/test-db` to verify database connectivity
2. **Authentication Flow:**
   - Go to `/auth/login`
   - Enter your email address
   - Check email for magic link
   - Click link to authenticate
3. **Role-Based Dashboard:** Once logged in, you'll see role-specific features

## 🏗️ Architecture

### Core Technologies

- **Frontend:** SvelteKit + TypeScript
- **Styling:** TailwindCSS + SHADCN UI
- **Backend:** Supabase (Database + Auth + Storage)
- **AI Integration:** OpenAI API (configurable)

### Database Schema (12 Tables)

- **Authentication:** `users` with role-based access
- **Content Structure:** `modules` → `units` → `content`
- **AI System:** `datasets` → `content_chunks` → `personas` → `agents`
- **Learning:** `chat_sessions` → `messages` + `user_progress`

### Storage Buckets

- `/public/` - Public assets
- `/user-uploads/` - User file uploads
- `/content/` - Learning materials
- `/datasets/` - AI training data

## 🔐 Authentication & Roles

### Magic Link Authentication

- Passwordless login via email
- Secure session management
- Auto user profile creation

### Role-Based Access Control

- **Admin:** Full system access
- **Collaborator:** Content & agent management
- **Student:** Learning materials & chat access

## 🎯 Features Status

### ✅ Completed

- [x] Project setup with SvelteKit + TypeScript
- [x] Database schema with RLS policies
- [x] Authentication system with magic links
- [x] Role-based routing and permissions
- [x] Storage buckets with proper policies
- [x] Dark mode UI with SHADCN components
- [x] TypeScript types for all entities

### 🔄 Next Phase (Ready for Implementation)

- [ ] Content Management (Modules, Units, Lessons CRUD)
- [ ] File Upload & Processing System
- [ ] AI Agents & Dataset Management
- [ ] Chat System with Streaming
- [ ] Admin Panel & User Management
- [ ] Workbench for Agent Testing

## 📝 API Endpoints Structure

```
/api/
├── auth/           # Authentication endpoints
├── modules/        # Module CRUD operations
├── units/          # Unit CRUD operations
├── content/        # Content CRUD operations
├── datasets/       # Dataset management
├── agents/         # Agent configuration
├── chat/           # Chat operations
└── admin/          # Admin functions
```

## 🛡️ Security Features

- Row Level Security (RLS) on all tables
- Role-based data access policies
- Secure file upload restrictions
- API key encryption for AI providers
- Session-based authentication

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/     # Reusable UI components
│   ├── stores/         # Svelte stores (auth, etc.)
│   ├── types/          # TypeScript type definitions
│   ├── utils.ts        # Utility functions
│   └── supabase.ts     # Database client
├── routes/
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Main dashboard
│   └── api/            # API endpoints (future)
├── app.css             # Global styles
└── app.html            # HTML template
```

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run check
```

## 🤝 Contributing

This is the foundation for BigStepLabs 2.0. The core infrastructure is complete and ready for feature development.

### Development Workflow

1. Core foundation is stable ✅
2. Ready for content management implementation
3. AI agents and chat system next
4. Admin panel and advanced features

---

**Built with ❤️ using SvelteKit, Supabase, and modern web technologies.**
