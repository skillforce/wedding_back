# ---------- Base ----------
FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# ---------- Test Stage ----------
FROM base AS test

ENV NODE_ENV=testing

CMD ["npm", "run", "test:e2e"]

# ---------- Build Stage ----------
FROM base AS build
RUN npm run build

# ---------- Production Stage ----------
FROM node:24-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]