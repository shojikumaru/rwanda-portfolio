// Hero night globe: dotted land, Tokyo & Bangkok (gold) with light arcs to Kigali (accent).
// Decorative only. Returns null when WebGL is unavailable so the hero stays exactly as before.
import * as THREE from "three";

const D2R = Math.PI / 180;
const GOLD = new THREE.Color("#E9B872");
const KIGALI_C = new THREE.Color("#F6D9A8");
const TOKYO = [139.69, 35.68];
const BANGKOK = [100.5, 13.75];
const KIGALI = [30.06, -1.95];

// lon/lat -> point on sphere; lon 0 faces the camera (+z).
const vec = (ll, r = 1) =>
  new THREE.Vector3(Math.cos(ll[1] * D2R) * Math.sin(ll[0] * D2R) * r, Math.sin(ll[1] * D2R) * r, Math.cos(ll[1] * D2R) * Math.cos(ll[0] * D2R) * r);

function arcCurve(from, to, seg) {
  const a = vec(from), b = vec(to);
  const ang = a.angleTo(b), s = Math.sin(ang);
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const u = i / seg;
    const p = a.clone().multiplyScalar(Math.sin((1 - u) * ang) / s).add(b.clone().multiplyScalar(Math.sin(u * ang) / s));
    p.normalize().multiplyScalar(1.004 + Math.sin(Math.PI * u) * (0.02 + 0.16 * (ang / Math.PI)));
    pts.push(p);
  }
  return new THREE.CatmullRomCurve3(pts);
}

// Facing-aware round points (fade toward the limb).
const pointsVert = `
  uniform float uPx; attribute float aSize; attribute vec3 aColor;
  varying float vFacing; varying vec3 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vFacing = dot(normalize(normalMatrix * position), normalize(-mv.xyz));
    vColor = aColor;
    gl_PointSize = aSize * uPx;
    gl_Position = projectionMatrix * mv;
  }`;

