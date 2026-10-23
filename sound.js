"use strict";
// Sound, made live with the browser's Web Audio API. No audio files, no downloads, no cost.
// It follows the brand's look and feel: vinyl records and a corrido (a Mexican ballad), so the background is a
// warm vinyl crackle with a slow nylon-guitar arpeggio, and the effects use bottle clinks, guitar strums,
// a trumpet fanfare, a cork pop and a record scratch. The header button mutes everything and remembers the choice.
// Sound starts only after the first click, as browsers require.

const Sound = {
  ctx: null, master: null, on: true, theme: null, nodes: [], timers: [], noise: null, plucks: {},

  init() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return !!this.ctx; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.on ? 0.5 : 0;
    this.master.connect(this.ctx.destination);
    this.makeNoise();
    return true;
  },
  makeNoise() {
    const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf; this.plucks = {};
  },
  load() { try { this.on = localStorage.getItem("csa_sound") !== "off"; } catch { this.on = true; } },
  setOn(v) {
    this.on = v;
    try { localStorage.setItem("csa_sound", v ? "on" : "off"); } catch { /* ignore */ }
    if (this.master) this.master.gain.setTargetAtTime(v ? 0.5 : 0, this.ctx.currentTime, 0.05);
    if (!v) this.stopAmbience(); else if (this.theme) this.start(this.theme);
  },

  // ----- building blocks -----
  // A plucked nylon string (Karplus-Strong): a burst of noise that rings down like a guitar string.
  pluckBuffer(freq) {
    const key = Math.round(freq * 10);
    if (this.plucks[key]) return this.plucks[key];
    const sr = this.ctx.sampleRate, n = Math.max(2, Math.round(sr / freq)), len = Math.round(sr * 1.6);
    const buf = this.ctx.createBuffer(1, len, sr), d = buf.getChannelData(0), ring = new Float32Array(n);
    for (let i = 0; i < n; i++) ring[i] = Math.random() * 2 - 1;
    for (let i = 0; i < len; i++) { const j = i % n, next = (j + 1) % n; d[i] = ring[j]; ring[j] = 0.4985 * (ring[j] + ring[next]); }
    return (this.plucks[key] = buf);
  },
  pluck(freq, at = 0, vol = 0.3, dest = null) {
    if (!this.ctx) return;
    const c = this.ctx, s = c.createBufferSource(), lp = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.pluckBuffer(freq); lp.type = "lowpass"; lp.frequency.value = 2600; g.gain.value = vol;
    s.connect(lp); lp.connect(g); g.connect(dest || this.master); s.start(c.currentTime + at); this.nodes.push(s);
  },
  strum(freqs, at = 0, vol = 0.22, dest = null) { freqs.forEach((f, i) => this.pluck(f, at + i * 0.04, vol, dest)); },
  tone(freq, dur, type = "sine", vol = 0.2, dest = null, at = 0) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  // Glass on glass: two bright, quickly fading partials.
  clink(at = 0, vol = 0.16, dest = null) {
    const f = 2300 + Math.random() * 500;
    this.tone(f, 0.35, "sine", vol, dest, at); this.tone(f * 1.34, 0.22, "sine", vol * 0.7, dest, at); this.tone(f * 2.1, 0.12, "sine", vol * 0.35, dest, at);
  },
  // Filtered noise that sweeps in pitch: used for the cork pop and the record scratch.
  sweep(from, to, dur, vol, at = 0, q = 2) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime + at, s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; s.loop = true; bp.type = "bandpass"; bp.Q.value = q;
    bp.frequency.setValueAtTime(from, t); bp.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bp); bp.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + 0.05);
  },
  // A bright, breathy trumpet note, mariachi style: a filtered sawtooth with a little vibrato.
  trumpet(freq, dur, at = 0, vol = 0.12) {
    if (!this.ctx) return;
    const c = this.ctx, t = c.currentTime + at, o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain(), v = c.createOscillator(), vg = c.createGain();
    o.type = "sawtooth"; o.frequency.value = freq; lp.type = "lowpass"; lp.frequency.setValueAtTime(900, t); lp.frequency.linearRampToValueAtTime(2800, t + 0.08);
    v.frequency.value = 5.5; vg.gain.value = freq * 0.012; v.connect(vg); vg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.04); g.gain.setValueAtTime(vol, t + dur - 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); lp.connect(g); g.connect(this.master); o.start(t); v.start(t); o.stop(t + dur + 0.05); v.stop(t + dur + 0.05);
  },

  // ----- the background -----
  // Each setting has its own room tone under the same record-player music.
  ROOM: {
    bar: { band: 550, vol: 0.06, clink: true }, restaurant: { band: 480, vol: 0.05, clink: true }, venue: { band: 650, vol: 0.08, clink: true },
    lounge: { band: 420, vol: 0.035, clink: true }, shop: { band: 380, vol: 0.03 }, warehouse: { band: 200, vol: 0.045, hum: true },
  },
  // Am - G - F - E, the classic Spanish-sounding turn, played as a slow arpeggio on nylon strings.
  CHORDS: [[110, 164.81, 220, 261.63, 329.63], [98, 146.83, 196, 246.94, 293.66], [87.31, 130.81, 174.61, 220, 261.63], [82.41, 123.47, 164.81, 207.65, 246.94]],
  start(theme) {
    this.theme = theme;
    if (!this.on || !this.init()) return;
    this.stopAmbience();
    const c = this.ctx, R = this.ROOM[theme] || this.ROOM.bar, t = c.currentTime;
    const out = c.createGain(); out.gain.value = 0; out.gain.linearRampToValueAtTime(1, t + 1.5); out.connect(this.master); this.nodes.push(out);
    const later = (ms, fn) => { const id = setTimeout(fn, ms); this.timers.push(id); };

    // room murmur
    const src = c.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = R.band; bp.Q.value = 0.6;
    const g = c.createGain(); g.gain.value = R.vol; src.connect(bp); bp.connect(g); g.connect(out); src.start(); this.nodes.push(src);
    if (R.hum) [55, 110].forEach(f => { const o = c.createOscillator(), pg = c.createGain(), lp = c.createBiquadFilter(); o.type = "sawtooth"; o.frequency.value = f; lp.type = "lowpass"; lp.frequency.value = 180; pg.gain.value = 0.015; o.connect(lp); lp.connect(pg); pg.connect(out); o.start(); this.nodes.push(o); });

    // vinyl: a faint hiss with little pops and crackles
    const hiss = c.createBufferSource(); hiss.buffer = this.noise; hiss.loop = true;
    const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 5000; const hg = c.createGain(); hg.gain.value = 0.012;
    hiss.connect(hp); hp.connect(hg); hg.connect(out); hiss.start(); this.nodes.push(hiss);
    const crackle = () => { this.tone(1500 + Math.random() * 3500, 0.012, "square", 0.012 + Math.random() * 0.02, out); later(25 + Math.random() * 160, crackle); };
    later(300, crackle);

    // nylon guitar, a bar of arpeggio at a time, softened so it sits under the voices
    const bus = c.createGain(); bus.gain.value = 0.95; bus.connect(out); this.nodes.push(bus);
    let bar = 0;
    const play = () => {
      const ch = this.CHORDS[bar % 4], order = [0, 2, 3, 4, 3, 2, 3, 1];
      order.forEach((n, i) => this.pluck(ch[n], 0.1 + i * 0.45, 0.07 + (i % 4 === 0 ? 0.03 : 0), bus));
      bar++; later(3600, play);
    };
    play();

    if (R.clink) { const tick = () => { this.clink(0, 0.035, out); later(4000 + Math.random() * 6000, tick); }; later(2500, tick); }
  },
  stopAmbience() {
    this.timers.forEach(clearTimeout); this.timers = [];
    this.nodes.forEach(n => { try { if (n.stop) n.stop(); n.disconnect(); } catch { /* already stopped or not started */ } }); this.nodes = [];
  },
  stop() { this.theme = null; this.stopAmbience(); },

  // ----- effects -----
  SFX: {
    // glass clink and a bright note up: a toast
    right: s => { s.clink(0, 0.2); s.pluck(440, 0.05, 0.35); s.pluck(659.25, 0.16, 0.35); },
    // a record scratch and a low sour note
    wrong: s => { s.sweep(3200, 300, 0.28, 0.3, 0, 3); s.pluck(110, 0.12, 0.45); s.pluck(116.54, 0.14, 0.35); },
    // cork pop, mariachi trumpet fanfare and a full strum
    win: s => {
      s.sweep(300, 1800, 0.07, 0.35, 0, 1); s.tone(420, 0.1, "sine", 0.25); s.clink(0.18, 0.18);
      [[523.25, 0.22], [659.25, 0.22], [783.99, 0.22], [1046.5, 0.6]].forEach(([f, d], i) => s.trumpet(f, d, 0.3 + i * 0.2, 0.11));
      s.strum([130.81, 196, 261.63, 329.63, 392], 0.35, 0.3);
    },
    // a sad little minor line on the guitar
    lose: s => { [329.63, 261.63, 220, 164.81].forEach((f, i) => s.pluck(f, i * 0.28, 0.4)); s.sweep(1500, 200, 0.5, 0.08, 0.8, 2); },
    // two clinks and a sparkle of high piano-like notes
    badge: s => { s.clink(0, 0.18); s.clink(0.14, 0.14); [1318.5, 1568, 2093].forEach((f, i) => s.tone(f, 0.3, "sine", 0.1, null, 0.25 + i * 0.09)); },
  },
  sfx(name) { if (this.on && this.init() && this.SFX[name]) this.SFX[name](this); },
};
Sound.load();
