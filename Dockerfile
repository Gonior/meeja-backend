# Base Image
FROM node:20-alpine AS base
WORKDIR /usr/src/app
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

# Dependencies
FROM base as deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
  pnpm install --frozen-lockfile

# Tambahkan use yang sama dengan dengang host

RUN mkdir -p /usr/src/app && chown -R node:node /usr/src/app

# gunakan root untuk install deps
USER root

# Development Stage
FROM base as dev
ENV NODE_ENV=development
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
CMD ["pnpm", "start:dev"]

# Build stage
FROM deps AS build
COPY . .
RUN pnpm build

# Production Stage
FROM base AS prod
ENV NODE_ENV=production
COPY --from=build /usr/src/app/dist ./dist
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY package.json .
EXPOSE 3000
CMD ["node", "dist/main.js"]
