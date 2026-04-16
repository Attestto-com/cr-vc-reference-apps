/**
 * Express app factory — separated from index.ts for testability.
 */

import express from 'express'
import type { Application } from 'express'
import { createVerifyHandler } from './routes/verify.js'
import { createHealthHandler } from './routes/health.js'
import type { AppConfig } from './config.js'

export function createApp(config: AppConfig): Application {
  const app = express()
  app.use(express.json({ limit: '1mb' }))

  app.get('/health', createHealthHandler(config))
  app.post('/verify', createVerifyHandler(config.trustedIssuers))

  return app
}
