class Joueur {
  constructor(jeu, x, y) {
    this.jeu = jeu;
    this.x = x;
    this.y = y;
    this.w = 24;
    this.h = 28;
    this.vx = 0;
    this.vy = 0;
    this.taille = 'petit';
    this.feu = false;
    this.etoile = 0;
    this.invincible = 0;
    this.dir = 1;
    this.auSol = false;
    this.pose = 'idle';
    this.animT = 0;
    this.sautBuffer = 0;
    this.coyote = 0;
    this.cdTir = 0;
    this.porte = null;
    this.sx = 1;
    this.sy = 1;
    this.auSolPrecedent = true;
    this.vyPrecedente = 0;
    this.accroupi = false;
    this.mort = false;
  }

  centreX() { return this.x + this.w / 2; }
  centreY() { return this.y + this.h / 2; }

  grandir() {
    if (this.taille === 'petit') {
      this.taille = 'grand';
      this.y -= 24;
      this.h = 52;
      Sons.jouer('grandit');
    }
  }

  devenirFeu() {
    this.grandir();
    this.feu = true;
    Sons.jouer('grandit');
  }

  devenirEtoile() {
    this.etoile = 620;
    Sons.jouer('etoileJingle');
  }

  retrecir() {
    this.taille = 'petit';
    this.feu = false;
    this.y += 24;
    this.h = 28;
    this.invincible = 130;
    Sons.jouer('retrecit');
  }

  blesser() {
    if (this.etoile > 0 || this.invincible > 0 || this.mort) return false;
    if (this.taille === 'grand') {
      this.retrecir();
      return false;
    }
    return true;
  }

  update(jeu) {
    const e = jeu.entrees;
    this.age = (this.age || 0) + 1;

    if (this.porte) {
      this.x += this.porte.dxPrecedent;
      this.y += this.porte.dyPrecedent;
      this.porte = null;
    }

    this.accroupi = this.taille === 'grand' && e.bas && this.auSol;
    const hCible = this.accroupi ? 32 : this.taille === 'grand' ? 52 : 28;
    if (hCible !== this.h) {
      this.y += this.h - hCible;
      this.h = hCible;
    }

    const maxV = this.accroupi ? 0 : e.courir ? 4.5 : 2.9;
    const accel = this.auSol ? 0.24 : 0.15;
    let glisse = false;

    if (!this.accroupi && (e.gauche || e.droite)) {
      const sens = e.droite ? 1 : -1;
      if (Math.sign(this.vx) === -sens && Math.abs(this.vx) > 0.6 && this.auSol) {
        this.vx += sens * 0.5;
        glisse = true;
        if (this.age % 5 === 0) jeu.poussiere(this.x + this.w / 2, this.y + this.h);
      } else if (Math.abs(this.vx) < maxV) {
        this.vx += sens * accel;
      }
      this.dir = sens;
    } else if (this.auSol) {
      this.vx *= 0.82;
      if (Math.abs(this.vx) < 0.12) this.vx = 0;
    }
    if (Math.abs(this.vx) > maxV) this.vx = maxV * Math.sign(this.vx);

    if (e.sautPresse) this.sautBuffer = 8;
    if (this.auSol) this.coyote = 6;
    else if (this.coyote > 0) this.coyote--;

    if (this.sautBuffer > 0 && (this.auSol || this.coyote > 0)) {
      this.vy = -11.6 - Math.abs(this.vx) * 0.22;
      this.auSol = false;
      this.coyote = 0;
      this.sautBuffer = 0;
      this.sy = 1.16;
      this.sx = 0.86;
      Sons.jouer(this.taille === 'grand' ? 'sautGrand' : 'saut');
    }
    if (this.sautBuffer > 0) this.sautBuffer--;

    if (this.cdTir > 0) this.cdTir--;
    if (this.feu && e.tirPresse && this.cdTir <= 0) {
      const nb = jeu.projectiles.filter((p) => p.proprietaire === 'joueur').length;
      if (nb < 2) {
        jeu.projectiles.push(new BouleFeu(this.x + (this.dir > 0 ? this.w : -12), this.y + this.h / 2 - 6, this.dir));
        Sons.jouer('balle');
        this.cdTir = 16;
      }
    }

    this.vy += this.vy < 0 && e.saut ? 0.34 : 0.62;
    if (this.vy > 13) this.vy = 13;

    this.x += this.vx;
    this.resoudreHorizontal(jeu);
    this.vyPrecedente = this.vy;
    this.auSolPrecedent = this.auSol;
    this.auSol = false;
    this.y += this.vy;
    this.resoudreVertical(jeu);
    this.attraperPlateforme(jeu);

    if (this.auSol && !this.auSolPrecedent && this.vyPrecedente > 6) {
      this.sx = 1.24;
      this.sy = 0.78;
      jeu.poussiere(this.x + 4, this.y + this.h);
      jeu.poussiere(this.x + this.w - 4, this.y + this.h);
    }
    this.sx += (1 - this.sx) * 0.18;
    this.sy += (1 - this.sy) * 0.18;

    if (this.etoile > 0) this.etoile--;
    if (this.invincible > 0) this.invincible--;

    if (this.pose !== 'mort' && this.pose !== 'drapeau') {
      if (!this.auSol) this.pose = 'saut';
      else if (glisse) this.pose = 'glisse';
      else if (this.accroupi) this.pose = 'accroupi';
      else if (Math.abs(this.vx) > 0.3) this.pose = 'cours';
      else this.pose = 'idle';
      if (this.pose === 'cours') this.animT += Math.abs(this.vx) * 0.55;
    }

    if (this.y > 16 * 32 + 80) jeu.mourirJoueur(true);
  }

