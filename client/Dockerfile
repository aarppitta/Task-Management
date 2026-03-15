FROM node:22-alpine

WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 4173

CMD ["npx", "vite", "preview", "--host", "0.0.0.0"]
