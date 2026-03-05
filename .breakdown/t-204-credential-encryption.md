# T-204 — AES-256-GCM Credential Encryption

**Epic**: M9 / 9.1 Security Hardening  
**Status**: 🟡 Todo  
**Priority**: P0  
**Severity**: 🔴 CRITICAL  
**Effort**: ~2 hr  
**Good First Issue**: No

---

## Problem

### `src/lib/registry-store.ts`
Registry credentials (username + password) are stored as **plain text** in `data/registries/*.json`. Anyone with filesystem access can read all credentials.

### `src/stores/registry-store.ts` (Zustand client store)
Lines 18–26 use a **XOR cipher** with a hardcoded key — this provides no real security (trivially reversible, frequency analysis attack).

```ts
// ❌ XOR cipher — security theater
const encoded = btoa(value.split("").map((c, i) => 
  String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
).join(""))
```

---

## Solution

### Server-side: AES-256-GCM via Node.js `crypto`

```ts
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto"

const ALGORITHM = "aes-256-gcm"
const SALT = "registry-dashboard-v1"  // static salt, key derived from SESSION_SECRET

function deriveKey(): Buffer {
  return scryptSync(config.SESSION_SECRET, SALT, 32)
}

export function encryptCredential(plaintext: string): string {
  const key = deriveKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  // Format: hex(iv):hex(tag):hex(ciphertext)
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`
}

export function decryptCredential(encoded: string): string {
  const [ivHex, tagHex, ciphertextHex] = encoded.split(":")
  const key = deriveKey()
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"))
  decipher.setAuthTag(Buffer.from(tagHex, "hex"))
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final()
  ]).toString("utf8")
}
```

### Client-side Zustand store
Remove the XOR encoding entirely — the Zustand client store should NOT store credentials at all. Credentials only live server-side in the encrypted JSON files.

---

## Files

- `src/lib/registry-store.ts` — wrap credential fields with `encrypt/decrypt`
- `src/stores/registry-store.ts` — remove XOR encoding; strip credentials before storing in Zustand
- `src/lib/crypto.ts` — **new file** for `encryptCredential` / `decryptCredential`

---

## Dependencies

- Requires `config.SESSION_SECRET` to be set (already enforced by config.ts)

---

## Acceptance Criteria

- [ ] `src/lib/crypto.ts` created with AES-256-GCM encrypt/decrypt using `SESSION_SECRET`
- [ ] `registry-store.ts` encrypts credential fields on write, decrypts on read
- [ ] Zustand `stores/registry-store.ts` contains no credential data (only metadata: id, name, url, type)
- [ ] Existing credentials are migrated or registry re-add is required on first boot
- [ ] `bun run typecheck` passes
- [ ] Credential values are NOT logged anywhere

---

## Notes

Migration path: on first boot with new code, existing plain-text files will fail to decrypt. Options: (1) detect plain-text format (no `:` separator) and re-encrypt automatically; (2) require users to re-add registries. Option 1 is better UX. GCM mode provides authenticated encryption — tampering with stored data is detected. Each credential gets a unique random IV, preventing pattern analysis across multiple encryptions.
