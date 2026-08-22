function rr(ctx, x, y, w, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

class Etre {
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.vx = 0; this.vy = 0;
    this.auSol = false;
    this.mort = false;
    this.actif = false;
    this.age = 0;
  }
  rect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  centreX() { return this.x + this.w / 2; }
  centreY() { return this.y + this.h / 2; }
}

class Goomba extends Etre {
  constructor(x, y) {
    super(x, y, 28, 28);
    this.type = 'goomba';
    this.vx = -0.8;
    this.ecrase = 0;
  }
  update(jeu) {
    this.age++;
    if (this.ecrase > 0) {
      this.ecrase--;
      if (this.ecrase === 0) this.mort = true;
      return;
    }
    const f = jeu.physique(this);
    if (f.murG) this.vx = Math.abs(this.vx);
    if (f.murD) this.vx = -Math.abs(this.vx);
    if (f.auSol) this.vx = this.vx === 0 ? -0.8 : this.vx;
  }
  dessiner(ctx) {
    const p = Math.floor(this.age / 8) % 2;
    const x = this.x, y = this.y;
    if (this.ecrase > 0) {
      rr(ctx, x, y + 18, 28, 10, '#8a4b22');
      rr(ctx, x + 4, y + 20, 20, 4, '#5d3013');
      return;
    }
    rr(ctx, x + 2, y + 4, 24, 18, '#a05a26');
    rr(ctx, x + 4, y, 20, 8, '#a05a26');
    rr(ctx, x + 6, y + 22, 7, 6, '#4a2408');
    rr(ctx, x + 15, y + 22, 7, 6, '#4a2408');
    if (p === 0) { rr(ctx, x + 4, y + 24, 8, 4, '#2d1604'); rr(ctx, x + 16, y + 22, 8, 4, '#2d1604'); }
    else { rr(ctx, x + 4, y + 22, 8, 4, '#2d1604'); rr(ctx, x + 16, y + 24, 8, 4, '#2d1604'); }
    rr(ctx, x + 7, y + 8, 5, 8, '#fff');
    rr(ctx, x + 16, y + 8, 5, 8, '#fff');
    rr(ctx, x + 8, y + 11, 3, 4, '#000');
    rr(ctx, x + 17, y + 11, 3, 4, '#000');
    ctx.fillStyle = '#3a1c05';
    ctx.fillRect(x + 5, y + 5, 7, 3);
    ctx.fillRect(x + 16, y + 5, 7, 3);
  }
}

class Koopa extends Etre {
  constructor(x, y) {
    super(x, y, 26, 32);
    this.type = 'koopa';
    this.vx = -0.9;
    this.etat = 'marche';
    this.reveil = 0;
  }
  update(jeu) {
    this.age++;
    if (this.etat === 'carapace') {
      if (this.grace > 0) this.grace--;
      this.reveil--;
      if (this.reveil <= 0) { this.etat = 'marche'; this.h = 32; this.y -= 14; this.vx = -0.9; }
      return;
    }
    if (this.etat === 'glisse') {
      if (this.grace > 0) this.grace--;
      const f = jeu.physique(this, 0.55);
      if (f.murG || f.murD) {
        this.vx = -this.vx;
        Sons.jouer('cogne');
        jeu.tremble(3);
      }
      return;
    }
    const f = jeu.physique(this);
    if (f.murG) this.vx = Math.abs(this.vx);
    if (f.murD) this.vx = -Math.abs(this.vx);
    if (f.auSol) {
      const devant = this.vx > 0 ? this.x + this.w + 2 : this.x - 2;
      if (!jeu.estSolidePx(devant, this.y + this.h + 4)) this.vx = -this.vx;
    }
  }
  transformerCarapace() {
    this.etat = 'carapace';
    this.reveil = 480;
    this.vx = 0;
    this.y += 14;
    this.h = 18;
  }
  lancer(dir) {
    this.etat = 'glisse';
    this.vx = 5.6 * dir;
  }
  arreter() {
    this.etat = 'carapace';
    this.reveil = 360;
    this.vx = 0;
  }
  dessiner(ctx) {
    const x = this.x, y = this.y;
    if (this.etat !== 'marche') {
      const rap = this.etat === 'glisse' ? Math.floor(this.age / 3) % 4 : 0;
      rr(ctx, x, y, 26, 18, '#2f9e44');
      rr(ctx, x + 2, y + 2, 22, 12, '#69db7c');
      rr(ctx, x + 4, y + 4, 18, 8, '#2f9e44');
      if (this.etat === 'glisse') {
        const l = [4, 10, 16, 10][rap];
        rr(ctx, x + l, y + 4, 4, 8, '#fff');
      }
      rr(ctx, x, y + 16, 26, 3, '#d8f5a2');
      return;
    }
    const d = this.vx < 0 ? -1 : 1;
    const p = Math.floor(this.age / 8) % 2;
    rr(ctx, x + (d < 0 ? 0 : 16), y, 10, 10, '#d8f5a2');
    rr(ctx, x + (d < 0 ? 1 : 17), y + 3, 5, 4, '#2d1604');
    rr(ctx, x + 3, y + 8, 20, 18, '#2f9e44');
    rr(ctx, x + 5, y + 10, 16, 12, '#69db7c');
    rr(ctx, x + 2, y + 24, 8, 5, '#d8f5a2');
    rr(ctx, x + 16, y + 24, 8, 5, '#d8f5a2');
    if (p === 0) { rr(ctx, x + 1, y + 27, 8, 4, '#94c957'); rr(ctx, x + 17, y + 25, 8, 4, '#94c957'); }
    else { rr(ctx, x + 1, y + 25, 8, 4, '#94c957'); rr(ctx, x + 17, y + 27, 8, 4, '#94c957'); }
  }
}

