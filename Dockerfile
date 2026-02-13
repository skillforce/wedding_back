# ---------- Base ----------
FROM node:20-alpine AS base

WORKDIR /app

RUN corepack enable
RUN corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml package.json ./

RUN pnpm install --frozen-lockfile

COPY . .

# ---------- Test ----------
FROM base AS test
ENV NODE_ENV=testing
CMD ["pnpm", "run", "test:e2e"]

# ---------- Build ----------
FROM base AS build
RUN pnpm run build

# ---------- Production ----------
FROM node:20-alpine AS production

WORKDIR /app

RUN corepack enable
RUN corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml package.json ./

RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "pnpm run migration:run && node dist/main.js"]