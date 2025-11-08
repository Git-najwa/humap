# HUMAP — API RESTful d'activités locales selon l’humeur

**HUMAP** est une application mobile connectée à une API RESTful qui recommande des **activités locales personnalisées** en fonction de :

- l’**humeur** de l’utilisateur (ex. : calme, sociable…),
- son **contexte** (budget, durée, nombre de personnes, etc.),
- sa **géolocalisation**,
- et ses **préférences passées**.

Cette API permet de gérer les utilisateurs, les activités (créées ou importées via l'API Google), les avis (reviews) et des listes personnalisées (favoris, historiques, etc.).

---

## Technologies

- Node.js & Express  
- MongoDB & Mongoose  
- JWT (authentification)  
- Swagger (documentation)  
- Render (déploiement)

## Fonctionnalités principales de l’API

- Authentification sécurisée (JWT)
- Création, modification et suppression d’activités
- Filtres avancés (humeur, budget, âge, etc.)
- Gestion des avis utilisateurs
- Listes personnalisées : favoris, historiques, etc.
- Pagination & agrégation
- Rôles utilisateur : `user` et `admin`

---
## Documentation API

👉 [Voir la documentation API](https://github.com/Git-najwa/humap/blob/main/docs/humap_api_doc.md)

---

