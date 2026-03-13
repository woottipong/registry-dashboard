/**
 * AES-256-GCM credential encryption for registry credentials stored on disk.
 *
 * Encrypted format: `<iv-hex>:<auth-tag-hex>:<ciphertext-hex>`
 *
 * The key is derived from SESSION_SECRET via scrypt so that changing the
 * secret effectively re-encrypts all credentials on next write.
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto"
import { config } from "@/lib/config"

const ALGORITHM = "aes-256-gcm"
const SALT = "registry-dashboard-v1" // fixed, non-secret; just for key material derivation
const SEP = ":"

function deriveKey(): Buffer {
    return scryptSync(config.SESSION_SECRET, SALT, 32)
}

/**
 * Encrypt a credential string (password / token).
 * Returns a `iv:tag:ciphertext` hex string safe to store on disk.
 */
export function encryptCredential(plaintext: string): string {
    const key = deriveKey()
    const iv = randomBytes(12) // 96-bit IV recommended for GCM
    const cipher = createCipheriv(ALGORITHM, key, iv)
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
    const tag = cipher.getAuthTag()
    return [iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(SEP)
}

/**
 * Decrypt a credential string produced by `encryptCredential`.
 *
 * Handles migration: if the value does not contain our separator `:`
 * (i.e. it is plain-text from before encryption was introduced) it is
 * returned as-is so existing registries keep working without a manual
 * migration step.
 */
export function decryptCredential(encoded: string): string {
    // Plain-text fallback / migration path — our format always has exactly two ":"
    const parts = encoded.split(SEP)
    if (parts.length !== 3) {
        console.warn("[crypto] Detected unencrypted credential — it will be re-encrypted on next save")
        return encoded
    }

    const [ivHex, tagHex, cipherHex] = parts
    const key = deriveKey()
    const iv = Buffer.from(ivHex, "hex")
    const tag = Buffer.from(tagHex, "hex")
    const cipherBuf = Buffer.from(cipherHex, "hex")

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    return decipher.update(cipherBuf).toString("utf8") + decipher.final("utf8")
}
