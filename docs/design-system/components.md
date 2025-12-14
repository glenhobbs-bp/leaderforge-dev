# Components

## Overview

LeaderForge uses [shadcn/ui](https://ui.shadcn.com/) as the component foundation. These are copied into the codebase (not imported as a library) and customized to match our design system.

### Technology Choice

| Choice | Decision | Rationale |
|--------|----------|-----------|
| **shadcn/ui version** | Stable (`@latest`) | Production stability for MVP |
| **Primitives** | Radix UI | Accessibility, proven reliability |
| **Styling** | Tailwind CSS v3 | Stable, well-documented |

> **Note**: Tailwind v4 support available via `@canary`. Consider upgrading post-MVP when Tailwind v4 is fully released.

## Installation

Initialize shadcn in the project:

```bash
npx shadcn@latest init
```

Add components as needed:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
# etc.
```

## Core Components

### Button

```jsx
import { Button } from "@/components/ui/button"

// Variants
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button variant="link">Link Style</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>

// With icon
<Button>
  <Plus className="w-4 h-4 mr-2" />
  Add Item
</Button>

// Loading state
<Button disabled>
  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
  Loading...
</Button>
```

### Card

```jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Input & Form Controls

```jsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

// Text input
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>

// Select
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>

// Checkbox
<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms</Label>
</div>
```

### Dialog (Modal)

```jsx
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Description of what this dialog is for.
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      {/* Dialog content */}
    </div>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Table

```jsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Role</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
      <TableCell>Admin</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Tabs

```jsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="details">Details</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Overview content</TabsContent>
  <TabsContent value="details">Details content</TabsContent>
  <TabsContent value="settings">Settings content</TabsContent>
</Tabs>
```

## LMS-Specific Components

These components are custom-built for LeaderForge:

### ProgressBar

```jsx
// Simple progress
<ProgressBar value={75} />

// With label
<ProgressBar value={75} showLabel />

// Completion states
<ProgressBar value={100} variant="success" />
<ProgressBar value={30} variant="warning" />
```

### ContentCard

```jsx
// Video content
<ContentCard
  type="video"
  title="Leadership Fundamentals"
  duration="15:30"
  thumbnail="/thumbnails/leadership.jpg"
  progress={45}
  onClick={() => {}}
/>

// Document content
<ContentCard
  type="document"
  title="Team Building Guide"
  pageCount={12}
  thumbnail="/thumbnails/guide.jpg"
  completed
/>

// Course card
<ContentCard
  type="course"
  title="Management 101"
  moduleCount={8}
  progress={62}
  onClick={() => {}}
/>
```

### UserAvatar

```jsx
// With image
<UserAvatar 
  src="/avatars/user.jpg" 
  name="John Doe" 
  size="md" 
/>

// Fallback to initials
<UserAvatar name="John Doe" size="md" />

// With status indicator
<UserAvatar 
  name="John Doe" 
  status="online" 
/>

// Sizes
<UserAvatar name="JD" size="sm" /> {/* 32px */}
<UserAvatar name="JD" size="md" /> {/* 40px */}
<UserAvatar name="JD" size="lg" /> {/* 48px */}
```

### CompletionBadge

```jsx
<CompletionBadge status="completed" />
<CompletionBadge status="in-progress" />
<CompletionBadge status="not-started" />

// With percentage
<CompletionBadge status="in-progress" percentage={65} />
```

### CourseNavigation

```jsx
<CourseNavigation
  modules={[
    {
      id: '1',
      title: 'Introduction',
      lessons: [
        { id: '1-1', title: 'Welcome', completed: true },
        { id: '1-2', title: 'Course Overview', completed: true },
      ]
    },
    {
      id: '2',
      title: 'Core Concepts',
      lessons: [
        { id: '2-1', title: 'Lesson 1', completed: false, current: true },
        { id: '2-2', title: 'Lesson 2', completed: false },
      ]
    }
  ]}
  onLessonClick={(lessonId) => {}}
/>
```

### TeamSelector

```jsx
<TeamSelector
  teams={teams}
  selectedTeamId={currentTeam}
  onSelect={(teamId) => setCurrentTeam(teamId)}
/>
```

## Icons

Use [Lucide React](https://lucide.dev/) for all icons:

```jsx
import { User, Settings, ChevronRight, Check, X, Loader2 } from "lucide-react"

<User className="w-5 h-5" />
<Settings className="w-5 h-5 text-muted" />
```

### Icon Sizes

| Size | Class | Usage |
|------|-------|-------|
| Small | `w-4 h-4` | Inline with text, buttons |
| Medium | `w-5 h-5` | Navigation, standalone |
| Large | `w-6 h-6` | Headers, empty states |

## Loading States

### Skeleton

```jsx
import { Skeleton } from "@/components/ui/skeleton"

// Text skeleton
<Skeleton className="h-4 w-[200px]" />

// Card skeleton
<Card>
  <CardHeader>
    <Skeleton className="h-6 w-[150px]" />
    <Skeleton className="h-4 w-[250px]" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-32 w-full" />
  </CardContent>
</Card>
```

### Spinner

```jsx
import { Loader2 } from "lucide-react"

<Loader2 className="w-6 h-6 animate-spin text-primary" />
```

## Empty States

```jsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <FileQuestion className="w-12 h-12 text-muted mb-4" />
  <h3 className="text-lg font-semibold text-primary">No content found</h3>
  <p className="text-sm text-secondary mt-1 max-w-sm">
    There's no content matching your criteria. Try adjusting your filters.
  </p>
  <Button className="mt-4">
    Clear Filters
  </Button>
</div>
```

## Error States

```jsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <AlertCircle className="w-12 h-12 text-error mb-4" />
  <h3 className="text-lg font-semibold text-primary">Something went wrong</h3>
  <p className="text-sm text-secondary mt-1 max-w-sm">
    We couldn't load this content. Please try again.
  </p>
  <Button variant="outline" className="mt-4" onClick={retry}>
    Try Again
  </Button>
</div>
```

## Accessibility Checklist

All components must:

- [ ] Have proper ARIA labels where needed
- [ ] Support keyboard navigation
- [ ] Have visible focus states
- [ ] Meet color contrast requirements
- [ ] Work with screen readers
- [ ] Support reduced motion preferences

