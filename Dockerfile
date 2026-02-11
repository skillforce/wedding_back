FROM node:24-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build project
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]
