# T-205 — DockerHub JWT Expiration Check

**Epic**: M9 / 9.1 Security Hardening  
**Status**: 🟡 Todo  
**Priority**: P0  
**Severity**: 🟠 HIGH  
**Effort**: ~30 min  
**Good First Issue**: ✅ Yes

---

## Problem

`dockerhub-provider.ts` `authenticateHubApi()` (lines 279–310) caches the JWT token in the provider instance but never checks if it has expired. Docker Hub JWTs typically expire in **60 minutes**.

After expiry:
- All Hub API requests fail with `401 Unauthorized`
- The error is surfaced as a generic "registry unreachable" to the user
- The provider **never auto-refreshes** — requires a page reload or re-ping

---

## Solution

```ts
interface HubTokenCache {
  token: string
  expiresAt: number   // Date.now() + (exp - iat) * 1000 - 30s buffer
}

private hubTokenCache: HubTokenCache | null = null

private isTokenValid(): boolean {
  return this.hubTokenCache !== null && Date.now() < this.hubTokenCache.expiresAt
}

private async getHubToken(): Promise<string> {
  if (this.isTokenValid()) return this.hubTokenCache!.token
  
  // Re-authenticate
  const token = await this.authenticateHubApi()
  const payload = JSON.parse(atob(token.split(".")[1]))  // decode JWT payload
  this.hubTokenCache = {
    token,
    expiresAt: Date.now() + (payload.exp - payload.iat) * 1000 - 30_000  // 30s buffer
  }
  return token
}
```

Replace all direct `this.hubToken` accesses with `await this.getHubToken()`.

---

## Files

- `src/lib/providers/dockerhub-provider.ts` — add `HubTokenCache`, `isTokenValid()`, `getHubToken()`

---

## Dependencies

- None — standalone

---

## Acceptance Criteria

- [ ] Token validity is checked before each Hub API request
- [ ] Expired token triggers automatic re-authentication (using stored credentials)
- [ ] 30-second buffer prevents using a token that expires mid-request
- [ ] `bun run typecheck` passes

---

## Notes

JWT payload decoding (`atob(token.split(".")[1])`) is safe here — we're only reading the `exp` and `iat` claims. No signature verification needed since Docker Hub issued the token. If `credentials` are not available for re-auth, throw a descriptive `AuthenticationError` rather than making a failing API call.
