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

<<<<<<< HEAD
## Analyse de draft

L'analyse s'appuie sur une fiche par champion écrite à la main dans [src/lib/profiles.js](src/lib/profiles.js) : type de dégâts, moment fort et traits (frontline, engage, plongée, réception…). Corrige une fiche si tu n'es pas d'accord. Les styles de jeu sont dans [src/lib/draft.js](src/lib/draft.js), les compos de référence pro dans [src/lib/proDrafts.js](src/lib/proDrafts.js).

## Méta du moment

[src/data/meta.json](src/data/meta.json) contient :

- la méta soloQ du patch en cours (OP.GG) : tier, winrate et pickrate de chaque champion à chaque poste ;
- les drafts pro récentes des compétitions majeures (Leaguepedia), qui servent d'exemples pour chaque style.

L'app s'en sert pour signaler les picks en retrait et proposer des champions plus forts qui remplissent la même fonction. Elle se met à jour toute seule le lundi et le jeudi (GitHub Action « Méta du moment », qui commit sur `main`), ou à la main :

```bash
npm run meta              # soloQ + pro (jusqu'à quelques minutes : Leaguepedia limite les requêtes)
npm run meta -- --no-pro  # soloQ seulement, quelques secondes
```

OP.GG et Leaguepedia ne sont pas des API officielles : si l'une ne répond plus, ses données précédentes sont gardées.
=======
>>>>>>> 1d1a3bd (Remove Vercel deployment instructions)
