FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
ENV REACT_APP_API_URL=http://localhost:8000/api
EXPOSE 3000
CMD ["npm", "start"]
