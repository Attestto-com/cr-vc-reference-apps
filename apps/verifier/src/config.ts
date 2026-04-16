/**
 * Verifier configuration loaded from environment.
 *
 * TRUSTED_ISSUERS env var encodes a static trust registry as a
 * comma-separated list of `did|algorithm|base64url-publicKey` triples.
 * Example:
 *   TRUSTED_ISSUERS=did:web:cosevi.cr|Ed25519|abc...,did:web:dgev.cr|Ed25519|def...
 *
 * For production, replace this with a live trust registry lookup
 * (e.g. attestto.com /trust-registry/entities/by-did/:did).
 */

import { fromBase64url } from '@attestto/cr-vc-sdk'

export interface TrustedIssuer {
  did: string
  algorithm: 'Ed25519' | 'ES256'
  publicKey: Uint8Array
}

export interface AppConfig {
  port: number
  trustedIssuers: Map<string, TrustedIssuer>
}

export function loadConfig(): AppConfig {
  const port = Number.parseInt(process.env.PORT ?? '3002', 10)
  const trustedIssuers = new Map<string, TrustedIssuer>()

  const raw = process.env.TRUSTED_ISSUERS ?? ''
  for (const entry of raw.split(',').map((s) => s.trim()).filter(Boolean)) {
    const [did, algorithm, b64] = entry.split('|')
    if (!did || !algorithm || !b64) {
      console.warn(`[verifier] Skipping malformed TRUSTED_ISSUERS entry: ${entry}`)
      continue
    }
    if (algorithm !== 'Ed25519' && algorithm !== 'ES256') {
      console.warn(`[verifier] Skipping unsupported algorithm: ${algorithm}`)
      continue
    }
    trustedIssuers.set(did, {
      did,
      algorithm,
      publicKey: fromBase64url(b64),
    })
  }

  return { port, trustedIssuers }
}
