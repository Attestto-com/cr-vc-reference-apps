/**
 * OID4VCI protocol endpoints — minimal issuer implementation.
 *
 * Implements the pre-authorized code flow:
 *   1. POST /offers → create credential offer (returns QR-scannable URL)
 *   2. GET /.well-known/openid-credential-issuer → issuer metadata
 *   3. POST /token → exchange pre-auth code for access token
 *   4. POST /credential → issue credential with proof verification
 *
 * In-memory state only — no database. Codes and tokens expire after 5 minutes.
 */

import { randomUUID, randomBytes } from 'node:crypto'
import type { Request, Response, Router } from 'express'
import { Router as createRouter } from 'express'
import { VCIssuer } from '@attestto/cr-vc-sdk'
import type { IssuerConfig } from '@attestto/cr-vc-sdk'
import type { AppConfig } from '../config.js'

interface PendingOffer {
  code: string
  credentialType: string
  subjectDid?: string
  claims: Record<string, unknown>
  txCode?: string
  createdAt: number
}

interface ActiveToken {
  token: string
  offer: PendingOffer
  createdAt: number
}

const TTL_MS = 5 * 60 * 1000 // 5 minutes

export function createOid4vciRoutes(config: AppConfig): Router {
  const router = createRouter()
  const issuer = new VCIssuer(config.issuer)

  // In-memory stores
  const offers = new Map<string, PendingOffer>()
  const tokens = new Map<string, ActiveToken>()

  // Cleanup expired entries
  function gc() {
    const now = Date.now()
    for (const [k, v] of offers) if (now - v.createdAt > TTL_MS) offers.delete(k)
    for (const [k, v] of tokens) if (now - v.createdAt > TTL_MS) tokens.delete(k)
  }

  // ── Issuer metadata ────────────────────────────────────────

  router.get('/.well-known/openid-credential-issuer', (_req: Request, res: Response) => {
    const baseUrl = config.baseUrl ?? `http://localhost:${config.port}`
    res.json({
      credential_issuer: baseUrl,
      credential_endpoint: `${baseUrl}/credential`,
      token_endpoint: `${baseUrl}/token`,
      credential_configurations_supported: {
        CedulaIdentidadCR: {
          format: 'jwt_vc_json',
          scope: 'CedulaIdentidadCR',
          credential_definition: {
            type: ['VerifiableCredential', 'CedulaIdentidadCR'],
          },
          cryptographic_binding_methods_supported: ['did:key', 'did:web', 'did:sns'],
          credential_signing_alg_values_supported: ['EdDSA'],
        },
        IdentityVC: {
          format: 'jwt_vc_json',
          scope: 'IdentityVC',
          credential_definition: {
            type: ['VerifiableCredential', 'IdentityVC'],
          },
          cryptographic_binding_methods_supported: ['did:key', 'did:web', 'did:sns'],
          credential_signing_alg_values_supported: ['EdDSA'],
        },
        DrivingLicense: {
          format: 'jwt_vc_json',
          scope: 'DrivingLicense',
          credential_definition: {
            type: ['VerifiableCredential', 'DrivingLicense'],
          },
          cryptographic_binding_methods_supported: ['did:key', 'did:web', 'did:sns'],
          credential_signing_alg_values_supported: ['EdDSA'],
        },
      },
    })
  })

  // ── Create credential offer ────────────────────────────────

  router.post('/offers', (req: Request, res: Response) => {
    gc()
    const { credentialType, subjectDid, claims } = req.body

    if (!credentialType || !claims) {
      return res.status(400).json({ error: 'Missing credentialType or claims' })
    }

    const code = randomBytes(16).toString('hex')
    const offer: PendingOffer = {
      code,
      credentialType,
      subjectDid,
      claims,
      createdAt: Date.now(),
    }
    offers.set(code, offer)

    const baseUrl = config.baseUrl ?? `http://localhost:${config.port}`
    const offerPayload = {
      credential_issuer: baseUrl,
      credential_configuration_ids: [credentialType],
      grants: {
        'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
          'pre-authorized_code': code,
        },
      },
    }

    const offerUri = `openid-credential-offer://?credential_offer=${encodeURIComponent(JSON.stringify(offerPayload))}`

    return res.status(201).json({
      offer: offerPayload,
      offerUri,
      code,
    })
  })

  // ── Token endpoint ─────────────────────────────────────────

  router.post('/token', (req: Request, res: Response) => {
    gc()

    // Accept both JSON and form-urlencoded
    const body = req.body
    const grantType = body.grant_type
    const preAuthCode = body['pre-authorized_code']

    if (grantType !== 'urn:ietf:params:oauth:grant-type:pre-authorized_code') {
      return res.status(400).json({ error: 'unsupported_grant_type' })
    }

    if (!preAuthCode) {
      return res.status(400).json({ error: 'invalid_request', error_description: 'Missing pre-authorized_code' })
    }

    const offer = offers.get(preAuthCode)
    if (!offer) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'Unknown or expired code' })
    }

    offers.delete(preAuthCode)

    const token = randomBytes(32).toString('hex')
    tokens.set(token, { token, offer, createdAt: Date.now() })

    return res.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 300,
      c_nonce: randomUUID(),
      c_nonce_expires_in: 300,
    })
  })

  // ── Credential endpoint ────────────────────────────────────

  router.post('/credential', async (req: Request, res: Response) => {
    gc()

    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'invalid_token' })
    }

    const tokenValue = authHeader.slice(7)
    const active = tokens.get(tokenValue)
    if (!active) {
      return res.status(401).json({ error: 'invalid_token', error_description: 'Unknown or expired token' })
    }

    tokens.delete(tokenValue)

    try {
      const { offer } = active
      const vc = await issuer.issue({
        type: offer.credentialType as any,
        subjectDid: offer.subjectDid ?? 'did:key:unspecified',
        claims: offer.claims,
      })

      return res.json({
        format: 'jwt_vc_json',
        credential: vc,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Issuance failed'
      return res.status(500).json({ error: message })
    }
  })

  return router
}
