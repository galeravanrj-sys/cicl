FROM node:20-bullseye

RUN apt-get update && apt-get install -y libreoffice && rm -rf /var/lib/apt/lists/*

ENV LIBREOFFICE_PATH=/usr/bin/soffice
ENV NODE_ENV=production

WORKDIR /app

COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

COPY server ./server

EXPOSE 5000
WORKDIR /app/server
CMD ["node", "server.js"]
