/**
 * Verifier integration tests — issues a credential via the SDK in-process,
 * then verifies it through the Express endpoint with the issuer in the
 * trust registry.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import type { Application } from 'express'
import { VCIssuer, generateKeyPair, toBase64url } from '@attestto/cr-vc-sdk'
import { loadConfig } from '../src/config.js'
import { createApp } from '../src/app.js'

const ISSUER_DID = 'did:web:test-issuer.example.cr'

describe('cr-vc-verifier-reference', () => {
  let app: Application
  let signedVc: any

  beforeAll(async () => {
    const kp = generateKeyPair('Ed25519')
    process.env.TRUSTED_ISSUERS = `${ISSUER_DID}|Ed25519|${toBase64url(kp.publicKey)}`

    const config = loadConfig()
    app = createApp(config)

    const issuer = new VCIssuer({
      did: ISSUER_DID,
      privateKey: kp.privateKey,
      algorithm: 'Ed25519',
      keyId: '#key-1',
    })
    signedVc = await issuer.issue({
      type: 'DrivingLicense',
      subjectDid: 'did:web:holder.example.cr',
      claims: { name: 'Test User', licenseClass: 'B1' },
    })
  })

  it('GET /health lists trusted issuers', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.trustedIssuerCount).toBeGreaterThan(0)
    expect(res.body.trustedIssuers).toContain(ISSUER_DID)
  })

  it('POST /verify rejects missing credential', async () => {
    const res = await request(app).post('/verify').send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('Missing required field')
  })

  it('POST /verify accepts a valid credential from a trusted issuer', async () => {
    const res = await request(app).post('/verify').send({ credential: signedVc })
    expect(res.status).toBe(200)
    expect(res.body.valid).toBe(true)
    expect(res.body.issuerTrusted).toBe(true)
    expect(res.body.errors).toEqual([])
  })

  it('POST /verify flags untrusted issuer', async () => {
    const tampered = {
      ...signedVc,
      issuer: 'did:web:unknown-issuer.example.cr',
    }
    const res = await request(app).post('/verify').send({ credential: tampered })
    expect(res.status).toBe(200)
    expect(res.body.issuerTrusted).toBe(false)
  })
})
