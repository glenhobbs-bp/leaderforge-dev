# LeaderForge Component Architecture

## Overview

LeaderForge uses Next.js 15 App Router with a clear separation between:
- **Server Components** (default) - Data fetching, auth checks
- **Client Components** - Interactivity, state management

### Architecture Principles

1. **Server Components by default** - Only use `'use client'` when needed
2. **Colocate components** - Feature components live with their routes
3. **Shared UI in packages** - Reusable components in `packages/ui`
4. **Service layer abstraction** - Components don't access DB directly

---

## Directory Structure

```
apps/web/
├── app/
│   ├── (auth)/                    # Auth routes (no layout)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   ├── reset-password/
│   │   │   └── page.tsx
│   │   ├── invite/
│   │   │   └── [token]/
│   │   │       └── page.tsx
│   │   └── layout.tsx             # Minimal auth layout
│   │
│   ├── (dashboard)/               # Main app (authenticated)
│   │   ├── layout.tsx             # App shell with nav
│   │   ├── page.tsx               # Dashboard home
│   │   │
│   │   ├── content/
│   │   │   ├── page.tsx           # Content library
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Content player/viewer
│   │   │
│   │   ├── progress/
│   │   │   └── page.tsx           # Progress dashboard
│   │   │
│   │   ├── leaderboard/
│   │   │   └── page.tsx           # Leaderboards
│   │   │
│   │   ├── settings/
│   │   │   ├── page.tsx           # User settings
│   │   │   └── profile/
│   │   │       └── page.tsx       # Profile settings
│   │   │
│   │   └── admin/                 # Admin routes
│   │       ├── layout.tsx         # Admin sub-nav
│   │       ├── page.tsx           # Admin dashboard
│   │       ├── users/
│   │       │   └── page.tsx       # User management
│   │       ├── teams/
│   │       │   └── page.tsx       # Team management
│   │       ├── organization/
│   │       │   └── page.tsx       # Org settings
│   │       └── audit/
│   │           └── page.tsx       # Audit log
│   │
│   ├── api/                       # API routes
│   │   └── v1/
│   │       ├── auth/
│   │       ├── content/
│   │       ├── progress/
│   │       ├── gamification/
│   │       └── ...
│   │
│   ├── layout.tsx                 # Root layout (providers)
│   ├── loading.tsx                # Global loading
│   ├── error.tsx                  # Global error
│   └── not-found.tsx              # 404 page
│
├── components/                    # App-specific components
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── MobileNav.tsx
│   │   └── UserMenu.tsx
│   │
│   ├── content/
│   │   ├── ContentGrid.tsx
│   │   ├── ContentCard.tsx
│   │   ├── ContentFilters.tsx
│   │   ├── VideoPlayer.tsx
│   │   ├── DocumentViewer.tsx
│   │   └── ContentProgress.tsx
│   │
│   ├── progress/
│   │   ├── ProgressDashboard.tsx
│   │   ├── ProgressCard.tsx
│   │   ├── ProgressChart.tsx
│   │   └── RecentActivity.tsx
│   │
│   ├── gamification/
│   │   ├── StreakWidget.tsx
│   │   ├── LeaderboardWidget.tsx
│   │   ├── LeaderboardTable.tsx
│   │   ├── PointsDisplay.tsx
│   │   └── MilestoneToast.tsx
│   │
│   ├── admin/
│   │   ├── UserTable.tsx
│   │   ├── TeamCard.tsx
│   │   ├── InviteModal.tsx
│   │   ├── RoleSelector.tsx
│   │   └── AuditLog.tsx
│   │
│   └── shared/
│       ├── ThemeProvider.tsx
│       ├── AuthProvider.tsx
│       └── QueryProvider.tsx
│
├── hooks/
│   ├── useUser.ts
│   ├── useOrganization.ts
│   ├── useProgress.ts
│   ├── useStreak.ts
│   └── useContent.ts
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   ├── server.ts              # Server client
│   │   └── middleware.ts          # Auth middleware
│   ├── api.ts                     # API client
│   └── utils.ts                   # Utilities
│
└── styles/
    └── globals.css                # Tailwind + custom styles

packages/ui/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Progress.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Toast.tsx
│   │   └── ... (shadcn components)
│   └── index.ts
└── package.json

packages/services/
├── src/
│   ├── auth.service.ts
│   ├── content.service.ts
│   ├── progress.service.ts
│   ├── gamification.service.ts
│   ├── organization.service.ts
│   ├── team.service.ts
│   ├── user.service.ts
│   └── index.ts
└── package.json
```

---

## Layout Components

### Root Layout (`app/layout.tsx`)

Server Component that wraps all pages with providers.

