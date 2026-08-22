const SAUVEGARDE = (() => {
  const CLE = 'smb_save_v1';
  let data = { deverrouille: 0, etoiles: {}, records: {}, meilleur: 0, highscores: [] };
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) data = Object.assign(data, JSON.parse(brut));
  } catch (e) {}
  if (!data.highscores) data.highscores = [];
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
  function finPartie(score, pieces, victoire) {
    data.meilleur = Math.max(data.meilleur, score);
    const estRecord = data.highscores.length < 10 || score > (data.highscores[data.highscores.length - 1]?.score || 0);
    const ts = Date.now();
    data.highscores.push({ nom: 'MARIO', score, pieces, victoire, date: ts });
    data.highscores.sort((a, b) => b.score - a.score);
    data.highscores = data.highscores.slice(0, 10);
    sauver();
    if (!estRecord) return -1;
    return data.highscores.findIndex((h) => h.date === ts);
  }
  function setNomHighscore(idx, nom) {
    if (data.highscores[idx]) {
      data.highscores[idx].nom = nom.slice(0, 12).toUpperCase() || 'MARIO';
      sauver();
    }
  }
  function estNouveauRecord(score) {
    return data.highscores.length < 10 || score > (data.highscores[data.highscores.length - 1]?.score || 0);
  }
  return { data, sauver, apresNiveau, finPartie, setNomHighscore, estNouveauRecord };
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
  // Masquer/afficher les contrôles tactiles selon qu'un écran est visible
  const cmds = document.getElementById('commandes-tactile');
  if (cmds) cmds.style.display = id ? 'none' : '';
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
  const idxRecord = (typeof window._idxRecord === 'number' && window._idxRecord >= 0) ? window._idxRecord : -1;
  if (victoire) {
    const d = SAUVEGARDE.data;
    let totalEtoiles = 0;
    NIVEAUX.forEach((_, i) => { totalEtoiles += (d.etoiles[i] || 0); });
    const totalMax = NIVEAUX.length * 3;
    document.getElementById('credits-texte').innerHTML =
      `Vous avez vaincu Rex et sauvé le royaume !<br><br>` +
      `Score final : <b>${score}</b><br>` +
      `Pièces collectées : <b>${pieces}</b> 🪙<br><br>` +
      `3 mondes · 12 niveaux · 3 boss vaincus 🏰`;
    document.getElementById('credits-etoiles').textContent =
      `${'★'.repeat(totalEtoiles)}${'☆'.repeat(totalMax - totalEtoiles)}  ${totalEtoiles}/${totalMax}`;
    let msg = "Merci d'avoir joué ! 🎮";
    if (totalEtoiles === totalMax) msg = '★ PARFAIT ! Toutes les étoiles ! Tu es un vrai champion ! ★';
    else if (totalEtoiles >= totalMax * 0.7) msg = 'Excellent ! Encore quelques étoiles à collectionner !';
    document.getElementById('credits-merci').textContent = msg;
    if (idxRecord >= 0) {
      const btnNom = document.getElementById('btn-credits-nom');
      if (btnNom) btnNom.style.display = '';
    }
    montrer('ecran-credits');
  } else {
    const titre = document.getElementById('final-titre');
    const stats = document.getElementById('final-stats');
    titre.textContent = 'GAME OVER';
    stats.innerHTML = `Score : <b>${score}</b><br>Pièces : <b>${pieces}</b> 🪙<br><br>Le royaume compte sur vous...`;
    const btnNom = document.getElementById('btn-final-nom');
    if (idxRecord >= 0 && btnNom) {
      stats.innerHTML += `<br><br><span style="color:#8ce99a">🏆 Nouveau record ! Tu es dans le top 10 !</span>`;
      btnNom.style.display = '';
    } else if (btnNom) {
      btnNom.style.display = 'none';
    }
    montrer('ecran-final');
  }
};

