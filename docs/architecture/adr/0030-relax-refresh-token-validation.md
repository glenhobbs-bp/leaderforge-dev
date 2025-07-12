# ADR-0030: Relax Refresh Token Validation in set-session

**Date:** 2024-10-18

**Status:** Accepted

## Context

set-session rejected Supabase refresh tokens (opaque strings, not JWT) with 400 'Invalid token format', preventing cookie setting and causing auth loops. Supabase docs confirm refresh tokens are opaque, so strict JWT check was inappropriate.

## Decision

Relax validation: Check access_token for JWT format (3 parts), refresh_token only for non-empty string. This matches Supabase patterns while maintaining security.

## Options Considered
1. Relax refresh validation (chosen).
2. Remove all format checks.
3. Verify with Supabase API.

## Consequences
- Enables proper cookie setting for valid Supabase tokens.
- Maintains thin API endpoint.
- No technical debt introduced.