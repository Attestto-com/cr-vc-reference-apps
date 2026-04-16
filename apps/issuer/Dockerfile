FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY ../../package.json ../../pnpm-workspace.yaml ./
COPY ./apps/issuer ./apps/issuer
RUN pnpm install --frozen-lockfile --filter @attestto/cr-vc-issuer-reference...
RUN pnpm --filter @attestto/cr-vc-issuer-reference build

FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY --from=build /app/apps/issuer/dist ./dist
COPY --from=build /app/apps/issuer/package.json ./
COPY --from=build /app/apps/issuer/node_modules ./node_modules
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
CMD ["node", "dist/index.js"]
