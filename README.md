# MyEasyDev — Site vitrine + book de démonstration

Site vitrine "mère" présentant IDEA, avec 3 sites de démonstration factices pour montrer
le savoir-faire à des prospects (petits commerçants, artisans).

Aucune dépendance, aucun outil de build : HTML / CSS / JS natifs. Ouvre, modifie, déploie.

## Structure

```
index.html                     → Site MyEasyDev (offre, tarifs, réalisations, contact) — Bricolage Grotesque via Google Fonts
mentions-legales.html          → Mentions légales du site IDEA (à compléter : SIRET, adresse...)
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

demos/
  pizzeria-provencale/index.html + mentions-legales.html
  pizzeria-italienne/index.html  + mentions-legales.html
  salon-esthetique/index.html    + mentions-legales.html
```

Chaque démo a son propre header/footer et sa propre identité (police, couleurs), et affiche un
bandeau rappelant qu'il s'agit d'un site fictif, avec un lien de retour vers le site IDEA.

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
