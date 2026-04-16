/**
 * GET /health
 *
 * Returns:
 *   {
 *     "status": "ok",
 *     "issuer": "did:web:...",
 *     "publicKeyJwk": { ... }
 *   }
 */

import type { Request, Response } from 'express'
import type { AppConfig } from '../config.js'

export function createHealthHandler(config: AppConfig) {
  return function healthHandler(_req: Request, res: Response) {
    res.json({
      status: 'ok',
      issuer: config.issuer.did,
      algorithm: config.issuer.algorithm,
      keyId: config.issuer.keyId,
      publicKey: config.publicKeyB64u,
    })
  }
}