class Flyer extends Etre {
  constructor(x, y) {
    super(x, y, 28, 26);
    this.type = 'flyer';
    this.vx = -1.1;
    this.yBase = y;
  }
  update(jeu) {
    this.age++;
    const f = jeu.physique(this);
    if (f.murG) this.vx = Math.abs(this.vx);
    if (f.murD) this.vx = -Math.abs(this.vx);
    this.y = this.yBase + Math.sin(this.age * 0.06) * 34;
  }
  dessiner(ctx) {
    const x = this.x, y = this.y;
    const bat = Math.sin(this.age * 0.35);
    const d = this.vx < 0 ? -1 : 1;
    ctx.fillStyle = '#f1f3f5';
    if (bat > 0) {
      ctx.beginPath(); ctx.moveTo(x + (d < 0 ? 24 : 4), y + 6); ctx.lineTo(x + (d < 0 ? 40 : -12), y - 8); ctx.lineTo(x + (d < 0 ? 24 : 4), y + 14); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(x + (d < 0 ? 24 : 4), y + 6); ctx.lineTo(x + (d < 0 ? 38 : -10), y + 16); ctx.lineTo(x + (d < 0 ? 24 : 4), y + 16); ctx.fill();
    }
    rr(ctx, x + 4, y + 4, 20, 18, '#e03131');
    rr(ctx, x + 6, y + 6, 16, 10, '#ff8787');
    rr(ctx, x + (d < 0 ? 0 : 20), y - 2, 8, 8, '#ffd43b');
    rr(ctx, x + (d < 0 ? 1 : 21), y + 1, 4, 3, '#2d1604');
    rr(ctx, x + 6, y + 20, 6, 5, '#ffd43b');
    rr(ctx, x + 16, y + 20, 6, 5, '#ffd43b');
  }
}

class Spiky extends Etre {
  constructor(x, y) {
    super(x, y, 28, 26);
    this.type = 'spiky';
    this.vx = -1.0;
  }
  update(jeu) {
    this.age++;
    const f = jeu.physique(this);
    if (f.murG) this.vx = Math.abs(this.vx);
    if (f.murD) this.vx = -Math.abs(this.vx);
    if (f.auSol) {
      const devant = this.vx > 0 ? this.x + this.w + 2 : this.x - 2;
      if (!jeu.estSolidePx(devant, this.y + this.h + 4)) this.vx = -this.vx;
    }
  }
  dessiner(ctx) {
    const x = this.x, y = this.y;
    ctx.fillStyle = '#862e9c';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + this.age * 0.02;
      ctx.beginPath();
      ctx.moveTo(x + 14 + Math.cos(a) * 10, y + 13 + Math.sin(a) * 9);
      ctx.lineTo(x + 14 + Math.cos(a + 0.5) * 15, y + 13 + Math.sin(a + 0.5) * 14);
      ctx.lineTo(x + 14 + Math.cos(a + 1) * 10, y + 13 + Math.sin(a + 1) * 9);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x + 14, y + 13, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#9c36b5';
    ctx.fill();
    rr(ctx, x + 8, y + 9, 4, 5, '#fff');
    rr(ctx, x + 16, y + 9, 4, 5, '#fff');
    rr(ctx, x + 9, y + 11, 2, 3, '#000');
    rr(ctx, x + 17, y + 11, 2, 3, '#000');
  }
}

