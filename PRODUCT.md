# Cloud LMS — Product Blueprint

## Overview

- **Domain:** Education
- **Category:** Learning Management Systems (LMS)
- **Reference Product:** TalentLMS
- **Reference Website:** https://www.talentlms.com

---

## What Is This Product?

A **Cloud Learning Management System (LMS)** is a web-based platform that enables organizations to create, deliver, manage, and track online training and learning programs entirely in the cloud — accessible from anywhere, on any device.

It serves as the complete training headquarters for companies, educational institutions, and training providers — automating everything from course creation to certification.

---

## Who Is It For?

| Audience | Use Case |
|---|---|
| Companies & Corporates | Employee onboarding, compliance training, skill development |
| Educational Institutions | Online courses, student management, exams |
| Training Providers | Sell courses to external learners |
| SMBs | Quick team training without big IT setup |
| Enterprises | Large-scale multi-department training programs |

---

## The 3 Core User Roles

### Admin
Controls everything. Manages users, monitors the entire platform, views all reports, configures settings, and oversees all training activity across the organization.

### Instructor
Creates and delivers courses. Builds lessons, uploads content, designs quizzes, tracks student progress, and communicates with learners.

### Learner
Consumes the training. Enrolls in courses, watches videos, reads materials, takes assessments, earns certificates, and tracks personal progress.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Supabase (Auth + Database + Storage + Realtime) |
| AI | Anthropic Claude API |
| Payments | Stripe |
| File Upload | Supabase Storage |
| Charts | Recharts |
| Deployment | Vercel + Supabase |

> IMPORTANT: We are using Supabase for ALL backend needs.
> Do NOT use Prisma. Use Supabase JS client (@supabase/ssr) only throughout the entire project.

---

## Environment Variables

Create a `.env.local` file in the project root with these variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

---

## Supabase Project Setup (Do This First)

1. Create a new project at https://supabase.com
2. Go to **SQL Editor** and run the full database schema SQL below
3. Go to **Storage** and create these buckets:
   - `avatars` — Public
   - `course-thumbnails` — Public
   - `lesson-videos` — Private
   - `lesson-documents` — Private
   - `certificates` — Private
4. Go to **Authentication > Providers** — Enable Email (default) and optionally Google
5. Go to **Authentication > URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
6. Copy your project URL and anon key from **Settings > API** into `.env.local`

---

## Database Schema (Supabase SQL)

Copy and run this entire block in your Supabase SQL Editor.

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================
-- ENUMS
-- =====================

create type user_role as enum ('admin', 'instructor', 'learner');
create type course_status as enum ('draft', 'published', 'archived');
create type lesson_type as enum ('video', 'document', 'scorm', 'text');
create type question_type as enum ('mcq', 'true_false', 'short_answer');
create type enrollment_status as enum ('in_progress', 'completed', 'dropped');

-- =====================
-- USERS
-- Extends Supabase auth.users
-- =====================

create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  name text not null,
  role user_role default 'learner',
  avatar_url text,
  group_id uuid,
  points integer default 0,
  badges jsonb default '[]',
  created_at timestamp with time zone default now()
);

-- =====================
-- ORGANIZATIONS
-- For multi-tenant support
-- =====================

create table public.organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  domain text unique,
  logo_url text,
  theme jsonb,
  created_at timestamp with time zone default now()
);

-- =====================
-- GROUPS
-- Departments or teams inside an organization
-- =====================

create table public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  organization_id uuid references public.organizations(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Add foreign key for users -> groups
alter table public.users
  add constraint users_group_id_fkey
  foreign key (group_id) references public.groups(id) on delete set null;

-- =====================
-- COURSES
-- =====================

create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  thumbnail_url text,
  status course_status default 'draft',
  price numeric(10, 2) default 0,
  instructor_id uuid references public.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- =====================
-- LESSONS
-- =====================

create table public.lessons (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  type lesson_type not null,
  content text,
  video_url text,
  file_url text,
  duration_seconds integer,
  sort_order integer default 0,
  created_at timestamp with time zone default now()
);

-- =====================
-- ASSESSMENTS
-- =====================

create table public.assessments (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  time_limit_minutes integer,
  passing_score integer default 70,
  created_at timestamp with time zone default now()
);

-- =====================
-- QUESTIONS
-- =====================

create table public.questions (
  id uuid default uuid_generate_v4() primary key,
  assessment_id uuid references public.assessments(id) on delete cascade not null,
  type question_type not null,
  text text not null,
  options jsonb,        -- Array of options for MCQ: ["option1", "option2", ...]
  answer text not null, -- Correct answer
  points integer default 1
);

-- =====================
-- GRADES
-- Learner assessment results
-- =====================

create table public.grades (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  assessment_id uuid references public.assessments(id) on delete cascade not null,
  score numeric(5, 2) not null,
  passed boolean not null,
  submitted_at timestamp with time zone default now()
);

-- =====================
-- ENROLLMENTS
-- Learner enrolled in a course
-- =====================

create table public.enrollments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  status enrollment_status default 'in_progress',
  enrolled_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  unique(user_id, course_id)
);

