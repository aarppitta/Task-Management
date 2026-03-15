FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "node config/migrate.js && node index.js"]