class Plante extends Etre {
  constructor(x, y, bas) {
    super(x - 13, y, 26, 30);
    this.type = 'plante';
    this.cycle = Math.floor(Math.random() * 120);
    this.sortie = 0;
    this.bas = bas;
    this.morsure = 0;
  }
  update(jeu) {
    this.age++;
    this.cycle++;
    const periode = this.cycle % 260;
    const loin = Math.abs(jeu.joueur.centreX() - this.centreX()) > 84;
    if (periode < 110) {
      if (loin || this.sortie > 0) this.sortie = Math.min(1, this.sortie + 0.04);
    } else if (periode < 130) {
      this.sortie = Math.max(0, this.sortie - 0.05);
    } else if (periode < 230) {
      this.sortie = Math.max(0, this.sortie - 0.06);
    } else {
      if (loin || this.sortie === 0) this.sortie = Math.min(1, this.sortie + 0.04);
    }
    if (this.sortie > 0.25) this.morsure = (this.morsure + 0.25) % (Math.PI * 2);
  }
  rect() {
    if (this.sortie < 0.2) return { x: -9999, y: -9999, w: 0, h: 0 };
    const h = this.h * this.sortie;
    return { x: this.x, y: this.bas - h, w: this.w, h };
  }
  dessiner(ctx) {
    if (this.sortie <= 0.01) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.x - 6, this.bas - 200, this.w + 12, 200);
    ctx.clip();
    const h = this.h * this.sortie;
    const top = this.bas - h;
    rr(ctx, this.x + 9, top + 12, 8, h - 8, '#2f9e44');
    rr(ctx, this.x + 9, top + 12, 3, h - 8, '#69db7c');
    rr(ctx, this.x + 2, top, 22, 16, '#e03131');
    rr(ctx, this.x + 4, top + 2, 18, 8, '#ff8787');
    const ouv = 3 + Math.sin(this.morsure) * 2;
    rr(ctx, this.x + 4, top + 10 - ouv / 2, 18, ouv + 2, '#fff');
    rr(ctx, this.x + 7, top + 10 - ouv / 2 + 1, 3, ouv, '#e03131');
    rr(ctx, this.x + 14, top + 10 - ouv / 2 + 1, 3, ouv, '#e03131');
    ctx.restore();
  }
}

