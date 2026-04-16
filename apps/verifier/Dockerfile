FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY ../../package.json ../../pnpm-workspace.yaml ./
COPY ./apps/verifier ./apps/verifier
RUN pnpm install --frozen-lockfile --filter @attestto/cr-vc-verifier-reference...
RUN pnpm --filter @attestto/cr-vc-verifier-reference build

FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY --from=build /app/apps/verifier/dist ./dist
COPY --from=build /app/apps/verifier/package.json ./
COPY --from=build /app/apps/verifier/node_modules ./node_modules
ENV NODE_ENV=production
ENV PORT=3002
EXPOSE 3002
CMD ["node", "dist/index.js"]
