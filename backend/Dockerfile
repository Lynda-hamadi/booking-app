FROM node:24-slim

WORKDIR /app

# Dépendances d'abord : cette couche est mise en cache tant que package*.json ne change pas
COPY package.json package-lock.json ./
RUN npm ci

# Génération du client Prisma (aucune connexion à la base n'est nécessaire)
COPY prisma ./prisma
COPY prisma7.config.ts ./
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npx prisma generate

COPY src ./src

ENV NODE_ENV=production
EXPOSE 3001

# Le conteneur n'a pas besoin des droits root
USER node

CMD ["npm", "start"]