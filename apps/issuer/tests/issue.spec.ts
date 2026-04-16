/**
 * Issuer integration tests — boots the Express app, issues a credential,
 * and asserts shape + signature presence.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import type { Application } from 'express'
import { loadConfig } from '../src/config.js'
import { createApp } from '../src/app.js'

describe('cr-vc-issuer-reference', () => {
  let app: Application

  beforeAll(() => {
    const config = loadConfig()
    app = createApp(config)
  })

  it('GET /health returns issuer metadata', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.issuer).toMatch(/^did:/)
    expect(res.body.publicKey).toBeTruthy()
  })

  it('POST /issue rejects missing fields', async () => {
    const res = await request(app).post('/issue').send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('Missing required fields')
  })

  it('POST /issue returns a signed VC for DrivingLicense', async () => {
    const res = await request(app)
      .post('/issue')
      .send({
        type: 'DrivingLicense',
        subjectDid: 'did:web:holder.example.cr',
        claims: {
          name: 'Juan Carlos Prueba Ejemplo',
          documentNumber: '9-9999-9999',
          licenseClass: 'B1',
        },
        expirationDate: '2030-01-01T00:00:00Z',
      })

    expect(res.status).toBe(201)
    expect(res.body.type).toContain('VerifiableCredential')
    expect(res.body.type).toContain('DrivingLicense')
    expect(res.body.proof).toBeDefined()
    expect(res.body.credentialSubject.id).toBe('did:web:holder.example.cr')
    expect(res.body.credentialSubject.license.documentNumber).toBe('9-9999-9999')
  })

  it('POST /issue accepts optional expirationDate', async () => {
    const res = await request(app)
      .post('/issue')
      .send({
        type: 'MedicalFitnessCredential',
        subjectDid: 'did:web:holder.example.cr',
        claims: { fit: true, examinedBy: 'Dr Test' },
      })

    expect(res.status).toBe(201)
    expect(res.body.expirationDate).toBeUndefined()
  })
})
