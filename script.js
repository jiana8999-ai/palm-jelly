const $ = (id) => document.getElementById(id);

function palmPosition(landmarks) {
  const ids = [0, 5, 9, 13, 17];
  let x = 0,
    y = 0;
  for (const i of ids) {
    x += landmarks[i].x / ids.length;
    y += landmarks[i].y / ids.length;
  }
  return {
    x: Math.max(0.06, Math.min(0.94, (1 - x - 0.13) / 0.74)),
    y: Math.max(0.13, Math.min(0.85, (y - 0.12) / 0.72)),
  };
}

const HOOP_X = 0.86;
const PASS_SECONDS = 1.15;
function alignedWithHoop(jelly, ring, bodyRadius) {
  const xClear = ring.r * HOOP_X - bodyRadius,
    yClear = ring.r - bodyRadius;
  if (xClear <= 0 || yClear <= 0) return false;
  return ((jelly.x - ring.x) / xClear) ** 2 + ((jelly.y - ring.y) / yClear) ** 2 <= 1;
}
function passagePose(ring, progress) {
  const p = Math.max(0, Math.min(1, progress)),
    ease = p * p * (3 - 2 * p);
  return {
    x: ring.x + (-0.28 + 1.55 * ease) * ring.r,
    y: ring.y - Math.sin(p * Math.PI) * ring.r * 0.12,
    scale: 1 - 0.12 * Math.sin(p * Math.PI),
    front: p > 0.78,
  };
}

const settings = { muted: localStorage.getItem("palm-jelly-muted") === "true" };
let soundContext,
  master,
  motionGain,
  motionFilter,
  motionSource,
  bubbleTimer,
  lastBubble = 0,
  music = null;