class BouleFeu extends Etre {
  constructor(x, y, dir, proprietaire = 'joueur') {
    super(x, y, 14, 14);
    this.type = 'boule';
    this.proprietaire = proprietaire;
    this.vx = (proprietaire === 'joueur' ? 6 : 3.6) * dir;
    this.vy = proprietaire === 'joueur' ? -2 : 0;
    this.vie = 260;
    this.t = 0;
  }
  update(jeu) {
    this.t++;
    this.vie--;
    if (this.vie <= 0) { this.mort = true; return; }
    if (this.proprietaire === 'joueur') {
      const f = jeu.physique(this, 0.42);
      if (f.auSol) this.vy = -5.2;
      if (f.murG || f.murD) { this.mort = true; jeu.etincelles(this.centreX(), this.centreY(), '#ff922b', 6); }
    } else {
      this.x += this.vx;
      this.y += Math.sin(this.t * 0.08) * 0.7;
      if (jeu.estSolidePx(this.centreX(), this.centreY())) { this.mort = true; jeu.etincelles(this.centreX(), this.centreY(), '#e599f7', 6); }
    }
    if (this.x < jeu.camX - 80 || this.x > jeu.camX + 1040) this.mort = true;
  }
  dessiner(ctx) {
    const c = this.proprietaire === 'joueur' ? ['#ff922b', '#ffe066'] : ['#e599f7', '#eebefa'];
    ctx.beginPath();
    ctx.arc(this.centreX(), this.centreY(), 7, 0, Math.PI * 2);
    ctx.fillStyle = c[Math.floor(this.t / 3) % 2];
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.centreX() - this.vx, this.centreY(), 3, 0, Math.PI * 2);
    ctx.fillStyle = c[0];
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

class Objet extends Etre {
  constructor(x, y, genre) {
    const taille = genre === 'fleur' ? { w: 28, h: 30 } : { w: 26, h: 26 };
    super(x, y, taille.w, taille.h);
    this.genre = genre;
    this.sors = genre === 'champignon' || genre === 'unup' || genre === 'etoile' ? 32 : 0;
    this.vx = 0;
    this.vy = 0;
  }
  update(jeu) {
    this.age++;
    if (this.sors > 0) {
      this.y -= 1.2;
      this.sors -= 1.2;
      return;
    }
    if (this.genre === 'champignon' || this.genre === 'unup') {
      if (this.vx === 0) this.vx = 1.7;
      const f = jeu.physique(this);
      if (f.murG) this.vx = Math.abs(this.vx);
      if (f.murD) this.vx = -Math.abs(this.vx);
    } else if (this.genre === 'etoile') {
      if (this.vx === 0) this.vx = 2.2;
      const f = jeu.physique(this, 0.3);
      if (f.auSol) this.vy = -9;
      if (f.murG) this.vx = Math.abs(this.vx);
      if (f.murD) this.vx = -Math.abs(this.vx);
    }
  }
  dessiner(ctx) {
    const x = this.x, y = this.y;
    if (this.genre === 'champignon' || this.genre === 'unup') {
      const cap = this.genre === 'champignon' ? '#e03131' : '#37b24d';
      const pt = this.genre === 'champignon' ? '#fff' : '#b2f2bb';
      rr(ctx, x + 1, y + 2, 24, 12, cap);
      rr(ctx, x + 5, y, 16, 4, cap);
      rr(ctx, x + 5, y + 4, 5, 5, pt);
      rr(ctx, x + 16, y + 3, 5, 6, pt);
      rr(ctx, x + 10, y + 1, 5, 4, pt);
      rr(ctx, x + 5, y + 14, 16, 12, '#ffe066');
      rr(ctx, x + 8, y + 17, 3, 3, '#2d1604');
      rr(ctx, x + 15, y + 17, 3, 3, '#2d1604');
    } else if (this.genre === 'fleur') {
      rr(ctx, x + 11, y + 16, 6, 14, '#2f9e44');
      rr(ctx, x + 2, y + 20, 9, 4, '#2f9e44');
      rr(ctx, x + 17, y + 22, 9, 4, '#2f9e44');
      const p = Math.floor(this.age / 8) % 2;
      rr(ctx, x + 6, y + 2, 16, 14, p ? '#fd7e14' : '#f76707');
      rr(ctx, x + 9, y + 5, 10, 8, '#ffe066');
      rr(ctx, x + 11, y + 7, 6, 4, '#fff');
    } else if (this.genre === 'etoile') {
      const sc = Math.floor(this.age / 4) % 2;
      ctx.beginPath();
      ctx.moveTo(x + 13, y);
      ctx.lineTo(x + 16 + sc, y + 9);
      ctx.lineTo(x + 26, y + 10 + sc);
      ctx.lineTo(x + 19, y + 17);
      ctx.lineTo(x + 21, y + 26);
      ctx.lineTo(x + 13, y + 21);
      ctx.lineTo(x + 5, y + 26);
      ctx.lineTo(x + 7, y + 17);
      ctx.lineTo(x, y + 10 + sc);
      ctx.lineTo(x + 10 - sc, y + 9);
      ctx.closePath();
      ctx.fillStyle = sc ? '#ffe066' : '#ffd43b';
      ctx.fill();
      rr(ctx, x + 9, y + 10, 3, 4, '#000');
      rr(ctx, x + 15, y + 10, 3, 4, '#000');
    }
  }
}

class PieceLibre extends Etre {
  constructor(x, y) {
    super(x + 4, y + 4, 24, 24);
    this.type = 'piece';
  }
  update() { this.age++; }
  dessiner(ctx) {
    const ph = Math.cos(this.age * 0.12);
    const lx = this.x + 12, ly = this.y + 12;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.scale(Math.max(0.25, Math.abs(ph)), 1);
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd43b';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#ffe99a';
    ctx.fill();
    ctx.restore();
    if (ph > 0.85) { rr(ctx, lx - 1, ly - 6, 2, 12, '#f59f00'); }
  }
}

class PlateformeMobile extends Etre {
  constructor(x, y, axe, portee, vitesse) {
    super(x * 32, y * 32, 96, 16);
    this.axe = axe;
    this.portee = portee * 32;
    this.vitesse = vitesse;
    this.t = Math.random() * 1000;
    this.dxPrecedent = 0;
    this.dyPrecedent = 0;
    this.ancreX = this.x;
    this.ancreY = this.y;
  }
  update() {
    this.t++;
    const tri = Math.asin(Math.sin(this.t * 0.014 * this.vitesse)) / (Math.PI / 2);
    const nx = this.axe === '-' ? this.ancreX + tri * this.portee : this.ancreX;
    const ny = this.axe === '|' ? this.ancreY + tri * this.portee : this.ancreY;
    this.dxPrecedent = nx - this.x;
    this.dyPrecedent = ny - this.y;
    this.x = nx;
    this.y = ny;
  }
  dessiner(ctx) {
    const x = this.x, y = this.y;
    rr(ctx, x, y, 96, 16, '#e8a33d');
    rr(ctx, x, y, 96, 5, '#ffc078');
    rr(ctx, x, y + 12, 96, 4, '#b06a1e');
    rr(ctx, x + 8, y + 6, 6, 4, '#b06a1e');
    rr(ctx, x + 44, y + 6, 6, 4, '#b06a1e');
    rr(ctx, x + 80, y + 6, 6, 4, '#b06a1e');
  }
}

class Rex extends Etre {
  constructor(x, y, pv) {
    super(x * 32, y * 32, 54, 54);
    this.type = 'rex';
    this.pvMax = pv;
    this.pv = pv;
    this.vx = -1.15;
    this.gravite = true;
    this.cdSaut = 120;
    this.cdFeu = 90;
    this.flash = 0;
    this.tombe = false;
    this.zoneMin = x * 32 - 190;
    this.zoneMax = x * 32 + 190;
  }
  update(jeu) {
    this.age++;
    if (this.flash > 0) this.flash--;
    if (this.tombe) {
      this.vy += 0.5;
      this.y += this.vy;
      if (this.y > 16 * 32 + 120) this.mort = true;
      return;
    }
    const f = jeu.physique(this, 0.5);
    if (f.murG) this.vx = Math.abs(this.vx);
    if (f.murD) this.vx = -Math.abs(this.vx);
    if (this.x < this.zoneMin) this.vx = Math.abs(this.vx);
    if (this.x + this.w > this.zoneMax) this.vx = -Math.abs(this.vx);
    if (f.auSol) {
      this.cdSaut--;
      if (this.cdSaut <= 0 && Math.random() < 0.5) {
        this.vy = -9.5;
        this.cdSaut = 130 + Math.random() * 60;
      }
    }
    this.cdFeu--;
    if (this.cdFeu <= 0 && this.x > jeu.camX - 60 && this.x < jeu.camX + 1020) {
      const dir = jeu.joueur.centreX() > this.centreX() ? 1 : -1;
      jeu.projectiles.push(new BouleFeu(this.centreX() + dir * 26, this.y + 14, dir, 'ennemi'));
      Sons.jouer('feuBoss');
      this.cdFeu = 150 - (this.pvMax - this.pv) * 14;
    }
  }
  toucher(degats = 1) {
    this.pv -= degats;
    this.flash = 12;
    Sons.jouer('bossTouche');
    if (this.pv <= 0) {
      this.tombe = true;
      this.vy = -7;
      Sons.jouer('bossMeurt');
      return true;
    }
    return false;
  }
  precipiter() { this.tombe = true; this.vy = 2; }
  dessiner(ctx) {
    const x = this.x, y = this.y;
    const d = this.vx < 0 ? -1 : 1;
    if (this.flash > 0 && this.flash % 4 < 2) {
      rr(ctx, x, y, 54, 54, '#fff');
      return;
    }
    rr(ctx, x + 8, y + 10, 40, 40, '#c92a2a');
    rr(ctx, x + 14, y + 30, 30, 18, '#ffe8cc');
    rr(ctx, x + (d < 0 ? 2 : 38), y + 2, 16, 14, '#c92a2a');
    rr(ctx, x + (d < 0 ? 4 : 40), y - 4, 6, 8, '#ffe066');
    rr(ctx, x + (d < 0 ? 12 : 48), y - 4, 6, 8, '#ffe066');
    rr(ctx, x + (d < 0 ? 5 : 41), y + 6, 5, 5, '#fff');
    rr(ctx, x + (d < 0 ? 6 : 42), y + 7, 3, 3, '#000');
    rr(ctx, x + (d < 0 ? 46 : 4), y + 8, 6, 4, '#f8f9fa');
    for (let i = 0; i < 4; i++) {
      rr(ctx, x + 14 + i * 8, y + 6 - i, 4, 6, '#ffe066');
    }
    rr(ctx, x + 6, y + 46, 14, 8, '#862e2e');
    rr(ctx, x + 34, y + 46, 14, 8, '#862e2e');
  }
}

function creerEnnemi(spawn) {
  const px = spawn.x * 32 + 2;
  const py = spawn.y * 32 + (32 - (spawn.type === 'g' ? 28 : spawn.type === 'k' ? 32 : spawn.type === 's' ? 26 : 28));
  switch (spawn.type) {
    case 'g': return new Goomba(px, py);
    case 'k': return new Koopa(px, py);
    case 'f': return new Flyer(px, py);
    case 's': return new Spiky(px, py);
  }
  return null;
}
