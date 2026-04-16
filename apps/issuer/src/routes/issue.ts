/**
 * POST /issue
 *
 * Body:
 *   {
 *     "type": "DrivingLicense",
 *     "subjectDid": "did:web:holder.example.cr",
 *     "claims": { ... },
 *     "expirationDate": "2030-01-01T00:00:00Z"  // optional
 *   }
 *
 * Returns the signed Verifiable Credential.
 */

import type { Request, Response } from 'express'
import { VCIssuer } from '@attestto/cr-vc-sdk'
import type { IssuerConfig, IssueOptions } from '@attestto/cr-vc-sdk'

export function createIssueHandler(config: IssuerConfig) {
  const issuer = new VCIssuer(config)

  return async function issueHandler(req: Request, res: Response) {
    try {
      const { type, subjectDid, claims, expirationDate, id, issuerInfo } = req.body as Partial<IssueOptions>

      if (!type || !subjectDid || !claims) {
        return res.status(400).json({
          error: 'Missing required fields: type, subjectDid, claims',
        })
      }

      const vc = await issuer.issue({
        type,
        subjectDid,
        claims,
        expirationDate,
        id,
        issuerInfo,
      })

      return res.status(201).json(vc)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return res.status(500).json({ error: message })
    }
  }
}
