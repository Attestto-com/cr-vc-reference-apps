import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { loadConfig } from '../src/config.js'

const config = loadConfig()
const app = createApp(config)

describe('OID4VCI endpoints', () => {
  describe('GET /.well-known/openid-credential-issuer', () => {
    it('returns issuer metadata', async () => {
      const res = await request(app).get('/.well-known/openid-credential-issuer')
      expect(res.status).toBe(200)
      expect(res.body.credential_issuer).toBeDefined()
      expect(res.body.credential_endpoint).toContain('/credential')
      expect(res.body.token_endpoint).toContain('/token')
      expect(res.body.credential_configurations_supported).toBeDefined()
      expect(res.body.credential_configurations_supported.CedulaIdentidadCR).toBeDefined()
    })
  })

  describe('POST /offers', () => {
    it('creates a credential offer', async () => {
      const res = await request(app)
        .post('/offers')
        .send({
          credentialType: 'DriverIdentity',
          claims: { nombre: 'Maria', cedula: '1-1234-0567' },
        })

      expect(res.status).toBe(201)
      expect(res.body.offer).toBeDefined()
      expect(res.body.offerUri).toContain('openid-credential-offer://')
      expect(res.body.code).toBeDefined()
      expect(res.body.offer.credential_configuration_ids).toContain('DriverIdentity')
    })

    it('rejects missing fields', async () => {
      const res = await request(app)
        .post('/offers')
        .send({ credentialType: 'CedulaIdentidadCR' })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /token', () => {
    it('exchanges pre-authorized code for access token', async () => {
      // Create offer first
      const offerRes = await request(app)
        .post('/offers')
        .send({
          credentialType: 'DriverIdentity',
          claims: { nombre: 'Maria', cedula: '1-1234-0567' },
        })

      const { code } = offerRes.body

      // Exchange code for token
      const tokenRes = await request(app)
        .post('/token')
        .send({
          grant_type: 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
          'pre-authorized_code': code,
        })

      expect(tokenRes.status).toBe(200)
      expect(tokenRes.body.access_token).toBeDefined()
      expect(tokenRes.body.token_type).toBe('Bearer')
      expect(tokenRes.body.c_nonce).toBeDefined()
    })

    it('rejects invalid code', async () => {
      const res = await request(app)
        .post('/token')
        .send({
          grant_type: 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
          'pre-authorized_code': 'invalid-code',
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('invalid_grant')
    })

    it('rejects unsupported grant type', async () => {
      const res = await request(app)
        .post('/token')
        .send({ grant_type: 'authorization_code', code: 'abc' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('unsupported_grant_type')
    })
  })

  describe('POST /credential', () => {
    it('issues a credential with valid token', async () => {
      // Create offer
      const offerRes = await request(app)
        .post('/offers')
        .send({
          credentialType: 'DriverIdentity',
          claims: { nombre: 'Maria', cedula: '1-1234-0567' },
        })

      // Get token
      const tokenRes = await request(app)
        .post('/token')
        .send({
          grant_type: 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
          'pre-authorized_code': offerRes.body.code,
        })

      // Request credential
      const credRes = await request(app)
        .post('/credential')
        .set('Authorization', `Bearer ${tokenRes.body.access_token}`)
        .send({})

      expect(credRes.status).toBe(200)
      expect(credRes.body.credential).toBeDefined()
      expect(credRes.body.credential.type).toContain('DriverIdentity')
      expect(credRes.body.credential.credentialSubject).toBeDefined()
    })

    it('rejects missing authorization', async () => {
      const res = await request(app).post('/credential').send({})
      expect(res.status).toBe(401)
    })

    it('rejects invalid token', async () => {
      const res = await request(app)
        .post('/credential')
        .set('Authorization', 'Bearer invalid-token')
        .send({})

      expect(res.status).toBe(401)
    })
  })

  describe('full OID4VCI flow', () => {
    it('offer → token → credential end-to-end', async () => {
      // Step 1: Create offer
      const offer = await request(app)
        .post('/offers')
        .send({
          credentialType: 'DrivingLicense',
          subjectDid: 'did:key:z6MkTest',
          claims: { fullName: 'Maria Ejemplo', categories: ['B1'] },
        })
      expect(offer.status).toBe(201)

      // Step 2: Exchange code for token
      const token = await request(app)
        .post('/token')
        .send({
          grant_type: 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
          'pre-authorized_code': offer.body.code,
        })
      expect(token.status).toBe(200)

      // Step 3: Request credential
      const cred = await request(app)
        .post('/credential')
        .set('Authorization', `Bearer ${token.body.access_token}`)
        .send({})
      expect(cred.status).toBe(200)
      expect(cred.body.credential.type).toContain('DrivingLicense')
      expect(cred.body.credential.credentialSubject.id).toBe('did:key:z6MkTest')
      expect(cred.body.credential.proof).toBeDefined()
    })
  })
})
