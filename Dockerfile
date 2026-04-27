FROM node:20-alpine3.20
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3100
EXPOSE 3100

RUN chmod +x ./docker/entrypoint.sh
ENTRYPOINT ["./docker/entrypoint.sh"]
