function Carte(largeur) {
  const g = Array.from({ length: 16 }, () => Array(largeur).fill(' '));
  const ennemis = [];
  const plateformes = [];
  const api = {
    l: largeur, g, ennemis, plateformes,
    sol(x0, x1, haut = 14) {
      for (let x = Math.max(0, x0); x <= Math.min(largeur - 1, x1); x++)
        for (let y = haut; y < 16; y++) g[y][x] = '#';
    },
    bloc(x, y, ch) { if (x >= 0 && x < largeur && y >= 0 && y < 16) g[y][x] = ch; },
    rangee(x0, x1, y, ch) { for (let x = Math.max(0, x0); x <= Math.min(largeur - 1, x1); x++) g[y][x] = ch; },
    mur(x, y0, y1, ch = 'X') { for (let y = Math.max(0, y0); y <= Math.min(15, y1); y++) g[y][x] = ch; },
    tuyau(x, h, base = 14) {
      const t = base - h;
      g[t][x] = '['; g[t][x + 1] = ']';
      for (let y = t + 1; y < base; y++) { g[y][x] = '{'; g[y][x + 1] = '}'; }
    },
    plante(x, h, base = 14) { this.bloc(x, base - h - 1, 'V'); },
    escalier(x, h, dir = 1) {
      for (let i = 0; i < h; i++) {
        const cx = x + i * dir;
        const hauteurCol = dir === 1 ? i + 1 : h - i;
        for (let j = 0; j < hauteurCol; j++) this.bloc(cx, 13 - j, 'X');
      }
    },
    pieces(x, y, n, pas = 1) { for (let i = 0; i < n; i++) this.bloc(x + i * pas, y, 'o'); },
    trou(x0, x1) {
      for (let x = Math.max(0, x0); x <= Math.min(largeur - 1, x1); x++)
        for (let y = 0; y < 16; y++) if (g[y][x] === '#') g[y][x] = ' ';
    },
    lave(x0, x1) {
      this.trou(x0, x1);
      for (let x = Math.max(0, x0); x <= Math.min(largeur - 1, x1); x++) { g[14][x] = '~'; g[15][x] = '~'; }
    },
    pics(x0, x1, y = 13) { this.rangee(x0, x1, y, '^'); },
    pont(x0, x1, y) { this.rangee(x0, x1, y, '='); },
    plafond(x0, x1, y = 0, ch = 'X') { this.rangee(x0, x1, y, ch); },
    ennemi(type, x, y = 13) { ennemis.push({ type, x, y }); },
    plateforme(x, y, axe, portee = 3, vitesse = 0.8) { plateformes.push({ x, y, axe, portee, vitesse }); },
  };
  return api;
}

