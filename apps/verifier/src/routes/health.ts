/**
 * GET /health
 *
 * Returns:
 *   {
 *     "status": "ok",
 *     "trustedIssuerCount": N,
 *     "trustedIssuers": ["did:web:..."]
 *   }
 */

import type { Request, Response } from 'express'
import type { AppConfig } from '../config.js'

export function createHealthHandler(config: AppConfig) {
  return function healthHandler(_req: Request, res: Response) {
    res.json({
      status: 'ok',
      trustedIssuerCount: config.trustedIssuers.size,
      trustedIssuers: Array.from(config.trustedIssuers.keys()),
    })
  }
}
