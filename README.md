# teambuilder-lol

Petit outil pour préparer les compos de notre équipe pour le tournoi LoL.

- **Joueurs** : chacun renseigne ses rôles (par ordre de préférence) et son pool de champions par rôle.
- **Compos** : on assemble des compos (joueur + champion par rôle) avec des notes (win condition, bans…).
- Les données sont partagées et se mettent à jour en temps réel pour tout le monde.

Stack : React + Vite + Tailwind, Supabase (base de données), champions et icônes via Data Dragon (Riot).

## Installation

### 1. Supabase (une seule fois)

1. Crée un projet gratuit sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, colle le contenu de [supabase/schema.sql](supabase/schema.sql) et clique sur **Run**.
3. Dans **Project Settings > API**, récupère l'URL du projet et la clé `anon` `public`.

### 2. En local

```bash
cp .env.example .env   # puis remplis les deux variables
npm install
npm run dev
```

