# ✅ Supabase SSR Auth Debug - Resolution Report

**Date:** 2025-06-13 11:23:00 UTC

---

## 🔍 Problem Summary

You attempted to implement **Supabase SSR authentication** in a Next.js 15 App Router project. Although cookies were correctly set and JWT tokens were valid (as confirmed via [jwt.io](https://jwt.io)), the following issue occurred:

- `supabase.auth.getSession()` returned `null`
- `supabase.auth.getUser()` returned: `AuthSessionMissingError`
- You were not authenticated on the server (SSR)

---

## 🧨 Root Cause

The **Supabase SSR client does not implicitly hydrate a session** from the `auth-token` cookie alone.

> It expects an explicit call to `supabase.auth.setSession({ access_token, refresh_token })` when manually handling authentication on the server side.

---

## ✅ Solution

You successfully fixed the issue by:

1. Parsing the cookies using `headers()` (server-side only, no `'use client'`)
2. Extracting the `sb-<project>-auth-token` and `sb-<project>-refresh-token`
3. Calling:

```ts
await supabase.auth.setSession({
  access_token: authToken,
  refresh_token: refreshToken,
});
```

4. Then retrieving the session and user:

```ts
const session = await supabase.auth.getSession();
const user = await supabase.auth.getUser();
```

---

## 🧭 Rules for Operational Supabase SSR Auth

### ✅ DO:

- ✅ Use a Server Component (no `'use client'`)
- ✅ Call `await headers()` to read request cookies
- ✅ Parse cookies with `cookie` package
- ✅ Pass both tokens to `setSession()` explicitly
- ✅ Use `createServerClient()` from `@supabase/ssr`

### ❌ DON'T:

- ❌ Use `cookies()` or `headers()` in Client Components
- ❌ Assume `auth-token` alone is enough for `getSession()`
- ❌ Forget to include `refresh-token` if calling `setSession()`

---

## 📄 Final Working Code Reference

```ts
const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  cookies: {
    getAll: async () =>
      Object.entries(parsedCookies).map(([name, value]) => ({ name, value })),
    setAll: async () => {},
  },
});

await supabase.auth.setSession({
  access_token: authToken,
  refresh_token: refreshToken,
});

const session = await supabase.auth.getSession();
const user = await supabase.auth.getUser();
```

---

## ✅ Status

You are now fully authenticated on the server and ready to build secure SSR pages with Supabase Auth.
