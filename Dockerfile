# Etapa 1: Compilacion de la app React (Node 20)
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-fund --no-audit

COPY . .
RUN npm run build

# Etapa 2: Servidor Nginx para servir la app y hacer proxy de /api
FROM nginx:alpine AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