function demanderNomHighscore() {
  const idx = (typeof window._idxRecord === 'number' && window._idxRecord >= 0) ? window._idxRecord : -1;
  if (idx < 0) return;
  const hs = SAUVEGARDE.data.highscores;
  if (!hs[idx]) return;
  // Créer l'overlay directement dans le body, en dehors de #cadre
  const overlay = document.createElement('div');
  overlay.id = 'overlay-nom';
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;z-index:9999;';
  overlay.innerHTML = `
    <div style="background:linear-gradient(135deg,#1a2030,#0f172a);border:3px solid #ffd43b;border-radius:16px;padding:28px 24px;text-align:center;max-width:340px;width:90%;box-shadow:0 8px 40px rgba(255,212,59,0.3);">
      <div style="font-size:48px;margin-bottom:8px;">🏆</div>
      <h2 style="color:#ffd43b;font-size:22px;margin-bottom:6px;font-family:Courier New,monospace;">NOUVEAU RECORD !</h2>
      <p style="color:#dbe4f3;font-size:15px;margin-bottom:16px;font-family:Courier New,monospace;">Score : <b>${hs[idx].score}</b><br>Entre ton nom de plombier :</p>
      <input type="text" id="input-nom" maxlength="12" placeholder="MARIO" value="MARIO"
        style="font-family:Courier New,monospace;font-size:22px;font-weight:bold;text-align:center;text-transform:uppercase;
        letter-spacing:3px;padding:12px 14px;border:3px solid #38507e;border-radius:8px;background:#0f172a;color:#ffd43b;width:80%;outline:none;margin-bottom:18px;"
        autocomplete="off" autocapitalize="characters" spellcheck="false">
      <br>
      <button id="btn-valider-nom" style="font-family:Courier New,monospace;font-weight:bold;font-size:18px;padding:12px 32px;
        color:#fff;background:linear-gradient(#f59f00,#d9740a);border:none;border-bottom:4px solid #99500a;border-radius:10px;cursor:pointer;letter-spacing:1px;">
        ✓ VALIDER
      </button>
    </div>`;
  document.body.appendChild(overlay);
  const input = document.getElementById('input-nom');
  // Focus différé pour que le clavier mobile apparaisse
  setTimeout(() => { input.focus(); input.select(); }, 100);
  const valider = () => {
    const nom = input.value.trim().toUpperCase() || 'MARIO';
    SAUVEGARDE.setNomHighscore(idx, nom);
    overlay.remove();
    toast('🏆 ' + nom + ' entre dans la légende !');
    // Masquer le bouton "saisir nom"
    const b1 = document.getElementById('btn-final-nom');
    const b2 = document.getElementById('btn-credits-nom');
    if (b1) b1.style.display = 'none';
    if (b2) b2.style.display = 'none';
  };
  document.getElementById('btn-valider-nom').addEventListener('click', valider);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
  // Fermer si on clique en dehors
  overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); } });
}

