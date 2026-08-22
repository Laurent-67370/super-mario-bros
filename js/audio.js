const Sons = (() => {
  let ctx = null;
  let master = null;
  let musiqueGain = null;
  let muet = false;
  let piste = null;
  let evenements = [];
  let dureeBoucle = 0;
  let idx = 0;
  let curseur = 0;
  let timer = null;

  try { muet = localStorage.getItem('smb_muet') === '1'; } catch (e) {}

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muet ? 0 : 0.5;
    master.connect(ctx.destination);
    musiqueGain = ctx.createGain();
    musiqueGain.gain.value = 0.42;
    musiqueGain.connect(master);
  }

  function reprendre() {
    init();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function freq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

  function ton(f0, f1, duree, type, vol, quand, dest) {
    if (!ctx || muet) return;
    const t = quand !== undefined ? quand : ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(20, f0), t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + duree);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    o.connect(g);
    g.connect(dest || master);
    o.start(t);
    o.stop(t + duree + 0.05);
  }

  let bufferBruit = null;
  function bruit(duree, vol, coupe, quand) {
    if (!ctx || muet) return;
    const t = quand !== undefined ? quand : ctx.currentTime;
    if (!bufferBruit) {
      bufferBruit = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const d = bufferBruit.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = bufferBruit;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = coupe || 1200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t);
    src.stop(t + duree + 0.02);
  }

  function sequence(notes, pas, type, vol) {
    if (!ctx || muet) return;
    let t = ctx.currentTime;
    for (const [m, d] of notes) {
      if (m > 0) ton(freq(m), freq(m), d * pas * 0.92, type, vol, t);
      t += d * pas;
    }
  }

  const sfx = {
    saut()      { ton(260, 640, 0.14, 'square', 0.22); },
    sautGrand() { ton(220, 720, 0.18, 'square', 0.24); },
    piece()     { ton(freq(83), freq(83), 0.07, 'square', 0.2); setTimeout(() => ton(freq(88), freq(88), 0.24, 'square', 0.2), 70); },
    ecrase()    { bruit(0.12, 0.3, 900); ton(180, 60, 0.1, 'square', 0.2); },
    cogne()     { ton(120, 80, 0.07, 'square', 0.24); },
    casse()     { bruit(0.2, 0.34, 2400); },
    apparait()  { sequence([[72,1],[76,1],[79,1],[84,1]], 0.055, 'square', 0.2); },
    grandit()   { ton(180, 620, 0.32, 'sawtooth', 0.16); },
    retrecit()  { ton(620, 140, 0.34, 'sawtooth', 0.16); },
    balle()     { ton(700, 180, 0.1, 'square', 0.16); },
    mort()      { sequence([[79,1],[76,1],[72,2],[67,1],[64,1],[60,3]], 0.13, 'square', 0.22); },
    drapeau()   { sequence([[60,1],[64,1],[67,1],[72,1],[76,1],[79,1],[84,2]], 0.11, 'square', 0.2); },
    vie()       { sequence([[72,1],[76,1],[79,1],[84,1],[79,1],[84,2]], 0.1, 'square', 0.22); },
    checkpoint(){ sequence([[76,1],[83,2]], 0.12, 'triangle', 0.26); },
    etoileJingle() { sequence([[72,1],[72,1],[72,1]], 0.09, 'square', 0.2); },
    alerte()    { sequence([[88,1],[88,1]], 0.14, 'square', 0.18); },
    hache()     { bruit(0.5, 0.4, 500); ton(90, 45, 0.5, 'sawtooth', 0.24); },
    bossTouche(){ ton(300, 120, 0.12, 'sawtooth', 0.24); },
    bossMeurt() { ton(400, 50, 0.9, 'sawtooth', 0.26); bruit(0.6, 0.3, 700); },
    feuBoss()   { ton(160, 420, 0.16, 'sawtooth', 0.14); },
    pauseBlip() { ton(freq(84), freq(84), 0.08, 'square', 0.18); },
    clic()      { ton(freq(81), freq(81), 0.06, 'triangle', 0.2); },
    glisse()    { bruit(0.1, 0.12, 3200); },
  };

  const PISTES = {
    plaine: {
      bpm: 164,
      voix: [
        { onde: 'square', vol: 0.16, notes: [
          [72,1],[76,1],[79,1],[76,1],[81,1],[79,1],[76,1],[72,1],
          [74,1],[77,1],[81,1],[77,1],[83,2],[0,2],
          [72,1],[76,1],[79,1],[76,1],[81,1],[84,1],[81,1],[79,1],
          [77,1],[74,1],[71,1],[74,1],[72,3],[0,1],
        ]},
        { onde: 'triangle', vol: 0.3, notes: [
          [48,2],[55,2],[52,2],[55,2],
          [50,2],[57,2],[43,2],[47,2],
          [48,2],[55,2],[52,2],[57,2],
          [50,2],[47,2],[48,4],
        ]},
      ],
    },
    souterrain: {
      bpm: 126,
      voix: [
        { onde: 'square', vol: 0.14, notes: [
          [69,1],[0,1],[72,1],[0,1],[76,1],[0,1],[72,1],[0,1],
          [68,1],[0,1],[71,1],[0,1],[74,1],[0,1],[71,1],[0,1],
          [69,1],[0,1],[72,1],[0,1],[76,1],[0,1],[81,1],[0,1],
          [79,1],[76,1],[72,1],[69,1],[65,2],[0,2],
        ]},
        { onde: 'triangle', vol: 0.28, notes: [
          [45,4],[44,4],[45,4],[41,4],
        ]},
      ],
    },
    chateau: {
      bpm: 108,
      voix: [
        { onde: 'sawtooth', vol: 0.1, notes: [
          [64,1],[65,1],[64,1],[63,1],[64,2],[59,2],
          [64,1],[65,1],[64,1],[63,1],[61,2],[56,2],
          [64,1],[65,1],[64,1],[63,1],[64,2],[66,2],
          [67,2],[63,2],[61,2],[59,2],
        ]},
        { onde: 'triangle', vol: 0.3, notes: [
          [40,2],[40,2],[40,2],[40,2],[38,2],[38,2],[36,2],[35,2],
          [40,2],[40,2],[40,2],[40,2],[43,2],[42,2],[41,2],[40,2],
        ]},
      ],
    },
    ciel: {
      bpm: 142,
      voix: [
        { onde: 'triangle', vol: 0.2, notes: [
          [76,2],[79,1],[84,2],[83,1],[79,2],[76,2],
          [74,2],[77,1],[81,2],[79,1],[77,2],[74,2],
          [76,2],[79,1],[84,2],[86,1],[84,2],[81,2],
          [79,2],[77,2],[76,4],[0,2],
        ]},
        { onde: 'square', vol: 0.09, notes: [
          [64,3],[59,3],[62,3],[57,3],
          [64,3],[59,3],[66,3],[62,3],
        ]},
      ],
    },
    boss: {
      bpm: 152,
      voix: [
        { onde: 'sawtooth', vol: 0.12, notes: [
          [57,1],[57,1],[60,1],[57,1],[58,1],[57,1],[55,2],
          [57,1],[57,1],[62,1],[61,1],[60,1],[58,1],[57,2],
        ]},
        { onde: 'triangle', vol: 0.3, notes: [
          [33,2],[33,2],[33,2],[33,2],[31,2],[31,2],[33,2],[35,2],
        ]},
      ],
    },
    victoire: {
      bpm: 150,
      voix: [
        { onde: 'square', vol: 0.16, notes: [
          [72,1],[72,1],[72,1],[69,2],[72,2],[76,2],
          [74,1],[77,1],[81,2],[79,2],[77,2],[74,2],
          [72,2],[76,2],[79,2],[84,4],
        ]},
        { onde: 'triangle', vol: 0.3, notes: [
          [48,2],[53,2],[55,2],[57,2],[53,2],[55,2],[48,4],[43,2],[48,6],
        ]},
      ],
    },
  };

  function preparer(nom) {
    const chanson = PISTES[nom];
    if (!chanson) return;
    evenements = [];
    let totale = 0;
    for (const v of chanson.voix) {
      let t = 0;
      const pas = 60 / chanson.bpm / 4;
      for (const [m, d] of v.notes) {
        if (m > 0) evenements.push({ t, m, d: d * pas, onde: v.onde, vol: v.vol });
        t += d * pas;
      }
      totale = Math.max(totale, t);
    }
    evenements.sort((a, b) => a.t - b.t);
    dureeBoucle = totale;
  }

  function tick() {
    if (!ctx || !piste) return;
    const limite = ctx.currentTime + 0.35;
    let garde = 0;
    while (curseur + evenements[idx].t < limite && garde++ < 200) {
      const ev = evenements[idx];
      ton(freq(ev.m), freq(ev.m), Math.max(0.08, ev.d * 0.88), ev.onde, ev.vol, curseur + ev.t, musiqueGain);
      idx++;
      if (idx >= evenements.length) { idx = 0; curseur += dureeBoucle; }
    }
  }

  function musique(nom) {
    init();
    if (piste === nom) return;
    arreterMusique();
    if (!PISTES[nom]) return;
    preparer(nom);
    piste = nom;
    if (!ctx) return;
    curseur = ctx.currentTime + 0.12;
    idx = 0;
    tick();
    timer = setInterval(tick, 110);
  }

  function arreterMusique() {
    if (timer) { clearInterval(timer); timer = null; }
    piste = null;
  }

  function inverserSon() {
    muet = !muet;
    try { localStorage.setItem('smb_muet', muet ? '1' : '0'); } catch (e) {}
    if (master) master.gain.value = muet ? 0 : 0.5;
    return muet;
  }

  function jouer(nom) {
    init();
    if (sfx[nom]) sfx[nom]();
  }

  return { init, reprendre, jouer, musique, arreterMusique, inverserSon, estMuet: () => muet };
})();
