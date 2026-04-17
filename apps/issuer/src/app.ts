/**
 * Express app factory — separated from index.ts for testability.
 */

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import express from 'express'
import type { Application } from 'express'
import { createIssueHandler } from './routes/issue.js'
import { createHealthHandler } from './routes/health.js'
import { createOid4vciRoutes } from './routes/oid4vci.js'
import type { AppConfig } from './config.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function createApp(config: AppConfig): Application {
  const app = express()
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))

  // Static demo page
  app.use('/demo', express.static(join(__dirname, '..', 'public')))

  // Existing routes
  app.get('/health', createHealthHandler(config))
  app.post('/issue', createIssueHandler(config.issuer))

  // OID4VCI protocol routes
  app.use(createOid4vciRoutes(config))

  return app
}
