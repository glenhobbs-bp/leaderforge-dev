import { headers } from 'next/headers';
import { parse } from 'cookie';
import { createServerClient } from '@supabase/ssr';

const SUPABASE_URL = 'https://pcjaagjqydyqfsthsmac.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function decodeJWT(token: string) {
  try {
    const [header, payload] = token.split('.').slice(0, 2);
    return {
      header: JSON.parse(Buffer.from(header, 'base64url').toString()),
      payload: JSON.parse(Buffer.from(payload, 'base64url').toString()),
    };
  } catch (err) {
    return { error: 'JWT decode failed', details: String(err) };
  }
}

export default async function MinimalCookieTestPage() {
  // --- Step 1: Read cookies from request headers ---
  const headersList = await headers();
  const rawCookieHeader = headersList.get('cookie') || '';
  const parsedCookies = parse(rawCookieHeader);

  const authToken = parsedCookies['sb-pcjaagjqydyqfsthsmac-auth-token'];
  const refreshToken = parsedCookies['sb-pcjaagjqydyqfsthsmac-refresh-token'];
  const jwtDecoded = authToken ? decodeJWT(authToken) : null;

  // --- Step 2: Create Supabase client with parsed cookies ---
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: async () =>
        Object.entries(parsedCookies).map(([name, value]) => ({ name, value })),
      setAll: async () => {},
    },
  });

  // ✅ Hydrate session from cookie tokens
  if (authToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: authToken,
      refresh_token: refreshToken,
    });
  }

  // --- Step 3: Try to get session and user ---
  let session = null;
  let user = null;
  let sessionRes = null;
  let userRes = null;
  let error: string | null = null;

  try {
    sessionRes = await supabase.auth.getSession();
    session = sessionRes.data.session;
    if (sessionRes.error) error = `Session Error: ${sessionRes.error.message}`;

    userRes = await supabase.auth.getUser();
    user = userRes.data.user;
    if (userRes.error) error = `User Error: ${userRes.error.message}`;
  } catch (e: any) {
    error = `Unhandled Exception: ${e.message || e.toString()}`;
  }

  return (
    <div style={{ fontFamily: 'monospace', padding: 24 }}>
      <h2>✅ Supabase SSR Auth Debug</h2>

      <h3>🍪 Raw Cookie Header</h3>
      <pre>{rawCookieHeader}</pre>

      <h3>🔍 Parsed Cookies</h3>
      <pre>{JSON.stringify(parsedCookies, null, 2)}</pre>

      <h3>🔐 Auth Token</h3>
      <pre>{authToken || '❌ Not Found'}</pre>

      <h3>🔁 Refresh Token</h3>
      <pre>{refreshToken || '❌ Not Found'}</pre>

      <h3>🧬 Decoded JWT</h3>
      <pre>{JSON.stringify(jwtDecoded, null, 2)}</pre>

      <h3>📦 Session Response</h3>
      <pre>{JSON.stringify(sessionRes, null, 2)}</pre>

      <h3>👤 User Response</h3>
      <pre>{JSON.stringify(userRes, null, 2)}</pre>

      <h3>✅ Session</h3>
      <pre>{JSON.stringify(session, null, 2)}</pre>

      <h3>✅ User</h3>
      <pre>{JSON.stringify(user, null, 2)}</pre>

      <h3>⚠️ Error</h3>
      <pre>{JSON.stringify(error, null, 2)}</pre>

      {(!session || !user) && (
        <div style={{ color: 'red', marginTop: 16 }}>
          <b>❌ SSR session or user not found. You are not authenticated on the server.</b>
        </div>
      )}
      {(session && user) && (
        <div style={{ color: 'green', marginTop: 16 }}>
          <b>✅ SSR session and user found. You are authenticated on the server.</b>
        </div>
      )}
    </div>
  );
}