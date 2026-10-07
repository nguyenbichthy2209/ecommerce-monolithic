FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./

ENV DATABASE_URL="postgresql://postgres:postgres@postgres:5432/ecommerce_db"

RUN npx prisma generate

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]