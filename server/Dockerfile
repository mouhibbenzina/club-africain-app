FROM node:22-bookworm-slim

ENV NODE_ENV=production
ENV TZ=Africa/Tunis

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY . .

RUN mkdir -p logs backups data

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://localhost:3001/api/matches').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "index.js"]