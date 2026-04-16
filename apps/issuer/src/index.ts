/**
 * @attestto/cr-vc-issuer-reference
 *
 * Reference Express service for issuing Verifiable Credentials in the
 * Costa Rica SSI driving ecosystem. Wraps @attestto/cr-vc-sdk.
 */

import { loadConfig } from './config.js'
import { createApp } from './app.js'

function main() {
  const config = loadConfig()
  const app = createApp(config)

  app.listen(config.port, () => {
    console.log(`[issuer] DID: ${config.issuer.did}`)
    console.log(`[issuer] Algorithm: ${config.issuer.algorithm}`)
    console.log(`[issuer] Listening on http://localhost:${config.port}`)
  })
}

try {
  main()
} catch (err) {
  console.error('[issuer] Fatal:', err)
  process.exit(1)
}