  resoudreHorizontal(jeu) {
    const T = 32;
    const y0 = Math.floor(this.y / T);
    const y1 = Math.floor((this.y + this.h - 1) / T);
    if (this.vx > 0) {
      const tx = Math.floor((this.x + this.w) / T);
      for (let ty = y0; ty <= y1; ty++) {
        if (jeu.solide(tx, ty)) { this.x = tx * T - this.w - 0.01; this.vx = 0; break; }
      }
    } else if (this.vx < 0) {
      const tx = Math.floor(this.x / T);
      for (let ty = y0; ty <= y1; ty++) {
        if (jeu.solide(tx, ty)) { this.x = (tx + 1) * T + 0.01; this.vx = 0; break; }
      }
    }
    if (this.x < 0) { this.x = 0; this.vx = 0; }
    const maxX = jeu.largeurPx - this.w;
    if (this.x > maxX) { this.x = maxX; this.vx = 0; }
  }

  resoudreVertical(jeu) {
    const T = 32;
    const x0 = Math.floor((this.x + 2) / T);
    const x1 = Math.floor((this.x + this.w - 3) / T);
    if (this.vy >= 0) {
      const ty = Math.floor((this.y + this.h) / T);
      for (let tx = x0; tx <= x1; tx++) {
        if (jeu.solide(tx, ty)) {
          this.y = ty * T - this.h;
          this.vy = 0;
          this.auSol = true;
          break;
        }
      }
    } else {
      const ty = Math.floor(this.y / T);
      const touchees = [];
      for (let tx = x0; tx <= x1; tx++) {
        if (jeu.solide(tx, ty)) touchees.push({ tx, ty });
      }
      if (touchees.length > 0) {
        this.y = (ty + 1) * T + 0.01;
        this.vy = 0;
        jeu.frapperBlocs(touchees);
      }
    }
  }

  attraperPlateforme(jeu) {
    if (this.vy < 0) return;
    const basAvant = this.y - this.vy + this.h;
    const bas = this.y + this.h;
    for (const p of jeu.plateformes) {
      if (this.x + this.w > p.x + 4 && this.x < p.x + p.w - 4) {
        if (basAvant <= p.y + 8 && bas >= p.y) {
          this.y = p.y - this.h;
          this.vy = 0;
          this.auSol = true;
          this.porte = p;
          break;
        }
      }
    }
  }