-- =====================
-- PROGRESS
-- Per lesson completion per enrollment
-- =====================

create table public.progress (
  id uuid default uuid_generate_v4() primary key,
  enrollment_id uuid references public.enrollments(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  completed boolean default false,
  completed_at timestamp with time zone,
  unique(enrollment_id, lesson_id)
);

-- =====================
-- CERTIFICATES
-- Issued on course completion
-- =====================

create table public.certificates (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  certificate_url text,
  issued_at timestamp with time zone default now(),
  unique(user_id, course_id)
);

-- =====================
-- LEARNING PATHS
-- =====================

create table public.learning_paths (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  created_at timestamp with time zone default now()
);

-- Junction table: learning path <-> courses
create table public.learning_path_courses (
  learning_path_id uuid references public.learning_paths(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  sort_order integer default 0,
  primary key (learning_path_id, course_id)
);

-- =====================
-- NOTIFICATIONS
-- =====================

create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- =====================
-- DISCUSSIONS
-- Per course with threaded replies
-- =====================

create table public.discussions (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  message text not null,
  parent_id uuid references public.discussions(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- =====================
-- SKILLS
-- =====================

create table public.skills (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null
);

-- Junction table: user <-> skills
create table public.user_skills (
  user_id uuid references public.users(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete cascade,
  level integer default 1,
  primary key (user_id, skill_id)
);

-- =====================
-- LIVE SESSIONS
-- Webinars and virtual classrooms
-- =====================

create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null,
  meeting_url text,
  scheduled_at timestamp with time zone not null,
  duration_minutes integer,
  created_at timestamp with time zone default now()
);

-- =====================
-- ROW LEVEL SECURITY
-- Enable on all tables
-- =====================

alter table public.users enable row level security;
alter table public.organizations enable row level security;
alter table public.groups enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.assessments enable row level security;
alter table public.questions enable row level security;
alter table public.grades enable row level security;
alter table public.enrollments enable row level security;
alter table public.progress enable row level security;
alter table public.certificates enable row level security;
alter table public.learning_paths enable row level security;
alter table public.learning_path_courses enable row level security;
alter table public.notifications enable row level security;
alter table public.discussions enable row level security;
alter table public.skills enable row level security;
alter table public.user_skills enable row level security;
alter table public.sessions enable row level security;

-- =====================
-- RLS POLICIES
-- =====================

-- Users: view own profile
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

-- Users: admin can view all
create policy "Admin can view all users"
  on public.users for select
  using (exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  ));

-- Users: update own profile
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Courses: anyone can view published
create policy "Anyone can view published courses"
  on public.courses for select
  using (status = 'published');

-- Courses: instructor manages own
create policy "Instructors can manage own courses"
  on public.courses for all
  using (instructor_id = auth.uid());

-- Courses: admin manages all
create policy "Admin can manage all courses"
  on public.courses for all
  using (exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  ));

-- Lessons: visible to enrolled learners
create policy "Enrolled users can view lessons"
  on public.lessons for select
  using (exists (
    select 1 from public.enrollments
    where course_id = lessons.course_id and user_id = auth.uid()
  ));

-- Enrollments: users can view own
create policy "Users can view own enrollments"
  on public.enrollments for select
  using (user_id = auth.uid());

-- Enrollments: users can enroll themselves
create policy "Users can enroll themselves"
  on public.enrollments for insert
  with check (user_id = auth.uid());

-- Progress: users manage own
create policy "Users can manage own progress"
  on public.progress for all
  using (exists (
    select 1 from public.enrollments
    where id = enrollment_id and user_id = auth.uid()
  ));

-- Notifications: users view own
create policy "Users can view own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users can update own notifications"
  on public.notifications for update
  using (user_id = auth.uid());

-- Certificates: users view own
create policy "Users can view own certificates"
  on public.certificates for select
  using (user_id = auth.uid());

-- Discussions: anyone can read, auth users can post
create policy "Anyone can view discussions"
  on public.discussions for select
  using (true);

create policy "Authenticated users can post discussions"
  on public.discussions for insert
  with check (auth.uid() = user_id);

-- =====================
-- TRIGGER: Auto-create user profile on signup
-- =====================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'learner'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## Supabase Client Code

### lib/supabase/client.ts
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### lib/supabase/server.ts
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### middleware.ts
```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/instructor/:path*', '/learner/:path*'],
}
```

---

## Project Folder Structure

```
cloud-lms/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── callback/route.ts
│   ├── (dashboard)/
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   ├── users/
│   │   │   ├── courses/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   ├── instructor/
│   │   │   ├── page.tsx
│   │   │   ├── courses/
│   │   │   ├── assessments/
│   │   │   └── students/
│   │   └── learner/
│   │       ├── page.tsx
│   │       ├── my-courses/
│   │       ├── progress/
│   │       └── certificates/
│   └── api/
│       ├── courses/
│       ├── users/
│       ├── assessments/
│       ├── certificates/
│       ├── analytics/
│       └── ai/generate-course/
├── components/
│   ├── ui/
│   ├── course-builder/
│   ├── assessment-builder/
│   ├── analytics/
│   ├── learner/
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── utils.ts
├── middleware.ts
└── .env.local
```

---

## Core Features (Must-Have)

| # | Feature | Description | Complexity |
|---|---|---|---|
| 1 | User Registration & Authentication | Secure signup, login, profile with role-based access | Low |
| 2 | Course Creation & Management | Course builder with multimedia, lessons, modules | Medium |
| 3 | Content Upload & Library | Videos, documents, SCORM via Supabase Storage | Medium |
| 4 | Assessment & Quiz Builder | Question types, timed tests, automated grading | Medium |
| 5 | Progress Tracking | Real-time progress monitoring per learner | Medium |
| 6 | Certificate Management | Auto-generate and distribute on completion | Low |
| 7 | Reporting & Analytics Dashboard | Performance, engagement, completion reports | Medium |
| 8 | Mobile Learning Support | Fully responsive design for all devices | Medium |
| 9 | Learning Paths & Curricula | Structured sequences with prerequisites | Medium |
| 10 | User Group Management | Departments, teams, targeted training | Low |
| 11 | Notification System | In-app, email notifications for deadlines | Low |
| 12 | SCORM/xAPI Compliance | Industry-standard content format support | High |
| 13 | Multi-tenant Architecture | Multiple organizations with isolated data | High |
| 14 | Integration APIs | RESTful APIs for third-party integrations | Medium |
| 15 | Basic Search & Filtering | Search courses, users, and content | Low |

---

## Important Features

| # | Feature | Description | Complexity |
|---|---|---|---|
| 1 | Discussion Forums | Course-specific discussion and collaboration | Medium |
| 2 | Calendar Integration | Schedule live sessions and training events | Low |
| 3 | Bulk User Import/Export | CSV-based user management | Low |
| 4 | Branded Learning Portals | Custom themes, logos, branding | Medium |
| 5 | Offline Learning Support | Download and sync via Supabase | High |
| 6 | Gamification Elements | Points, badges, leaderboards | Medium |
| 7 | Live Session Management | Virtual classrooms, webinar links | Medium |
| 8 | Content Versioning | Track versions of learning materials | Medium |

---

## Advanced & Differentiating Features

| # | Feature | Description | Complexity |
|---|---|---|---|
| 1 | AI-Powered Course Creation | Generate courses from topics using Claude API | High |
| 2 | Adaptive Learning Paths | Dynamic recommendations based on performance | High |
| 3 | Advanced Analytics & ML | Predictive analytics for at-risk learners | High |
| 4 | Social Learning Features | Study groups, peer-to-peer learning | Medium |
| 5 | Advanced Proctoring | AI-powered exam monitoring | High |
| 6 | Skills Gap Analysis | Identify gaps and recommend training | High |
| 7 | Multi-language Support | Content translation, localized experiences | Medium |
| 8 | Advanced Workflow Automation | Conditional logic, automated actions | High |
| 9 | ROI Measurement Tools | Training ROI with business impact metrics | Medium |
| 10 | Microlearning Support | Bite-sized modules via multiple channels | Medium |
| 11 | AI Content Curation | Auto-tagging and discovery from external sources | High |
| 12 | Performance Support Tools | Just-in-time learning in work applications | Medium |

---

## Innovative Ideas (Beyond Current Market)

- AI learning companion for personalized coaching throughout the journey
- Blockchain-based credential verification for tamper-proof certification
- Productivity tool integration to surface learning content during work tasks
- Peer mentoring marketplace where experienced learners mentor newcomers
- Voice-enabled learning interface for hands-free training
- Sentiment analysis to detect learner frustration and provide support
- Collaborative virtual workspaces for teams to practice skills together
- Wearable device integration for biometric-based learning insights
- Dynamic pricing models based on demand and learner demographics
- AI-generated personalized learning summaries and key takeaways
- Advanced plagiarism detection for assignments using machine learning
- Automated accessibility compliance checking for disabled learners

---

## Monetization Strategies

- Tiered SaaS subscription based on users and features
- Per-learner monthly/annual pricing
- Enterprise licensing with custom features and support
- Marketplace for third-party content with revenue sharing
- Professional services for implementation and customization
- White-label licensing to other software vendors
- Premium content library subscriptions
- Transaction fees for e-commerce course sales
- Certification and compliance testing fees

---

## MVP Scope

Core MVP includes:
- User management with role-based access (Admin, Instructor, Learner)
- Basic course creation with lesson builder
- Content upload via Supabase Storage (video and documents)
- Simple assessments with auto-grading
- Progress tracking per learner
- Basic reporting dashboard
- Mobile-responsive design
- Certificate generation on course completion

**Primary focus:** Employee onboarding use case to validate market fit before expanding.

---

## Key Metrics to Track

- Monthly Active Users (MAU)
- Course Completion Rates
- User Engagement Time
- Customer Acquisition Cost (CAC)
- Monthly Recurring Revenue (MRR)
- Churn Rate
- Net Promoter Score (NPS)
- Time to Value
- Content Creation Velocity
- Assessment Pass Rates
- Mobile Usage Percentage
- Support Ticket Volume
- API Usage Metrics

---

## Competitive Landscape

| Competitor | Strength | Weakness |
|---|---|---|
| Moodle | Open-source, customizable | Complex setup, outdated UI |
| Canvas | Strong in universities | Not built for corporate |
| Cornerstone OnDemand | Enterprise-grade | Expensive, slow to deploy |
| Thinkific | Course selling focused | Limited corporate features |
| TalentLMS | SMB simple and fast | Limited AI and analytics |

**Opportunity:** Bridge education and corporate training with AI-powered simplicity.

---

## Go-to-Market Strategy

- Target SMBs and growing companies first
- Focus on compliance industries: healthcare, finance, manufacturing
- Content marketing around training ROI and employee engagement
- Offer migration services from legacy LMS systems
- Partner with HR consultants and training content providers
- Offer free trial with guided onboarding

---

## Build Phases

### Phase 1 — Foundation
- Project Setup (Next.js 14 + Supabase + Tailwind + shadcn/ui)
- Supabase: run SQL schema, create storage buckets, configure auth
- Authentication & Role-Based Access (Admin / Instructor / Learner)
- Folder structure and routing setup

### Phase 2 — Core Modules
- User Management
- Course Builder
- Content Upload via Supabase Storage
- Assessment & Quiz Builder
- Enrollment System
- Progress Tracking
- Certificate Generation

### Phase 3 — Admin & Reporting
- Admin Dashboard
- Analytics & Reporting
- User Group Management
- Notification System

### Phase 4 — Learner Experience
- Learner Dashboard
- Learning Paths & Curricula
- Gamification (Points / Badges / Leaderboard)
- Discussion Forums
- Mobile Responsive Polish

### Phase 5 — AI & Advanced Features
- AI Course Generator (Anthropic Claude API)
- Adaptive Learning Recommendations
- Skills Gap Analysis
- Live Session Management

### Phase 6 — Monetization & Integrations
- Stripe Payments & Course Pricing
- REST API Layer
- Third-Party Integrations (Zoom, Slack, Google Calendar)
- Multi-tenant Architecture

### Phase 7 — Launch
- Testing & QA
- Performance Optimization
- Deploy to Vercel + Supabase Production
- Go-to-Market Setup

---

## Codex Instructions (Read Every Session)

- This is the single source of truth for this product
- We use **Supabase** for Auth, Database, Storage, and Realtime — not Prisma
- Use `@supabase/ssr` package for all Supabase calls in Next.js App Router
- Use `shadcn/ui` + Tailwind CSS for all UI components
- Build one module per Codex session — do not mix modules
- Always say "do not touch [filename]" to protect working files
- After every session: test in browser, then commit to Git before next session

---

*Reference this file at the start of every Codex session.*
