FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/crypto/package.json packages/crypto/package.json
COPY packages/audit/package.json packages/audit/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS runner
COPY . .
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@icra360/worker", "start"]
