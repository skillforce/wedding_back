# ---------- Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable
RUN corepack prepare pnpm@9 --activate

COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build


# ---------- Production ----------
FROM node:20-alpine

WORKDIR /app

RUN corepack enable
RUN corepack prepare pnpm@9 --activate

COPY pnpm-lock.yaml package.json ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "pnpm migration:run:prod && node dist/main.js"]