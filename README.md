# MyEasyDev — Site vitrine + book de démonstration

Site vitrine "mère" présentant MyEasyDev, avec 3 sites de démonstration factices pour montrer
le savoir-faire à des prospects (petits commerçants, artisans).

Aucune dépendance, aucun outil de build : HTML / CSS / JS natifs. Ouvre, modifie, déploie.

## Structure

```
index.html                     → Site MyEasyDev (offre, tarifs, réalisations, contact) — Newsreader + Familjen Grotesk via Google Fonts
mentions-legales.html          → Mentions légales du site MyEasyDev (à compléter : SIRET, adresse...)
confidentialite.html           → Politique de confidentialité / cookies
robots.txt / sitemap.xml       → SEO de base (le dossier /demos/ est exclu de l'indexation)
404.html                       → Page d'erreur personnalisée

assets/
  css/myeasydev.css            → Feuille de style du site MyEasyDev (index, mentions légales, confidentialité)
  js/myeasydev.js              → Menu, aperçus des réalisations, calculateur de tarifs, formulaire mailto
  css/base.css                 → Fondations partagées des démos et de la 404 (reset, layout, boutons, header, footer...)
  css/mother.css               → Ancien thème du site mère (encore utilisé par 404.html)
  css/provence.css             → Thème démo Pizzeria Lou Soleï (provençal)
  css/italien.css              → Thème démo Pizzeria Da Enzo (italien)
  css/beaute.css                → Thème démo Salon Émeraude (esthétique)
  js/main.js                   → Menu mobile, bannière cookies, formulaires de démo (aucun tracker)
  img/favicon.svg

pizza-al-dente/                → Maquette client : Pizza al dente (Le Rove), non indexée
mairie-le-rove/                → Maquette client : Mairie du Rove (refonte de lerove.fr), non indexée
                                 index.html + mairie.css + mairie.js + mentions-legales.html
sushi-tys/                     → Maquette client : Sushi Ty's (Septèmes-les-Vallons), non indexée
                                 index.html + sushi.css + sushi.js + mentions-legales.html
auberge-du-merou/              → Maquette client : Auberge du Mérou (calanque de Niolon, Le Rove), non indexée
                                 index.html + merou.css + merou.js + mentions-legales.html
pizza-maracana/                → Maquette client : Pizza Maracana (chemin de Gibbes, Marseille 14e), non indexée
                                 index.html + maracana.css + maracana.js + mentions-legales.html
ecurie-du-faraon/              → Maquette client : Écurie du Faraon (centre équestre, Gignac-la-Nerthe), non indexée
                                 index.html + faraon.css + faraon.js + mentions-legales.html
pas-des-lanciers/              → Maquette client : Centre Équestre Pas des Lanciers (Marignane), non indexée
                                 index.html + lanciers.css + lanciers.js + mentions-legales.html
espace-gala/                   → Maquette client : Espace Gala, salle de réception (Gignac-la-Nerthe / Marignane), non indexée
                                 index.html + gala.css + gala.js + mentions-legales.html
gites-du-resquiadou/           → Maquette client : Gîtes du Resquiadou (Le Rove, Côte Bleue), non indexée
                                 index.html + resquiadou.css + resquiadou.js + mentions-legales.html
gignac-conduite/               → Maquette client : Auto-École Gignac Conduite (Gignac-la-Nerthe), non indexée
                                 index.html + gignac.css + gignac.js + mentions-legales.html
sud-carrosserie/               → Maquette client : Sud Carrosserie (Marignane), non indexée
garage-septemes/               → Maquette client : Garage Septèmes (carrosserie & peinture, Septèmes-les-Vallons), non indexée
kalm-by-night/                 → Maquette client : Kalm by Night (livraison de nuit, Vitrolles / Marseille), non indexée
                                 index.html + sud.css + sud.js + mentions-legales.html

demos/
  carrosserie-roc-blanc/         → Démo : carrosserie indépendante fictive (devis photo, sinistre, avant/après)
                                 index.html + rocblanc.css + rocblanc.js + mentions-legales.html
  pizzeria-provencale/index.html + mentions-legales.html
  pizzeria-italienne/index.html  + mentions-legales.html
  salon-esthetique/index.html    + mentions-legales.html
```

Chaque démo a son propre header/footer et sa propre identité (police, couleurs), et affiche un
bandeau rappelant qu'il s'agit d'un site fictif, avec un lien de retour vers le site MyEasyDev.

## Avant mise en ligne publique

Deux points à compléter dans `mentions-legales.html` (site mère) :

- Raison sociale, statut, SIRET, adresse du siège (marqués `à compléter`)
- Garder uniquement la mention de l'hébergeur réellement utilisé (Vercel **ou** Netlify)

Les formulaires de contact sont volontairement désactivés (aucun backend) : ils affichent un
message de confirmation factice. Pour les rendre fonctionnels, brancher un service comme
Netlify Forms, Formspree, ou une fonction serverless, puis mettre à jour la politique de
confidentialité en conséquence.

## Prévisualiser en local

Pas besoin d'installation. Dans VS Code :

- Extension **Live Server** → clic droit sur `index.html` → "Open with Live Server", ou
- Terminal : `npx serve .` ou `python3 -m http.server 8080`, puis ouvrir `http://localhost:8080`

Les chemins sont en racine absolue (`/assets/...`) : sers toujours le dossier depuis sa racine
(pas un sous-dossier), sinon les styles ne se chargeront pas.

## Déployer

### Option Vercel

1. Créer un compte sur vercel.com et installer la CLI : `npm i -g vercel`
2. Depuis ce dossier : `vercel` (puis `vercel --prod` pour la mise en production)
3. Aucun "build command" à renseigner : Vercel sert les fichiers statiques tels quels

