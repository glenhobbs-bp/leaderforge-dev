/**
 * File: src/app/(dashboard)/page.tsx
 * Purpose: Dashboard home redirect
 * Owner: Core Team
 */

import { redirect } from 'next/navigation';

export default function DashboardRootPage() {
  redirect('/dashboard');
}

