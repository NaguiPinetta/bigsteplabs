# BigStepLabs Vitrine Site

## Overview

The vitrine (marketing) site has been implemented at the root (`/`) of the application, while the existing LMS app has been moved to `/app`. This creates a clear separation between the public marketing site and the authenticated learning platform.

## Structure

### Root Routes (Marketing Site)

- `/` - Home page with hero, courses overview, methodology, testimonials, team, FAQ, and CTA
- `/cursos` - Courses overview page with course cards and descriptions
- `/cursos/[slug]` - Individual course detail pages (e.g., `/cursos/ingles-basico`)
- `/metodologia` - Methodology page explaining the learning approach
- `/equipe` - Team page showcasing company members
- `/faq` - FAQ page with accordion-style questions and answers
- `/contato` - Contact page with lead capture form

### App Routes (LMS Platform)

- `/app/auth/login` - Login page
- `/app/dashboard` - User dashboard
- `/app/workbench` - AI agent testing and management
- `/app/admin/settings` - Admin settings and configuration

## Features Implemented

### UI Components

- **SHADCN UI**: All UI elements use SHADCN components (Card, Button, Input, Select, Textarea, Accordion)
- **Tailwind CSS**: Consistent styling and responsive design
- **Modern Layout**: Clean, professional design with proper spacing and typography

### Lead Capture

- Contact form with server-side action (`+page.server.ts`)
- Form validation and error handling
- Data insertion into `prospects` table
- Success/error message display

### SEO & Metadata

- `<svelte:head>` tags with proper titles and descriptions
- Open Graph meta tags for social sharing
- Semantic HTML structure

### Navigation

- Responsive navigation bar with mobile menu
- Footer with company information and quick links
- Proper routing between marketing and app sections

## Technical Implementation

### Server Actions

- Contact form uses SvelteKit server actions for secure data handling
- Supabase integration for prospect data storage
- Proper error handling and validation

### Route Configuration

- Root routes: `prerender = true` for static generation
- App routes: `prerender = false` for dynamic content
- Proper SSR configuration for both sections

### Data Management

- Mock data for courses, team members, and FAQ content
- Structured data models ready for Supabase integration
- Responsive data binding and state management

## Next Steps

### Supabase Schema

- Create `courses_public` table for course information
- Create `course_materials` table for course content
- Create `prospects` table for lead capture
- Implement RLS policies for data security

### Content Management

- Replace mock data with real content from Supabase
- Add image assets for team members and course materials
- Implement content management system for easy updates

### Analytics & Tracking

- Add Google Analytics or similar tracking
- Implement conversion tracking for lead capture
- Add performance monitoring

### Testing & Optimization

- Cross-browser compatibility testing
- Mobile responsiveness validation
- Performance optimization and lazy loading
- Accessibility improvements

## File Structure

```
src/
├── routes/
│   ├── +layout.svelte          # Main layout with NavBar and Footer
│   ├── +page.svelte            # Home page
│   ├── cursos/
│   │   ├── +page.svelte        # Courses overview
│   │   └── [slug]/
│   │       └── +page.svelte    # Course detail page
│   ├── metodologia/
│   │   └── +page.svelte        # Methodology page
│   ├── equipe/
│   │   └── +page.svelte        # Team page
│   ├── faq/
│   │   └── +page.svelte        # FAQ page
│   ├── contato/
│   │   ├── +page.svelte        # Contact page
│   │   └── +page.server.ts     # Contact form handler
│   └── app/                    # LMS application routes
├── lib/
│   └── components/
│       ├── ui/                 # SHADCN UI components
│       └── vitrine/            # Vitrine-specific components
│           ├── NavBar.svelte   # Navigation component
│           └── Footer.svelte   # Footer component
```

## Deployment Notes

- Marketing pages are configured for static pre-rendering
- App routes require server-side rendering for authentication
- Environment variables needed for Supabase integration
- Consider CDN for static assets and marketing pages