const audio = {
  async unlock() {
    if (!soundContext) {
      soundContext = new AudioContext();
      master = soundContext.createGain();
      master.gain.value = settings.muted ? 0 : 0.65;
      master.connect(soundContext.destination);
      const b = soundContext.createBuffer(
          1,
          soundContext.sampleRate * 2,
          soundContext.sampleRate,
        ),
        data = b.getChannelData(0);
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        last = (last + Math.random() * 0.02 - 0.01) / 1.02;
        data[i] = last * 6;
      }
      motionSource = soundContext.createBufferSource();
      motionSource.buffer = b;
      motionSource.loop = true;
      motionFilter = soundContext.createBiquadFilter();
      motionFilter.type = "bandpass";
      motionFilter.frequency.value = 700;
      motionFilter.Q.value = 0.5;
      motionGain = soundContext.createGain();
      motionGain.gain.value = 0;
      motionSource.connect(motionFilter).connect(motionGain).connect(master);
      motionSource.start();
      bubbleTimer = setInterval(() => {
        if (
          !document.hidden &&
          !settings.muted &&
          soundContext.state === "running" &&
          Math.random() < 0.38
        )
          this.bubble(0.035);
      }, 1700);
    }
    if (soundContext.state === "suspended") await soundContext.resume();
  },
  tone(freq, at, duration, gain = 0.12, type = "sine") {
    if (!soundContext || settings.muted) return;
    const o = soundContext.createOscillator(),
      g = soundContext.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    o.connect(g).connect(master);
    o.start(at);
    o.stop(at + duration + 0.03);
  },
  bubble(volume = 0.08) {
    if (!soundContext || settings.muted) return;
    const o = soundContext.createOscillator(),
      g = soundContext.createGain(),
      at = soundContext.currentTime;
    o.frequency.setValueAtTime(350 + Math.random() * 200, at);
    o.frequency.exponentialRampToValueAtTime(900 + Math.random() * 350, at + 0.06);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(volume, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.12);
    o.connect(g).connect(master);
    o.start();
    o.stop(at + 0.14);
  },
  cue(kind, index = 0) {
    if (!soundContext || settings.muted) return;
    const now = soundContext.currentTime;
    if (kind === "click") {
      this.bubble(0.09);
      return;
    }
    const notes =
      kind === "win"
        ? [523.25, 659.25, 783.99, 1046.5]
        : kind === "ring"
          ? [523.25 * 2 ** (index / 6), 783.99 * 2 ** (index / 6)]
          : kind === "start"
            ? [392, 523.25, 659.25]
            : [659.25, 880];
    notes.forEach((f, i) => {
      this.tone(f, now + i * 0.115, 0.45, kind === "win" ? 0.12 : 0.09);
      this.tone(f * 2, now + i * 0.115, 0.18, 0.018);
    });
  },
  setMotion(value) {
    if (!soundContext) return;
    motionGain.gain.setTargetAtTime(
      Math.min(0.12, value * 0.11),
      soundContext.currentTime,
      0.22,
    );
    motionFilter.frequency.setTargetAtTime(
      400 + value * 850,
      soundContext.currentTime,
      0.2,
    );
    if (value > 0.25 && soundContext.currentTime - lastBubble > 0.5 + Math.random()) {
      lastBubble = soundContext.currentTime;
      this.bubble(0.025 + value * 0.025);
    }
  },
  toggle() {
    settings.muted = !settings.muted;
    localStorage.setItem("palm-jelly-muted", String(settings.muted));
    if (master)
      master.gain.setTargetAtTime(
        settings.muted ? 0 : 0.65,
        soundContext.currentTime,
        0.04,
      );
    if (music) music.muted = settings.muted;
    this.updateButton();
    return settings.muted;
  },
  updateButton() {
    const b = document.getElementById("sound");
    b.textContent = settings.muted ? "♪̸" : "♫";
    b.setAttribute(
      "aria-label",
      settings.muted ? "Turn sound on / 开启声音" : "Turn sound off / 关闭声音",
    );
    b.setAttribute("aria-pressed", String(!settings.muted));
    b.title = settings.muted ? "Sound off / 声音已关闭" : "Sound on / 声音已开启";
  },
  suspend() {
    soundContext?.suspend();
    music?.pause();
  },
  resume() {
    if (soundContext && !settings.muted) soundContext.resume();
    if (music && !settings.muted) music.play().catch(() => {});
  },
  playMusic() {
    if (!music || settings.muted) return Promise.resolve();
    return music.play().catch(() => {});
  },
  async loadMusic(url, { start = 0 } = {}) {
    if (!music) {
      music = new Audio();
      music.preload = "auto";
      music.loop = true;
      music.volume = 0.22;
      music.muted = settings.muted;
      music.src = url;
      if (start > 0)
        music.addEventListener(
          "loadedmetadata",
          () => {
            music.currentTime = start;
          },
          { once: true },
        );
      music.load();
    }
    if (!settings.muted) await music.play();
  },
};
document.addEventListener("pointerdown", () => audio.unlock(), { once: true });
document.addEventListener("keydown", () => audio.unlock(), { once: true });
document.addEventListener("click", async (event) => {
  const b = event.target.closest("button");
  if (!b || b.disabled) return;
  await audio.unlock();
  if (b.id === "sound") {
    audio.toggle();
    if (!settings.muted) {
      audio.playMusic();
      audio.cue("click");
    }
  } else audio.cue("click");
});
audio.updateButton();

const ctx = $("ocean").getContext("2d"),
  sprite = new Image();
sprite.src = "assets/jelly-sprite.webp";
let mode = "home",
  paused = false,
  tracking = false,
  active = 0,
  hold = 0,
  handHold = 0,
  last = 0,
  t = 0,
  stop = () => {},
  start = () => {},
  jelly = { x: 365, y: 490 },
  target = { ...jelly },
  particles = [],
  passage = null,
  screenTime = 0;
const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
const livingArt = animateArtwork();
const goals = [
    { x: 600, y: 308, r: 138 },
    { x: 978, y: 600, r: 94 },
    { x: 1348, y: 319, r: 84 },
  ],
  practiceGoal = { x: 1117, y: 408, r: 115 };
