# ---------- Build ----------
FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable
RUN corepack prepare pnpm@10.33.0 --activate

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build


# ---------- Production ----------
FROM node:24-alpine

WORKDIR /app

RUN corepack enable
RUN corepack prepare pnpm@10.33.0 --activate

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["sh", "-c", "pnpm migration:run:prod && node dist/main.js"]