```tsx
// app/layout.tsx
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { QueryProvider } from '@/components/shared/QueryProvider';
import { Toaster } from '@/packages/ui';
import '@/styles/globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Auth Layout (`app/(auth)/layout.tsx`)

Minimal layout for auth pages (centered card).

```tsx
// app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        {children}
      </div>
    </div>
  );
}
```

### Dashboard Layout (`app/(dashboard)/layout.tsx`)

Main app shell with sidebar navigation.

```tsx
// app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';

export default async function DashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  // Fetch user context (tenant, org, role)
  const userContext = await getUserContext(session.user.id);
  
  return (
    <AppShell userContext={userContext}>
      {children}
    </AppShell>
  );
}
```

### AppShell Component

```tsx
// components/layout/AppShell.tsx
'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';

interface AppShellProps {
  userContext: UserContext;
  children: React.ReactNode;
}

export function AppShell({ userContext, children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar 
        className="hidden lg:flex w-64 border-r" 
        userContext={userContext}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userContext={userContext} />
        
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav className="lg:hidden" userContext={userContext} />
    </div>
  );
}
```

---

## Page Components

### Dashboard Home (`app/(dashboard)/page.tsx`)

```tsx
// app/(dashboard)/page.tsx
import { createServerClient } from '@/lib/supabase/server';
import { StreakWidget } from '@/components/gamification/StreakWidget';
import { LeaderboardWidget } from '@/components/gamification/LeaderboardWidget';
import { RecentActivity } from '@/components/progress/RecentActivity';
import { ContentGrid } from '@/components/content/ContentGrid';

export default async function DashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Parallel data fetching
  const [streak, recentContent, leaderboard] = await Promise.all([
    getStreak(user.id),
    getRecentContent(user.id, 4),
    getLeaderboard(user.id, 'team', 5),
  ]);
  
  return (
    <div className="space-y-8">
      {/* Welcome + Streak */}
      <section className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">Continue your learning journey</p>
        </div>
        <StreakWidget streak={streak} />
      </section>
      
      {/* Continue Learning */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Continue Learning</h2>
        <ContentGrid items={recentContent} variant="compact" />
      </section>
      
      {/* Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentActivity userId={user.id} />
        <LeaderboardWidget entries={leaderboard} />
      </section>
    </div>
  );
}
```

### Content Library (`app/(dashboard)/content/page.tsx`)

```tsx
// app/(dashboard)/content/page.tsx
import { Suspense } from 'react';
import { ContentGrid } from '@/components/content/ContentGrid';
import { ContentFilters } from '@/components/content/ContentFilters';
import { Skeleton } from '@/packages/ui';

interface ContentPageProps {
  searchParams: {
    type?: string;
    search?: string;
    page?: string;
  };
}

export default async function ContentPage({ searchParams }: ContentPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Content Library</h1>
      </div>
      
      <ContentFilters />
      
      <Suspense fallback={<ContentGridSkeleton />}>
        <ContentGridServer searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ContentGridServer({ searchParams }: ContentPageProps) {
  const content = await getContent(searchParams);
  return <ContentGrid items={content.items} />;
}

function ContentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-lg" />
      ))}
    </div>
  );
}
```

### Content Player (`app/(dashboard)/content/[id]/page.tsx`)

```tsx
// app/(dashboard)/content/[id]/page.tsx
import { notFound } from 'next/navigation';
import { VideoPlayer } from '@/components/content/VideoPlayer';
import { DocumentViewer } from '@/components/content/DocumentViewer';
import { ContentProgress } from '@/components/content/ContentProgress';

interface ContentDetailPageProps {
  params: { id: string };
}

export default async function ContentDetailPage({ params }: ContentDetailPageProps) {
  const content = await getContentById(params.id);
  
  if (!content) {
    notFound();
  }
  
  const progress = await getProgress(content.id);
  
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Content Viewer */}
      {content.type === 'video' ? (
        <VideoPlayer 
          content={content} 
          initialProgress={progress}
        />
      ) : (
        <DocumentViewer 
          content={content}
          initialProgress={progress}
        />
      )}
      
      {/* Content Info */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{content.title}</h1>
        <p className="text-muted-foreground">{content.description}</p>
        
        <ContentProgress progress={progress} />
      </div>
    </div>
  );
}
```

---

## Feature Components

### VideoPlayer Component

```tsx
// components/content/VideoPlayer.tsx
'use client';

import { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';
import { useProgressMutation } from '@/hooks/useProgress';

interface VideoPlayerProps {
  content: Content;
  initialProgress: Progress | null;
}

export function VideoPlayer({ content, initialProgress }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { mutate: saveProgress } = useProgressMutation();
  
  // Initialize HLS if needed
  useEffect(() => {
    if (content.metadata.hls_url && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(content.metadata.hls_url);
      hls.attachMedia(videoRef.current!);
      return () => hls.destroy();
    }
  }, [content.metadata.hls_url]);
  
  // Resume from last position
  useEffect(() => {
    if (initialProgress?.metadata.last_position_seconds) {
      videoRef.current!.currentTime = initialProgress.metadata.last_position_seconds;
    }
  }, [initialProgress]);
  
  // Save progress periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && isPlaying) {
        const video = videoRef.current;
        const percentage = Math.round((video.currentTime / video.duration) * 100);
        
        saveProgress({
          contentId: content.id,
          progress_percentage: percentage,
          metadata: {
            last_position_seconds: video.currentTime,
            watch_time_seconds: video.currentTime,
          },
        });
      }
    }, 10000); // Every 10 seconds
    
    return () => clearInterval(interval);
  }, [isPlaying, content.id, saveProgress]);
  
  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          saveProgress({
            contentId: content.id,
            progress_percentage: 100,
            metadata: { completed: true },
          });
        }}
      >
        {!content.metadata.hls_url && (
          <source src={content.content_url} type="video/mp4" />
        )}
      </video>
    </div>
  );
}
```

### StreakWidget Component

```tsx
// components/gamification/StreakWidget.tsx
'use client';

