# T-264 — Create `SECURITY.md`

**Epic**: M9 / 9.7 Developer Experience  
**Status**: 🟡 Todo  
**Priority**: P1  
**Severity**: 🟡 MEDIUM  
**Effort**: ~30 min  
**Good First Issue**: ✅ Yes

---

## Problem

The project has no `SECURITY.md` file. GitHub's security tab flags this. More practically, someone who finds a vulnerability has no contact info or disclosure process. For a self-hosted tool handling registry credentials, this is a real gap.

---

## Solution

Create `SECURITY.md` at the repository root:

```md
# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest  | ✅ Yes    |

## Reporting a Vulnerability

**Please do not open public GitHub issues for security vulnerabilities.**

To report a security issue, please use one of:
- GitHub private security advisory: [Report a vulnerability](https://github.com/...)
- Email: [contact email]

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- (Optional) Suggested fix

Expect a response within 48 hours. We aim to patch critical vulnerabilities within 7 days.

## Security Architecture

### Authentication
- Single-user login via environment variables (`APP_USERNAME`, `APP_PASSWORD`)
- Timing-safe password comparison (`crypto.timingSafeEqual`)
- Rate limiting: 5 attempts / 15 min / IP
- Session: iron-session encrypted HTTP-only cookie

### Registry Credentials
- Credentials are handled server-side only (BFF pattern)
- Never transmitted to the browser
- Stored encrypted at rest (AES-256-GCM) — see T-204
- CSRF protection via custom header validation

### Data
- Registry config stored in `DATA_DIR` (default: `./data/`)
- Ensure `DATA_DIR` has appropriate filesystem permissions (mode 700)

## Known Limitations

- Single-user only — no multi-user RBAC
- In-memory rate limiting resets on server restart
```

---

## Files

- `SECURITY.md` — create at repo root

---

## Dependencies

- T-203 (CSRF protection) — document after implementing
- T-204 (credential encryption) — document after implementing

---

## Acceptance Criteria

- [ ] `SECURITY.md` exists at repo root
- [ ] GitHub security advisory link is included
- [ ] Auth architecture section is accurate
- [ ] Known limitations are honest about the single-user model

---

## Notes

The `SECURITY.md` file is recognised by GitHub automatically and linked from the repository's Security tab. This is also required for responsible disclosure if the project is ever listed in security databases.
