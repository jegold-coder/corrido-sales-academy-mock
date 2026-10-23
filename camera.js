"use strict";
// Optional body-language coach (the brief's stretch goal). Fully opt-in and free.
// The camera video never leaves the device and is never recorded: each frame is turned into a few numbers
// (is the face in frame, is the head level, is the rep looking at the camera, is there a smile) and thrown away.
// It uses Google's open-source MediaPipe Face Landmarker, loaded from a CDN only when the rep turns the camera on.
// This code could not be tried with a real webcam while it was written: the maths is unit-tested with fake
// landmarks, but expect to tune the thresholds on real faces.

const CAM_LIB = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const CAM_MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

// Turn one frame of face landmarks (x and y from 0 to 1) and blendshape scores into yes/no signals.
function frameSignals(lm, blend) {
  if (!lm) return { present: false };
  const nose = lm[1], cL = lm[234], cR = lm[454], chin = lm[152], eA = lm[33], eB = lm[263];
  const width = cR.x - cL.x, yaw = (nose.x - (cL.x + cR.x) / 2) / width;           // 0 when facing the camera
  const roll = Math.atan2(eB.y - eA.y, eB.x - eA.x) * 180 / Math.PI;               // 0 when the head is level
  const eyeY = (eA.y + eB.y) / 2, pitch = (nose.y - eyeY) / (chin.y - eyeY);       // about .37 when looking straight ahead
  const cx = (cL.x + cR.x) / 2;
  const b = n => (blend && blend[n]) || 0;
  const gazeAway = Math.max(b("eyeLookOutLeft"), b("eyeLookOutRight"), b("eyeLookUpLeft"), b("eyeLookUpRight"), b("eyeLookDownLeft"), b("eyeLookDownRight"));
  const smile = (b("mouthSmileLeft") + b("mouthSmileRight")) / 2;
  return {
    present: true,
    eye: Math.abs(yaw) < .12 && gazeAway < .45,
    posture: Math.abs(roll) < 8 && pitch > .27 && pitch < .5 && width > .16 && width < .6 && cx > .3 && cx < .7,
    smile: smile > .3,
  };
}

