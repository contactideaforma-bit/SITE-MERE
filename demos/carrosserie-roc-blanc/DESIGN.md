# Design — Carrosserie Roc Blanc (démo)

<!-- impeccable:design-schema 1 -->

## Monde

La plaque d'immatriculation française (SIV). Chaque section est une plaque vue de face : bande bleue à gauche qui porte le titre, champ blanc rétro-réfléchissant qui porte le contenu, bande bleue à droite qui porte l'information clé (prix, délai, horaires), quatre vis dans les coins. Le premier écran est une plaque géante dont le champ est le vrai champ de saisie : on tape sa plaque, on part au devis.

## Couleurs

- `--blue #1D3E9C` bandes, étapes, boutons secondaires ; `--blue-deep #16307C` survol.
- `--field #F6F7F3` → `--field-2 #E9EBE4` champ de la plaque (dégradé 168° « reflet »).
- `--ground #DADDD5` fond de page (béton clair) : les plaques se détachent par leur blanc.
- `--yellow #F5C400` (ancienne plaque arrière) : l'action primaire et le focus clavier uniquement ; `--yellow-deep #D9AD00` survol.
- `--ink #111318` lettrage ; `--ink-soft #3C4250` texte secondaire. Jamais de gris neutre sur fond bleu : `--blue-text #D7DEF5`.
- États : ouvert `#1E8E3E`, fermé `#B42318`.

## Typographie

- Titres, lettrages, prix, boutons : **Saira Condensed** 600/700, capitales, interlettrage 0.04–0.1em, embossage `text-shadow: 0 1px 0 #fff, 0 -1px 0 rgba(0,0,0,.25)`.
- Lecture : **Atkinson Hyperlegible** 400/700, 1.02rem, interligne 1.55, mesure ≤ 72ch.
- Chiffres tabulaires partout (`font-variant-numeric: tabular-nums`).
- Interdit : étiquette au-dessus d'un titre (kicker), gris sur bleu, emoji en guise d'icône.

## Composants

- `.plate` : grille `band | field | band`, bord 1.5px `--ink`, rayon 14px, ombre portée décalée (`0 14px 22px -16px`), vis en fond radial (`.screws`).
- `.band--l` (h2, vertical sur desktop, horizontal en haut sur mobile), `.band--r` (info, `--blue-text`).
- `.plaque` : bouton-plaquette (bord 1.5px, rayon 7px, jaune ou bleu), icône SVG 1.8 de trait.
- `.price` : mini-plaque blanche « dès 59 € » ; `.price--quote` bleue « sur devis ».
- `.mini-plate` : champ immatriculation du formulaire (F | AB-123-CD | 13).
- `.ba` : comparateur avant/après, poignée en tête de vis.
- `.mplate` (mobile < 900px) : plaque fixe en bas — bande bleue Appeler | texte + statut | bouton jaune Devis photo.

## Mouvement

Un seul moment : la plaque se pose (`plate-in`, 0.9s, `cubic-bezier(.16,1,.3,1)`) et les mots du titre montent en cascade. Aucun effet de révélation au défilement. Survols : translation de 2px et changement de ton, flèche qui avance de 5px.

## Surfaces du navigateur

Sélection bleue/blanc, caret bleu, focus jaune 3px décalé de 3px, barre de défilement bleue sur fond béton.