function animateArtwork() {
  const canvas = $("living-art"),
    art = $("art"),
    gl = canvas.getContext("webgl", { alpha: false, antialias: false });
  if (!gl || typeof gl.createShader !== "function") return null;
  let ready = false,
    lastDraw = -1,
    lastMotion = -1;
  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(result));
    }
    return result;
  }
  try {
    const vertex = shader(
      gl.VERTEX_SHADER,
      `
      attribute vec2 position;
      varying vec2 uv;
      void main() {
        uv = vec2(position.x * .5 + .5, .5 - position.y * .5);
        gl_Position = vec4(position, 0., 1.);
      }
    `,
    );
    const fragment = shader(
      gl.FRAGMENT_SHADER,
      `
      precision highp float;
      varying vec2 uv;
      uniform sampler2D picture;
      uniform float time, age, scene, motion;
      float area(vec2 p, vec2 center, vec2 radius) {
        return 1. - smoothstep(.65, 1., length((p - center) / radius));
      }
      float pulse(float t, float center, float width) {
        return pow(max(0., 1. - abs(t - center) / width), 2.);
      }
      vec2 swim(vec2 p, vec2 center, vec2 radius, float phase) {
        float mask = area(p, center, radius);
        return mask * vec2(sin(time * .65 + phase) * 7.,
          sin(time * .9 + phase) * 3. + sin(p.x * .035 + time * 2.) * .7);
      }
      vec2 blink(vec2 p, vec2 center, float amount) {
        vec2 d = p - center;
        float mask = area(p, center, vec2(19., 17.));
        return vec2(0., d.y * amount * 3.4 * mask);
      }
      void main() {
        vec2 p = uv * vec2(1672., 941.);
        vec2 drift = vec2(0.);
        float left = (1. - smoothstep(145., 260., p.x));
        float right = smoothstep(1420., 1545., p.x);
        float height = smoothstep(80., 180., p.y) * (1. - smoothstep(820., 930., p.y));
        drift.x += (left + right) * height * (930. - p.y) / 800.
          * (sin(time * .85 + p.y * .005 + p.x * .015) * 8.);
        float garden = area(p, vec2(355., 650.), vec2(220., 220.))
          + area(p, vec2(1315., 650.), vec2(210., 220.));
        drift.x += garden * sin(time * 1.05 + p.x * .025 + p.y * .009)
          * 3. * (1. - smoothstep(710., 825., p.y));
        if (scene == 2.) {
          drift += swim(p, vec2(420., 348.), vec2(156., 107.), .3);
          drift += swim(p, vec2(1260., 426.), vec2(160., 112.), 2.);
          drift += swim(p, vec2(545., 448.), vec2(125., 83.), 4.);
        } else {
          drift += swim(p, vec2(325., 290.), vec2(140., 91.), .3);
          drift += swim(p, vec2(1245., 452.), vec2(160., 97.), 2.);
          drift += swim(p, vec2(565., 495.), vec2(105., 75.), 4.);
        }
        drift += swim(p, vec2(452., 260.), vec2(150., 80.), 1.3) * .4;
        drift += swim(p, vec2(1190., 280.), vec2(190., 100.), 3.1) * .4;
        float crab = area(p, vec2(370., 817.), vec2(96., 75.));
        drift.x += crab * sin(time * .75) * 2.;
        drift.y += crab * sin(time * 1.5) * 1.5;
        drift.y += area(p, vec2(scene == 2. ? 340. : 307., 778.), vec2(32., 43.))
          * sin(time * 2.1) * 3.;
        drift.y += area(p, vec2(scene == 2. ? 443. : 415., 802.), vec2(30., 42.))
          * sin(time * 2.1 + 1.4) * 3.;
        vec2 q = p - drift * motion;
        if (scene == 1. || scene == 2.) {
          vec2 center = vec2(861., 450.);
          vec2 d = p - center;
          float mask = area(p, center, vec2(270., 265.))
            * smoothstep(255., 280., p.y) * (1. - smoothstep(645., 675., p.y));
          float cheer = scene == 2. ? exp(-age * .9) : 0.;
          float lift = sin(time * .95) * 6. - abs(sin(age * 5.5)) * 19. * cheer;
          float tilt = sin(time * .7) * .018 + sin(age * 9.) * .055 * cheer;
          vec2 body = vec2(sin(time * .7) * 3., lift)
            + vec2(-d.y, d.x) * tilt + d * sin(time * 1.45) * .012;
          float tail = smoothstep(435., 610., p.y);
          body.x += tail * (sin(time * 1.9 + p.y * .023) * 9.
            + sin(time * 1.25 + p.x * .025) * 3.);
          body.y += tail * sin(time * 1.8 + p.x * .025) * 2.4;
          q -= body * mask * motion;
          float wink = pulse(mod(age + 1.1, 5.3), 4.6, .17);
          if (scene == 2.) {
            wink = max(wink, pulse(age, .9, .19) + pulse(age, 1.3, .15));
            q += (blink(q, vec2(815., 410.), wink)
              + blink(q, vec2(908., 386.), wink)) * motion;
          } else {
            q += (blink(q, vec2(813., 392.), wink)
              + blink(q, vec2(900., 372.), wink)) * motion;
          }
        }
        if (scene == 2.) {
          vec2 stars = swim(p, vec2(680., 340.), vec2(40., 40.), 1.)
            + swim(p, vec2(1127., 375.), vec2(44., 44.), 3.)
            + swim(p, vec2(1061., 464.), vec2(34., 34.), 5.);
          q -= stars * .5 * motion;
        }
        gl_FragColor = texture2D(picture, clamp(q / vec2(1672., 941.), 0., 1.));
      }
    `,
    );
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error("Drawing unavailable");
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(program, "picture"), 0);
    const uniforms = Object.fromEntries(
      ["time", "age", "scene", "motion"].map((name) => [
        name,
        gl.getUniformLocation(program, name),
      ]),
    );
    function upload() {
      if (!art.complete || !art.naturalWidth || gl.isContextLost()) return;
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, art);
      ready = true;
      lastDraw = -1;
    }
    art.addEventListener("load", upload);
    canvas.addEventListener("webglcontextlost", () => {
      ready = false;
      canvas.style.opacity = "0";
    });
    return {
      resize() {
        const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
        canvas.width = Math.round(innerWidth * ratio);
        canvas.height = Math.round(innerHeight * ratio);
        gl.viewport(0, 0, canvas.width, canvas.height);
      },
      reset() {
        ready = false;
        canvas.style.opacity = "0";
      },
      draw(time, age, screen, motion) {
        if (!ready) upload();
        if (!ready) return;
        if (
          lastDraw >= 0 &&
          lastMotion === motion &&
          (motion === 0 || time - lastDraw < 1 / 30)
        )
          return;
        lastDraw = time;
        lastMotion = motion;
        gl.uniform1f(uniforms.time, time);
        gl.uniform1f(uniforms.age, age);
        gl.uniform1f(uniforms.scene, screen === "home" ? 1 : screen === "won" ? 2 : 0);
        gl.uniform1f(uniforms.motion, motion);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        canvas.style.opacity = "1";
      },
    };
  } catch (error) {
    console.warn("Ocean animation:", error.message);
    return null;
  }
}
function scale() {
  const sx = innerWidth / 1672,
    sy = innerHeight / 941;
  $("stage").style.transform = `scale(${sx},${sy})`;
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 3),
    canvas = $("ocean");
  canvas.width = Math.round(innerWidth * dpr);
  canvas.height = Math.round(innerHeight * dpr);
  ctx.setTransform(canvas.width / 1672, 0, 0, canvas.height / 941, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  livingArt?.resize();
}
addEventListener("resize", scale);
scale();
function hit(id, label, x, y, w, h, fn) {
  const b = document.createElement("button");
  b.id = id;
  b.className = "hit";
  b.setAttribute("aria-label", label);
  Object.assign(b.style, {
    left: x + "px",
    top: y + "px",
    width: w + "px",
    height: h + "px",
  });
  b.onclick = fn;
  $("ui").append(b);
  return b;
}
function copy(html, x, y, w, cls = "") {
  const e = document.createElement("div");
  e.className = "copy " + cls;
  e.innerHTML = html;
  Object.assign(e.style, { left: x + "px", top: y + "px", width: w + "px" });
  $("ui").append(e);
  return e;
}
function patch(file, x, y, w, h) {
  const e = document.createElement("div");
  e.className = "patch";
  Object.assign(e.style, {
    left: x + "px",
    top: y + "px",
    width: w + "px",
    height: h + "px",
    backgroundImage: `url(assets/storyboards/${file}.webp)`,
    backgroundPosition: `-${x}px -${y}px`,
  });
  $("ui").append(e);
}
function status(s) {
  $("status").textContent = s;
  $("status").classList.toggle("hidden", !s);
}
function help() {
  if (["playing", "practice"].includes(mode)) paused = true;
  $("help-dialog").showModal();
}
function show(m) {
  passage = null;
  screenTime = 0;
  livingArt?.reset();
  mode = m;
  document.body.dataset.screen = m;
  $("ui").replaceChildren();
  status("");
  $("art").src = ["playing", "practice"].includes(m)
    ? "assets/ocean-plate.webp"
    : `assets/storyboards/${m === "home" ? "home-hd" : m}.webp`;
  if (m === "home") {
    hit("start", "Start / 开始", 659, 800, 356, 77, prepare);
    hit("help", "How to play", 1473, 37, 157, 49, help);
  }
  if (m === "camera") hit("home", "Home / 返回首页", 1564, 30, 75, 75, home);
  if (m === "hand") hit("home", "Home / 返回首页", 25, 22, 260, 65, home);
  if (m === "won") {
    hit("again", "Play Again / 再玩一次", 494, 755, 365, 100, () => {
      prepare();
      start();
    });
    hit("back", "Home / 返回首页", 879, 755, 296, 100, home);
  }
  if (["practice", "playing"].includes(m)) {
    patch(m, 20, 15, m === "practice" ? 290 : 225, 85);
    if (m === "practice") {
      patch(m, 520, 20, 630, 74);
      patch(m, 440, 115, 815, 138);
      patch(m, 1265, 306, 205, 75);
      patch(m, 968, 543, 340, 82);
      patch(m, 636, 806, 405, 80);
      patch(m, 29, 592, 312, 279);
    } else {
      copy(
        '<span id="progress">0 / 3</span>　<span id="dots">○ ○ ○</span>',
        270,
        40,
        220,
        "ring-count",
      );
      hit("pause", "Pause / 暂停", 1510, 30, 58, 58, () => pause(true)).textContent =
        "Ⅱ";
      hit("help", "How to play", 1588, 30, 58, 58, help).textContent = "?";
      copy("Follow the glowing ring / 跟随发光的光圈", 595, 839, 482, "cream");
      copy(
        '<span id="track-label">● Hand detected / 已识别</span>',
        30,
        827,
        280,
        "cream",
      );
    }
  }
}
function home() {
  stop();
  paused = false;
  $("pause-panel").classList.add("hidden");
  show("home");
}
function prepare() {
  stop();
  tracking = false;
  handHold = 0;
  hold = 0;
  paused = false;
  $("camera-error").classList.add("hidden");
  $("enable-camera").disabled = false;
  $("enable-camera").innerHTML = "";
  show("camera");
}
function practice() {
  active = 0;
  hold = 0;
  jelly = { x: 700, y: 540 };
  target = { ...jelly };
  show("practice");
  audio.cue("found");
}
function play() {
  active = 0;
  hold = 0;
  jelly = { x: 365, y: 490 };
  target = { ...jelly };
  show("playing");
  audio.cue("start");
}
function pause(v) {
  paused = v;
  hold = 0;
  $("pause-panel").classList.toggle("hidden", !v);
  audio.setMotion(0);
}
function drawRing(r, i, layer = "back") {
  ctx.save();
  const near = layer === "front";
  ctx.strokeStyle =
    i < active
      ? "#ffe79d"
      : i === active
        ? near
          ? "#fffbd2"
          : "#e8eeb3"
        : near
          ? "#efffff"
          : "#b9eaf0";
  ctx.lineWidth = i === active ? 16 : 11;
  ctx.lineCap = "round";
  ctx.shadowColor = "#fff8c0";
  ctx.shadowBlur = i === active ? 6 : 0;
  ctx.beginPath();
  ctx.ellipse(
    r.x,
    r.y,
    r.r * HOOP_X,
    r.r,
    -0.1,
    near ? -Math.PI / 2 : Math.PI / 2,
    near ? Math.PI / 2 : Math.PI * 1.5,
  );
  ctx.stroke();
  ctx.shadowBlur = 0;
  if (!near && mode === "playing") {
    ctx.fillStyle = i <= active ? "#fff9bc" : "#eaffff";
    ctx.font = "bold 38px Trebuchet MS";
    ctx.fillText(i < active ? "✓" : `0${i + 1}`, r.x - r.r, r.y - r.r - 15);
  }
  if (!near && i === active && hold) {
    ctx.strokeStyle = "#9c8bff";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(
      r.x,
      r.y,
      r.r * HOOP_X + 12,
      r.r + 12,
      -0.1,
      -Math.PI / 2,
      -Math.PI / 2 + Math.min(1, hold / 0.35) * Math.PI * 2,
    );
    ctx.stroke();
  }
  ctx.restore();
}
function completePassage() {
  active++;
  hold = 0;
  passage = null;
  audio.cue("ring", active - 1);
  if (mode === "practice") {
    play();
    return;
  }
  if ($("progress")) $("progress").textContent = `${active} / 3`;
  if ($("dots")) $("dots").textContent = "● ".repeat(active) + "○ ".repeat(3 - active);
  if (active === 3) {
    stop();
    show("won");
    audio.cue("win");
  }
}
function drawJelly() {
  if (!sprite.complete || !sprite.naturalWidth) return;
  const size =
    (mode === "practice" ? 220 : 170) *
    (passage ? passagePose(passage.ring, passage.elapsed / PASS_SECONDS).scale : 1);
  ctx.save();
  ctx.translate(jelly.x, jelly.y);
  ctx.rotate(Math.sin(t * 1.5) * 0.025);
  const h = size * 1.05,
    sw = sprite.naturalWidth,
    sh = sprite.naturalHeight;
  for (let y = 0; y < sh; y += 8) {
    const f = y / sh,
      dx = f > 0.48 ? Math.sin(t * 3 + f * 6) * (f - 0.48) * 15 : 0;
    ctx.drawImage(
      sprite,
      0,
      y,
      sw,
      Math.min(8, sh - y),
      -size / 2 + dx,
      -h / 2 + (y / sh) * h,
      size,
      (Math.min(8, sh - y) / sh) * h + 0.4,
    );
  }
  ctx.restore();
}
function tick(ms) {
  const dt = Math.min(0.04, (ms - last) / 1000) || 0;
  last = ms;
  if (!paused && !document.hidden) {
    if (!reducedMotion?.matches) t += dt;
    screenTime += dt;
    livingArt?.draw(t, screenTime, mode, reducedMotion?.matches ? 0 : 1);
  }
  ctx.clearRect(0, 0, 1672, 941);
  if (mode === "hand" && tracking) {
    handHold += dt;
    if (handHold > 1.1) practice();
  }
  if (["practice", "playing"].includes(mode)) {
    let speed = 0;
    if (tracking && !paused) {
      if (passage) {
        passage.elapsed += dt;
        const pose = passagePose(passage.ring, passage.elapsed / PASS_SECONDS);
        jelly = { x: pose.x, y: pose.y };
        speed = 110;
        if (passage.elapsed >= PASS_SECONDS) completePassage();
      } else {
        const prev = { ...jelly },
          b = 1 - Math.exp(-dt * 6);
        jelly.x += (target.x - jelly.x) * b;
        jelly.y += (target.y - jelly.y) * b;
        speed = Math.hypot(jelly.x - prev.x, jelly.y - prev.y) / Math.max(dt, 0.001);
        const r = (mode === "practice" ? [practiceGoal] : goals)[active];
        if (r) {
          hold = alignedWithHoop(jelly, r, mode === "practice" ? 85 : 60)
            ? hold + dt
            : 0;
          if (hold >= 0.35) {
            hold = 0;
            passage = { ring: r, elapsed: 0 };
            audio.bubble(0.06);
          }
        }
      }
    }
    audio.setMotion(Math.min(1, speed / 500));
    if (["practice", "playing"].includes(mode)) {
      const visibleRings = mode === "practice" ? [practiceGoal] : goals;
      visibleRings.forEach((r, i) => drawRing(r, i, "back"));
      if (mode === "practice" && !tracking) {
        ctx.save();
        ctx.setLineDash([17, 17]);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(818, 500);
        ctx.bezierCurveTo(880, 465, 925, 414, 979, 410);
        ctx.stroke();
        ctx.restore();
      }
      const inFront =
        passage && passagePose(passage.ring, passage.elapsed / PASS_SECONDS).front;
      if (!inFront) drawJelly();
      visibleRings.forEach((r, i) => drawRing(r, i, "front"));
      if (inFront) drawJelly();
      if (speed > 30 && Math.random() < dt * 12)
        particles.push({
          x: jelly.x + (Math.random() - 0.5) * 95,
          y: jelly.y + 65,
          r: 3 + Math.random() * 7,
          life: 2,
        });
    }
  } else audio.setMotion(0);
  if (!paused && !reducedMotion?.matches && Math.random() < dt * 2)
    particles.push({
      x: 150 + Math.random() * 1370,
      y: 850,
      r: 3 + Math.random() * 6,
      life: 6,
    });
  particles = particles.filter((p) => (p.life -= dt) > 0);
  ctx.strokeStyle = "#ffffffb0";
  ctx.lineWidth = 2;
  for (const p of particles) {
    if (!paused && !reducedMotion?.matches) p.y -= dt * 35;
    ctx.beginPath();
    ctx.arc(p.x + Math.sin(t + p.y) * 2, p.y, p.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  requestAnimationFrame(tick);
}
$("resume").onclick = () => pause(false);
$("return").onclick = home;
$("close-help").onclick = () => $("help-dialog").close();
$("help-dialog").addEventListener("close", () => {
  paused = false;
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (["playing", "practice"].includes(mode)) pause(true);
    audio.suspend();
  } else audio.resume();
});
addEventListener("pagehide", () => stop());
audio.loadMusic("assets/music.m4a", { start: 0 }).catch(() => {});
for (const event of ["pointerdown", "keydown"])
  document.addEventListener(event, () => audio.playMusic(), { passive: true });
show("home");
requestAnimationFrame(tick);
const game = {
  status,
  home,
  prepare,
  handReady() {
    show("hand");
    handHold = 0;
    tracking = false;
  },
  isPlaying: () => ["hand", "practice", "playing"].includes(mode),
  isPaused: () => paused,
  setStop(fn) {
    stop = fn;
  },
  setStart(fn) {
    start = fn;
  },
  setTracking(found, pos) {
    tracking = found;
    if ($("track-label"))
      $("track-label").textContent = found
        ? "● Hand detected / 已识别"
        : "○ Raise your hand / 举起手掌";
    if (!found) {
      handHold = 0;
      hold = 0;
      if (["playing", "practice"].includes(mode))
        status("Raise your palm / 举起手掌，继续游动");
    } else {
      status("");
      if (pos)
        target = {
          x: Math.max(90, Math.min(1582, pos.x * 1672)),
          y: Math.max(180, Math.min(745, pos.y * 941)),
        };
    }
  },
};
if (["127.0.0.1", "localhost"].includes(location.hostname)) {
  const preview = new URLSearchParams(location.search).get("preview");
  if (["home", "camera", "hand", "practice", "playing", "won"].includes(preview)) {
    if (preview === "practice") practice();
    else if (preview === "playing") play();
    else show(preview);
    const phase = new URLSearchParams(location.search).get("crossing");
    if (phase !== null && preview === "playing") {
      passage = {
        ring: goals[0],
        elapsed: Math.max(0, Math.min(1, Number(phase))) * PASS_SECONDS,
      };
      jelly = passagePose(goals[0], Number(phase));
    }
  }
}

let tracker,
  stream,
  frame = 0,
  run = 0,
  lastVideo = -1,
  lastDetect = 0,
  busy = false;
function stopCamera() {
  run++;
  cancelAnimationFrame(frame);
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = null;
  $("video").srcObject = null;
  $("camera").classList.add("hidden");
  game.setTracking(false);
  busy = false;
}
game.setStop(stopCamera);
async function startCamera() {
  if (busy) return;
  busy = true;
  const token = run;
  $("enable-camera").disabled = true;
  $("enable-camera").innerHTML = "Opening… <span>/ 正在开启</span>";
  $("camera-error").classList.add("hidden");
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw Error("HTTPS required");
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" },
      audio: false,
    });
    if (token !== run) {
      newStream.getTracks().forEach((t) => t.stop());
      return;
    }
    stream = newStream;
    $("video").srcObject = stream;
    await $("video").play();
    $("enable-camera").innerHTML = "Loading… <span>/ 加载手掌识别</span>";
    if (!tracker) {
      const { HandLandmarker, FilesetResolver } = await import(
        "./assets/vendor/vision_bundle.mjs"
      );
      const files = await FilesetResolver.forVisionTasks("./assets/vendor/wasm");
      tracker = await HandLandmarker.createFromOptions(files, {
        baseOptions: {
          modelAssetPath: "./assets/vendor/hand_landmarker.task",
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    }
    if (token !== run) return;
    busy = false;
    lastVideo = -1;
    let foundAt = 0;
    game.handReady();
    $("camera").classList.remove("hidden");
    function loop(now) {
      if (token !== run || !game.isPlaying()) return;
      const video = $("video");
      if (
        video.readyState >= 2 &&
        video.currentTime !== lastVideo &&
        now - lastDetect > 55 &&
        !game.isPaused()
      ) {
        lastVideo = video.currentTime;
        lastDetect = now;
        try {
          const result = tracker.detectForVideo(video, now),
            hand = result.landmarks?.[0];
          if (hand) {
            foundAt = now;
            game.setTracking(true, palmPosition(hand));
            $("camera-label").textContent = "Palm found / 手掌已识别";
          } else if (now - foundAt > 350) {
            game.setTracking(false);
            $("camera-label").textContent = "Raise your hand / 举起手掌";
          }
        } catch (e) {
          game.setTracking(false);
          game.status(
            "Tracking paused. Return home to retry. / 识别暂停，请返回首页重试",
          );
        }
      }
      frame = requestAnimationFrame(loop);
    }
    frame = requestAnimationFrame(loop);
  } catch (e) {
    if (token !== run) return;
    stopCamera();
    game.prepare();
    const denied = ["NotAllowedError", "PermissionDeniedError"].includes(e.name);
    $("camera-error").textContent = denied
      ? "Please allow camera access, then try again. / 请在浏览器中允许摄像头，再点击重试。"
      : "Camera unavailable. Check that it is connected and not in use. / 请检查摄像头连接，关闭占用摄像头的软件后重试。";
    $("camera-error").classList.remove("hidden");
    console.warn("Camera initialization:", e.name);
  }
}
$("enable-camera").onclick = startCamera;
game.setStart(startCamera);

export { game, palmPosition, alignedWithHoop, passagePose };