export function createGlobe(hero, landUrl) {
  const mobile = window.innerWidth < 768 || matchMedia("(pointer: coarse)").matches;
  const canvas = document.createElement("canvas");
  canvas.className = "hero-globe";
  canvas.setAttribute("aria-hidden", "true");

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({canvas, antialias: !mobile, alpha: true, powerPreference: "low-power"});
  } catch (e) {
    return null;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  hero.querySelector(".hero-bg").after(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 0, 4.9);
  const tilt = new THREE.Group();
  const spin = new THREE.Group();
  tilt.add(spin);
  scene.add(tilt);
  const disposables = [];
  const keep = (x) => (disposables.push(x), x);

  // Body: deep navy, slightly lighter toward the centre.
  const bodyMat = keep(new THREE.ShaderMaterial({
    vertexShader: `varying float vF; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vF = dot(normalize(normalMatrix*normal), normalize(-mv.xyz)); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `varying float vF; void main(){ vec3 a = vec3(0.027,0.075,0.122); vec3 b = vec3(0.075,0.16,0.24); float f = max(vF,0.0); vec3 col = mix(a,b,pow(f,1.4)) + vec3(0.2,0.33,0.45)*pow(1.0-f,4.0)*0.45; gl_FragColor = vec4(col,1.0); }`,
  }));
  spin.add(new THREE.Mesh(keep(new THREE.SphereGeometry(1, mobile ? 40 : 72, mobile ? 28 : 48)), bodyMat));

  // Soft atmosphere: additive glow on a back-faced shell, brightest at the limb.
  const rimMat = keep(new THREE.ShaderMaterial({
    vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 vN; varying vec3 vV; void main(){ float i = pow(clamp(-dot(vN, vV) / 0.45, 0.0, 1.0), 2.2); gl_FragColor = vec4(vec3(0.43,0.61,0.76), i * 0.42); }`,
    side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  }));
  tilt.add(new THREE.Mesh(keep(new THREE.SphereGeometry(1.12, mobile ? 40 : 64, mobile ? 28 : 40)), rimMat));

  const px = {value: dpr};

  // Land dots (thinned on small screens).
  const landMat = keep(new THREE.ShaderMaterial({
    uniforms: {uPx: px},
    vertexShader: pointsVert,
    fragmentShader: `varying float vFacing; varying vec3 vColor; void main(){ if (length(gl_PointCoord-0.5) > 0.5) discard; gl_FragColor = vec4(vColor, 0.62 * smoothstep(0.0, 0.5, vFacing)); }`,
    transparent: true, depthWrite: false,
  }));
  const landGeo = keep(new THREE.BufferGeometry());
  spin.add(new THREE.Points(landGeo, landMat));

  // Cities: Tokyo, Bangkok (gold), Kigali (accent, larger, with a soft halo).
  const cities = [[TOKYO, GOLD, 6], [BANGKOK, GOLD, 6], [KIGALI, KIGALI_C, 9]];
  const cPos = new Float32Array(cities.length * 3), cCol = new Float32Array(cities.length * 3), cSize = new Float32Array(cities.length);
  cities.forEach(([ll, col, s], i) => {
    vec(ll, 1.006).toArray(cPos, i * 3);
    col.toArray(cCol, i * 3);
    cSize[i] = s * 3;
  });
  const cityGeo = keep(new THREE.BufferGeometry());
  cityGeo.setAttribute("position", new THREE.BufferAttribute(cPos, 3));
  cityGeo.setAttribute("aColor", new THREE.BufferAttribute(cCol, 3));
  cityGeo.setAttribute("aSize", new THREE.BufferAttribute(cSize, 1));
  const cityMat = keep(new THREE.ShaderMaterial({
    uniforms: {uPx: px},
    vertexShader: pointsVert,
    fragmentShader: `varying float vFacing; varying vec3 vColor; void main(){ float d = length(gl_PointCoord-0.5); if (d > 0.5) discard; float core = 1.0 - smoothstep(0.1, 0.14, d); float halo = (1.0 - smoothstep(0.14, 0.5, d)) * 0.28; gl_FragColor = vec4(mix(vColor, vec3(1.0), core*0.3), (core + halo) * smoothstep(0.05, 0.3, vFacing)); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  const cityPts = new THREE.Points(cityGeo, cityMat);
  cityPts.renderOrder = 3;
  spin.add(cityPts);

  // Kigali pulse ring.
  const kp = vec(KIGALI, 1.006);
  const ringMat = keep(new THREE.MeshBasicMaterial({color: GOLD, transparent: true, depthWrite: false, side: THREE.DoubleSide}));
  const ring = new THREE.Mesh(keep(new THREE.RingGeometry(0.9, 1, 48)), ringMat);
  ring.position.copy(kp);
  ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), kp.clone().normalize());
  spin.add(ring);

  // Arcs: a faint gold hairline with a light pulse travelling toward Kigali.
  const seg = mobile ? 48 : 96;
  const arcs = [[TOKYO, 0], [BANGKOK, 1.7]].map(([from, offset]) => {
    const mat = keep(new THREE.ShaderMaterial({
      uniforms: {uGrow: {value: 0}, uHead: {value: -1}, uColor: {value: GOLD}},
      vertexShader: `varying float vT; void main(){ vT = uv.x; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform float uGrow; uniform float uHead; uniform vec3 uColor; varying float vT;
        void main(){ if (vT > uGrow) discard; float x = (vT - uHead) / 0.09; float pulse = exp(-x*x) * step(vT, uHead + 0.02);
          float trail = smoothstep(uHead - 0.35, uHead, vT) * step(vT, uHead) * 0.35;
          gl_FragColor = vec4(mix(uColor, vec3(1.0,0.96,0.88), pulse*0.6), 0.32 + pulse * 0.68 + trail); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    const mesh = new THREE.Mesh(keep(new THREE.TubeGeometry(arcCurve(from, KIGALI, 64), seg, mobile ? 0.005 : 0.004, 4, false)), mat);
    mesh.renderOrder = 2;
    spin.add(mesh);
    return {mat, offset};
  });

  fetch(landUrl).then((r) => r.json()).then((arr) => {
    const step = mobile ? 2 : 1; // land.json = [lat, lon, lat, lon, ...]
    const n = Math.floor(arr.length / 2 / step);
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n);
    const c = new THREE.Color("#B9C7D3");
    for (let i = 0; i < n; i++) {
      const k = i * step * 2;
      vec([arr[k + 1], arr[k]], 1.003).toArray(pos, i * 3);
      c.toArray(col, i * 3);
      size[i] = mobile ? 2.4 : 2.1;
    }
    landGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    landGeo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    landGeo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    landGeo.computeBoundingSphere();
  }).catch(() => {});

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  // Pose: drift from the Pacific (Tokyo) westward and settle with Asia -> Africa in frame.
  const START_LON = 150, END_LON = 82, LAT = 14;
  let t = 0, last = 0, raf = 0, shown = false;
  let onScreen = true, tabVisible = !document.hidden;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    t += dt;
    const settle = 1 - Math.pow(1 - Math.min(1, t / 5), 3);
    const lon = START_LON + (END_LON - START_LON) * settle + Math.sin(t * 0.11) * 5 * settle;
    spin.rotation.y = -lon * D2R;
    tilt.rotation.x = LAT * D2R;

    const grow = Math.min(1, Math.max(0, (t - 1.4) / 1.6));
    arcs.forEach((a) => {
      a.mat.uniforms.uGrow.value = grow;
      const cyc = (t - 3 + a.offset) / 3.4;
      a.mat.uniforms.uHead.value = grow < 1 ? grow : (cyc - Math.floor(cyc)) * 1.25 - 0.1;
    });
    const pulse = (t % 2.6) / 2.6;
    ring.scale.setScalar(0.012 + pulse * 0.05);
    ringMat.opacity = (1 - pulse) * 0.7;

    renderer.render(scene, camera);
    if (!shown) {
      shown = true;
      hero.classList.add("has-globe");
      canvas.classList.add("on");
    }
  }
  function sync() {
    const run = onScreen && tabVisible;
    if (run && !raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    } else if (!run && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }
  const io = new IntersectionObserver((es) => {
    onScreen = es[es.length - 1].isIntersecting;
    sync();
  });
  io.observe(hero);
  const onVis = () => {
    tabVisible = !document.hidden;
    sync();
  };
  document.addEventListener("visibilitychange", onVis);
  canvas.addEventListener("webglcontextlost", () => api.dispose());
  sync();

  const api = {
    get running() {
      return !!raf;
    },
    dispose() {
      cancelAnimationFrame(raf);
      raf = 0;
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      disposables.forEach((x) => x.dispose());
      landGeo.dispose();
      renderer.dispose();
      canvas.remove();
      hero.classList.remove("has-globe");
    },
  };
  return api;
}