const Cam = {
  on: false, sampling: false, stream: null, lm: null, timer: null, video: null, box: null,
  n: 0, c: { present: 0, eye: 0, posture: 0, smile: 0 },

  box_() {
    if (this.box) return this.box;
    const d = document.createElement("div");
    d.id = "camBox"; d.setAttribute("aria-label", "Camera coach preview");
    d.innerHTML = `<video id="camVid" autoplay muted playsinline></video><div id="camStat">Starting camera…</div>`;
    document.body.appendChild(d);
    this.box = d; this.video = d.querySelector("video");
    return d;
  },
  say(t) { this.msg = t; const el = document.getElementById("camStat"); if (el) el.textContent = t; const l = document.getElementById("camLine"); if (l) l.textContent = "📷 " + t; },

  // Ask for the camera and load the model. Resolves true when ready, false (with a message) if not.
  async begin() {
    if (this.on) return true;
    this.reset(); this.box_().style.display = "block"; this.box.classList.remove("off");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser has no camera access");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }, audio: false });
      await this.attach(stream);
      return true;
    } catch (e) {
      this.say("Camera coach unavailable: " + (e.message || e.name) + ". The mission works without it.");
      this.stopStream();
      this.box_().classList.add("off");
      return false;
    }
  },
  // Start the video, load the face model and begin sampling. (Also used by tests with a fake stream.)
  async attach(stream) {
    this.stream = stream; this.video.srcObject = stream;
    this.say("Starting the camera…");
    try { await this.video.play(); } catch { /* autoplay handles it */ }
    await new Promise(res => { if (this.video.videoWidth) res(); else this.video.onloadeddata = () => res(); setTimeout(res, 4000); });
    this.say("Loading the face model…");
    if (!this.lm) {
      const { FaceLandmarker, FilesetResolver } = await import(CAM_LIB + "/vision_bundle.mjs");
      const files = await FilesetResolver.forVisionTasks(CAM_LIB + "/wasm");
      this.lm = await FaceLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: CAM_MODEL, delegate: "CPU" }, runningMode: "VIDEO", numFaces: 1, outputFaceBlendshapes: true,
        minFaceDetectionConfidence: 0.3, minFacePresenceConfidence: 0.3, minTrackingConfidence: 0.3 });
    }
    this.cv = document.createElement("canvas"); this.cx = this.cv.getContext("2d", { willReadFrequently: true });
    this.small = document.createElement("canvas"); this.small.width = 32; this.small.height = 24; this.sx = this.small.getContext("2d", { willReadFrequently: true });
    this.on = true;
    this.timer = setInterval(() => this.tick(), 250);
    this.say("Camera coach on. Face the camera. Video stays on your device.");
  },
  // Average brightness of the picture from 0 to 100, to tell the rep when the room is too dark.
  brightness() {
    try { this.sx.drawImage(this.cv, 0, 0, 32, 24); const d = this.sx.getImageData(0, 0, 32, 24).data; let t = 0; for (let i = 0; i < d.length; i += 4) t += d[i] * .299 + d[i + 1] * .587 + d[i + 2] * .114; return Math.round(t / (d.length / 4) / 2.55); } catch { return 50; }
  },
  tick() {
    const v = this.video;
    if (!this.on || !this.sampling || !v || !v.videoWidth || v.readyState < 2) return;
    // Copy the frame to a canvas first, so the model always sees a clean, current picture.
    const w = Math.min(640, v.videoWidth), h = Math.round(w * v.videoHeight / v.videoWidth);
    if (this.cv.width !== w) { this.cv.width = w; this.cv.height = h; }
    this.cx.drawImage(v, 0, 0, w, h);
    let r; try { r = this.lm.detectForVideo(this.cv, performance.now()); } catch (e) { this.err = e.message; return; }
    const lm = r.faceLandmarks && r.faceLandmarks[0], bs = {};
    if (r.faceBlendshapes && r.faceBlendshapes[0]) r.faceBlendshapes[0].categories.forEach(c => { bs[c.categoryName] = c.score; });
    this.bright = this.brightness();
    this.add(frameSignals(lm, bs));
  },
  add(sig) {
    this.n++;
    if (sig.present) { this.c.present++; if (sig.eye) this.c.eye++; if (sig.posture) this.c.posture++; if (sig.smile) this.c.smile++; }
    this.frames = (this.frames || 0) + 1; if (sig.present) this.seen = (this.seen || 0) + 1;
    if (this.on) this.say(!sig.present ? (this.bright < 25 ? "It's too dark. Turn on a light or face a window." : `I can't see your face yet. Move a little closer, face the camera and make sure the room is lit. (${this.seen || 0}/${this.frames} frames, brightness ${this.bright}%)`) : sig.eye ? "Good eye contact" : "Look at the camera");
  },
  reset() { this.frames = 0; this.seen = 0; this.n = 0; this.c = { present: 0, eye: 0, posture: 0, smile: 0 }; },
  // Percent scores for the mission so far, or null if the camera was never on or saw too little.
  scores() {
    if (this.n < 8) return null;
    const p = this.c.present, pct = v => Math.round(v * 100);
    return { presence: pct(p / this.n), eye: p ? pct(this.c.eye / p) : 0, posture: p ? pct(this.c.posture / p) : 0, smile: p ? pct(this.c.smile / p) : 0 };
  },
  tips(s) {
    if (!s) return [];
    const t = [];
    if (s.presence < 80) t.push("Stay in frame while you speak.");
    if (s.eye < 60) t.push("Look at the camera lens when you talk. In a real bar that's eye contact.");
    if (s.posture < 60) t.push("Sit or stand tall with your head level, and keep a steady distance from the camera.");
    if (s.smile < 15) t.push("Let some warmth show. A natural smile builds trust fast.");
    return t.length ? t : ["Strong delivery. Keep it natural."];
  },
  stopStream() {
    clearInterval(this.timer); this.timer = null; this.on = false; this.sampling = false;
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    this.stream = null;
    if (this.video) this.video.srcObject = null;
  },
  stop() { this.stopStream(); if (this.box) this.box.style.display = "none"; },
};
if (typeof module !== "undefined") module.exports = { frameSignals, Cam };
