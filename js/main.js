const SAUVEGARDE = (() => {
  const CLE = 'smb_save_v1';
  let data = { deverrouille: 0, etoiles: {}, records: {}, meilleur: 0 };
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) data = Object.assign(data, JSON.parse(brut));
  } catch (e) {}
  function sauver() {
    try { localStorage.setItem(CLE, JSON.stringify(data)); } catch (e) {}
  }
  function apresNiveau(index, stats) {
    data.deverrouille = Math.max(data.deverrouille, index + 1);
    let et = 1;
    if (stats.totalPieces > 0 && stats.piecesNiveau >= stats.totalPieces) et++;
    if (stats.morts === 0) et++;
    data.etoiles[index] = Math.max(data.etoiles[index] || 0, et);
    data.records[index] = Math.max(data.records[index] || 0, stats.score);
    data.meilleur = Math.max(data.meilleur, stats.score);
    sauver();
  }
  function finPartie(score) {
    data.meilleur = Math.max(data.meilleur, score);
    sauver();
  }
  return { data, sauver, apresNiveau, finPartie };
})();
window.progression = SAUVEGARDE;

const jeu = new Jeu(document.getElementById('jeu'));
const ent = jeu.entrees;

const TOUCHES = {
  ArrowLeft: 'gauche', KeyA: 'gauche',
  ArrowRight: 'droite', KeyD: 'droite',
  ArrowDown: 'bas', KeyS: 'bas',
  ShiftLeft: 'courir', ShiftRight: 'courir', KeyX: 'courir',
};
const SAUT_CODES = ['Space', 'ArrowUp', 'KeyW', 'KeyZ'];

function montrer(id) {
  document.querySelectorAll('.ecran').forEach((el) => el.classList.remove('visible'));
  if (id) document.getElementById(id).classList.add('visible');
}

function toast(txt) {
  const t = document.getElementById('toast');
  t.textContent = txt;
  t.classList.add('visible');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('visible'), 2300);
}
window.toast = toast;

window.ecranFinal = function (victoire, score, pieces) {
  const titre = document.getElementById('final-titre');
  const stats = document.getElementById('final-stats');
  if (victoire) {
    titre.textContent = '🏆 FÉLICITATIONS !';
    stats.innerHTML = `Vous avez vaincu Rex et traversé les 3 mondes !<br><br>Score final : <b>${score}</b><br>Pièces : <b>${pieces}</b> 🪙`;
  } else {
    titre.textContent = 'GAME OVER';
    stats.innerHTML = `Score : <b>${score}</b><br>Pièces : <b>${pieces}</b> 🪙<br><br>Le royaume compte sur vous...`;
  }
  montrer('ecran-final');
};

function majTitre() {
  const d = SAUVEGARDE.data;
  const btn = document.getElementById('btn-jouer');
  if (d.deverrouille > 0) {
    const def = NIVEAUX[Math.min(d.deverrouille, NIVEAUX.length - 1)];
    btn.textContent = '▶ CONTINUER — ' + def.id;
  } else {
    btn.textContent = '▶ JOUER';
  }
  document.getElementById('titre-meilleur').textContent = d.meilleur > 0 ? 'Meilleur score : ' + d.meilleur : 'Bienvenue dans le royaume !';
  const lblSon = Sons.estMuet() ? '🔇 SON : OFF' : '🔊 SON : ON';
  document.getElementById('btn-son-titre').textContent = lblSon;
  document.getElementById('btn-son-pause').textContent = lblSon;
}

function demarrerJeu() {
  Sons.reprendre();
  Sons.jouer('clic');
  const depart = Math.min(SAUVEGARDE.data.deverrouille, NIVEAUX.length - 1);
  jeu.nouvellePartie(depart);
  montrer(null);
}

function ouvrirNiveaux() {
  Sons.reprendre();
  Sons.jouer('clic');
  const grille = document.getElementById('grille-niveaux');
  grille.innerHTML = '';
  const d = SAUVEGARDE.data;
  NIVEAUX.forEach((def, i) => {
    const verrouille = i > d.deverrouille;
    const carte = document.createElement('button');
    carte.className = 'carte-niveau' + (verrouille ? ' verrouille' : '');
    const etoiles = d.etoiles[i] || 0;
    const record = d.records[i];
    carte.innerHTML = verrouille
      ? `<span class="niv-id">🔒</span><span class="niv-nom">?</span>`
      : `<span class="niv-id">${def.id}</span><span class="niv-nom">${def.nom}</span><span class="niv-etoiles">${'★'.repeat(etoiles)}${'☆'.repeat(3 - etoiles)}</span>${record ? `<span class="niv-record">${record}</span>` : ''}`;
    if (!verrouille) carte.addEventListener('click', () => { Sons.jouer('clic'); jeu.nouvellePartie(i); montrer(null); });
    grille.appendChild(carte);
  });
  montrer('ecran-niveaux');
}

