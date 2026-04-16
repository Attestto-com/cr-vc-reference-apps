# cr-vc-reference-apps

[![CI](https://github.com/Attestto-com/cr-vc-reference-apps/actions/workflows/ci.yml/badge.svg)](https://github.com/Attestto-com/cr-vc-reference-apps/actions)

> Reference issuer + verifier services for the Costa Rica SSI driving ecosystem. Wraps [`@attestto/cr-vc-sdk`](https://www.npmjs.com/package/@attestto/cr-vc-sdk).

Two minimal Express services any institution can clone, configure, and deploy:

- **`apps/issuer/`** — `@attestto/cr-vc-issuer-reference` — signs Verifiable Credentials
- **`apps/verifier/`** — `@attestto/cr-vc-verifier-reference` — validates VCs against a static trust registry

## Quick start (Docker)

```bash
docker compose up --build
```

Then in another terminal:

```bash
./examples/issue-and-verify.sh
```

## Quick start (local Node)

```bash
pnpm install
pnpm build

# Terminal A — issuer on :3001
pnpm issuer:dev

# Terminal B — verifier on :3002
pnpm verifier:dev
```

## Issuer endpoints

### `POST /issue`

```json
{
  "type": "DrivingLicense",
  "subjectDid": "did:web:holder.example.cr",
  "claims": { "name": "...", "licenseClass": "B1" },
  "expirationDate": "2030-01-01T00:00:00Z"
}
```

Returns the signed Verifiable Credential.

### `GET /health`

Returns issuer DID, algorithm, keyId, and base64url-encoded public key (for trust registry registration).

## Verifier endpoints

### `POST /verify`

```json
{
  "credential": { "@context": [...], "type": [...], "issuer": "did:web:...", "proof": {...} },
  "options": { "expectedType": "DrivingLicense" }
}
```

Returns:

```json
{
  "valid": true,
  "checks": [ ... ],
  "errors": [],
  "warnings": [],
  "issuerTrusted": true
}
```

### `GET /health`

Returns the count and DIDs of issuers in the trust registry.

## Configuration

### Issuer environment variables

| Var | Default | Notes |
|---|---|---|
| `PORT` | `3001` | HTTP port |
| `ISSUER_DID` | `did:web:issuer.example.cr` | Identifier published in the VC |
| `ISSUER_ALGORITHM` | `Ed25519` | `Ed25519` or `ES256` |
| `ISSUER_KEY_ID` | `#key-1` | DID URL fragment |
| `ISSUER_PRIVATE_KEY` | _(generated on startup)_ | base64url-encoded private key |
| `ISSUER_PUBLIC_KEY` | _(derived from key gen)_ | base64url-encoded public key |

### Verifier environment variables

| Var | Default | Notes |
|---|---|---|
| `PORT` | `3002` | HTTP port |
| `TRUSTED_ISSUERS` | _(empty)_ | Comma-separated `did|algorithm|base64url-publicKey` triples |

## Limitations of this reference

This MVP intentionally implements only the basics. The following are **deferred** until upstream features land:

- Revocation (StatusList2021 / CRL) — depends on `CRLManager` in `@attestto/cr-vc-sdk` (not yet built)
- Live trust registry lookup — currently static via env. A live REST client to the Attestto trust registry will land once an SDK wrapper is published
- OpenID4VCI / OpenID4VP protocol flows — tracked as ATT-494
- Admin UI, QR code input, persistent VC storage — out of scope for the MVP

For production, replace the in-memory key generation with a HSM/KMS/Infisical integration.

## License

Apache 2.0. See [LICENSE](./LICENSE).

## Contact

| Channel | Address |
|---|---|
| Author | Eduardo Chongkan ([@chongkan](https://github.com/chongkan)) |
| Standards | [standards@attestto.com](mailto:standards@attestto.com) |
| Website | [attestto.com](https://attestto.com) |