  palette() {
    if (this.etoile > 0) {
      const cyc = Math.floor(this.age / 4) % 3;
      if (cyc === 0) return { casque: '#ffd43b', habit: '#ffd43b', salopette: '#fff', peau: '#ffe8cc', bottes: '#f59f00', cheveux: '#f59f00' };
      if (cyc === 1) return { casque: '#fff', habit: '#fff', salopette: '#ffd43b', peau: '#ffe8cc', bottes: '#f59f00', cheveux: '#f59f00' };
    }
    if (this.feu) {
      return { casque: '#f8f9fa', habit: '#f8f9fa', salopette: '#e03131', peau: '#ffd8a8', bottes: '#8b4513', cheveux: '#5c3c21' };
    }
    return { casque: '#e03131', habit: '#e03131', salopette: '#2b53c9', peau: '#ffd8a8', bottes: '#6b4a2b', cheveux: '#5c3c21' };
  }

  dessiner(ctx) {
    if (this.invincible > 0 && this.pose !== 'mort' && Math.floor(this.invincible / 3) % 2 === 0) return;
    const p = this.palette();
    ctx.save();
    ctx.translate(Math.round(this.x + this.w / 2), Math.round(this.y + this.h));
    ctx.scale(this.dir * this.sx, this.sy);
    ctx.translate(-this.w / 2, -this.h);
    const w = this.w;

    if (this.pose === 'mort') {
      rr(ctx, 2, 6, 20, 16, p.habit);
      rr(ctx, 4, 0, 16, 8, p.casque);
      rr(ctx, 5, 8, 14, 8, p.peau);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, 10); ctx.lineTo(12, 14);
      ctx.moveTo(12, 10); ctx.lineTo(8, 14);
      ctx.stroke();
      rr(ctx, 4, 22, 7, 6, p.bottes);
      rr(ctx, 13, 22, 7, 6, p.bottes);
      ctx.restore();
      return;
    }

    const grand = this.taille === 'grand';
    if (this.pose === 'accroupi') {
      rr(ctx, 1, 10, 22, 14, p.habit);
      rr(ctx, 3, 4, 18, 8, p.casque);
      rr(ctx, 4, 12, 16, 8, p.peau);
      rr(ctx, 15, 13, 3, 4, '#000');
      rr(ctx, 3, 24, 8, 8, p.salopette);
      rr(ctx, 13, 24, 8, 8, p.salopette);
      rr(ctx, 1, 28, 10, 4, p.bottes);
      rr(ctx, 13, 28, 10, 4, p.bottes);
      ctx.restore();
      return;
    }

    if (!grand) {
      rr(ctx, 2, 0, 20, 7, p.casque);
      rr(ctx, 0, 4, 24, 3, p.casque);
      rr(ctx, 4, 7, 16, 9, p.peau);
      rr(ctx, 6, 3, 5, 5, p.cheveux);
      rr(ctx, 15, 9, 3, 4, '#000');
      rr(ctx, 6, 14, 12, 2, p.cheveux);
      rr(ctx, 3, 16, 18, 8, p.salopette);
      rr(ctx, 8, 16, 3, 2, '#ffd43b');
      const jambe = this.pose === 'cours' ? Math.floor(this.animT) % 2 : 0;
      if (this.pose === 'saut') {
        rr(ctx, 1, 12, 5, 7, p.habit);
        rr(ctx, 18, 12, 5, 7, p.habit);
        rr(ctx, 3, 24, 8, 4, p.bottes);
        rr(ctx, 13, 24, 8, 4, p.bottes);
      } else if (jambe === 0) {
        rr(ctx, 0, 16, 4, 8, p.habit);
        rr(ctx, 20, 16, 4, 8, p.habit);
        rr(ctx, 2, 24, 9, 4, p.bottes);
        rr(ctx, 13, 24, 9, 4, p.bottes);
      } else {
        rr(ctx, 0, 16, 4, 8, p.habit);
        rr(ctx, 20, 16, 4, 8, p.habit);
        rr(ctx, 0, 24, 9, 4, p.bottes);
        rr(ctx, 15, 24, 9, 4, p.bottes);
      }
      ctx.restore();
      return;
    }

