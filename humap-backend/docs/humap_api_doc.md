# HUMAP API Documentation

## Vue d'ensemble

HUMAP est une API RESTful qui recommande des activités locales en fonction de l'humeur, du contexte et de la position géographique de l'utilisateur.

**Base URL:** `https://humap.onrender.com` 

**Technologies:**
- Node.js + Express
- MongoDB + Mongoose
- JWT pour l'authentification
- Déployé sur Render

---

## Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification. Incluez le token dans l'en-tête Authorization pour les routes protégées:

```
Authorization: Bearer <votre_token_jwt>
```

---

## Ressources

### 1. User
Représente un utilisateur de l'application.

**Attributs:**
- `id` (ObjectId) - Identifiant unique
- `username` (String, requis) - Nom d'utilisateur
- `gender` (String) - Genre
- `email` (String, requis, unique) - Email
- `avatar` (String) - URL de l'image de profil
- `password` (String, requis) - Mot de passe haché
- `nb_reviews` (Number, default: 0) - Nombre de reviews postées
- `role` (String, default: "user") - "user" ou "admin"
- `created_at` (Date) - Date d'inscription

---

### 2. Activity
Représente une activité géolocalisée.

**Attributs:**
- `id` (ObjectId) - Identifiant unique
- `title` (String, requis) - Titre de l'activité
- `description` (String) - Description courte
- `location` (String, requis) - Adresse ou nom de lieu
- `coordinates` (Object) - Coordonnées GPS
  - `type` (String) - "Point"
  - `coordinates` (Array) - [longitude, latitude]
- `mood` (String) - Humeur ciblée (ex: "calm", "social", "energetic")
- `nb_people` (Number) - Nombre de personnes idéal
- `price_range` (Number, 0-3) - 0 = gratuit, 3 = élevé
- `age_range` (String) - Tranche d'âge recommandée
- `hours` (Number) - Durée approximative (en minutes)
- `day` (String) - Jours disponibles
- `user_id` (ObjectId, nullable) - Référence au créateur
- `source` (String) - "user" ou "google"
- `created_at` (Date) - Date de création

**Index:**
- `coordinates` en 2dsphere pour les recherches géospatiales
- Index texte sur `title` et `description`

---

### 3. ReviewActivity
Commentaires et notations sur les activités.

**Attributs:**
- `id` (ObjectId) - Identifiant unique
- `activity_id` (ObjectId, requis) - Référence à l'activité
- `user_id` (ObjectId, requis) - Référence à l'auteur
- `comment` (String) - Texte du commentaire
- `ranking` (Number, 1-5, requis) - Note attribuée
- `pictures` (Array[String]) - URLs des images
- `created_at` (Date) - Date de publication

---

### 4. UserActivityList
Listes d'activités (historique, favoris, listes personnalisées).

**Attributs:**
- `id` (ObjectId) - Identifiant unique
- `user_id` (ObjectId, requis) - Référence à l'utilisateur
- `activity_id` (ObjectId, requis) - Référence à l'activité
- `list_type` (String, requis) - "history", "liked" ou "custom"
- `custom_name` (String) - Nom de la liste (si list_type = "custom")
- `created_at` (Date) - Date d'ajout

---

## Endpoints

### Authentication

#### POST /auth/register
Créer un nouveau compte utilisateur.

**Requête:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "gender": "male"
}
```

**Réponse:** `201 Created`
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2025-11-05T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Erreurs:**
- `400` - Données invalides ou email déjà utilisé
- `500` - Erreur serveur

---

#### POST /auth/login
Se connecter et obtenir un token JWT.

**Requête:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Réponse:** `200 OK`
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "johndoe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Erreurs:**
- `401` - Email ou mot de passe incorrect
- `500` - Erreur serveur

---

#### GET /auth/me
Obtenir les informations de l'utilisateur connecté.

**Headers:** `Authorization: Bearer <token>`

**Réponse:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "username": "johndoe",
  "email": "john@example.com",
  "gender": "male",
  "avatar": "https://example.com/avatar.jpg",
  "nb_reviews": 5,
  "role": "user",
  "created_at": "2025-11-05T10:30:00Z"
}
```

**Erreurs:**
- `401` - Token manquant ou invalide
- `404` - Utilisateur non trouvé

---

### Users

#### GET /users/:id
Récupérer le profil d'un utilisateur.

**Paramètres:**
- `id` (path) - ID de l'utilisateur

