function chevauche(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const SOLIDES = '#XB?MUSD=[]{}';

const THEMES = {
  plaine: { cielHaut: '#63a5ff', cielBas: '#c9e7ff', sol: '#c9642a', solTop: '#3fae4a', solFonce: '#8a451a', brique: '#b5502a', bloc: '#e8a33d', tuyau: '#37b24d', colline: '#3fae4a', nuages: true },
  souterrain: { cielHaut: '#070b18', cielBas: '#141d38', sol: '#2f6fb8', solTop: '#5aa7e8', solFonce: '#1c4a80', brique: '#3a76c4', bloc: '#74a8e8', tuyau: '#2f9e44', colline: null, nuages: false },
  ciel: { cielHaut: '#8fb8ff', cielBas: '#ffe3b0', sol: '#c9642a', solTop: '#51cf66', solFonce: '#8a451a', brique: '#e8a33d', bloc: '#ffd43b', tuyau: '#37b24d', colline: '#69db7c', nuages: true },
  chateau: { cielHaut: '#1a0b12', cielBas: '#3a1220', sol: '#6e6e78', solTop: '#9a9aa8', solFonce: '#494952', brique: '#5c5c66', bloc: '#86868e', tuyau: '#494952', colline: null, nuages: false },
};

class Jeu {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = 960;
    canvas.height = 544;
    this.TAILLE = 32;
    this.largeurVue = 960;
    this.hauteurVue = 544;
    this.mode = 'titre';
    this.entrees = { gauche: false, droite: false, bas: false, saut: false, courir: false, sautPresse: false, tirPresse: false };
    this.age = 0;
    this.niveauIndex = 0;
    this.score = 0;
    this.pieces = 0;
    this.vies = 3;
    this.meilleur = 0;
  }

  nouvellePartie(index) {
    this.vies = 3;
    this.score = 0;
    this.pieces = 0;
    this.chargerNiveau(index, false);
  }

  chargerNiveau(i, auPointControle) {
    this.niveauIndex = i;
    const data = construireNiveau(i);
    this.data = data;
    this.def = data.def;
    this.themeNom = data.def.theme;
    this.theme = THEMES[data.def.theme];
    this.grille = data.grille.map((r) => r.split(''));
    this.largeurPx = data.largeur * 32;
    this.ennemis = [];
    this.plantes = [];
    this.rex = null;
    this.items = [];
    this.piecesLibres = [];
    this.projectiles = [];
    this.particules = [];
    this.popups = [];
    this.bumps = [];
    this.camX = 0;
    this.temps = 300;
    this.tempsT = 0;
    this.alerteEmise = false;
    this.tremblement = 0;
    this.comboEcrasement = 0;
    this.chaineCoquille = 0;

    let depart = { x: 64, y: 380 };
    this.pointControle = null;
    this.checkpointPris = false;
    this.axePris = false;
    this.drapeauPx = null;
    this.drapeauBaseY = 13;
    this.axePos = null;

    for (let ty = 0; ty < 16; ty++) {
      for (let tx = 0; tx < data.largeur; tx++) {
        const ch = this.grille[ty][tx];
        if (ch === '@') { depart = { x: tx * 32 + 4, y: ty * 32 }; this.grille[ty][tx] = ' '; }
        else if (ch === 'F') { this.drapeauPx = tx * 32; this.drapeauBaseY = ty; this.grille[ty][tx] = ' '; }
        else if (ch === 'A') { this.axePos = { tx, ty }; this.grille[ty][tx] = ' '; }
        else if (ch === '*') { this.controleSpawn = { tx, ty }; this.grille[ty][tx] = ' '; }
        else if (ch === 'V') { this.plantes.push(new Plante((tx + 1) * 32, ty * 32, (ty + 1) * 32)); this.grille[ty][tx] = ' '; }
        else if (ch === 'R') { this.rex = new Rex(tx, ty, i >= 11 ? 8 : i >= 7 ? 6 : 5); this.grille[ty][tx] = ' '; }
        else if (ch === 'o') { this.piecesLibres.push(new PieceLibre(tx * 32, ty * 32)); this.grille[ty][tx] = ' '; }
      }
    }

    for (const sp of data.ennemisSpawn) {
      const e = creerEnnemi(sp);
      if (e) this.ennemis.push(e);
    }
    this.plateformes = data.plateformesSpawn.map((p) => new PlateformeMobile(p.x, p.y, p.axe, p.portee, p.vitesse));
    if (this.rex) this.ennemis.push(this.rex);

    this.mortsNiveau = auPointControle ? this.mortsNiveau || 0 : 0;
    this.piecesNiveau = auPointControle ? this.piecesNiveau || 0 : 0;
    if (!auPointControle) this.pointSauvegarde = null;
    this.totalPiecesNiveau = data.totalPieces;
    this.planteRects = [];

    const ancien = this.joueur;
    let taille = 'petit';
    let feu = false;
    if (auPointControle && this.pointSauvegarde && ancien) {
      depart = { x: this.pointSauvegarde.x, solY: this.pointSauvegarde.solY };
      this.checkpointPris = true;
      taille = ancien.taille;
      feu = ancien.feu;
    }

    this.joueur = new Joueur(this, depart.x, 0);
    this.joueur.taille = taille;
    this.joueur.h = taille === 'grand' ? 52 : 28;
    this.joueur.feu = feu;
    this.joueur.y = (depart.solY !== undefined ? depart.solY : depart.y + 32) - this.joueur.h;

    this.mode = 'carte';
    this.carteT = 115;
    this.seqDrapeau = null;
    this.finT = 0;
    this.pisteActuelle = null;
  }

  demarrerJeu() {
    this.mode = 'jeu';
    const pistes = { plaine: 'plaine', souterrain: 'souterrain', ciel: 'ciel', chateau: 'chateau' };
    this.pisteActuelle = pistes[this.themeNom];
    Sons.musique(this.pisteActuelle);
  }

  solide(tx, ty) {
    if (tx < 0 || tx >= this.data.largeur) return true;
    if (ty < 0 || ty >= 16) return false;
    return SOLIDES.includes(this.grille[ty][tx]);
  }

  estSolidePx(px, py) {
    return this.solide(Math.floor(px / 32), Math.floor(py / 32));
  }

  physique(e, grav = 0.5, maxChute = 12) {
    e.vy += grav;
    if (e.vy > maxChute) e.vy = maxChute;
    const res = { murG: false, murD: false, auSol: false };
    e.x += e.vx;
    const T = 32;
    const y0 = Math.floor(e.y / T);
    const y1 = Math.floor((e.y + e.h - 1) / T);
    if (e.vx > 0) {
      const tx = Math.floor((e.x + e.w) / T);
      for (let ty = y0; ty <= y1; ty++) {
        if (this.solide(tx, ty)) { e.x = tx * T - e.w - 0.01; res.murD = true; break; }
      }
    } else if (e.vx < 0) {
      const tx = Math.floor(e.x / T);
      for (let ty = y0; ty <= y1; ty++) {
        if (this.solide(tx, ty)) { e.x = (tx + 1) * T + 0.01; res.murG = true; break; }
      }
    }
    e.auSol = false;
    e.y += e.vy;
    const x0 = Math.floor((e.x + 1) / T);
    const x1 = Math.floor((e.x + e.w - 2) / T);
    if (e.vy >= 0) {
      const ty = Math.floor((e.y + e.h) / T);
      for (let tx = x0; tx <= x1; tx++) {
        if (this.solide(tx, ty)) { e.y = ty * T - e.h; e.vy = 0; res.auSol = true; e.auSol = true; break; }
      }
    } else {
      const ty = Math.floor(e.y / T);
      for (let tx = x0; tx <= x1; tx++) {
        if (this.solide(tx, ty)) { e.y = (ty + 1) * T + 0.01; e.vy = 0; break; }
      }
    }
    return res;
  }

  frapperBlocs(tuiles) {
    const j = this.joueur;
    let meilleure = null;
    let distMin = 999;
    for (const t of tuiles) {
      const d = Math.abs((t.tx * 32 + 16) - j.centreX());
      if (d < distMin) { distMin = d; meilleure = t; }
    }
    if (!meilleure) return;
    const { tx, ty } = meilleure;
    const ch = this.grille[ty][tx];
    const bx = tx * 32 + 16;

    if (ch === '?' || ch === 'M' || ch === 'U' || ch === 'S') {
      this.grille[ty][tx] = 'D';
      this.bumps.push({ tx, ty, t: 12 });
      if (ch === '?') {
        this.ajouterPieces(1);
        this.ajouterScore(200, bx, ty * 32 - 10, '+200');
        Sons.jouer('piece');
        this.etincelles(bx, ty * 32, '#ffd43b', 5);
      } else {
        const genre = ch === 'M' ? (j.taille === 'petit' ? 'champignon' : 'fleur') : ch === 'U' ? 'unup' : 'etoile';
        this.items.push(new Objet(tx * 32 + 2, ty * 32 - 4, genre));
        Sons.jouer('apparait');
      }
      this.tuerAuDessus(tx, ty);
      return;
    }
    if (ch === 'B') {
      if (j.taille === 'grand' || j.etoile > 0) {
        this.grille[ty][tx] = ' ';
        this.debris(bx, ty * 32 + 16, this.theme.brique);
        this.ajouterScore(50, bx, ty * 32, '+50');
        Sons.jouer('casse');
        this.tremble(2);
        this.tuerAuDessus(tx, ty);
      } else {
        this.bumps.push({ tx, ty, t: 12 });
        Sons.jouer('cogne');
        this.tuerAuDessus(tx, ty);
      }
      return;
    }
    Sons.jouer('cogne');
  }

  tuerAuDessus(tx, ty) {
    for (const e of this.ennemis) {
      if (e.mort || e.type === 'rex' || e.type === 'plante') continue;
      if (Math.abs(e.y + e.h - ty * 32) < 8 && e.x + e.w > tx * 32 && e.x < tx * 32 + 32) {
        this.tuerEnnemi(e, 'bump', 100);
      }
    }
  }

  tuerEnnemi(e, cause, pts) {
    if (e.mort) return;
    e.mort = true;
    this.etincelles(e.centreX(), e.centreY(), cause === 'etoile' ? '#ffe066' : '#fff', 8);
    this.ajouterScore(pts, e.centreX(), e.y, '+' + pts);
    Sons.jouer('ecrase');
  }

  ajouterScore(pts, x, y, texte) {
    this.score += pts;
    if (texte && x !== undefined) this.popups.push({ texte, x, y, t: 46, couleur: '#fff' });
  }

  ajouterPieces(n) {
    this.pieces += n;
    this.piecesNiveau += n;
    if (this.pieces >= 100) {
      this.pieces -= 100;
      this.vies++;
      Sons.jouer('vie');
      if (window.toast) window.toast('1-UP ! ❤');
    }
  }

  popup(texte, x, y, couleur) {
    this.popups.push({ texte, x, y, t: 46, couleur: couleur || '#fff' });
  }

  etincelles(x, y, couleur, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 1.5 + Math.random() * 2.5;
      this.particules.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, vie: 26 + Math.random() * 14, vieMax: 40, couleur, taille: 3 + Math.random() * 2, grav: 0.08 });
    }
  }

  poussiere(x, y) {
    this.particules.push({ x, y, vx: (Math.random() - 0.5) * 1.2, vy: -Math.random() * 1.2, vie: 18, vieMax: 18, couleur: '#ddd', taille: 3, grav: -0.01 });
  }

  debris(x, y, couleur) {
    for (let i = 0; i < 6; i++) {
      this.particules.push({ x, y, vx: (Math.random() - 0.5) * 5, vy: -3 - Math.random() * 3, vie: 42, vieMax: 42, couleur, taille: 5 + Math.random() * 3, grav: 0.28 });
    }
  }

  tremble(n) { this.tremblement = Math.max(this.tremblement, n); }

  update() {
    this.age++;
    switch (this.mode) {
      case 'carte':
        this.carteT--;
        if (this.carteT <= 0) this.demarrerJeu();
        break;
      case 'jeu':
        this.updateJeu();
        break;
      case 'mort':
        this.updateMort();
        break;
      case 'drapeau':
        this.updateDrapeau();
        break;
      case 'fin':
        this.updateFin();
        break;
    }
    if (this.tremblement > 0) this.tremblement -= 0.4;
  }

  updateJeu() {
    for (const p of this.plateformes) p.update();

    this.joueur.update(this);
    if (this.mode !== 'jeu') return;

    for (const pl of this.plantes) pl.update(this);
    this.planteRects = this.plantes.filter((p) => !p.mort).map((p) => p.rect());

    for (const e of this.ennemis) {
      if (e.mort) continue;
      if (!e.actif) {
        if (e.x < this.camX + 1060 && e.x > this.camX - 240) e.actif = true;
        else continue;
      }
      if (e !== this.rex && e.x < this.camX - 420 && (!e.etat || e.etat !== 'glisse')) continue;
      e.update(this);
    }
    this.ennemis = this.ennemis.filter((e) => !e.mort || (e.type === 'rex' && !e.tombe));

    for (const pr of this.projectiles) pr.update(this);
    this.projectiles = this.projectiles.filter((p) => !p.mort);

    for (const it of this.items) it.update(this);
    this.items = this.items.filter((it) => !it.prise && it.y < 16 * 32 + 100);

    for (const pc of this.piecesLibres) pc.update();
    this.piecesLibres = this.piecesLibres.filter((pc) => !pc.prise);

    this.collisionsJoueur();
    if (this.mode !== 'jeu') return;

    this.dangers();
    if (this.mode !== 'jeu') return;

    this.verifications();

    const cible = this.joueur.centreX() - 370;
    this.camX += (cible - this.camX) * 0.12;
    this.camX = Math.max(0, Math.min(this.camX, this.largeurPx - this.largeurVue));

    this.tempsT++;
    if (this.tempsT % 26 === 0) {
      this.temps--;
      if (this.temps === 100 && !this.alerteEmise) {
        this.alerteEmise = true;
        Sons.jouer('alerte');
        if (window.toast) window.toast('⚠ Dépêchez-vous !');
      }
      if (this.temps <= 0) { this.temps = 0; this.mourirJoueur(false); }
    }

    if (this.rex && !this.rex.tombe && !this.rex.mort && this.joueur.centreX() > this.rex.zoneMin - 340 && this.pisteActuelle !== 'boss') {
      this.pisteActuelle = 'boss';
      Sons.musique('boss');
    }

    for (const pa of this.particules) {
      pa.vy += pa.grav;
      pa.x += pa.vx;
      pa.y += pa.vy;
      pa.vie--;
    }
    this.particules = this.particules.filter((pa) => pa.vie > 0);
    for (const po of this.popups) { po.y -= 0.9; po.t--; }
    this.popups = this.popups.filter((po) => po.t > 0);
    for (const b of this.bumps) b.t--;
    this.bumps = this.bumps.filter((b) => b.t > 0);
  }

  collisionsJoueur() {
    const j = this.joueur;
    if (j.mort) return;

    for (const it of this.items) {
      if (!it.prise && chevauche(j, it)) {
        it.prise = true;
        this.ajouterScore(1000, it.centreX(), it.y, '+1000');
        if (it.genre === 'champignon') { if (j.taille === 'petit') j.grandir(); }
        else if (it.genre === 'fleur') j.devenirFeu();
        else if (it.genre === 'etoile') j.devenirEtoile();
        else if (it.genre === 'unup') {
          this.vies++;
          Sons.jouer('vie');
          if (window.toast) window.toast('1-UP ! ❤');
        }
      }
    }

    for (const pc of this.piecesLibres) {
      if (!pc.prise && chevauche(j, pc)) {
        pc.prise = true;
        this.ajouterPieces(1);
        this.ajouterScore(200);
        Sons.jouer('piece');
        this.etincelles(pc.centreX(), pc.centreY(), '#ffd43b', 5);
      }
    }

    for (const en of this.ennemis) {
      if (en.mort || !en.actif) continue;
      const r = en.rect();
      if (!chevauche(j, r)) continue;

      if (j.etoile > 0 && en.type !== 'rex') { this.tuerEnnemi(en, 'etoile', 200); continue; }

      if (en.type === 'koopa' && en.etat === 'carapace') {
        if (en.grace > 0) continue;
        const dir = j.centreX() < en.centreX() ? 1 : -1;
        en.lancer(dir);
        en.grace = 12;
        this.chaineCoquille = 0;
        Sons.jouer('cogne');
        this.tremble(2);
        continue;
      }

      const stomp = j.vy > 0.5 && j.y + j.h - j.vy <= r.y + 10;

      if (stomp && en.type === 'goomba') {
        en.ecrase = 26;
        this.bonusEcrasement(en);
      } else if (stomp && en.type === 'koopa' && en.etat === 'marche') {
        en.transformerCarapace();
        en.grace = 14;
        Sons.jouer('ecrase');
        this.rebond();
        this.ajouterScore(100, en.centreX(), en.y, '+100');
      } else if (stomp && en.type === 'koopa' && en.etat === 'glisse') {
        en.arreter();
        Sons.jouer('ecrase');
        this.rebond();
        this.ajouterScore(100, en.centreX(), en.y, '+100');
      } else if (stomp && en.type === 'flyer') {
        this.tuerEnnemi(en, 'ecrase', 200);
        this.rebond();
      } else {
        if (en.grace > 0) continue;
        if (j.blesser()) this.mourirJoueur(false);
        else this.tremble(3);
      }
    }

    for (const en of this.ennemis) {
      if (en.type === 'koopa' && en.etat === 'glisse' && !en.mort) {
        for (const autre of this.ennemis) {
          if (autre === en || autre.mort || autre.type === 'rex' || !autre.actif) continue;
          if (chevauche(en, autre.rect())) {
            this.chaineCoquille++;
            const pts = 200 * Math.pow(2, Math.min(this.chaineCoquille - 1, 4));
            this.tuerEnnemi(autre, 'coquille', pts);
          }
        }
      }
    }

    for (const pr of this.projectiles) {
      if (pr.mort) continue;
      if (pr.proprietaire === 'joueur') {
        for (const en of this.ennemis) {
          if (en.mort || !en.actif) continue;
          if (!chevauche(pr, en.rect())) continue;
          pr.mort = true;
          if (en.type === 'rex') {
            if (en.flash === 0 || en.flash < 4) {
              const vaincu = en.toucher();
              this.ajouterScore(300, en.centreX(), en.y, '+300');
              if (vaincu) this.rexVaincu(en);
            }
          } else {
            this.tuerEnnemi(en, 'feu', 200);
          }
          break;
        }
        if (!pr.mort) {
          for (const pl of this.plantes) {
            if (pl.mort) continue;
            if (chevauche(pr, pl.rect())) {
              pl.mort = true;
              pr.mort = true;
              this.tuerEnnemi(pl, 'feu', 200);
              break;
            }
          }
        }
      } else {
        if (chevauche(pr, j)) {
          pr.mort = true;
          if (j.blesser()) this.mourirJoueur(false);
          else this.tremble(3);
        }
      }
    }

    if (this.planteRects) {
      for (const r of this.planteRects) {
        if (chevauche(j, r)) {
          const stompPlante = j.vy > 0.5 && j.y + j.h - j.vy <= r.y + 12;
          if (stompPlante) {
            // Écraser la plante par le haut
            for (const pl of this.plantes) {
              if (pl.mort) continue;
              const pr = pl.rect();
              if (chevauche(j, pr)) {
                pl.mort = true;
                this.tuerEnnemi(pl, 'ecrase', 200);
                this.rebond();
                break;
              }
            }
          } else {
            if (j.blesser()) this.mourirJoueur(false);
            else this.tremble(3);
          }
          break;
        }
      }
    }
  }

  rebond() {
    const j = this.joueur;
    this.comboEcrasement++;
    j.vy = this.entrees.saut ? -11 : -7.6;
    j.sy = 0.82;
    j.sx = 1.18;
    Sons.jouer('ecrase');
  }

  bonusEcrasement(en) {
    this.rebond();
    const pts = 100 * Math.pow(2, Math.min(this.comboEcrasement - 1, 4));
    this.ajouterScore(pts, en.centreX(), en.y, '+' + pts);
  }

  rexVaincu(rex) {
    this.ajouterScore(5000, rex.centreX(), rex.y, '+5000');
    this.popup('REX VAINCU ! 👑', rex.centreX(), rex.y - 30, '#ffd43b');
    this.etincelles(rex.centreX(), rex.centreY(), '#ff8787', 16);
    this.tremble(6);
    if (window.toast) window.toast('👑 Rex est vaincu ! File à la hache !');
  }

  dangers() {
    const j = this.joueur;
    const pieds = [
      [j.x + 4, j.y + j.h - 4], [j.x + j.w - 4, j.y + j.h - 4],
      [j.centreX(), j.centreY()], [j.x + 4, j.y + 6], [j.x + j.w - 4, j.y + 6],
    ];
    for (const [px, py] of pieds) {
      const tx = Math.floor(px / 32);
      const ty = Math.floor(py / 32);
      if (ty >= 0 && ty < 16 && tx >= 0 && tx < this.data.largeur) {
        if (this.grille[ty][tx] === '~') { this.mourirJoueur(true); return; }
        if (this.grille[ty][tx] === '^' && py > ty * 32 + 12) {
          if (j.blesser()) { this.mourirJoueur(false); return; }
          j.vy = -6;
          break;
        }
      }
    }

    for (const en of this.ennemis) {
      if (en.mort || en.type === 'plante') continue;
      const cy = en.centreY();
      const ligneCy = Math.floor(cy / 32);
      if (this.grille[ligneCy] && this.grille[ligneCy][Math.floor(en.centreX() / 32)] === '~') {
        if (en.type === 'rex') {
          if (!en.tombe) { en.precipiter(); this.rexVaincu(en); }
        } else {
          en.mort = true;
          this.etincelles(en.centreX(), cy, '#ff922b', 8);
        }
      }
      if (en.y > 16 * 32 + 60) en.mort = true;
    }
  }

  verifications() {
    const j = this.joueur;

    if (!this.checkpointPris && this.controleSpawn) {
      const cr = { x: this.controleSpawn.tx * 32 - 6, y: (this.controleSpawn.ty - 1) * 32, w: 44, h: 96 };
      if (chevauche(j, cr)) {
        this.checkpointPris = true;
        this.pointSauvegarde = { x: this.controleSpawn.tx * 32 + 4, solY: (this.controleSpawn.ty + 1) * 32 };
        Sons.jouer('checkpoint');
        if (window.toast) window.toast('🚩 Checkpoint atteint !');
      }
    }

    if (this.drapeauPx !== null) {
      const pole = { x: this.drapeauPx + 10, y: (this.drapeauBaseY - 10) * 32, w: 14, h: 11 * 32 };
      if (chevauche(j, pole)) { this.demarrerDrapeau(); return; }
    }

    if (this.axePos) {
      const ar = { x: this.axePos.tx * 32, y: this.axePos.ty * 32, w: 32, h: 32 };
      if (chevauche(j, ar)) { this.demarrerHache(); return; }
    }
  }

  demarrerDrapeau() {
    if (this.mode !== 'jeu') return;
    this.mode = 'drapeau';
    const j = this.joueur;
    j.pose = 'drapeau';
    j.vx = 0;
    j.vy = 0;
    j.x = this.drapeauPx + 13 - j.w;
    const h = Math.max(0, Math.min(9, Math.round((this.drapeauBaseY * 32 - (j.y + j.h)) / 32)));
    const bonus = h * 100;
    this.ajouterScore(bonus, j.centreX(), j.y, '+' + bonus);
    Sons.arreterMusique();
    Sons.jouer('drapeau');
    this.seqDrapeau = { phase: 'glisse', t: 0, feux: 0 };
  }

  demarrerHache() {
    if (this.mode !== 'jeu') return;
    this.mode = 'drapeau';
    Sons.arreterMusique();
    Sons.jouer('hache');
    this.axePris = true;
    this.tremble(7);
    for (let ty = 0; ty < 16; ty++) {
      for (let tx = 0; tx < this.data.largeur; tx++) {
        if (this.grille[ty][tx] === '=') {
          this.grille[ty][tx] = ' ';
          if (Math.random() < 0.4) this.debris(tx * 32 + 16, ty * 32 + 16, '#b06a1e');
        }
      }
    }
    if (this.rex && !this.rex.tombe && !this.rex.mort) this.rex.precipiter();
    this.ajouterScore(2000, this.joueur.centreX(), this.joueur.y, '+2000');
    this.seqDrapeau = { phase: 'marche', t: 0, feux: 0 };
    this.joueur.pose = 'cours';
  }

  updateDrapeau() {
    const j = this.joueur;
    const s = this.seqDrapeau;
    s.t++;

    if (this.rex && !this.rex.mort) this.rex.update(this);
    this.ennemis = this.ennemis.filter((e) => !(e.tombe && e.mort));

    if (s.phase === 'glisse') {
      const solY = (this.drapeauBaseY + 1) * 32 - j.h;
      if (j.y < solY) j.y = Math.min(solY, j.y + 3.2);
      else { s.phase = 'attente'; s.t = 0; }
    } else if (s.phase === 'attente') {
      if (s.t > 26) { s.phase = 'marche'; j.pose = 'cours'; j.dir = 1; }
    } else if (s.phase === 'marche') {
      j.animT += 1.2;
      j.x += 2.2;
      const f = this.physique(j, 0.62);
      if (s.t > 85) { s.phase = 'feux'; s.t = 0; }
    } else if (s.phase === 'feux') {
      if (s.t % 24 === 0 && s.feux < 3) {
        s.feux++;
        const fx = this.camX + 200 + Math.random() * 560;
        const fy = 90 + Math.random() * 140;
        this.etincelles(fx, fy, ['#ff8787', '#74c0fc', '#ffd43b'][s.feux - 1], 18);
        Sons.jouer('apparait');
      }
      if (s.t > 92) this.terminerNiveau();
    }
  }

  terminerNiveau() {
    this.mode = 'fin';
    this.finT = 165;
    const bonusTemps = this.temps * 15;
    this.bonusTemps = bonusTemps;
    this.score += bonusTemps;
    if (window.progression) {
      window.progression.apresNiveau(this.niveauIndex, {
        piecesNiveau: this.piecesNiveau,
        totalPieces: this.totalPiecesNiveau,
        morts: this.mortsNiveau,
        score: this.score,
      });
    }
  }

  updateFin() {
    this.finT--;
    if (this.finT <= 0) {
      if (this.niveauIndex >= NIVEAUX.length - 1) {
        this.mode = 'victoire';
        Sons.musique('victoire');
        if (window.progression) window.progression.finPartie(this.score, this.pieces, true);
        if (window.ecranFinal) window.ecranFinal(true, this.score, this.pieces);
      } else {
        this.chargerNiveau(this.niveauIndex + 1, false);
      }
    }
  }

  mourirJoueur(chute) {
    if (this.mode !== 'jeu') return;
    this.mode = 'mort';
    this.mortT = 125;
    const j = this.joueur;
    j.pose = 'mort';
    j.mort = true;
    j.vy = chute ? 2 : -11.5;
    j.vx = 0;
    this.mortsNiveau++;
    Sons.arreterMusique();
    Sons.jouer('mort');
  }

  updateMort() {
    const j = this.joueur;
    j.vy += 0.5;
    j.y += j.vy;
    this.mortT--;
    if (this.mortT <= 0) {
      this.vies--;
      if (this.vies <= 0) {
        this.mode = 'gameover';
        if (window.progression) window.progression.finPartie(this.score, this.pieces, false);
        if (window.ecranFinal) window.ecranFinal(false, this.score, this.pieces);
      } else {
        this.chargerNiveau(this.niveauIndex, this.pointSauvegarde ? true : false);
      }
    }
  }

  basculerPause() {
    if (this.mode === 'jeu') {
      this.mode = 'pause';
      Sons.arreterMusique();
      return true;
    }
    if (this.mode === 'pause') {
      this.mode = 'jeu';
      Sons.musique(this.pisteActuelle);
      return false;
    }
    return null;
  }

  rendu() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.largeurVue, this.hauteurVue);
    if (!this.grille || this.mode === 'titre') return;

    const cle = this.themeNom + '_' + this.hauteurVue;
    if (this._cielCle !== cle) {
      const g = ctx.createLinearGradient(0, 32, 0, this.hauteurVue);
      g.addColorStop(0, this.theme.cielHaut);
      g.addColorStop(1, this.theme.cielBas);
      this._cielGrad = g;
      this._cielCle = cle;
    }
    ctx.fillStyle = this._cielGrad;
    ctx.fillRect(0, 0, this.largeurVue, this.hauteurVue);

    let shX = 0;
    let shY = 0;
    if (this.tremblement > 0) {
      shX = (Math.random() - 0.5) * this.tremblement * 2;
      shY = (Math.random() - 0.5) * this.tremblement * 2;
    }

    ctx.save();
    ctx.translate(-Math.round(this.camX) + shX, 32 + shY);

    this.dessinerDeco(ctx);
    this.dessinerTuiles(ctx);
    this.dessinerSpeciaux(ctx);

    for (const pc of this.piecesLibres) pc.dessiner(ctx);
    for (const it of this.items) it.dessiner(ctx);
    for (const pf of this.plateformes) pf.dessiner(ctx);
    for (const pl of this.plantes) pl.dessiner(ctx);
    for (const en of this.ennemis) if (!en.mort) en.dessiner(ctx);
    for (const pr of this.projectiles) pr.dessiner(ctx);
    this.joueur.dessiner(ctx);

    for (const pa of this.particules) {
      ctx.globalAlpha = Math.max(0, pa.vie / pa.vieMax);
      ctx.fillStyle = pa.couleur;
      ctx.fillRect(pa.x - pa.taille / 2, pa.y - pa.taille / 2, pa.taille, pa.taille);
    }
    ctx.globalAlpha = 1;

    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.textAlign = 'center';
    for (const po of this.popups) {
      ctx.globalAlpha = Math.min(1, po.t / 20);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.65)';
      ctx.strokeText(po.texte, po.x, po.y);
      ctx.fillStyle = po.couleur;
      ctx.fillText(po.texte, po.x, po.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';

    ctx.restore();

    this.dessinerHUD(ctx);

    if (this.mode === 'carte') this.dessinerCarte(ctx);
    else if (this.mode === 'fin') this.dessinerBandeauFin(ctx);
  }

  dessinerDeco(ctx) {
    if (this.theme.nuages) {
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      for (let k = 0; k < 7; k++) {
        const wx = k * 268 + 60;
        const periode = 1880;
        let sx = ((wx - this.camX * 0.35) % periode + periode) % periode - 160;
        if (sx < -160 || sx > 1060) continue;
        const sy = 64 + ((k * 47) % 100);
        ctx.beginPath();
        ctx.arc(sx, sy, 22, 0, Math.PI * 2);
        ctx.arc(sx + 24, sy - 10, 26, 0, Math.PI * 2);
        ctx.arc(sx + 50, sy, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(sx - 14, sy, 78, 20);
      }
    }
    if (this.themeNom === 'plaine') {
      ctx.fillStyle = this.theme.colline;
      for (let k = 0; k < 5; k++) {
        const wx = k * 430 + 120;
        const periode = 2160;
        let sx = ((wx - this.camX * 0.55) % periode + periode) % periode - 200;
        if (sx < -260 || sx > 1160) continue;
        ctx.beginPath();
        ctx.arc(sx, 450, 130, Math.PI, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + 150, 450, 84, Math.PI, 0);
        ctx.fill();
      }
    }
    if (this.themeNom === 'chateau') {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let k = 0; k < 8; k++) {
        const wx = k * 240 + 90;
        const periode = 1930;
        let sx = ((wx - this.camX * 0.3) % periode + periode) % periode - 120;
        if (sx < -60 || sx > 1020) continue;
        ctx.fillRect(sx, 60, 34, 210);
        ctx.beginPath();
        ctx.arc(sx + 17, 60, 17, Math.PI, 0);
        ctx.fill();
      }
    }
  }

  dessinerTuiles(ctx) {
    const T = 32;
    const th = this.theme;
    const x0 = Math.max(0, Math.floor(this.camX / T) - 1);
    const x1 = Math.min(this.data.largeur - 1, x0 + 33);
    for (let ty = 0; ty < 16; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const ch = this.grille[ty][tx];
        if (ch === ' ') continue;
        let oy = 0;
        for (const b of this.bumps) {
          if (b.tx === tx && b.ty === ty) oy = -Math.sin(((12 - b.t) / 12) * Math.PI) * 7;
        }
        const px = tx * T;
        const py = ty * T + oy;

        if (ch === '#') {
          ctx.fillStyle = th.sol;
          ctx.fillRect(px, py, T, T);
          const auDessus = ty > 0 ? this.grille[ty - 1][tx] : ' ';
          if (auDessus !== '#' && auDessus !== 'X') {
            ctx.fillStyle = th.solTop;
            ctx.fillRect(px, py, T, 9);
            ctx.fillStyle = th.solFonce;
            ctx.fillRect(px, py + 9, T, 3);
          }
          if ((tx * 13 + ty * 7) % 11 === 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.14)';
            ctx.fillRect(px + 8, py + 18, 6, 5);
            ctx.fillRect(px + 21, py + 24, 5, 4);
          }
        } else if (ch === 'X') {
          ctx.fillStyle = '#c97b3a';
          ctx.fillRect(px, py, T, T);
          ctx.strokeStyle = '#7e4516';
          ctx.lineWidth = 3;
          ctx.strokeRect(px + 1.5, py + 1.5, T - 3, T - 3);
          ctx.fillStyle = '#7e4516';
          ctx.fillRect(px + 5, py + 5, 4, 4);
          ctx.fillRect(px + 23, py + 5, 4, 4);
          ctx.fillRect(px + 5, py + 23, 4, 4);
          ctx.fillRect(px + 23, py + 23, 4, 4);
        } else if (ch === 'B' || ch === 'D') {
          ctx.fillStyle = ch === 'D' ? '#7a5230' : th.brique;
          ctx.fillRect(px, py, T, T);
          ctx.fillStyle = 'rgba(0,0,0,0.28)';
          ctx.fillRect(px, py + 15, T, 2);
          ctx.fillRect(px + 15, py, 2, 15);
          ctx.fillRect(px + 7, py + 17, 2, 15);
          ctx.fillRect(px + 23, py + 17, 2, 15);
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.fillRect(px, py, T, 3);
        } else if (ch === '?' || ch === 'M' || ch === 'U' || ch === 'S') {
          const cyc = ['#ff9f1a', '#ffb02e', '#ffc247'][Math.floor(this.age / 9) % 3];
          ctx.fillStyle = cyc;
          ctx.fillRect(px, py, T, T);
          ctx.strokeStyle = '#8a4b00';
          ctx.lineWidth = 3;
          ctx.strokeRect(px + 1.5, py + 1.5, T - 3, T - 3);
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.fillRect(px + 3, py + 3, T - 6, 4);
          ctx.font = 'bold 20px "Courier New", monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#6b3200';
          const bob = Math.sin(this.age * 0.09 + tx) * 1.5;
          ctx.fillText('?', px + 16, py + 23 + bob);
          ctx.textAlign = 'left';
        } else if (ch === '[' || ch === ']' || ch === '{' || ch === '}') {
          const tete = ch === '[' || ch === ']';
          if (tete) {
            ctx.fillStyle = th.tuyauFonce;
            ctx.fillRect(px - 3, py, T + 6, T);
          }
          ctx.fillStyle = th.tuyau;
          ctx.fillRect(px, py + (tete ? 4 : 0), T, T - (tete ? 4 : 0));
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.fillRect(px + (ch === '[' || ch === '{' ? 5 : 2), py + (tete ? 4 : 0), 6, T - (tete ? 4 : 0));
          ctx.fillStyle = 'rgba(0,0,0,0.22)';
          ctx.fillRect(px + T - (ch === ']' || ch === '}' ? 8 : 5), py + (tete ? 4 : 0), 5, T - (tete ? 4 : 0));
          if (tete) {
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.fillRect(px - 3, py + T - 4, T + 6, 4);
          }
        } else if (ch === '^') {
          ctx.fillStyle = '#dee2e6';
          ctx.beginPath();
          ctx.moveTo(px, py + T);
          ctx.lineTo(px + 8, py + 8);
          ctx.lineTo(px + 16, py + T);
          ctx.moveTo(px + 16, py + T);
          ctx.lineTo(px + 24, py + 8);
          ctx.lineTo(px + 32, py + T);
          ctx.fill();
          ctx.strokeStyle = '#868e96';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (ch === '~') {
          ctx.fillStyle = '#d9480f';
          ctx.fillRect(px, py, T, T);
          const auDessus = ty > 0 ? this.grille[ty - 1][tx] : ' ';
          if (auDessus !== '~') {
            ctx.fillStyle = '#ff922b';
            ctx.beginPath();
            ctx.moveTo(px, py + 6 + Math.sin(this.age * 0.07 + tx) * 3);
            for (let i = 0; i <= 8; i++) {
              ctx.lineTo(px + i * 4, py + 6 + Math.sin(this.age * 0.07 + tx + i * 0.8) * 3);
            }
            ctx.lineTo(px + T, py);
            ctx.lineTo(px, py);
            ctx.fill();
          }
          if ((tx * 7 + ty * 3 + Math.floor(this.age / 9)) % 9 === 0) {
            ctx.fillStyle = '#ffe066';
            ctx.fillRect(px + 12, py + 18, 4, 4);
          }
        } else if (ch === '=') {
          ctx.fillStyle = '#a9744f';
          ctx.fillRect(px, py, T, T);
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(px + 14, py, 3, T);
          ctx.fillRect(px, py, T, 4);
          ctx.fillStyle = '#6b4a2b';
          ctx.fillRect(px, py, T, 3);
        }
      }
    }
  }

  dessinerSpeciaux(ctx) {
    if (this.controleSpawn) {
      const { tx, ty } = this.controleSpawn;
      const bx = tx * 32 + 14;
      const bas = (ty + 1) * 32;
      ctx.fillStyle = this.checkpointPris ? '#868e96' : '#adb5bd';
      ctx.fillRect(bx, bas - 56, 4, 56);
      ctx.fillStyle = this.checkpointPris ? '#51cf66' : '#ced4da';
      ctx.beginPath();
      ctx.moveTo(bx + 4, bas - 56);
      ctx.lineTo(bx + 24, bas - 49);
      ctx.lineTo(bx + 4, bas - 42);
      ctx.fill();
    }

    if (this.drapeauPx !== null) {
      const bx = this.drapeauPx + 13;
      const bas = (this.drapeauBaseY + 1) * 32;
      const haut = bas - 10 * 32;
      ctx.fillStyle = '#adb5bd';
      ctx.fillRect(bx, haut, 5, 10 * 32);
      ctx.fillStyle = '#f1f3f5';
      ctx.fillRect(bx - 1, haut, 7, 4);
      ctx.beginPath();
      ctx.arc(bx + 2.5, haut - 6, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd43b';
      ctx.fill();
      const vague = Math.sin(this.age * 0.06) * 4;
      ctx.fillStyle = '#37b24d';
      ctx.beginPath();
      ctx.moveTo(bx, haut + 4);
      ctx.lineTo(bx - 30 + vague, haut + 14);
      ctx.lineTo(bx, haut + 24);
      ctx.fill();
    }

    if (this.axePos && !this.axePris) {
      const { tx, ty } = this.axePos;
      const bob = Math.sin(this.age * 0.1) * 3;
      const cx = tx * 32 + 16;
      const cy = ty * 32 + 16 + bob;
      ctx.fillStyle = '#8a5a30';
      ctx.fillRect(cx - 3, cy - 12, 6, 26);
      ctx.fillStyle = '#ced4da';
      ctx.beginPath();
      ctx.moveTo(cx - 16, cy - 10);
      ctx.lineTo(cx - 2, cy - 14);
      ctx.lineTo(cx - 2, cy + 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#868e96';
      ctx.fillRect(cx - 4, cy - 15, 4, 19);
    }

    if (this.rex && !this.rex.tombe && !this.rex.mort && this.rex.actif) {
      const rx = this.rex;
      if (rx.x > this.camX - 60 && rx.x < this.camX + 1000) {
        for (let i = 0; i < rx.pvMax; i++) {
          const hx = rx.centreX() - rx.pvMax * 9 + i * 18 + 4;
          ctx.font = '14px serif';
          ctx.fillText(i < rx.pv ? '❤' : '🖤', hx, rx.y - 10);
        }
      }
    }
  }

  dessinerHUD(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, this.largeurVue, 32);
    ctx.font = 'bold 17px "Courier New", monospace';
    const ombre = (txt, x, coul) => {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillText(txt, x + 2, 23);
      ctx.fillStyle = coul || '#fff';
      ctx.fillText(txt, x, 21);
    };
    ombre('SCORE ' + String(this.score).padStart(6, '0'), 16);
    ombre('🪙×' + String(this.pieces).padStart(2, '0'), 230);
    ombre('MONDE ' + (this.def ? this.def.id : ''), 380);
    ombre('TEMPS ' + String(Math.max(0, this.temps)).padStart(3, '0'), 600, this.temps <= 100 ? '#ff6b6b' : '#fff');
    ombre('❤×' + this.vies, 800);
  }

  dessinerCarte(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.largeurVue, this.hauteurVue);
    ctx.textAlign = 'center';
    ctx.font = 'bold 40px "Courier New", monospace';
    ctx.fillStyle = '#ffd43b';
    ctx.fillText('MONDE ' + this.def.id, 480, 195);
    ctx.font = 'bold 23px "Courier New", monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(this.def.nom, 480, 245);
    ctx.font = 'bold 27px "Courier New", monospace';
    ctx.fillStyle = '#ff8787';
    ctx.fillText('❤ × ' + this.vies, 480, 310);
    if (this.def.astuce) {
      ctx.font = 'italic 17px "Courier New", monospace';
      ctx.fillStyle = '#9aa5b5';
      ctx.fillText('💡 ' + this.def.astuce, 480, 380);
    }
    ctx.textAlign = 'left';
  }

  dessinerBandeauFin(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, this.largeurVue, this.hauteurVue);
    ctx.fillStyle = 'rgba(18,24,44,0.94)';
    ctx.fillRect(210, 165, 540, 200);
    ctx.strokeStyle = '#ffd43b';
    ctx.lineWidth = 3;
    ctx.strokeRect(210, 165, 540, 200);
    ctx.textAlign = 'center';
    ctx.font = 'bold 31px "Courier New", monospace';
    ctx.fillStyle = '#ffd43b';
    ctx.fillText('NIVEAU TERMINÉ !', 480, 222);
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText('Bonus temps : +' + this.bonusTemps, 480, 265);
    ctx.fillStyle = '#74c0fc';
    ctx.fillText('Pièces : ' + this.piecesNiveau + '/' + this.totalPiecesNiveau, 480, 296);
    ctx.fillStyle = '#ffd43b';
    ctx.fillText('Score : ' + this.score, 480, 330);
    if (this.niveauIndex >= NIVEAUX.length - 1) {
      ctx.font = 'italic 16px "Courier New", monospace';
      ctx.fillStyle = '#9aa5b5';
      ctx.fillText('Le grand final vous attend...', 480, 355);
    }
    ctx.textAlign = 'left';
  }
}