function retourTitre() {
  Sons.arreterMusique();
  jeu.mode = 'titre';
  majTitre();
  montrer('ecran-titre');
}

function basculerSon() {
  Sons.reprendre();
  Sons.inverserSon();
  majTitre();
}

document.getElementById('btn-jouer').addEventListener('click', demarrerJeu);
document.getElementById('btn-niveaux').addEventListener('click', ouvrirNiveaux);
document.getElementById('btn-aide').addEventListener('click', () => { Sons.reprendre(); Sons.jouer('clic'); montrer('ecran-aide'); });
document.getElementById('btn-son-titre').addEventListener('click', basculerSon);
document.getElementById('btn-son-pause').addEventListener('click', basculerSon);
document.getElementById('btn-retour-niveaux').addEventListener('click', () => { Sons.jouer('clic'); retourTitre(); });
document.getElementById('btn-retour-aide').addEventListener('click', () => { Sons.jouer('clic'); retourTitre(); });

document.getElementById('btn-reprendre').addEventListener('click', () => { jeu.basculerPause(); montrer(null); });
document.getElementById('btn-recommencer').addEventListener('click', () => { Sons.jouer('clic'); jeu.chargerNiveau(jeu.niveauIndex, false); montrer(null); });
document.getElementById('btn-menu-pause').addEventListener('click', retourTitre);
document.getElementById('btn-rejouer').addEventListener('click', () => {
  Sons.jouer('clic');
  const idx = jeu.mode === 'victoire' ? 0 : jeu.niveauIndex;
  jeu.nouvellePartie(idx);
  montrer(null);
});
document.getElementById('btn-menu-final').addEventListener('click', retourTitre);

window.addEventListener('keydown', (ev) => {
  const action = TOUCHES[ev.code];
  const estSaut = SAUT_CODES.includes(ev.code);
  if (action || estSaut) ev.preventDefault();
  if (ev.repeat) return;
  Sons.reprendre();
  if (action) ent[action] = true;
  if (estSaut) {
    ent.saut = true;
    ent.sautPresse = true;
    if (jeu.mode === 'titre' && document.getElementById('ecran-titre').classList.contains('visible')) {
      demarrerJeu();
    }
  }
  if (ev.code === 'Enter' && jeu.mode === 'titre' && document.getElementById('ecran-titre').classList.contains('visible')) {
    demarrerJeu();
  }
  if (ev.code === 'Escape' || ev.code === 'KeyP') {
    if (jeu.mode === 'jeu') { jeu.basculerPause(); montrer('ecran-pause'); }
    else if (jeu.mode === 'pause') { jeu.basculerPause(); montrer(null); }
  }
});

window.addEventListener('keyup', (ev) => {
  const action = TOUCHES[ev.code];
  if (action) ent[action] = false;
  if (SAUT_CODES.includes(ev.code)) ent.saut = false;
});

window.addEventListener('blur', () => {
  ent.gauche = ent.droite = ent.bas = ent.saut = ent.courir = false;
});

function lierBouton(id, action, edge) {
  const b = document.getElementById(id);
  const bas = (ev) => {
    ev.preventDefault();
    Sons.reprendre();
    ent[action] = true;
    if (edge) ent[edge] = true;
    b.classList.add('actif');
    if (navigator.vibrate) navigator.vibrate(action === 'saut' ? 30 : 12);
  };
  const haut = (ev) => {
    ev.preventDefault();
    ent[action] = false;
    b.classList.remove('actif');
  };
  b.addEventListener('pointerdown', bas);
  b.addEventListener('pointerup', haut);
  b.addEventListener('pointercancel', haut);
  b.addEventListener('pointerleave', haut);
  b.addEventListener('contextmenu', (ev) => ev.preventDefault());
}
lierBouton('btn-gauche', 'gauche');
lierBouton('btn-droite', 'droite');
lierBouton('btn-saut', 'saut', 'sautPresse');
lierBouton('btn-feu', 'courir', 'tirPresse');
document.getElementById('btn-start').addEventListener('pointerdown', (ev) => {
  ev.preventDefault();
  if (navigator.vibrate) navigator.vibrate(20);
  if (jeu.mode === 'jeu') { jeu.basculerPause(); montrer('ecran-pause'); }
  else if (jeu.mode === 'pause') { jeu.basculerPause(); montrer(null); }
});

let accumulateur = 0;
let dernierTemps = performance.now();
function boucle(t) {
  requestAnimationFrame(boucle);
  accumulateur += Math.min(100, t - dernierTemps);
  dernierTemps = t;
  while (accumulateur >= 1000 / 60) {
    jeu.update();
    ent.sautPresse = false;
    ent.tirPresse = false;
    accumulateur -= 1000 / 60;
  }
  jeu.rendu();
}
requestAnimationFrame(boucle);

majTitre();
montrer('ecran-titre');
jeu.mode = 'titre';
