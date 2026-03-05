# T-272 — Unit Tests: Security Functions

**Epic**: M9 / 9.8 Testing  
**Status**: 🟡 Todo  
**Priority**: P0  
**Severity**: 🔴 CRITICAL  
**Effort**: ~2 hr  
**Good First Issue**: No

---

## Problem

Security-critical code — authentication, CSRF validation, credential encryption — has no unit tests. Regressions in these functions can silently break authentication or expose credentials without any warning in CI.

Functions to cover:
- Login endpoint: rate limiting, timing-safe comparison
- CSRF middleware: header validation, bypass attempts
- Credential encryption/decryption: `src/lib/crypto.ts` (added by T-204)
- Session validation in middleware: protected vs. public paths

---

## Solution

Test each security function in strict isolation:

```ts
// src/lib/__tests__/auth.test.ts
describe("login rate limiting", () => {
  it("allows first 5 attempts", async () => {
    for (let i = 0; i < 5; i++) {
      const res = await POST("/api/auth/login", { username: "admin", password: "wrong" })
      expect(res.status).not.toBe(429)
    }
  })

  it("blocks on 6th attempt within window", async () => {
    // exhaust attempts
    for (let i = 0; i < 5; i++) await loginAttempt("wrong")
    const res = await loginAttempt("wrong")
    expect(res.status).toBe(429)
    expect(await res.json()).toMatchObject({ error: { code: "RATE_LIMITED" } })
  })
})

// src/lib/__tests__/crypto.test.ts
describe("encryptCredential / decryptCredential", () => {
  it("round-trips successfully", async () => {
    const plain = "s3cr3t-p4ssw0rd"
    const cipher = await encryptCredential(plain)
    expect(await decryptCredential(cipher)).toBe(plain)
  })

  it("produces different ciphertext each call (random IV)", async () => {
    const a = await encryptCredential("test")
    const b = await encryptCredential("test")
    expect(a).not.toBe(b)
  })

  it("throws on tampered ciphertext (GCM auth tag fails)", async () => {
    const cipher = await encryptCredential("test")
    const tampered = cipher.slice(0, -4) + "xxxx"  // corrupt auth tag
    await expect(decryptCredential(tampered)).rejects.toThrow()
  })
})
```

---

## Files

- `src/lib/__tests__/auth.test.ts` — login, rate limiting, timing-safe comparison
- `src/lib/__tests__/crypto.test.ts` — encrypt/decrypt round-trips, integrity
- `src/lib/__tests__/csrf.test.ts` — CSRF header validation (after T-203)
- `src/lib/__tests__/middleware.test.ts` — protected paths, public paths

---

## Dependencies

- T-203 (CSRF protection) — test after implementing
- T-204 (credential encryption) — test after implementing

---

## Test Cases to Cover

### Auth
- Correct credentials → 200 + session cookie
- Wrong password → 401 (timing-safe — consistent response time)
- Rate limit: 5 allowed, 6th blocked → 429
- Rate limit resets after window

### CSRF  
- Request with `X-Requested-With` header → passes
- Request without header on mutating endpoint → 403
- GET requests exempt from CSRF check

### Crypto
- Round-trip encrypt/decrypt
- Random IV — different ciphertext each call
- Tamper detection — throws on modified ciphertext
- Empty and unicode string handling

---

## Acceptance Criteria

- [ ] Rate limiting test covers the boundary (5 allowed, 6th blocked)
- [ ] Crypto tests cover the 3 key properties: correctness, randomness, integrity
- [ ] CSRF tests cover pass, block, and GET-exempt cases
- [ ] All tests run without real HTTP calls (mock `iron-session` if needed)
- [ ] `bun test` passes

---

## Notes

Use Vitest's `vi.useFakeTimers()` to test rate limit window expiry without actually waiting. The timing-safe comparison is hard to unit test directly (it's a constant-time check on the CPU) — test that correct passwords grant access and wrong ones are rejected, and trust Node's `crypto.timingSafeEqual` implementation.