**Réponse:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "username": "johndoe",
  "avatar": "https://example.com/avatar.jpg",
  "nb_reviews": 5,
  "created_at": "2025-11-05T10:30:00Z"
}
```

**Erreurs:**
- `404` - Utilisateur non trouvé

---

#### PATCH /users/:id
Modifier son propre profil (ou profil d'un autre si admin).

**Headers:** `Authorization: Bearer <token>`

**Paramètres:**
- `id` (path) - ID de l'utilisateur

**Requête:**
```json
{
  "username": "newusername",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Réponse:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "username": "newusername",
  "email": "john@example.com",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Erreurs:**
- `401` - Non authentifié
- `403` - Non autorisé (pas le propriétaire ni admin)
- `404` - Utilisateur non trouvé

---

#### DELETE /users/:id
Supprimer un utilisateur (admin uniquement).

**Headers:** `Authorization: Bearer <token>`

**Paramètres:**
- `id` (path) - ID de l'utilisateur

**Réponse:** `204 No Content`

**Erreurs:**
- `401` - Non authentifié
- `403` - Non autorisé (non admin)
- `404` - Utilisateur non trouvé

---

### Activities

#### GET /activities
Lister les activités avec filtres et pagination.

**Query Parameters:**
- `page` (number, default: 1) - Numéro de page
- `limit` (number, default: 10) - Nombre d'items par page
- `q` (string) - Recherche textuelle
- `mood` (string) - Filtrer par humeur (ex: "calm", "social")
- `price_max` (number, 0-3) - Prix maximum
- `day` (string) - Jour de la semaine
- `nb_people` (number) - Nombre de personnes
- `age_range` (string) - Tranche d'âge
- `source` (string) - "user" ou "google"

**Réponse:** `200 OK`
```json
{
  "page": 1,
  "limit": 10,
  "total": 37,
  "items": [
    {
      "id": "507f1f77bcf86cd799439012",
      "title": "Balade au parc",
      "description": "Profitez d'une promenade relaxante",
      "location": "Parc de Mon Repos, Lausanne",
      "coordinates": {
        "type": "Point",
        "coordinates": [6.6323, 46.5197]
      },
      "mood": "calm",
      "price_range": 0,
      "hours": 60,
      "source": "user",
      "created_at": "2025-11-05T09:00:00Z"
    }
  ]
}
```

---

#### GET /activities/:id
Récupérer les détails d'une activité.

**Paramètres:**
- `id` (path) - ID de l'activité

**Réponse:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439012",
  "title": "Balade au parc",
  "description": "Profitez d'une promenade relaxante dans un cadre naturel",
  "location": "Parc de Mon Repos, Lausanne",
  "coordinates": {
    "type": "Point",
    "coordinates": [6.6323, 46.5197]
  },
  "mood": "calm",
  "nb_people": 2,
  "price_range": 0,
  "age_range": "all",
  "hours": 60,
  "day": "everyday",
  "user_id": "507f1f77bcf86cd799439011",
  "source": "user",
  "created_at": "2025-11-05T09:00:00Z"
}
```

**Erreurs:**
- `404` - Activité non trouvée

---

#### POST /activities
Créer une nouvelle activité (authentification requise).

**Headers:** `Authorization: Bearer <token>`

**Requête:**
```json
{
  "title": "Cours de yoga",
  "description": "Séance de yoga pour tous niveaux",
  "location": "Studio Zen, Lausanne",
  "coordinates": {
    "type": "Point",
    "coordinates": [6.6323, 46.5197]
  },
  "mood": "calm",
  "nb_people": 10,
  "price_range": 2,
  "age_range": "adult",
  "hours": 90,
  "day": "monday,wednesday,friday"
}
```

**Réponse:** `201 Created`
```json
{
  "id": "507f1f77bcf86cd799439013",
  "title": "Cours de yoga",
  "user_id": "507f1f77bcf86cd799439011",
  "source": "user",
  "created_at": "2025-11-05T14:30:00Z",
  ...
}
```

**Erreurs:**
- `400` - Données invalides
- `401` - Non authentifié

---

#### PATCH /activities/:id
Modifier une activité (propriétaire ou admin).

**Headers:** `Authorization: Bearer <token>`

**Paramètres:**
- `id` (path) - ID de l'activité

**Requête:**
```json
{
  "title": "Cours de yoga avancé",
  "price_range": 3
}
```

**Réponse:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439013",
  "title": "Cours de yoga avancé",
  "price_range": 3,
  ...
}
```

**Erreurs:**
- `401` - Non authentifié
- `403` - Non autorisé
- `404` - Activité non trouvée

---

#### DELETE /activities/:id
Supprimer une activité (propriétaire ou admin).

**Headers:** `Authorization: Bearer <token>`

**Paramètres:**
- `id` (path) - ID de l'activité

**Réponse:** `204 No Content`

**Erreurs:**
- `401` - Non authentifié
- `403` - Non autorisé
- `404` - Activité non trouvée

---

#### GET /activities/near
Rechercher des activités à proximité (géolocalisation).

**Query Parameters:**
- `lng` (number, requis) - Longitude
- `lat` (number, requis) - Latitude
- `radius` (number, default: 5000) - Rayon en mètres
- `limit` (number, default: 10) - Nombre d'items

