# HUMAP - REST API & Mobile Frontend

HUMAP est une application mobile accompagnée d’une **API REST** développée avec **Express** et **MongoDB**, permettant de recommander des **activités locales personnalisées** selon l’humeur, le contexte et la **géolocalisation** de l’utilisateur.

Afin d’illustrer le modèle d’une activité telle qu’elle est effectivement stockée dans la base (conforme au schéma Mongoose `Activity`), exemple :

```json
{
  "title": "Pique-nique au lac",
  "description": "Moment détente en pleine nature avec vue sur le lac",
  "location": "Lausanne",
  "coordinates": { "type": "Point", "coordinates": [6.629, 46.529] },
  "mood": "calm",
  "nb_people": 2,
  "price_range": 0,
  "user_id": "<ObjectId>"
}
```

Cette API permet de gérer les utilisateurs, les activités (créées ou importées via l'API Google), les avis (reviews) et des listes personnalisées (favoris, historiques, etc.).

Ce dépôt contient :

* le **backend** (`humap-backend/`) - Express + MongoDB
* le **frontend** (`humap-frontend/`) - Vue.js (Vite)

---

## Conformité aux critères d’évaluation

### REST API

* Express.js + MongoDB
* Authentification utilisateur via **JWT** (inscription, connexion)
* Ressources principales liées entre elles et aux utilisateurs :

	* `Activity`
	* `Review`
	* `UserActivityList`
* CRUD minimal complet
* Pagination sur certaines listes
* Filtres optionnels
* Données agrégées via **MongoDB Aggregation Pipeline**
* Ressources géolocalisées (GeoJSON + index `2dsphere`)
* Ressources avec images (URLs)
* Routes protégées avec authentification et autorisation
* Restrictions d’accès (un utilisateur ne peut pas modifier les ressources d’un autre)
* Mises à jour **temps réel** via WebSocket (Socket.io)

### Infrastructure

* Code source hébergé sur **GitHub**
* Projet déployé sur **Render**
* Base de données hébergée sur **MongoDB Atlas**

### Documentation

* Documentation API fournie
* Description des endpoints, paramètres, validations et réponses

### Tests automatisés

* Tests avec **Jest** et **Supertest**
* Minimum de 10 tests couvrant au moins 4 opérations REST
* Tests reproductibles

---

## Architecture

```
humap/
├── humap-backend/
│   ├── src/
│   ├── tests/
│   └── docs/
└── humap-frontend/
		├── src/
		└── public/
```

---

## Installation et lancement en local

### Backend

```bash
cd humap-backend
npm install
npm start
```

Backend accessible sur `http://localhost:3000`.

---

### Frontend

```bash
cd humap-frontend
npm install
npm run dev
```

Frontend accessible sur `http://localhost:5173`.

---

## Variables d’environnement

### Backend (`humap-backend/.env`)

```env
# MongoDB Atlas (utilisée en production)
# DATABASE_URL=mongodb+srv://<user>:<pass>@<cluster>/humap

# MongoDB locale (développement)
DATABASE_URL=mongodb://127.0.0.1:27017/humap

PORT=3000
DEBUG=humap:*
MY_APP_SECRET_KEY=****
GEOAPIFY_API_KEY=****
```

En production, les variables sont définies directement dans Render (Database URL, clef JWT, clés API).

---

### Frontend

* `.env.local` (développement)

```env
VITE_API_URL=http://localhost:3000
```

* `.env.production` (production)

```env
VITE_API_URL=https://<backend-render-url>
```

---

## Tests

```bash
cd humap-backend
npm test
```

Les tests sont automatisés et reproductibles.

---

## Documentation API

* Documentation technique : `humap-backend/docs/` 
* OpenAPI / Swagger inclus

---

## Déploiement

### Backend (Render)

* Type : Web Service
* Build : `npm install`
* Start : `npm start`
* Variables Render recommandées : `DATABASE_URL`, `MY_APP_SECRET_KEY`, `GEOAPIFY_API_KEY`

### Frontend (Render)

* Type : Static Site
* Build : `npm run build` (depuis `humap-frontend`)
* Dossier public : `humap-frontend/dist`
* Variable Render : `VITE_API_URL` (URL du backend déployé)

---

## Liens

* API backend : https://humap.onrender.com
* Frontend : https://humap-fronted.onrender.com