function afficherHighscores() {
  Sons.reprendre();
  Sons.jouer('clic');
  const hs = SAUVEGARDE.data.highscores || [];
  const cont = document.getElementById('liste-highscores');
  if (hs.length === 0) {
    cont.innerHTML = '<p style="color:#5d6b80;font-size:16px;text-align:center;padding:20px;">Aucun score encore ! Sois le premier à entrer dans la légende 🏆</p>';
  } else {
    const medals = ['🥇','🥈','🥉'];
    const lignes = hs.map((h, i) => {
      const medal = i < 3 ? medals[i] : `<span style="color:#5d6b80">${i + 1}</span>`;
      const date = new Date(h.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      const v = h.victoire ? ' 🏰' : '';
      return `<div class="ligne-hs ${i === 0 ? 'hs-premier' : ''}">
        <span class="hs-rang">${medal}</span>
        <span class="hs-nom">${h.nom}</span>
        <span class="hs-score">${h.score.toLocaleString('fr-FR')}</span>
        <span class="hs-pieces">${h.pieces} 🪙</span>
        <span class="hs-date">${date}${v}</span>
      </div>`;
    }).join('');
    cont.innerHTML = lignes;
  }
  montrer('ecran-highscores');
}

function majTitre() {
  const d = SAUVEGARDE.data;
  const btn = document.getElementById('btn-jouer');
  if (d.deverrouille > 0) {
    const def = NIVEAUX[Math.min(d.deverrouille, NIVEAUX.length - 1)];
    btn.textContent = '▶ CONTINUER — ' + def.id;
  } else {
    btn.textContent = '▶ JOUER';
  }
  let txt = d.meilleur > 0 ? 'Meilleur score : ' + d.meilleur : 'Bienvenue dans le royaume !';
  let totalEtoiles = 0;
  const totalMax = NIVEAUX.length * 3;
  NIVEAUX.forEach((_, i) => { totalEtoiles += (d.etoiles[i] || 0); });
  if (totalEtoiles > 0) txt += ' · ⭐ ' + totalEtoiles + '/' + totalMax;
  document.getElementById('titre-meilleur').textContent = txt;
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
document.getElementById('btn-highscores').addEventListener('click', afficherHighscores);
document.getElementById('btn-retour-highscores').addEventListener('click', () => { Sons.jouer('clic'); retourTitre(); });
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
document.getElementById('btn-final-nom').addEventListener('pointerdown', (ev) => { ev.preventDefault(); demanderNomHighscore(); });
document.getElementById('btn-credits-menu').addEventListener('click', retourTitre);
document.getElementById('btn-credits-nom').addEventListener('pointerdown', (ev) => { ev.preventDefault(); demanderNomHighscore(); });
document.getElementById('btn-credits-rejouer').addEventListener('click', () => {
  Sons.jouer('clic');
  jeu.nouvellePartie(0);
  montrer(null);
});

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
  if (ev.code === 'KeyF') {
    basculerPleinEcran();
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

// ---- Support manette (Gamepad API) ----
let manettePrec = { saut: false, tir: false, start: false };
function lireManette() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  let gp = null;
  for (const p of pads) { if (p) { gp = p; break; } }
  if (!gp) {
    manettePrec.saut = false; manettePrec.tir = false; manettePrec.start = false;
    return;
  }
  // Axes : stick gauche / croix directionnelle
  const axeX = gp.axes[0] || 0;
  const axeY = gp.axes[1] || 0;
  ent.gauche = axeX < -0.4;
  ent.droite = axeX > 0.4;
  ent.bas = axeY > 0.4;
  // Boutons standards : 0=A(saut), 1=B(courir), 2=X, 3=Y, 9=Start, 12=Haut, 13=Bas, 14=Gauche, 15=Droite
  const btns = gp.buttons;
  const saut = btns[0] ? btns[0].value > 0.3 : false;
  const tir = (btns[1] && btns[1].value > 0.3) || (btns[2] && btns[2].value > 0.3) || (btns[7] && btns[7].value > 0.3);
  ent.courir = tir;
  const start = btns[9] ? btns[9].value > 0.3 : false;

  // Edge detection pour saut et tir
  if (saut && !manettePrec.saut) ent.sautPresse = true;
  if (tir && !manettePrec.tir) ent.tirPresse = true;

  // Start = pause
  if (start && !manettePrec.start) {
    if (jeu.mode === 'jeu') { jeu.basculerPause(); montrer('ecran-pause'); }
    else if (jeu.mode === 'pause') { jeu.basculerPause(); montrer(null); }
    else if (jeu.mode === 'titre' && document.getElementById('ecran-titre').classList.contains('visible')) {
      demarrerJeu();
    }
  }

  // Bouton 3 (Y) = plein écran
  if (btns[3] && btns[3].value > 0.3 && !manettePrec.fs) { basculerPleinEcran(); manettePrec.fs = true; }
  else if (!btns[3] || btns[3].value <= 0.3) manettePrec.fs = false;

  manettePrec.saut = saut;
  manettePrec.tir = tir;
  manettePrec.start = start;
}

// ---- Multitouch : chaque bouton gère son propre pointer ID ----

function basculerPleinEcran() {
  const el = document.getElementById('cadre');
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }
}

document.getElementById('btn-plein-ecran').addEventListener('click', basculerPleinEcran);
document.getElementById('btn-fs').addEventListener('pointerdown', (ev) => {
  ev.preventDefault();
  if (navigator.vibrate) navigator.vibrate(15);
  basculerPleinEcran();
});

function lierBouton(id, action, edge) {
  const b = document.getElementById(id);
  const pointeurs = new Set();
  const bas = (ev) => {
    ev.preventDefault();
    pointeurs.add(ev.pointerId);
    b.setPointerCapture(ev.pointerId);
    Sons.reprendre();
    ent[action] = true;
    if (edge) ent[edge] = true;
    b.classList.add('actif');
    if (navigator.vibrate) navigator.vibrate(action === 'saut' ? 30 : 12);
  };
  const haut = (ev) => {
    ev.preventDefault();
    pointeurs.delete(ev.pointerId);
    if (pointeurs.size === 0) {
      ent[action] = false;
      b.classList.remove('actif');
    }
  };
  b.addEventListener('pointerdown', bas);
  b.addEventListener('pointerup', haut);
  b.addEventListener('pointercancel', haut);
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
  lireManette();
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
