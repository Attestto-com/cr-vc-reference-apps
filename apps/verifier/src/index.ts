/**
 * @attestto/cr-vc-verifier-reference
 *
 * Reference Express service for verifying Verifiable Credentials in the
 * Costa Rica SSI driving ecosystem. Wraps @attestto/cr-vc-sdk.
 */

import { loadConfig } from './config.js'
import { createApp } from './app.js'

function main() {
  const config = loadConfig()
  const app = createApp(config)

  app.listen(config.port, () => {
    console.log(`[verifier] Trusted issuers: ${config.trustedIssuers.size}`)
    console.log(`[verifier] Listening on http://localhost:${config.port}`)
  })
}

try {
  main()
} catch (err) {
  console.error('[verifier] Fatal:', err)
  process.exit(1)
}