**Réponse:** `200 OK`
```json
{
  "items": [
    {
      "id": "507f1f77bcf86cd799439012",
      "title": "Balade au parc",
      "location": "Parc de Mon Repos, Lausanne",
      "distance": 1250.5,
      "coordinates": {
        "type": "Point",
        "coordinates": [6.6323, 46.5197]
      },
      ...
    }
  ]
}
```

**Erreurs:**
- `400` - Coordonnées invalides

---

#### GET /activities/stats/by-mood
Statistiques d'activités par humeur (agrégation).

**Réponse:** `200 OK`
```json
{
  "stats": [
    {
      "_id": "calm",
      "count": 45,
      "avgPrice": 1.2
    },
    {
      "_id": "social",
      "count": 32,
      "avgPrice": 2.1
    }
  ]
}
```

---

#### GET /activities/stats/by-user
Statistiques d'activités créées par utilisateur.

**Réponse:** `200 OK`
```json
{
  "stats": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "username": "johndoe",
      "count": 12
    }
  ]
}
```

---

### Reviews

#### POST /activities/:id/reviews
Ajouter une review à une activité (authentification requise).

**Headers:** `Authorization: Bearer <token>`

**Paramètres:**
- `id` (path) - ID de l'activité

**Requête:**
```json
{
  "comment": "Excellente activité, très relaxante!",
  "ranking": 5,
  "pictures": [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg"
  ]
}
```

**Réponse:** `201 Created`
```json
{
  "id": "507f1f77bcf86cd799439014",
  "activity_id": "507f1f77bcf86cd799439012",
  "user_id": "507f1f77bcf86cd799439011",
  "comment": "Excellente activité, très relaxante!",
  "ranking": 5,
  "pictures": ["https://example.com/photo1.jpg"],
  "created_at": "2025-11-05T15:00:00Z"
}
```

**Erreurs:**
- `400` - Données invalides ou activité inexistante
- `401` - Non authentifié
- `404` - Activité non trouvée

---

#### GET /activities/:id/reviews
Lister toutes les reviews d'une activité.

**Paramètres:**
- `id` (path) - ID de l'activité

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)

**Réponse:** `200 OK`
```json
{
  "page": 1,
  "limit": 10,
  "total": 5,
  "items": [
    {
      "id": "507f1f77bcf86cd799439014",
      "user": {
        "id": "507f1f77bcf86cd799439011",
        "username": "johndoe"
      },
      "comment": "Excellente activité!",
      "ranking": 5,
      "created_at": "2025-11-05T15:00:00Z"
    }
  ]
}
```

---

#### DELETE /reviews/:id
Supprimer sa propre review (propriétaire ou admin).

**Headers:** `Authorization: Bearer <token>`

**Paramètres:**
- `id` (path) - ID de la review

**Réponse:** `204 No Content`

**Erreurs:**
- `401` - Non authentifié
- `403` - Non autorisé
- `404` - Review non trouvée

---

### Lists (UserActivityList)

#### POST /activities/:id/like
Ajouter une activité aux favoris.

**Headers:** `Authorization: Bearer <token>`

**Paramètres:**
- `id` (path) - ID de l'activité

**Réponse:** `201 Created`
```json
{
  "id": "507f1f77bcf86cd799439015",
  "user_id": "507f1f77bcf86cd799439011",
  "activity_id": "507f1f77bcf86cd799439012",
  "list_type": "liked",
  "created_at": "2025-11-05T16:00:00Z"
}
```

**Erreurs:**
- `400` - Activité déjà dans les favoris
- `401` - Non authentifié
- `404` - Activité non trouvée

---

#### DELETE /activities/:id/like
Retirer une activité des favoris.

**Headers:** `Authorization: Bearer <token>`

**Paramètres:**
- `id` (path) - ID de l'activité

**Réponse:** `204 No Content`

**Erreurs:**
- `401` - Non authentifié
- `404` - Activité non trouvée dans les favoris

---

#### GET /me/activities/history
Récupérer l'historique de ses activités consultées.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)

**Réponse:** `200 OK`
```json
{
  "page": 1,
  "limit": 10,
  "total": 8,
  "items": [
    {
      "id": "507f1f77bcf86cd799439012",
      "title": "Balade au parc",
      "viewed_at": "2025-11-05T14:30:00Z"
    }
  ]
}
```

---

#### GET /me/activities/liked
Récupérer ses activités favorites.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)

**Réponse:** `200 OK`
```json
{
  "page": 1,
  "limit": 10,
  "total": 3,
  "items": [
    {
      "id": "507f1f77bcf86cd799439012",
      "title": "Balade au parc",
      "liked_at": "2025-11-05T16:00:00Z"
    }
  ]
}
```

---