`vercel.json` est déjà configuré (en-têtes de sécurité, URLs avec slash final).

### Option Netlify

1. Créer un compte sur netlify.com et installer la CLI : `npm i -g netlify-cli`
2. Depuis ce dossier : `netlify deploy` (puis `netlify deploy --prod`)
3. Ou glisser-déposer le dossier dans l'interface Netlify ("Deploys" → drag & drop)

`netlify.toml` est déjà configuré (`publish = "."`, en-têtes de sécurité, page 404).

## Mettre en ligne sur GitHub puis connecter Vercel/Netlify

Voir le bloc de commandes fourni dans la conversation pour initialiser Git et pousser ce projet
vers un nouveau dépôt GitHub. Une fois poussé, connecter le dépôt depuis le tableau de bord
Vercel ou Netlify pour un déploiement automatique à chaque `git push`.

## Typographie : un couple de polices par univers

Aucune police « par défaut » d'outil (Inter, Fraunces, Bricolage…) : chaque site a son propre couple,
chargé depuis Google Fonts, pour un rendu travaillé et reconnaissable.

| Site                       | Titres          | Texte            |
|----------------------------|-----------------|------------------|
| MyEasyDev (site mère)      | Newsreader      | Familjen Grotesk |
| Auberge du Mérou           | Castoro         | Hanken Grotesk   |
| Sushi Ty's                 | Gabarito        | Onest            |
| Mairie du Rove             | Petrona         | Mulish           |
| Pizza al dente             | Zilla Slab      | Karla            |
| Pizza Maracana             | Lilita One      | Red Hat Text     |
| Démo Carrosserie Roc Blanc | Saira Condensed | Atkinson Hyperlegible |
| Démo Pizzeria Lou Soleï    | Marcellus       | Figtree          |
| Démo Pizzeria Da Enzo      | Bodoni Moda     | Work Sans        |
| Démo Salon Émeraude        | Italiana        | Jost             |

Règle pour une nouvelle maquette : choisir un couple non encore utilisé, angles sobres (6–14 px, pas de
pilule), étiquettes en petites capitales espacées, filets fins plutôt que bordures épaisses.

## Impeccable (qualité de design)

Le skill [Impeccable](https://impeccable.style) de Paul Bakaus est installé dans le projet (`.claude/skills/impeccable`,
agents dans `.claude/agents`, hook dans `.claude/settings.json`). Dans Claude Code ou Cowork, ouvrir le dossier
du site et taper `/impeccable audit demos/…` ou `/impeccable polish …`. Le moteur se télécharge une fois au premier
lancement dans `~/.impeccable/bin/`. Les dossiers `.claude/` et `.impeccable/` sont exclus du déploiement (.vercelignore).

## Structure : un parti pris par site

Les sites ne doivent pas partager le même squelette (hero en deux colonnes + cartes). Chaque maquette
a sa propre construction :

- **Auberge du Mérou** — éditorial : couverture photo plein écran, colonnes de texte, carte typographique
  à points de conduite, grandes photos interstitielles, chiffres en marge, citation d'avis unique.
- **Sushi Ty's** — street : titre géant pleine largeur, bandeau défilant, photos façon polaroïds, rail de
  catégories collé à gauche + tuiles produit (comme une appli de commande), bande oblique, galerie défilante.
- **Carrosserie Roc Blanc** — la plaque d'immatriculation (SIV) : chaque section est une plaque (bande bleue
  gauche = titre vertical, champ blanc réfléchissant = contenu, bande bleue droite = info clé, quatre vis).
  Premier écran : une plaque géante qui est le vrai champ de saisie (AB-123-CD mis en forme en direct, synchronisé
  avec le formulaire de devis). Jaune des anciennes plaques arrière pour l'action. Lignes de prestations avec prix
  en mini-plaques, étapes sinistre numérotées, comparateur à poignée-vis, formulaire photo, atelier + plan.
  Mobile : bandes à l'horizontale (titre en haut, info en bas), plaque d'action fixe en bas (Appeler | statut |
  Devis photo), pas de barre d'onglets. Contexte Impeccable : demos/carrosserie-roc-blanc/PRODUCT.md et DESIGN.md.
- **Mairie du Rove** — portail civique : recherche en tête, accès rapides, démarches en vignettes, météo.
- **Pizza Maracana** — Brésil photographique : bannière plein écran (Pain de Sucre), en-tête transparent qui devient
  plein au défilement, bandeau drapeau « Vem comer ! », section commande sur photo voilée de vert, pizzas en « tickets »
  à encoches numérotés, galets photo. Images dans assets/img/maracana/.
  Mobile : pas de barre d'onglets — réglette à deux boutons (Appeler / Uber Eats), carte en accordéon par
  catégorie, étapes en frise verticale, chiffres clés en rangée qui défile.
- **Pizza al dente** — carte de pizzeria : liste à points de conduite, filtres, bandeau d'infos.
- **Garage Septèmes** — « le coffret noir » : fond noir laqué assumé (identité noir & or du prospect), filets d'or,
  chapitres en chiffres romains, poussière d'or animée (canvas) au premier écran, titre à reflet, bandeau défilant des
  prestations, trois plaques numérotées (Réparer · Protéger · Sublimer), carte de l'atelier en lignes pointillées
  dépliables, sceaux ronds (franchise, prêt, remorquage), comparateur avant / après à poignée d'or, frise sinistre en
  4 temps, avis Google, plan OSM sépia, devis photo avec immatriculation mise en forme. Photos Pexels d'illustration.
  Mobile : menu plein écran numéroté, pastille d'or fixe qui s'ouvre en éventail (Appeler / Devis photo / Itinéraire),
  frise verticale, pas de barre d'onglets.
