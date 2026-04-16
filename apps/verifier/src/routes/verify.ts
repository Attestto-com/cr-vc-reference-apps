/**
 * POST /verify
 *
 * Body:
 *   {
 *     "credential": { ... full VC ... },
 *     "options": { "expectedType": "DrivingLicense" }  // optional
 *   }
 *
 * Returns:
 *   {
 *     "valid": true,
 *     "checks": [...],
 *     "errors": [],
 *     "warnings": [],
 *     "issuerTrusted": true
 *   }
 */

import type { Request, Response } from 'express'
import { VCVerifier } from '@attestto/cr-vc-sdk'
import type { PublicKeyResolver, VerifiableCredential, VerifyOptions } from '@attestto/cr-vc-sdk'
import type { TrustedIssuer } from '../config.js'

export function createVerifyHandler(trustedIssuers: Map<string, TrustedIssuer>) {
  const resolver: PublicKeyResolver = async (did) => {
    const trusted = trustedIssuers.get(did)
    if (!trusted) return null
    return { publicKey: trusted.publicKey, algorithm: trusted.algorithm }
  }

  const verifier = new VCVerifier({ resolvePublicKey: resolver })

  return async function verifyHandler(req: Request, res: Response) {
    try {
      const { credential, options } = req.body as {
        credential?: VerifiableCredential
        options?: VerifyOptions
      }

      if (!credential) {
        return res.status(400).json({ error: 'Missing required field: credential' })
      }

      const result = await verifier.verify(credential, options ?? {})
      const issuerDid = typeof credential.issuer === 'string' ? credential.issuer : credential.issuer?.id
      const issuerTrusted = issuerDid ? trustedIssuers.has(issuerDid) : false

      return res.status(200).json({ ...result, issuerTrusted })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return res.status(500).json({ error: message })
    }
  }
}
