/**
 * File: src/app/(dashboard)/settings/page.tsx
 * Purpose: Settings overview - redirects to profile
 * Owner: Core Team
 */

import { redirect } from 'next/navigation';

export default function SettingsPage() {
  redirect('/settings/profile');
}
