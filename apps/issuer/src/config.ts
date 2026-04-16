/**
 * Issuer configuration loaded from environment.
 *
 * For production, replace the in-memory key generation with a HSM /
 * Vault / Infisical integration. The reference app uses a session-scoped
 * Ed25519 key generated on startup if no ISSUER_PRIVATE_KEY is provided.
 */

import { generateKeyPair, fromBase64url, toBase64url } from '@attestto/cr-vc-sdk'
import type { IssuerConfig } from '@attestto/cr-vc-sdk'

export interface AppConfig {
  port: number
  issuer: IssuerConfig
  publicKeyB64u: string
}

export function loadConfig(): AppConfig {
  const port = Number.parseInt(process.env.PORT ?? '3001', 10)
  const did = process.env.ISSUER_DID ?? 'did:web:issuer.example.cr'
  const algorithm = (process.env.ISSUER_ALGORITHM ?? 'Ed25519') as 'Ed25519' | 'ES256'

  let privateKey: Uint8Array
  let publicKeyB64u: string

  if (process.env.ISSUER_PRIVATE_KEY) {
    privateKey = fromBase64url(process.env.ISSUER_PRIVATE_KEY)
    publicKeyB64u = process.env.ISSUER_PUBLIC_KEY ?? ''
  } else {
    const kp = generateKeyPair(algorithm)
    privateKey = kp.privateKey
    publicKeyB64u = toBase64url(kp.publicKey)
  }

  return {
    port,
    issuer: {
      did,
      privateKey,
      algorithm,
      keyId: process.env.ISSUER_KEY_ID ?? '#key-1',
    },
    publicKeyB64u,
  }
}
