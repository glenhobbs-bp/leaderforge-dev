// File: apps/web/app/page.tsx

// page.tsx is a server component by default in Next.js App Router
// It should not use any client hooks or context directly.
// All client-only logic is handled in AuthGate.tsx
import AuthGate from "./AuthGate";

export default function Page() {
  return <AuthGate />;
}