    rr(ctx, 3, 0, 18, 9, p.casque);
    rr(ctx, 0, 6, 24, 4, p.casque);
    rr(ctx, 5, 10, 15, 11, p.peau);
    rr(ctx, 4, 8, 6, 6, p.cheveux);
    rr(ctx, 16, 12, 3, 5, '#000');
    rr(ctx, 5, 18, 14, 3, p.cheveux);
    rr(ctx, 3, 21, 18, 16, p.salopette);
    rr(ctx, 3, 21, 18, 6, p.habit);
    rr(ctx, 6, 22, 3, 8, p.salopette);
    rr(ctx, 15, 22, 3, 8, p.salopette);
    rr(ctx, 9, 27, 2, 2, '#ffd43b');
    rr(ctx, 13, 27, 2, 2, '#ffd43b');
    if (this.pose === 'saut') {
      rr(ctx, 21, 12, 4, 10, p.habit);
      rr(ctx, -1, 12, 4, 10, p.habit);
      rr(ctx, 21, 10, 4, 5, p.peau);
      rr(ctx, -1, 10, 4, 5, p.peau);
      rr(ctx, 3, 37, 9, 8, p.salopette);
      rr(ctx, 13, 37, 9, 8, p.salopette);
      rr(ctx, 1, 45, 10, 6, p.bottes);
      rr(ctx, 13, 45, 10, 6, p.bottes);
    } else if (this.pose === 'glisse') {
      ctx.rotate(-0.12);
      rr(ctx, 20, 22, 5, 9, p.habit);
      rr(ctx, 22, 20, 5, 5, p.peau);
      rr(ctx, 3, 37, 9, 8, p.salopette);
      rr(ctx, 13, 37, 9, 8, p.salopette);
      rr(ctx, 0, 45, 11, 6, p.bottes);
      rr(ctx, 14, 45, 10, 6, p.bottes);
    } else if (this.pose === 'cours') {
      const j = Math.floor(this.animT) % 2;
      if (j === 0) {
        rr(ctx, 20, 24, 4, 9, p.habit);
        rr(ctx, 0, 26, 4, 9, p.habit);
        rr(ctx, 4, 37, 8, 8, p.salopette);
        rr(ctx, 14, 39, 8, 6, p.salopette);
        rr(ctx, 2, 45, 10, 6, p.bottes);
        rr(ctx, 15, 43, 9, 6, p.bottes);
      } else {
        rr(ctx, 20, 26, 4, 9, p.habit);
        rr(ctx, 0, 24, 4, 9, p.habit);
        rr(ctx, 4, 39, 8, 6, p.salopette);
        rr(ctx, 14, 37, 8, 8, p.salopette);
        rr(ctx, 2, 43, 10, 6, p.bottes);
        rr(ctx, 14, 45, 9, 6, p.bottes);
      }
    } else if (this.pose === 'drapeau') {
      rr(ctx, 21, 20, 5, 6, p.peau);
      rr(ctx, 20, 22, 5, 8, p.habit);
      rr(ctx, 3, 37, 9, 8, p.salopette);
      rr(ctx, 13, 37, 9, 8, p.salopette);
      rr(ctx, 1, 45, 10, 6, p.bottes);
      rr(ctx, 13, 45, 10, 6, p.bottes);
    } else {
      const respi = Math.sin((this.age || 0) * 0.05) * 0.8;
      rr(ctx, 21, 24 + respi, 4, 10, p.habit);
      rr(ctx, -1, 24 + respi, 4, 10, p.habit);
      rr(ctx, 21, 22 + respi, 4, 5, p.peau);
      rr(ctx, -1, 22 + respi, 4, 5, p.peau);
      rr(ctx, 3, 37, 9, 8, p.salopette);
      rr(ctx, 13, 37, 9, 8, p.salopette);
      rr(ctx, 1, 45, 10, 6, p.bottes);
      rr(ctx, 13, 45, 10, 6, p.bottes);
    }
    ctx.restore();
  }
}