#### POST /me/activities/custom
Créer ou ajouter une activité à une liste personnalisée.

**Headers:** `Authorization: Bearer <token>`

**Requête:**
```json
{
  "activity_id": "507f1f77bcf86cd799439012",
  "custom_name": "Weekend activities"
}
```

**Réponse:** `201 Created`
```json
{
  "id": "507f1f77bcf86cd799439016",
  "user_id": "507f1f77bcf86cd799439011",
  "activity_id": "507f1f77bcf86cd799439012",
  "list_type": "custom",
  "custom_name": "Weekend activities",
  "created_at": "2025-11-05T17:00:00Z"
}
```

---

#### GET /me/activities/custom
Récupérer les activités d'une liste personnalisée.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `name` (string, requis) - Nom de la liste
- `page` (number, default: 1)
- `limit` (number, default: 10)

**Réponse:** `200 OK`
```json
{
  "list_name": "Weekend activities",
  "page": 1,
  "limit": 10,
  "total": 5,
  "items": [
    {
      "id": "507f1f77bcf86cd799439012",
      "title": "Balade au parc",
      "added_at": "2025-11-05T17:00:00Z"
    }
  ]
}
```

---

### Recommendations

#### GET /recommendations
Obtenir des recommandations d'activités personnalisées.

**Query Parameters:**
- `lng` (number, requis) - Longitude
- `lat` (number, requis) - Latitude
- `mood` (string) - Humeur actuelle
- `nb_people` (number) - Nombre de personnes
- `price_max` (number, 0-3) - Budget maximum
- `hours` (number) - Durée disponible (en minutes)
- `day` (string) - Jour de la semaine
- `radius` (number, default: 5000) - Rayon de recherche en mètres

**Réponse:** `200 OK`
```json
{
  "recommendations": [
    {
      "id": "507f1f77bcf86cd799439012",
      "title": "Balade au parc",
      "score": 95.5,
      "distance": 1250.5,
      "mood": "calm",
      "price_range": 0,
      "avg_ranking": 4.5,
      "nb_reviews": 12,
      "match_reasons": [
        "mood_match",
        "budget_match",
        "proximity"
      ]
    }
  ]
}
```

**Erreurs:**
- `400` - Paramètres invalides

---

## Codes de Statut HTTP

- `200 OK` - Requête réussie
- `201 Created` - Ressource créée avec succès
- `204 No Content` - Requête réussie sans contenu de retour
- `400 Bad Request` - Données invalides
- `401 Unauthorized` - Authentification requise ou token invalide
- `403 Forbidden` - Accès refusé (permissions insuffisantes)
- `404 Not Found` - Ressource non trouvée
- `500 Internal Server Error` - Erreur serveur

---

## Format des Erreurs

Toutes les erreurs retournent un JSON au format suivant:

```json
{
  "error": "ValidationError",
  "message": "price_range must be between 0 and 3",
  "details": {
    "field": "price_range",
    "value": 5
  }
}
```

---

## Pagination

Toutes les listes utilisent le même format de pagination:

**Query Parameters:**
- `page` (number, default: 1) - Numéro de page
- `limit` (number, default: 10, max: 100) - Items par page

**Format de réponse:**
```json
{
  "page": 1,
  "limit": 10,
  "total": 37,
  "items": [...]
}
```

---

## Opérateurs Spéciaux

### Recherche Géospatiale
- Utilise l'opérateur MongoDB `$geoNear` pour les recherches de proximité
- Index 2dsphere requis sur le champ `coordinates`
- Distance retournée en mètres

### Recherche Textuelle
- Index texte sur `title` et `description`
- Utilise l'opérateur `$text` avec `$search`
- Paramètre `q` dans la query string

### Agrégations
- Statistiques par mood, price_range, source
- Comptage d'activités par utilisateur
- Calcul de moyennes (prix, rankings)

---

## Limites et Quotas

- **Rate Limiting:** 100 requêtes par minute par IP
- **Pagination max:** 100 items par page
- **Upload d'images:** 5MB maximum par image (reviews)
- **Nombre de photos par review:** 10 maximum
- **Rayon de recherche géographique:** 50km maximum

---

## Notes de Sécurité

- Les mots de passe sont hachés avec bcrypt
- Les tokens JWT expirent après 7 jours
- Les coordonnées GPS ne sont jamais exposées pour les utilisateurs
- Les routes admin nécessitent le rôle "admin"
- Validation stricte de toutes les entrées utilisateur

---

## Ressources Externes

### APIs Tierces Utilisées

**Geoapify Places API:**
- Utilisée pour importer des activités (endpoint `/external-activities/geoapify`)
- Quota: dépend de l'offre Geoapify

**Open-Meteo API:**
- Utilisée pour afficher la météo dans l'interface
- Quota: dépend de l'offre Open-Meteo
