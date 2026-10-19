# Booking App

![CI](https://github.com/Lynda-hamadi/booking-app/actions/workflows/ci.yml/badge.svg)

Application web de réservation de ressources (salles, studios, matériel...) avec authentification, gestion des créneaux et annulation avec remboursement partiel.

## 🔗 Démo en ligne

- **Application** : https://booking-app-smoky-eta.vercel.app/
- **API** : https://booking-app-api-zq0j.onrender.com/api/health

> ⏱️ L'API est hébergée sur une offre gratuite : après 15 minutes d'inactivité elle se met en veille, et la première requête peut prendre jusqu'à une minute. Ensuite, tout est rapide.

## Le point technique : empêcher le double-booking

Si deux personnes réservent le même créneau au même instant, une vérification applicative du type « le créneau est-il libre ? » échoue : les deux requêtes le voient libre avant que l'une d'elles n'enregistre.

La garantie est donc confiée à **PostgreSQL** avec une contrainte d'exclusion :

```sql
ALTER TABLE "Booking"
ADD CONSTRAINT booking_no_overlap
EXCLUDE USING gist (
  "resourceId" WITH =,
  tsrange("startTime", "endTime") WITH &&
) WHERE (status <> 'CANCELLED');
```

Pour une même ressource, deux plages horaires ne peuvent pas se chevaucher (sauf si l'une est annulée). L'API traduit la violation de contrainte en réponse `409 Conflict`. Un test automatisé lance 5 requêtes simultanées sur le même créneau et vérifie qu'une seule est acceptée.

## Fonctionnalités

- Inscription et connexion (mots de passe hachés avec bcrypt, tokens JWT)
- Deux rôles : utilisateur et propriétaire (seul un propriétaire peut créer des ressources)
- Réservation d'un créneau, prix calculé côté serveur
- Annulation avec règle métier : remboursement à 100 % à plus de 24h, 50 % en dessous
- Protection contre la double annulation (mise à jour conditionnelle)
- Interface web complète : liste et détail des ressources, réservation, « Mes réservations » avec annulation, création de ressources pour les propriétaires
- Tests automatisés et intégration continue (GitHub Actions)
- Application déployée en production

## Stack

Node.js, Express 5, TypeScript, PostgreSQL, Prisma, JWT, Vitest, Supertest, GitHub Actions, Next.js, Tailwind CSS.

Déploiement : Vercel (frontend), Render (API), Neon (PostgreSQL).

## API

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/api/auth/register` | public | Créer un compte |
| POST | `/api/auth/login` | public | Se connecter, reçoit un token |
| GET | `/api/resources` | public | Lister les ressources |
| GET | `/api/resources/:id` | public | Détail d'une ressource |
| POST | `/api/resources` | propriétaire | Créer une ressource |
| POST | `/api/bookings` | connecté | Réserver un créneau |
| GET | `/api/bookings/me` | connecté | Mes réservations |
| POST | `/api/bookings/:id/cancel` | connecté | Annuler une réservation |


## Lancer avec Docker (le plus simple)

Prérequis : Docker Desktop. Aucune installation de Node ou de PostgreSQL n'est nécessaire.

```bash
git clone https://github.com/Lynda-hamadi/booking-app.git
cd booking-app
docker compose up --build
```

Cette commande démarre trois conteneurs : PostgreSQL, l'API (qui applique les migrations au démarrage) et le site. L'application est disponible sur http://localhost:3000 et l'API sur http://localhost:3001.

Pour arrêter : `docker compose down` (ajoute `-v` pour supprimer aussi les données).




## Lancer le projet en local

Prérequis : Node.js et PostgreSQL.

```bash
git clone https://github.com/Lynda-hamadi/booking-app.git
cd booking-app
```

### Backend

```bash
cd backend
npm install
```

Crée un fichier `backend/.env` :

```
PORT=3001
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/booking_app"
JWT_SECRET="une_longue_chaine_aleatoire"
```

Puis :

```bash
npx prisma migrate deploy
npx prisma generate
npm run dev
```

### Frontend

Dans un second terminal :

```bash
cd frontend
npm install
```

Crée un fichier `frontend/.env.local` :

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Puis :

```bash
npm run dev
```

L'application est disponible sur http://localhost:3000.

## Tests

Les tests utilisent une base séparée. Crée `booking_app_test` et un fichier `backend/.env.test` avec son `DATABASE_URL` et un `JWT_SECRET`, applique les migrations sur cette base, puis :

```bash
cd backend
npm test
```

## Déploiement

- **Base de données** : Neon (PostgreSQL), migrations appliquées avec `npx prisma migrate deploy`
- **API** : Render, dossier racine `backend`, variables `DATABASE_URL` et `JWT_SECRET`
- **Frontend** : Vercel, dossier racine `frontend`, variable `NEXT_PUBLIC_API_URL` pointant vers l'API



## DevOps

Le projet est industrialisé de bout en bout.

**Conteneurisation**
- Un Dockerfile par service, avec installation des dépendances mise en cache et exécution sous un utilisateur non root
- Build multi-étapes pour le frontend : l'image finale ne contient que le strict nécessaire (mode `standalone` de Next.js)
- `docker-compose.yml` : base PostgreSQL, API et site démarrent avec une seule commande, les migrations sont appliquées au lancement de l'API

**CI/CD (GitHub Actions)**
- Tests du backend sur une base PostgreSQL éphémère, y compris le test de concurrence
- Construction des images Docker à chaque push
- Audit des dépendances (`npm audit`) : le pipeline échoue si une faille de gravité haute apparaît en production
- Publication des images dans GitHub Container Registry, taguées avec le SHA du commit, uniquement depuis `main` et uniquement si tous les contrôles précédents sont verts
- Permissions minimales par défaut (`contents: read`), `packages: write` accordé au seul job de publication

**Maintenance des dépendances**
- Dependabot : mises à jour mineures regroupées en une seule demande par projet, versions majeures ignorées, nombre de demandes ouvertes limité

**Choix de sécurité**
- Aucun scanner tiers ajouté au pipeline à ce stade : le compromis de l'action Trivy en mars 2026 a rappelé le risque de la chaîne d'approvisionnement des workflows. Les actions utilisées sont les actions officielles GitHub.


## Kubernetes

Les manifestes du dossier `k8s/` déploient l'application complète sur un cluster local [kind](https://kind.sigs.k8s.io/) :

- **PostgreSQL** : StatefulSet avec volume persistant et sonde de disponibilité (`pg_isready`)
- **API** : Deployment de 2 réplicas, migrations Prisma appliquées par un `initContainer` avant le démarrage, sonde de disponibilité sur `/api/health` (qui vérifie la base) et sonde de vivacité volontairement indépendante de la base
- **Site** : Deployment de 2 réplicas, appelle l'API par son nom de service interne
- Requêtes et limites de ressources définies pour chaque pod
- **Secrets** : créés directement dans le cluster, jamais écrits dans le dépôt

Prérequis : Docker Desktop, [kind](https://kind.sigs.k8s.io/) et `kubectl`.

```bash
kind create cluster --name booking

# Images construites en local et chargées dans le cluster
docker build -t booking-api:local ./backend
docker build -t booking-web:local --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 ./frontend
kind load docker-image booking-api:local --name booking
kind load docker-image booking-web:local --name booking

# Espace de noms et secrets (remplacer le mot de passe : lettres et chiffres uniquement)
kubectl apply -f k8s/namespace.yaml
kubectl create secret generic booking-secrets --namespace booking \
  --from-literal=POSTGRES_PASSWORD=VOTRE_MOT_DE_PASSE \
  --from-literal=JWT_SECRET=$(node -e "console.log(crypto.randomBytes(32).toString('hex'))")

# Déploiement
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/api.yaml
kubectl apply -f k8s/web.yaml
kubectl get pods -n booking
```

Accès depuis le navigateur, dans deux terminaux :

```bash
kubectl port-forward -n booking svc/api 3001:3001
kubectl port-forward -n booking svc/web 3000:3000
```

L'application est alors disponible sur http://localhost:3000.



## Observabilité

L'API expose ses métriques au format Prometheus sur `/metrics` (durée des requêtes par méthode, route et code de statut, plus les métriques du processus Node). Les étiquettes utilisent le **modèle de route** (`/api/bookings/:id/cancel`) et non l'URL réelle, pour éviter une explosion du nombre de séries.

Dans le cluster :

- **Prometheus** collecte les métriques de chaque réplica de l'API toutes les 15 secondes, via un Service headless et la découverte DNS
- **Grafana** affiche le tableau de bord « Booking API », défini comme du code (ConfigMap) et chargé au démarrage : requêtes par seconde par route, latence au 95ᵉ centile, erreurs 5xx et conflits 409 (créneaux déjà pris), mémoire par instance
- La source de données et le tableau de bord sont provisionnés : aucune configuration manuelle dans l'interface
- Le mot de passe de Grafana est créé comme secret dans le cluster, il n'est pas dans le dépôt

```bash
kubectl create secret generic grafana-admin --namespace booking \
  --from-literal=GF_SECURITY_ADMIN_PASSWORD=VOTRE_MOT_DE_PASSE

kubectl apply -f k8s/api-headless.yaml
kubectl apply -f k8s/prometheus.yaml
kubectl apply -f k8s/grafana.yaml

kubectl port-forward -n booking svc/grafana 3002:3000
```

Grafana est alors disponible sur http://localhost:3002 (utilisateur `admin`).


## Prochaines étapes

- [x] Frontend Next.js
- [x] Déploiement
- [x] Conteneurisation (Docker, docker-compose)
- [x] CI/CD avec audit de sécurité et publication d'images
- [x] Déploiement sur Kubernetes (cluster local kind)
- [x] Monitoring (Prometheus, Grafana)
- [ ] Infrastructure as Code (Terraform)
- [ ] Paiement Stripe (mode test)
- [ ] Notifications par email