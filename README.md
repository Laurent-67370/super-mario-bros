# 🍄 Super Mario Bros — Clone HTML5

Un clone fidèle et complet de Super Mario Bros, en HTML5 Canvas pur. Aucune dépendance externe, aucune image, aucun build — juste un fichier HTML à ouvrir dans un navigateur.

![Plateforme](https://img.shields.io/badge/plateforme-Web%20%2F%20Mobile-blue)
![Technologie](https://img.shields.io/badge/tech-HTML5%20Canvas-orange)
![Dépendances](https://img.shields.io/badge/d%C3%A9pendances-0-green)

## ▶️ Jouer

**En ligne :** https://mario.lhusser.fr

**En local :**
```bash
# Télécharger et ouvrir
git clone https://github.com/Laurent-67370/super-mario-bros.git
cd super-mario-bros
# Ouvrir index.html dans un navigateur — c'est tout !
```

Aucun build, aucun serveur requis. Double-clique sur `index.html` et joue.

---

## 🎮 Contrôles

### Clavier

| Action | Touches |
|--------|---------|
| Se déplacer | ← → (ou Q / D) |
| Sauter (maintiens pour sauter plus haut) | ESPACE, ↑ ou Z |
| Courir / Tirer du feu 🔥 | MAJ ou X |
| S'accroupir | ↓ ou S |
| Pause | ÉCHAP ou P |
| Plein écran | F |

### Mobile (tactile)

Boutons tactiles en bas de l'écran, avec vibration haptique et retour visuel :

| Bouton | Fonction | Couleur |
|--------|----------|---------|
| ◀ ▶ | Déplacement gauche/droite | Bleu |
| ⏸ | Pause | Gris |
| ⛶ | Plein écran | Vert |
| 🔥 | Tirer des boules de feu | Orange |
| A | Sauter | Jaune |

---

## 🎯 Gameplay

### États de Mario

| État | Effet | Obtenu avec |
|------|-------|-------------|
| Petit Mario | 1 hit = mort | État initial |
| Grand Mario | 1 hit = redevient petit, peut casser les briques | 🍄 Champignon |
| Fire Mario | Idem Grand + tire des boules de feu | 🌸 Fleur de feu |
| Invincible | Invincible 10 secondes | ⭐ Étoile |

### Objets

| Objet | Effet |
|-------|-------|
| 🪙 Pièce | +200 pts — 100 pièces = 1 vie |
| 🍄 Champignon | Devient Grand Mario |
| 🌸 Fleur de feu | Devient Fire Mario |
| ⭐ Étoile | Invincible 10 secondes |
| 1-UP | +1 vie |

### Ennemis

| Ennemi | Comportement | Comment le vaincre |
|--------|-------------|-------------------|
| 🟤 Goomba | Marche en ligne droite | Sauter dessus |
| 🐢 Koopa Troopa | Marche, se replie en carapace si écrasé | Sauter dessus puis botter la carapace |
| 🦋 Papillon volant | Vole en zigzag | Sauter dessus en l'air |
| 🟣 Piquant | NE PAS sauter dessus ! | Boule de feu ou carapace |
| 🌺 Plante carnivore | Sort/rentre d'un tuyau | Boule de feu ou écrasement par le haut |
| 👑 Rex (Boss) | Boss de château, lance des boules de feu | Boules de feu ou couper le pont à la hache |

### Mécaniques

- **Saut variable** : maintiens la touche de saut pour sauter plus haut
- **Écrasement** : sauter sur un ennemi par le haut l'écrase (sauf les piquants)
- **Carapace** : écrase un Koopa → sa carapace reste au sol → botte-la pour la faire glisser et éliminer d'autres ennemis
- **Casse-briques** : Grand Mario peut casser les briques en frappant par le dessous
- **Blocs ?** : frappe par le dessous pour libérer pièces, champignons, fleurs ou 1-UP
- **Checkpoints** : un drapeau au milieu de chaque niveau
- **Mât de fin** : attrape le mât le plus HAUT possible pour plus de points
- **Système d'étoiles** : 3 étoiles par niveau (finir / toutes les pièces / sans mourir)

---

## 🗺 Niveaux

3 mondes, 12 niveaux, un boss par château :

### Monde 1 — Plaines
| Niveau | Nom | Thème |
|--------|-----|-------|
| 1-1 | Prairie ensoleillée | Plaine |
| 1-2 | Collines et tuyaux | Plaine |
| 1-3 | Îles du ciel | Ciel |
| 1-4 | Château de Rex 👑 | Château (Boss) |

### Monde 2 — Souterrain
| Niveau | Nom | Thème |
|--------|-----|-------|
| 2-1 | Galerie aux trésors | Souterrain |
| 2-2 | Le grand puits | Souterrain |
| 2-3 | Traversée ardente | Souterrain |
| 2-4 | Bastion de Rex 👑 | Château (Boss) |

### Monde 3 — Ciel
| Niveau | Nom | Thème |
|--------|-----|-------|
| 3-1 | Aurore dorée | Ciel |
| 3-2 | Retour aux sources | Plaine |
| 3-3 | L'ascension finale | Ciel |
| 3-4 | Le Grand Château 👑 | Château (Boss) |

---

## 🎵 Audio

Tous les sons et la musique sont générés en temps réel via la **Web Audio API** (oscillateurs) — aucun fichier audio externe.

| Son | Déclencheur |
|-----|-----------|
| Saut | Touche de saut |
| Pièce | Collecte d'une pièce |
| Écrasement | Ennemi écrasé |
| Power-up | Champignon, fleur, étoile |
| Boule de feu | Tir de boule de feu |
| Mort | Perte de dernière vie |
| Niveau complet | Attrapage du mât |
| Casse de brique | Brique détruite |
| Cogne | Coup de pied dans carapace |

Une mélodie de fond inspirée du thème Mario tourne en boucle pendant le jeu.

---

## 🏗 Architecture

```
super-mario-bros/
├── index.html          # Structure HTML + écrans (titre, pause, aide, etc.)
├── style.css           # Styles, responsive, contrôles tactiles, plein écran
├── js/
│   ├── audio.js        # Web Audio API : sons + musique
│   ├── levels.js       # Définition des 12 niveaux (cartes en ASCII)
│   ├── entities.js     # Entités : Goomba, Koopa, Plante, Rex, BouleFeu, etc.
│   ├── player.js       # Logique du joueur (Mario)
│   ├── game.js         # Moteur de jeu : physique, collisions, rendu, caméra
│   └── main.js         # Point d'entrée : inputs, boucle principale, UI
└── index_monolithe_backup.html  # Version monolithe originale (backup)
```

### Technologies

- **HTML5 Canvas** — rendu pixel-art 100% code (aucune image)
- **JavaScript vanilla** — aucun framework, aucune bibliothèque
- **Web Audio API** — sons et musique générés par oscillateurs
- **Fullscreen API** — mode plein écran natif
- **Vibration API** — haptique sur mobile
- **localStorage** — sauvegarde de la progression (étoiles, scores)

---

## 📱 Responsive & Mobile

- Détection automatique mobile (`pointer: coarse`)
- Boutons tactiles avec couleurs par fonction, halo lumineux et vibration
- Mode plein écran optimisé pour le format paysage
- Ratio 30:17 conservé sur tous les écrans

---

## 🚀 Déploiement

Le jeu est déployé sur le VPS lhusser.fr :

```bash
# Copier les fichiers
cp -r . /var/www/mario/

# Config nginx (mario.lhusser.fr)
# Voir /etc/nginx/sites-available/mario.lhusser.fr

# Certificat SSL
certbot --nginx -d mario.lhusser.fr
```

**URL :** https://mario.lhusser.fr

---

## 🔧 Développé avec

- **OpenCode CLI** (https://opencode.ai) — agent de codage IA autonome
- **Modèle :** `stealth/ox-alpha` via OpenRouter (gratuit, 1M contexte)
- **Orchestration :** Hermes Agent (Nous Research)

---

## 📄 Licence

MIT — Libre d'utilisation et de modification.

---

## 👤 Auteur

**Laurent Husser** — [GitHub](https://github.com/Laurent-67370)

Jeu inspiré de *Super Mario Bros* (Nintendo, 1985). Ce projet est un clone non-commercial à but éducatif. Mario et tous les personnages associés sont des marques déposées de Nintendo.