const NIVEAUX = [
  {
    id: '1-1', monde: 1, niv: 1, theme: 'plaine', nom: 'Prairie ensoleillée', largeur: 172,
    astuce: 'Cours avec MAJ et saute avec ESPACE !',
    creer(c) {
      c.sol(0, 171);
      c.bloc(2, 13, '@');
      c.rangee(16, 16, 10, 'B'); c.bloc(17, 10, '?'); c.rangee(18, 18, 10, 'B');
      c.bloc(19, 10, 'M'); c.rangee(20, 20, 10, 'B'); c.bloc(18, 6, 'M');
      c.ennemi('g', 24);
      c.tuyau(30, 2);
      c.tuyau(40, 3); c.plante(41, 3);
      c.trou(50, 51);
      c.rangee(58, 62, 9, 'B'); c.bloc(60, 9, '?'); c.pieces(58, 5, 5);
      c.ennemi('k', 70);
      c.bloc(74, 9, 'M'); c.bloc(78, 6, 'U');
      c.ennemi('g', 84); c.ennemi('g', 87);
      c.escalier(94, 4);
      c.trou(99, 101);
      c.escalier(102, 4, -1);
      c.bloc(110, 13, '*');
      c.trou(114, 117); c.pieces(114, 9, 4);
      c.ennemi('f', 122, 9);
      c.bloc(126, 9, 'M');
      c.ennemi('s', 132);
      c.rangee(140, 143, 9, 'B'); c.pieces(140, 8, 4);
      c.ennemi('k', 148);
      c.escalier(154, 7);
      c.pieces(150, 8, 3);
      c.bloc(164, 13, 'F');
    },
  },
  {
    id: '1-2', monde: 1, niv: 2, theme: 'plaine', nom: 'Collines et tuyaux', largeur: 186,
    astuce: 'Écrase les ennemis en leur sautant dessus !',
    creer(c) {
      c.sol(0, 185);
      c.bloc(2, 13, '@');
      c.sol(18, 34, 12);
      c.ennemi('g', 24, 11); c.pieces(20, 10, 4);
      c.tuyau(44, 2); c.plante(44, 2);
      c.tuyau(54, 3); c.plante(54, 3);
      c.trou(64, 66); c.rangee(63, 67, 10, 'B'); c.pieces(64, 9, 3);
      c.ennemi('k', 72); c.ennemi('k', 76);
      c.rangee(80, 84, 10, 'B'); c.bloc(81, 10, '?'); c.bloc(83, 10, 'M');
      c.trou(88, 90); c.plateforme(88, 10, '-', 2, 1);
      c.sol(96, 112, 11);
      c.ennemi('s', 104, 10);
      c.bloc(100, 7, 'S');
      c.pieces(96, 9, 6);
      c.bloc(120, 13, '*');
      c.ennemi('g', 126); c.ennemi('g', 129); c.ennemi('g', 132);
      c.tuyau(138, 4); c.plante(138, 4);
      c.trou(144, 147); c.plateforme(145, 10, '|', 2, 0.9);
      c.rangee(150, 154, 8, 'B'); c.bloc(152, 8, '?');
      c.ennemi('f', 160, 8);
      c.pieces(156, 11, 4);
      c.escalier(166, 6);
      c.bloc(178, 13, 'F');
    },
  },
  {
    id: '1-3', monde: 1, niv: 3, theme: 'ciel', nom: 'Îles du ciel', largeur: 168,
    astuce: 'Les plateformes bougent : vise tes sauts !',
    creer(c) {
      c.sol(0, 14); c.sol(26, 38); c.sol(52, 60); c.sol(74, 88); c.sol(104, 118); c.sol(132, 167);
      c.bloc(2, 13, '@');
      c.plateforme(16, 10, '-', 2, 0.9);
      c.ennemi('f', 30, 8);
      c.pieces(27, 10, 4);
      c.bloc(33, 10, 'M');
      c.plateforme(44, 9, '|', 2, 0.9);
      c.ennemi('f', 56, 7);
      c.bloc(55, 9, '?');
      c.plateforme(64, 9, '-', 3, 1);
      c.plateforme(90, 10, '|', 2, 1);
      c.pieces(75, 10, 5);
      c.bloc(78, 13, '*');
      c.bloc(80, 6, 'S');
      c.ennemi('s', 84);
      c.ennemi('k', 106);
      c.plateforme(120, 9, '-', 2, 1);
      c.ennemi('f', 108, 8);
      c.pieces(105, 10, 4);
      c.ennemi('g', 134); c.ennemi('g', 137); c.ennemi('g', 140);
      c.bloc(138, 10, 'U');
      c.pieces(144, 9, 5);
      c.escalier(150, 7);
      c.bloc(162, 13, 'F');
    },
  },
  {
    id: '1-4', monde: 1, niv: 4, theme: 'chateau', nom: 'Château de Rex', largeur: 152,
    astuce: 'Tire des boules de feu avec MAJ, ou coupe le pont !',
    creer(c) {
      c.sol(0, 151);
      c.plafond(0, 151);
      c.mur(0, 0, 10);
      c.bloc(3, 13, '@');
      c.lave(22, 25); c.plateforme(22, 11, '-', 2, 1);
      c.lave(44, 48); c.plateforme(44, 11, '-', 2, 1); c.plateforme(47, 8, '-', 2, 0.9);
      c.pics(64, 66);
      c.ennemi('s', 74);
      c.ennemi('f', 80, 8);
      c.rangee(88, 96, 8, 'B'); c.pieces(88, 7, 4, 3);
      c.ennemi('g', 91); c.ennemi('g', 94);
      c.bloc(98, 13, '*');
      c.lave(102, 105); c.plateforme(103, 10, '|', 2, 1);
      c.pieces(108, 10, 4);
      c.lave(126, 140); c.pont(126, 140, 12);
      c.bloc(133, 11, 'R');
      c.bloc(143, 13, 'X'); c.bloc(143, 12, 'A');
      c.mur(148, 0, 13);
    },
  },
  {
    id: '2-1', monde: 2, niv: 1, theme: 'souterrain', nom: 'Galerie aux trésors', largeur: 176,
    astuce: 'Fais glisser les carapaces sur les ennemis !',
    creer(c) {
      c.sol(0, 175);
      c.plafond(0, 175);
      c.bloc(2, 13, '@');
      c.rangee(12, 18, 10, 'B'); c.pieces(12, 9, 7);
      c.ennemi('g', 21);
      c.rangee(24, 28, 7, 'B'); c.pieces(24, 6, 5);
      c.tuyau(40, 3); c.plante(40, 3);
      c.trou(50, 52); c.pieces(49, 9, 5);
      c.rangee(60, 66, 9, 'B'); c.rangee(60, 66, 5, 'B');
      c.ennemi('g', 62); c.ennemi('g', 64);
      c.bloc(68, 9, 'M'); c.bloc(71, 9, 'U');
      c.ennemi('k', 86);
      c.ennemi('g', 93); c.ennemi('g', 96); c.ennemi('g', 99);
      c.bloc(104, 13, '*');
      c.trou(110, 113); c.plateforme(111, 10, '-', 2, 1);
      c.rangee(116, 119, 9, 'B'); c.pieces(116, 5, 10);
      c.ennemi('s', 128); c.ennemi('s', 131);
      c.tuyau(138, 2);
      c.ennemi('f', 144, 8);
      c.escalier(150, 6);
      c.bloc(162, 13, 'F');
    },
  },
  {
    id: '2-2', monde: 2, niv: 2, theme: 'souterrain', nom: 'Le grand puits', largeur: 162,
    astuce: 'Cherche les passages en hauteur !',
    creer(c) {
      c.sol(0, 161);
      c.plafond(0, 161);
      c.bloc(2, 13, '@');
      c.ennemi('g', 12); c.ennemi('g', 15);
      c.plateforme(22, 12, '|', 2, 0.8);
      c.plateforme(26, 9, '|', 2, 0.9);
      c.rangee(31, 45, 6, 'X'); c.pieces(33, 5, 6);
      c.ennemi('g', 37, 5); c.ennemi('g', 40, 5);
      c.rangee(52, 64, 8, 'X'); c.pieces(54, 7, 5);
      c.ennemi('k', 58, 7);
      c.bloc(58, 13, '*');
      c.ennemi('f', 48, 6); c.ennemi('f', 68, 5);
      c.rangee(72, 86, 5, 'X'); c.pieces(74, 4, 6);
      c.bloc(80, 3, 'S');
      c.ennemi('s', 78, 4);
      c.escalier(90, 4);
      c.trou(96, 99); c.plateforme(96, 10, '-', 2, 1);
      c.ennemi('k', 108); c.ennemi('k', 112);
      c.bloc(116, 9, 'M');
      c.pieces(118, 6, 6);
      c.escalier(126, 6);
      c.bloc(140, 13, 'F');
    },
  },
  {
    id: '2-3', monde: 2, niv: 3, theme: 'souterrain', nom: 'Traversée ardente', largeur: 172,
    astuce: 'La lave est mortelle : reste sur les plateformes !',
    creer(c) {
      c.sol(0, 171);
      c.plafond(0, 171);
      c.bloc(2, 13, '@');
      c.lave(18, 21); c.plateforme(17, 11, '-', 2, 1);
      c.lave(34, 38); c.plateforme(36, 10, '|', 2, 1);
      c.lave(52, 55); c.plateforme(51, 10, '-', 2, 1);
      c.pics(66, 68);
      c.ennemi('s', 76); c.ennemi('s', 79); c.ennemi('s', 82);
      c.rangee(88, 92, 9, 'B'); c.ennemi('k', 89);
      c.ennemi('g', 96); c.ennemi('g', 99);
      c.lave(102, 107); c.plateforme(101, 11, '-', 2, 1); c.plateforme(104, 8, '-', 2, 0.9);
      c.bloc(110, 13, '*');
      c.ennemi('f', 116, 8); c.ennemi('f', 120, 7); c.ennemi('f', 124, 8);
      c.bloc(130, 9, 'M'); c.bloc(134, 6, 'S');
      c.lave(140, 144); c.plateforme(142, 9, '|', 2, 1);
      c.pieces(146, 9, 5);
      c.escalier(152, 5);
      c.bloc(162, 13, 'F');
    },
  },
  {
    id: '2-4', monde: 2, niv: 4, theme: 'chateau', nom: 'Bastion de Rex', largeur: 158,
    astuce: 'Rex a appris ! Il résiste à 6 boules de feu.',
    creer(c) {
      c.sol(0, 157);
      c.plafond(0, 157);
      c.mur(0, 0, 10);
      c.bloc(3, 13, '@');
      c.lave(16, 20); c.plateforme(16, 11, '-', 2, 1.05);
      c.pics(30, 33);
      c.lave(42, 47); c.plateforme(43, 10, '|', 2, 1);
      c.ennemi('f', 50, 8); c.ennemi('f', 54, 7);
      c.rangee(60, 68, 8, 'B'); c.pieces(60, 7, 3, 4);
      c.ennemi('s', 63); c.ennemi('s', 66);
      c.lave(74, 80); c.plateforme(74, 10, '|', 2, 1); c.plateforme(78, 8, '|', 2, 0.9);
      c.bloc(84, 13, '*');
      c.rangee(88, 94, 4, 'X');
      c.ennemi('g', 96); c.ennemi('g', 99); c.ennemi('g', 102);
      c.lave(106, 112); c.plateforme(105, 11, '-', 2, 1); c.plateforme(109, 8, '|', 2, 1);
      c.pieces(114, 10, 4);
      c.lave(118, 138); c.pont(118, 138, 12);
      c.bloc(128, 11, 'R');
      c.bloc(141, 13, 'X'); c.bloc(141, 12, 'A');
      c.mur(146, 0, 13);
    },
  },
  {
    id: '3-1', monde: 3, niv: 1, theme: 'ciel', nom: "Aurore dorée", largeur: 192,
    astuce: 'Le soleil se lève sur les dernières îles...',
    creer(c) {
      c.sol(0, 18); c.sol(34, 46); c.sol(62, 72); c.sol(90, 104); c.sol(128, 142); c.sol(158, 191);
      c.bloc(2, 13, '@');
      c.plateforme(20, 10, '-', 2, 1);
      c.pieces(8, 10, 4);
      c.ennemi('f', 38, 7);
      c.bloc(40, 10, 'M');
      c.pieces(35, 10, 4);
      c.plateforme(50, 9, '|', 2, 1);
      c.ennemi('f', 66, 6);
      c.pieces(64, 10, 4);
      c.plateforme(76, 8, '-', 3, 0.9);
      c.plateforme(108, 10, '|', 2, 1);
      c.ennemi('s', 100);
      c.bloc(96, 6, 'S');
      c.bloc(92, 13, '*');
      c.ennemi('f', 132, 7);
      c.bloc(134, 10, 'U');
      c.ennemi('k', 138);
      c.pieces(130, 10, 4);
      c.plateforme(144, 9, '-', 3, 1.1);
      c.ennemi('g', 160); c.ennemi('g', 163); c.ennemi('g', 166);
      c.pieces(170, 9, 5);
      c.escalier(174, 8);
      c.bloc(184, 13, 'F');
    },
  },
  {
    id: '3-2', monde: 3, niv: 2, theme: 'plaine', nom: 'Retour aux sources', largeur: 182,
    astuce: 'Un dernier tour dans la prairie... méfie-toi !',
    creer(c) {
      c.sol(0, 181);
      c.bloc(2, 13, '@');
      c.tuyau(14, 2); c.plante(14, 2);
      c.tuyau(24, 3); c.plante(24, 3);
      c.tuyau(36, 4); c.plante(36, 4);
      c.ennemi('k', 46); c.ennemi('k', 49); c.ennemi('k', 52);
      c.rangee(60, 66, 9, 'B'); c.rangee(60, 66, 6, 'B');
      c.pieces(61, 8, 5); c.bloc(70, 9, 'U');
      c.ennemi('g', 64); c.ennemi('g', 74);
      c.trou(82, 85); c.plateforme(82, 10, '-', 2, 1);
      c.pics(90, 92);
      c.ennemi('s', 96);
      c.bloc(100, 13, '*');
      c.ennemi('k', 106);
      c.ennemi('g', 112); c.ennemi('g', 115); c.ennemi('g', 118); c.ennemi('g', 121);
      c.rangee(124, 125, 9, 'B');
      c.bloc(128, 9, 'M'); c.bloc(132, 6, 'S');
      c.trou(136, 140); c.plateforme(138, 10, '|', 2, 1);
      c.ennemi('f', 146, 8); c.ennemi('f', 150, 7);
      c.pieces(152, 9, 4);
      c.escalier(158, 7);
      c.bloc(172, 13, 'F');
    },
  },
  {
    id: '3-3', monde: 3, niv: 3, theme: 'ciel', nom: "L'ascension finale", largeur: 202,
    astuce: 'Le grand vide... garde ton élan !',
    creer(c) {
      c.sol(0, 201);
      c.bloc(2, 13, '@');
      c.tuyau(10, 2);
      c.ennemi('g', 14); c.ennemi('g', 16);
      c.trou(20, 23); c.plateforme(20, 10, '-', 2, 1);
      c.trou(30, 34); c.plateforme(32, 9, '|', 2, 1);
      c.trou(44, 48); c.plateforme(43, 10, '-', 2, 1);
      c.pics(56, 59);
      c.ennemi('s', 64); c.ennemi('s', 67);
      c.rangee(70, 76, 9, 'B'); c.pieces(70, 5, 7); c.bloc(73, 9, 'U');
      c.ennemi('k', 80);
      c.bloc(86, 13, '*');
      c.trou(92, 120);
      c.pieces(94, 6, 12); c.pieces(108, 6, 10);
      c.plateforme(92, 10, '-', 2, 1.05);
      c.plateforme(100, 8, '|', 2, 1);
      c.plateforme(108, 9, '-', 2, 1.1);
      c.plateforme(116, 7, '|', 2, 1);
      c.ennemi('f', 98, 6); c.ennemi('f', 110, 5); c.ennemi('f', 118, 6);
      c.bloc(124, 9, 'S'); c.bloc(128, 9, 'M');
      c.ennemi('g', 132); c.ennemi('g', 135);
      c.escalier(140, 8);
      c.escalier(152, 8, -1);
      c.ennemi('k', 158);
      c.pieces(156, 8, 4);
      c.escalier(164, 7);
      c.bloc(180, 13, 'F');
    },
  },
  {
    id: '3-4', monde: 3, niv: 4, theme: 'chateau', nom: 'Le Grand Château', largeur: 178,
    astuce: "Dernier combat : Rex est furieux !",
    creer(c) {
      c.sol(0, 177);
      c.plafond(0, 177);
      c.mur(0, 0, 10);
      c.bloc(3, 13, '@');
      c.pics(14, 16);
      c.lave(24, 29); c.plateforme(23, 11, '-', 2, 1.1);
      c.ennemi('s', 36); c.ennemi('s', 39);
      c.ennemi('f', 44, 8); c.ennemi('f', 48, 7);
      c.lave(54, 60); c.plateforme(55, 9, '|', 2, 1); c.plateforme(58, 11, '|', 2, 0.9);
      c.rangee(66, 74, 8, 'B'); c.pieces(66, 7, 3, 4);
      c.ennemi('s', 70);
      c.bloc(78, 13, '*');
      c.lave(84, 98);
      c.plateforme(84, 10, '-', 2, 1); c.plateforme(90, 7, '|', 2, 1); c.plateforme(96, 10, '-', 2, 1);
      c.pieces(86, 6, 3, 4); c.pieces(92, 5, 3);
      c.pics(104, 107);
      c.ennemi('g', 112); c.ennemi('g', 115);
      c.lave(120, 126); c.plateforme(119, 11, '-', 2, 1.05); c.plateforme(123, 9, '-', 2, 1);
      c.pieces(127, 10, 4);
      c.lave(132, 152); c.pont(132, 152, 12);
      c.bloc(142, 11, 'R');
      c.bloc(155, 13, 'X'); c.bloc(155, 12, 'A');
      c.pieces(160, 12, 6); c.pieces(160, 9, 6);
      c.mur(170, 0, 13);
    },
  },
];

function construireNiveau(i) {
  const def = NIVEAUX[i];
  const c = Carte(def.largeur);
  def.creer(c);
  let totalPieces = 0;
  for (const ligne of c.g) for (const ch of ligne) if (ch === 'o') totalPieces++;
  return {
    index: i,
    def,
    grille: c.g.map((r) => r.join('')),
    ennemisSpawn: c.ennemis,
    plateformesSpawn: c.plateformes,
    largeur: def.largeur,
    totalPieces,
  };
}