import { Flame } from 'lucide-react';
import { Card, Progress } from '@/packages/ui';

interface StreakWidgetProps {
  streak: {
    current: number;
    longest: number;
    at_risk: boolean;
    next_milestone: number;
  };
}

export function StreakWidget({ streak }: StreakWidgetProps) {
  const progressToMilestone = (streak.current / streak.next_milestone) * 100;
  
  return (
    <Card className="p-4 w-full lg:w-72">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${
          streak.at_risk ? 'bg-orange-100' : 'bg-primary/10'
        }`}>
          <Flame className={`w-6 h-6 ${
            streak.at_risk ? 'text-orange-500' : 'text-primary'
          }`} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{streak.current}</span>
            <span className="text-muted-foreground text-sm">day streak</span>
          </div>
          
          {streak.at_risk && (
            <p className="text-orange-500 text-xs">
              Learn today to keep your streak!
            </p>
          )}
        </div>
      </div>
      
      {/* Progress to next milestone */}
      <div className="mt-4 space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Next: {streak.next_milestone} days</span>
          <span>Best: {streak.longest} days</span>
        </div>
        <Progress value={progressToMilestone} className="h-2" />
      </div>
    </Card>
  );
}
```

### LeaderboardTable Component

```tsx
// components/gamification/LeaderboardTable.tsx
'use client';

import { Avatar, Badge } from '@/packages/ui';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
}

export function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  return (
    <div className="space-y-2">
      {entries.map((entry, index) => {
        const isCurrentUser = entry.user_id === currentUserId;
        const rankIcon = index < 3 ? ['🥇', '🥈', '🥉'][index] : null;
        
        return (
          <div
            key={entry.user_id}
            className={`flex items-center gap-4 p-3 rounded-lg ${
              isCurrentUser ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'
            }`}
          >
            {/* Rank */}
            <div className="w-8 text-center font-medium">
              {rankIcon || entry.rank}
            </div>
            
            {/* User */}
            <Avatar 
              src={entry.avatar_url} 
              fallback={entry.user_name.charAt(0)} 
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {entry.user_name}
                {isCurrentUser && (
                  <Badge variant="secondary" className="ml-2">You</Badge>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                🔥 {entry.current_streak} day streak
              </p>
            </div>
            
            {/* Points */}
            <div className="text-right">
              <p className="font-bold">{entry.points}</p>
              <p className="text-xs text-muted-foreground">points</p>
            </div>
            
            {/* Rank Change */}
            <RankChange change={entry.rank_change} />
          </div>
        );
      })}
    </div>
  );
}

function RankChange({ change }: { change: number }) {
  if (change > 0) {
    return (
      <div className="flex items-center text-green-500">
        <TrendingUp className="w-4 h-4" />
        <span className="text-xs">+{change}</span>
      </div>
    );
  }
  if (change < 0) {
    return (
      <div className="flex items-center text-red-500">
        <TrendingDown className="w-4 h-4" />
        <span className="text-xs">{change}</span>
      </div>
    );
  }
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}
```

### ContentCard Component

```tsx
// components/content/ContentCard.tsx
import Link from 'next/link';
import { Card, Badge, Progress } from '@/packages/ui';
import { Play, FileText, Clock } from 'lucide-react';

interface ContentCardProps {
  item: ContentItem;
  variant?: 'default' | 'compact';
}

export function ContentCard({ item, variant = 'default' }: ContentCardProps) {
  const TypeIcon = item.type === 'video' ? Play : FileText;
  
  return (
    <Link href={`/content/${item.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted">
          {item.thumbnail_url ? (
            <img 
              src={item.thumbnail_url} 
              alt={item.title}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <TypeIcon className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          
          {/* Duration badge */}
          {item.duration_seconds && (
            <Badge className="absolute bottom-2 right-2" variant="secondary">
              {formatDuration(item.duration_seconds)}
            </Badge>
          )}
          
          {/* Progress overlay */}
          {item.progress && (
            <div className="absolute bottom-0 left-0 right-0">
              <Progress 
                value={item.progress.percentage} 
                className="h-1 rounded-none"
              />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-2">
          <h3 className="font-semibold line-clamp-2">{item.title}</h3>
          
          {variant === 'default' && item.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          )}
          
          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TypeIcon className="w-3 h-3" />
            <span className="capitalize">{item.type}</span>
            
            {item.progress?.completed && (
              <Badge variant="success" size="sm">Completed</Badge>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

---

## Shared UI Components (packages/ui)

### Component List

| Component | Purpose | Source |
|-----------|---------|--------|
| `Button` | Actions, links | shadcn |
| `Card` | Content containers | shadcn |
| `Input` | Form inputs | shadcn |
| `Textarea` | Multi-line input | shadcn |
| `Select` | Dropdowns | shadcn |
| `Checkbox` | Boolean inputs | shadcn |
| `Modal` / `Dialog` | Overlays | shadcn |
| `Toast` | Notifications | shadcn |
| `Avatar` | User images | shadcn |
| `Badge` | Status labels | shadcn |
| `Progress` | Progress bars | shadcn |
| `Skeleton` | Loading states | shadcn |
| `Tabs` | Tab navigation | shadcn |
| `Table` | Data tables | shadcn |
| `DropdownMenu` | Menus | shadcn |
| `Tooltip` | Hints | shadcn |

### Custom Components

| Component | Purpose |
|-----------|---------|
| `ProgressRing` | Circular progress |
| `DataTable` | Sortable/filterable table |
| `EmptyState` | No data placeholder |
| `PageHeader` | Consistent page headers |
| `StatCard` | Metric displays |

---

## Hooks

### useUser Hook

```tsx
// hooks/useUser.ts
import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@/lib/supabase/client';

export function useUser() {
  const supabase = createBrowserClient();
  
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('users')
        .select('*, memberships(*)')
        .eq('id', user.id)
        .single();
        
      return data;
    },
  });
}
```

### useProgress Hook

```tsx
// hooks/useProgress.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useProgressMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateProgressRequest) => {
      const response = await api.put(`/progress/${data.contentId}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      
      // Show milestone toast if earned
      if (data.streak?.milestone) {
        toast.success(`🎉 ${data.streak.milestone} streak!`);
      }
      
      // Show points earned
      if (data.points_earned > 0) {
        toast.info(`+${data.points_earned} points`);
      }
    },
  });
}
```

### useStreak Hook

```tsx
// hooks/useStreak.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useStreak() {
  return useQuery({
    queryKey: ['streak'],
    queryFn: async () => {
      const response = await api.get('/gamification/streak');
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
```

---

## State Management

### Server State
- **TanStack Query** for API data caching
- Server Components fetch initial data
- Client components use hooks for updates

### Client State
- **React Context** for user/org context
- **URL state** for filters, pagination
- **Local state** for UI (modals, forms)

### No Global State Library
- Avoid Redux/Zustand complexity
- Use React Query for server state
- Use Context for auth/theme/org

---

## Loading & Error States

### Loading Pattern

```tsx
// Suspense for server components
<Suspense fallback={<LoadingSkeleton />}>
  <ServerComponent />
</Suspense>

// TanStack Query for client
const { data, isLoading } = useQuery(...);
if (isLoading) return <Skeleton />;
```

### Error Pattern

```tsx
// Error boundary
export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="text-center py-12">
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

---

## Navigation Structure

### Sidebar Navigation

```tsx
const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Content', href: '/content', icon: BookOpen },
  { name: 'Progress', href: '/progress', icon: TrendingUp },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
];

const adminNavigation = [
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Teams', href: '/admin/teams', icon: Users2 },
  { name: 'Organization', href: '/admin/organization', icon: Building },
  { name: 'Audit Log', href: '/admin/audit', icon: ScrollText },
];
```

### Role-Based Access

```tsx
// Show admin nav only for admin/owner roles
{userContext.role === 'admin' || userContext.role === 'owner' ? (
  <NavSection title="Admin" items={adminNavigation} />
) : null}
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Pages | `page.tsx` | `app/content/page.tsx` |
| Layouts | `layout.tsx` | `app/(dashboard)/layout.tsx` |
| Components | PascalCase | `ContentCard.tsx` |
| Hooks | camelCase, `use` prefix | `useProgress.ts` |
| Utilities | camelCase | `formatDuration.ts` |
| Types | PascalCase | `types.ts` |
| Services | camelCase, `.service` suffix | `content.service.ts` |

