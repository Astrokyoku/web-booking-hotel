# 1. Gunakan Node.js LTS berbasis Alpine Linux (ringan dan hemat memori)
FROM node:20-alpine

# 2. Tentukan direktori kerja di dalam container
WORKDIR /app

# 3. Salin dependencies definition
COPY package*.json ./

# 4. Install dependensi khusus production
RUN npm ci --omit=dev

# 5. Salin folder kode aplikasi backend dan frontend
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# 6. Expose port 5000 yang digunakan Express.js
EXPOSE 5000

# 7. Jalankan server
CMD ["node", "backend/server.js"]