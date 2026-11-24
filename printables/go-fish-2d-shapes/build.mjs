// Builds the "Shape Fish" 2D-shapes Go Fish deck as HTML, then prints it to PDF.
// Usage: node build.mjs        (needs Playwright + Chromium, which this machine has)
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const INK = '#2b2b2b';
const SW = 'stroke="#2b2b2b" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"';

/* ------------------------------------------------------------------ geometry */
const rad = (d) => (d * Math.PI) / 180;
const r1 = (n) => Math.round(n * 100) / 100;
const pts = (vs) => vs.map(([x, y]) => `${r1(x)},${r1(y)}`).join(' ');
function regular(n, R, startDeg = -90, cx = 50, cy = 50) {
  return Array.from({ length: n }, (_, k) => {
    const a = rad(startDeg + (360 / n) * k);
    return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
  });
}
function star(R, r, cx = 50, cy = 52) {
  return Array.from({ length: 10 }, (_, k) => {
    const a = rad(-90 + 36 * k);
    const rr = k % 2 ? r : R;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  });
}
function insidePoly([x, y], vs) {
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const [xi, yi] = vs[i], [xj, yj] = vs[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/* Shapes in a 100 x 100 box. Polygons carry vertices; curved shapes carry a path. */
const triV = regular(3, 46, -90, 50, 58);
const SHAPES = {
  circle: { name: 'Circle', path: 'M50,10 A40,40 0 1 1 49.99,10 Z', fill: '#FFD6A5', verts: [], center: [50, 50], sym: 'inf' },
  semicircle: { name: 'Semicircle', path: 'M8,70 A42,42 0 0 1 92,70 Z', fill: '#FDFFB6', verts: [[8, 70], [92, 70]], center: [50, 50], sym: [90], symC: [50, 48], symL: 52 },
  oval: { name: 'Oval', path: 'M6,50 A44,30 0 1 1 94,50 A44,30 0 1 1 6,50 Z', fill: '#CAFFBF', verts: [], center: [50, 50], sym: [0, 90], symL: 104 },
  triangle: { name: 'Triangle', poly: triV, fill: '#9BF6FF', center: [50, 58], sym: [-90, -30, 30], symL: 104 },
  square: { name: 'Square', poly: regular(4, 54, -135), fill: '#A0C4FF', center: [50, 50], sym: [0, 45, 90, 135], symL: 104 },
  rectangle: { name: 'Rectangle', poly: [[8, 26], [92, 26], [92, 74], [8, 74]], fill: '#BDB2FF', center: [50, 50], sym: [0, 90], symL: 100 },
  pentagon: { name: 'Pentagon', poly: regular(5, 46, -90, 50, 54), fill: '#FFC6FF', center: [50, 54], sym: [-90, -54, -18, 18, 54], symL: 104 },
  hexagon: { name: 'Hexagon', poly: regular(6, 46, -90), fill: '#FFADAD', center: [50, 50], sym: [-90, -60, -30, 0, 30, 60], symL: 104 },
  octagon: { name: 'Octagon', poly: regular(8, 47, -112.5), fill: '#FFD6A5', center: [50, 50], sym: [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5], symL: 104 },
  rhombus: { name: 'Rhombus', poly: [[50, 4], [82, 50], [50, 96], [18, 50]], fill: '#CAFFBF', center: [50, 50], sym: [0, 90], symL: 104 },
  trapezium: { name: 'Trapezium', poly: [[30, 24], [70, 24], [94, 76], [6, 76]], fill: '#9BF6FF', center: [50, 50], sym: [90], symL: 72 },
  star: { name: 'Star', poly: star(48, 18.3), fill: '#FDFFB6', center: [50, 52], sym: [-90, -54, -18, 18, 54], symL: 104, star: true },
  heart: {
    name: 'Heart',
    path: 'M50,90 C22,68 6,50 6,32 C6,17 18,8 30,8 C40,8 47,14 50,24 C53,14 60,8 70,8 C82,8 94,17 94,32 C94,50 78,68 50,90 Z',
    fill: '#FFADAD', verts: [[50, 90], [50, 24]], center: [50, 50], sym: [90], symL: 100,
  },
};
for (const s of Object.values(SHAPES)) if (s.poly) s.verts = s.poly;
const outline = (s, extra = '') =>
  s.poly ? `<polygon points="${pts(s.poly)}" ${extra}/>` : `<path d="${s.path}" ${extra}/>`;

/* ------------------------------------------------------- attribute diagrams */
const DIA = (inner) => `<svg viewBox="-6 -6 112 112" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const base = (s, fill = '#fff') => outline(s, `fill="${fill}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"`);

function diaVertices(s, col) {
  let out = base(s, '#fff');
  if (s.key === 'semicircle') out += `<path d="M8,70 L92,70" stroke="${col}" stroke-width="6"/>`;
  out += s.verts.map(([x, y]) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="6.5" fill="${col}" stroke="${INK}" stroke-width="2"/>`).join('');
  return DIA(out);
}
function diaSymmetry(s, col) {
  let out = base(s, '#fff');
  const [cx, cy] = s.symC || s.center;
  const angles = s.sym === 'inf' ? [0, 30, 60, 90, 120, 150] : s.sym;
  const L = (s.symL || 104) / 2;
  for (const a of angles) {
    const dx = Math.cos(rad(a)) * L, dy = Math.sin(rad(a)) * L;
    out += `<line x1="${r1(cx - dx)}" y1="${r1(cy - dy)}" x2="${r1(cx + dx)}" y2="${r1(cy + dy)}" stroke="${col}" stroke-width="3.5" stroke-dasharray="7 5" stroke-linecap="round"/>`;
  }
  if (s.sym === 'inf') out += `<circle cx="50" cy="50" r="15" fill="#fff" stroke="${col}" stroke-width="2"/><text x="50" y="58" text-anchor="middle" font-size="24" font-weight="700" fill="${INK}" font-family="Fredoka, sans-serif">∞</text>`;
  return DIA(out);
}
function diaAngles(s, col) {
  let out = base(s, '#fff');
  if (!s.poly) {
    // curved shapes: show the corners (if any) as gentle marks
    out += s.verts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${col}" fill-opacity="0.35" stroke="${col}" stroke-width="3"/>`).join('');
    if (!s.verts.length) out += `<text x="50" y="58" text-anchor="middle" font-size="22" font-weight="700" fill="${col}" font-family="Fredoka, sans-serif">0</text>`;
    return DIA(out);
  }
  const vs = s.poly, n = vs.length;
  vs.forEach((V, i) => {
    const P = vs[(i - 1 + n) % n], N = vs[(i + 1) % n];
    const norm = ([x, y]) => { const l = Math.hypot(x, y); return [x / l, y / l]; };
    const a = norm([P[0] - V[0], P[1] - V[1]]), b = norm([N[0] - V[0], N[1] - V[1]]);
    const dot = a[0] * b[0] + a[1] * b[1];
    const between = Math.acos(Math.max(-1, Math.min(1, dot)));
    const bis = norm([a[0] + b[0], a[1] + b[1]]);
    const convex = insidePoly([V[0] + bis[0] * 3, V[1] + bis[1] * 3], vs);
    const interior = convex ? between : 2 * Math.PI - between;
    const r = interior > Math.PI ? 10 : 15;
    if (Math.abs(interior - Math.PI / 2) < 0.02) {
      const q = 13;
      out += `<polyline points="${pts([[V[0] + a[0] * q, V[1] + a[1] * q], [V[0] + (a[0] + b[0]) * q, V[1] + (a[1] + b[1]) * q], [V[0] + b[0] * q, V[1] + b[1] * q]])}" fill="${col}" fill-opacity="0.3" stroke="${col}" stroke-width="3"/>`;
      return;
    }
    // Choose the sweep direction that runs through the inside of the shape.
    const ta = Math.atan2(a[1], a[0]), tb = Math.atan2(b[1], b[0]);
    const span1 = (tb - ta + 4 * Math.PI) % (2 * Math.PI); // increasing angle (sweep=1 in SVG)
    const mid1 = ta + span1 / 2;
    const in1 = insidePoly([V[0] + Math.cos(mid1) * 4, V[1] + Math.sin(mid1) * 4], vs);
    const sweep = in1 ? 1 : 0;
    const span = in1 ? span1 : 2 * Math.PI - span1;
    const A = [V[0] + a[0] * r, V[1] + a[1] * r], B = [V[0] + b[0] * r, V[1] + b[1] * r];
    out += `<path d="M${r1(V[0])},${r1(V[1])} L${r1(A[0])},${r1(A[1])} A${r},${r} 0 ${span > Math.PI ? 1 : 0} ${sweep} ${r1(B[0])},${r1(B[1])} Z" fill="${col}" fill-opacity="${interior > Math.PI ? 0.15 : 0.35}" stroke="${col}" stroke-width="2.5"/>`;
  });
  return DIA(out);
}
const PAIR_COLS = ['#E23B3B', '#2F6FD6', '#2E9E4F', '#8E44AD'];
function diaSides(s, col) {
  let out = '';
  if (!s.poly) {
    out += base(s, '#fff');
    if (s.key === 'semicircle') {
      out += `<path d="M8,70 A42,42 0 0 1 92,70" fill="none" stroke="#E8A400" stroke-width="7"/><path d="M8,70 L92,70" stroke="${PAIR_COLS[1]}" stroke-width="7"/>`;
    } else {
      out += outline(s, `fill="none" stroke="#E8A400" stroke-width="7"`);
    }
    return DIA(out);
  }
  out += base(s, '#fff');
  const vs = s.poly, n = vs.length;
  const edges = vs.map((v, i) => [v, vs[(i + 1) % n]]);
  if (s.star) {
    // all 10 sides the same length: tick each one
    edges.forEach(([p, q]) => {
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy);
      const nx = (-dy / l) * 5, ny = (dx / l) * 5;
      out += `<line x1="${r1(mx - nx)}" y1="${r1(my - ny)}" x2="${r1(mx + nx)}" y2="${r1(my + ny)}" stroke="#E8A400" stroke-width="3.5"/>`;
    });
    return DIA(out);
  }
  const dirOf = ([p, q]) => ((Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI + 360) % 180;
  const groups = [];
  edges.forEach((e) => {
    const d = dirOf(e);
    const g = groups.find((g) => Math.min(Math.abs(g.d - d), 180 - Math.abs(g.d - d)) < 0.5);
    g ? g.edges.push(e) : groups.push({ d, edges: [e] });
  });
  let c = 0;
  for (const g of groups) {
    if (g.edges.length < 2) continue;
    const colr = PAIR_COLS[c++ % PAIR_COLS.length];
    for (const [p, q] of g.edges) {
      out += `<line x1="${r1(p[0])}" y1="${r1(p[1])}" x2="${r1(q[0])}" y2="${r1(q[1])}" stroke="${colr}" stroke-width="7" stroke-linecap="round"/>`;
      // little arrowhead (chevron) to show the "parallel" mark
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
      const k = 7;
      out += `<polyline points="${pts([[mx - ux * k - uy * k, my - uy * k + ux * k], [mx, my], [mx - ux * k + uy * k, my - uy * k - ux * k]])}" fill="none" stroke="#fff" stroke-width="3"/>`;
    }
  }
  return DIA(out);
}

/* ----------------------------------------------------------- illustrations */
// Every illustration lives in a 200 x 140 box.
const big = (s) =>
  `<g transform="translate(37,4) scale(1.32)">${outline(s, `fill="${s.fill}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"`)}</g>`;

const reg = (n, R, start, cx, cy) => pts(regular(n, R, start, cx, cy));

const ART = {
  pizza() {
    const pep = [[78, 48], [122, 50], [100, 70], [70, 88], [128, 90], [100, 104], [104, 34], [140, 70], [60, 66]];
    const slices = Array.from({ length: 6 }, (_, k) => { const a = rad(k * 60 + 15); return `<line x1="100" y1="70" x2="${r1(100 + 58 * Math.cos(a))}" y2="${r1(70 + 58 * Math.sin(a))}" stroke="#C98A2B" stroke-width="2"/>`; }).join('');
    return `<circle cx="100" cy="70" r="62" fill="#E9A64B" ${SW}/><circle cx="100" cy="70" r="52" fill="#E85D3A"/><circle cx="100" cy="70" r="48" fill="#FFD35C"/>
      ${pep.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="#C0392B" stroke="#8E2A1F" stroke-width="1.5"/><circle cx="${x - 2}" cy="${y - 2}" r="1.6" fill="#E77A6B"/>`).join('')}
      ${[[90, 52], [116, 76], [82, 98]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="2.6" fill="#3F8E3A" transform="rotate(-30 ${x} ${y})"/>`).join('')}${slices}`;
  },
  sun() {
    const rays = Array.from({ length: 12 }, (_, k) => { const a = rad(k * 30), b = rad(k * 30 - 9), c = rad(k * 30 + 9);
      return `<polygon points="${pts([[100 + 46 * Math.cos(b), 70 + 46 * Math.sin(b)], [100 + 66 * Math.cos(a), 70 + 66 * Math.sin(a)], [100 + 46 * Math.cos(c), 70 + 46 * Math.sin(c)]])}" fill="#FFA62B" ${SW}/>`; }).join('');
    return `<rect x="0" y="0" width="200" height="140" fill="#D7F0FF"/>${rays}<circle cx="100" cy="70" r="42" fill="#FFD93D" ${SW}/>
      <circle cx="86" cy="64" r="4.5" fill="${INK}"/><circle cx="114" cy="64" r="4.5" fill="${INK}"/>
      <circle cx="80" cy="78" r="6" fill="#FF9B85" opacity=".7"/><circle cx="120" cy="78" r="6" fill="#FF9B85" opacity=".7"/>
      <path d="M86,80 Q100,94 114,80" fill="none" ${SW}/>`;
  },
  clock() {
    const ticks = Array.from({ length: 60 }, (_, k) => { const a = rad(k * 6), big = k % 5 === 0;
      return `<line x1="${r1(100 + (big ? 44 : 48) * Math.cos(a))}" y1="${r1(70 + (big ? 44 : 48) * Math.sin(a))}" x2="${r1(100 + 52 * Math.cos(a))}" y2="${r1(70 + 52 * Math.sin(a))}" stroke="${INK}" stroke-width="${big ? 3 : 1.2}"/>`; }).join('');
    const nums = [[12, -90], [3, 0], [6, 90], [9, 180]].map(([n, d]) => `<text x="${r1(100 + 34 * Math.cos(rad(d)))}" y="${r1(70 + 34 * Math.sin(rad(d)) + 6)}" text-anchor="middle" font-size="16" font-weight="700" font-family="Fredoka, sans-serif" fill="${INK}">${n}</text>`).join('');
    return `<circle cx="100" cy="70" r="64" fill="#2F6FD6" ${SW}/><circle cx="100" cy="70" r="55" fill="#fff" stroke="${INK}" stroke-width="2"/>${ticks}${nums}
      <line x1="100" y1="70" x2="100" y2="38" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><line x1="100" y1="70" x2="122" y2="82" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
      <line x1="100" y1="70" x2="78" y2="106" stroke="#E23B3B" stroke-width="2"/><circle cx="100" cy="70" r="5" fill="#E23B3B" stroke="${INK}" stroke-width="2"/>`;
  },
  watermelon() {
    const seeds = [[76, 50], [100, 54], [124, 50], [88, 74], [112, 74], [100, 92], [64, 40], [136, 40]];
    return `<path d="M34,36 A66,66 0 0 0 166,36 Z" fill="#3BA55C" ${SW}/><path d="M42,36 A58,58 0 0 0 158,36 Z" fill="#E9F7D9"/><path d="M48,36 A52,52 0 0 0 152,36 Z" fill="#F25C5C"/>
      ${seeds.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="5" fill="${INK}" transform="rotate(${(x - 100) / 3} ${x} ${y})"/>`).join('')}
      <path d="M34,36 L166,36" ${SW}/>`;
  },
  rainbow() {
    const cols = ['#E23B3B', '#FF8C1A', '#FFD93D', '#3BA55C', '#2F6FD6', '#5B3CC4', '#9B59B6'];
    const arcs = cols.map((c, i) => { const r = 86 - i * 11; return `<path d="M${100 - r},124 A${r},${r} 0 0 1 ${100 + r},124 Z" fill="${c}"/>`; }).join('');
    const cloud = (x) => `<g fill="#fff" ${SW}><path d="M${x - 26},128 a12,12 0 0 1 10,-18 a15,15 0 0 1 28,-2 a12,12 0 0 1 16,20 Z"/></g>`;
    return `<rect width="200" height="140" fill="#D7F0FF"/><path d="M14,124 A86,86 0 0 1 186,124 Z" fill="none" ${SW}/>${arcs}<path d="M14,124 A86,86 0 0 1 186,124 Z" fill="none" ${SW}/>${cloud(24)}${cloud(180)}`;
  },
  protractor() {
    const ticks = Array.from({ length: 37 }, (_, k) => { const a = rad(180 + k * 5), l = k % 6 === 0 ? 14 : k % 2 === 0 ? 9 : 6;
      return `<line x1="${r1(100 + 80 * Math.cos(a))}" y1="${r1(122 + 80 * Math.sin(a))}" x2="${r1(100 + (80 - l) * Math.cos(a))}" y2="${r1(122 + (80 - l) * Math.sin(a))}" stroke="${INK}" stroke-width="1.5"/>`; }).join('');
    const labs = [0, 30, 60, 90, 120, 150, 180].map((d) => { const a = rad(180 + d); return `<text x="${r1(100 + 58 * Math.cos(a))}" y="${r1(122 + 58 * Math.sin(a) + 4)}" text-anchor="middle" font-size="10" font-family="Fredoka, sans-serif" fill="${INK}">${180 - d}</text>`; }).join('');
    return `<path d="M16,122 A84,84 0 0 1 184,122 Z" fill="#BFE3FF" fill-opacity=".85" ${SW}/>${ticks}${labs}
      <path d="M82,122 A18,18 0 0 1 118,122" fill="none" stroke="${INK}" stroke-width="1.8"/><line x1="100" y1="122" x2="100" y2="112" stroke="${INK}" stroke-width="2"/><path d="M16,122 L184,122" ${SW}/>`;
  },
  mirror() {
    return `<rect width="200" height="140" fill="#F6EEDF"/><ellipse cx="100" cy="70" rx="50" ry="64" fill="#D4A72C" ${SW}/><ellipse cx="100" cy="70" rx="41" ry="55" fill="#BFE6F5" stroke="#A5821C" stroke-width="2"/>
      <path d="M74,58 L96,30 M78,76 L108,38" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>
      ${[[100, 6], [150, 70], [100, 134], [50, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#F4D35E" stroke="${INK}" stroke-width="1.5"/>`).join('')}`;
  },
  rug() {
    return `<rect width="200" height="140" fill="#C69C6D"/>${[0, 1, 2, 3, 4].map((i) => `<line x1="0" y1="${14 + i * 28}" x2="200" y2="${14 + i * 28}" stroke="#A97E52" stroke-width="2"/>`).join('')}
      <ellipse cx="100" cy="70" rx="92" ry="60" fill="#D9534F" ${SW}/><ellipse cx="100" cy="70" rx="78" ry="49" fill="#F0AD4E"/><ellipse cx="100" cy="70" rx="64" ry="38" fill="#5BC0DE"/>
      <ellipse cx="100" cy="70" rx="48" ry="27" fill="#F7F1E3"/><ellipse cx="100" cy="70" rx="30" ry="15" fill="#3BA55C"/>`;
  },
  soap() {
    const bub = [[40, 30, 10], [162, 26, 8], [170, 112, 11], [30, 112, 7], [150, 50, 5], [56, 16, 5]];
    return `<rect width="200" height="140" fill="#E4F4FB"/><ellipse cx="100" cy="74" rx="74" ry="44" fill="#F7B7CF" ${SW}/><ellipse cx="100" cy="68" rx="60" ry="32" fill="#FBD3E2"/>
      <text x="100" y="78" text-anchor="middle" font-size="24" font-weight="700" fill="#E08AAD" font-family="Fredoka, sans-serif">SOAP</text>
      ${bub.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity=".6" stroke="#8FC9E2" stroke-width="2"/><circle cx="${x - r / 3}" cy="${y - r / 3}" r="${r / 4}" fill="#fff"/>`).join('')}`;
  },
  warningSign() {
    return `<rect width="200" height="140" fill="#D7F0FF"/><polygon points="${pts(regular(3, 74, -90, 100, 82))}" fill="#E23B3B" ${SW} stroke-width="4"/>
      <polygon points="${pts(regular(3, 54, -90, 100, 82))}" fill="#fff" stroke="none"/>
      <rect x="95" y="62" width="10" height="30" rx="5" fill="${INK}"/><circle cx="100" cy="104" r="6" fill="${INK}"/>`;
  },
  musicTriangle() {
    const [t, r, l] = regular(3, 58, -90, 100, 78);
    return `<rect width="200" height="140" fill="#FFF4D6"/><line x1="100" y1="2" x2="100" y2="${r1(t[1])}" stroke="#C0392B" stroke-width="2.5"/>
      <path d="M${r1(l[0] + 10)},${r1(l[1] - 17)} L${r1(t[0])},${r1(t[1])} L${r1(r[0])},${r1(r[1])} L${r1(l[0] + 10)},${r1(l[1])}" fill="none" stroke="${INK}" stroke-width="11" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="M${r1(l[0] + 10)},${r1(l[1] - 17)} L${r1(t[0])},${r1(t[1])} L${r1(r[0])},${r1(r[1])} L${r1(l[0] + 10)},${r1(l[1])}" fill="none" stroke="#C9D3DD" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>
      <line x1="150" y1="40" x2="182" y2="12" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><line x1="150" y1="40" x2="182" y2="12" stroke="#C9D3DD" stroke-width="3" stroke-linecap="round"/>
      <g fill="${INK}" font-family="Fredoka, sans-serif" font-size="22"><text x="22" y="40">♪</text><text x="160" y="120">♫</text></g>`;
  },
  snookerRack() {
    const cols = ['#E23B3B', '#E23B3B', '#FFD93D', '#E23B3B', '#111', '#E23B3B', '#3BA55C', '#E23B3B', '#2F6FD6', '#E23B3B', '#E23B3B', '#8B4513', '#E23B3B', '#FF69B4', '#E23B3B'];
    let balls = '', k = 0;
    for (let i = 0; i < 5; i++) for (let j = 0; j <= i; j++) {
      const x = 100 + (j - i / 2) * 19.5, y = 52 + i * 17;
      balls += `<circle cx="${r1(x)}" cy="${y}" r="9.3" fill="${cols[k++]}" stroke="${INK}" stroke-width="1.5"/><circle cx="${r1(x - 3)}" cy="${y - 3}" r="2.2" fill="#fff" opacity=".7"/>`;
    }
    return `<rect width="200" height="140" fill="#2E7D32"/><polygon points="${pts(regular(3, 80, -90, 100, 82))}" fill="none" stroke="#8B5A2B" stroke-width="10" stroke-linejoin="round"/>
      <polygon points="${pts(regular(3, 80, -90, 100, 82))}" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>${balls}`;
  },
  present() {
    return `<rect x="46" y="30" width="108" height="108" fill="#E23B3B" ${SW}/><rect x="91" y="30" width="18" height="108" fill="#FFD93D" stroke="${INK}" stroke-width="2"/>
      <rect x="46" y="75" width="108" height="18" fill="#FFD93D" stroke="${INK}" stroke-width="2"/>
      <path d="M100,30 C80,2 58,14 72,28 C78,33 92,31 100,30 C108,31 122,33 128,28 C142,14 120,2 100,30 Z" fill="#FFD93D" ${SW}/><circle cx="100" cy="30" r="6" fill="#F4B400" ${SW}/>
      ${[[64, 50], [136, 50], [64, 116], [136, 116], [120, 106]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#fff" opacity=".85"/>`).join('')}`;
  },
  window() {
    return `<rect width="200" height="140" fill="#F3D9B1"/><rect x="40" y="6" width="120" height="120" fill="#fff" ${SW}/><rect x="49" y="15" width="102" height="102" fill="#8FD3FF" stroke="${INK}" stroke-width="2"/>
      <circle cx="78" cy="44" r="10" fill="#FFD93D"/><path d="M110,50 a8,8 0 0 1 14,-6 a9,9 0 0 1 16,6 Z" fill="#fff"/>
      <rect x="96" y="15" width="8" height="102" fill="#fff" stroke="${INK}" stroke-width="1.5"/><rect x="49" y="62" width="102" height="8" fill="#fff" stroke="${INK}" stroke-width="1.5"/>
      <path d="M58,100 L72,86 M120,104 L138,86" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/><rect x="32" y="124" width="136" height="12" rx="2" fill="#fff" ${SW}/>`;
  },
  chessboard() {
    let sq = '';
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) sq += `<rect x="${44 + j * 14}" y="${14 + i * 14}" width="14" height="14" fill="${(i + j) % 2 ? '#7A4B2A' : '#F3DDB3'}"/>`;
    return `<rect x="36" y="6" width="128" height="128" fill="#5C3317" ${SW}/>${sq}<rect x="44" y="14" width="112" height="112" fill="none" stroke="${INK}" stroke-width="1.5"/>
      <g ${SW}><circle cx="65" cy="91" r="5" fill="#fff"/><path d="M59,104 L71,104 L68,94 L62,94 Z" fill="#fff"/><circle cx="121" cy="35" r="5" fill="${INK}"/><path d="M115,48 L127,48 L124,38 L118,38 Z" fill="${INK}"/></g>`;
  },
  door() {
    return `<rect width="200" height="140" fill="#F3E3C3"/><rect x="58" y="4" width="84" height="136" fill="#fff" ${SW}/><rect x="64" y="10" width="72" height="130" fill="#2F6FD6" ${SW}/>
      <rect x="72" y="20" width="24" height="44" rx="2" fill="#4A86E8" stroke="${INK}" stroke-width="1.8"/><rect x="104" y="20" width="24" height="44" rx="2" fill="#4A86E8" stroke="${INK}" stroke-width="1.8"/>
      <rect x="72" y="92" width="56" height="38" rx="2" fill="#4A86E8" stroke="${INK}" stroke-width="1.8"/><rect x="86" y="73" width="28" height="7" rx="2" fill="#F4D35E" stroke="${INK}" stroke-width="1.5"/>
      <circle cx="124" cy="80" r="4.5" fill="#F4D35E" stroke="${INK}" stroke-width="1.5"/><text x="100" y="17.5" text-anchor="middle" font-size="7" fill="#fff" font-family="Fredoka, sans-serif">No. 4</text>`;
  },
  phone() {
    const icons = ['#E23B3B', '#FFD93D', '#3BA55C', '#2F6FD6', '#FF8C1A', '#9B59B6', '#00BCD4', '#FF69B4', '#8BC34A'];
    return `<rect x="68" y="4" width="64" height="132" rx="6" fill="#2b2b2b" ${SW}/><rect x="73" y="16" width="54" height="106" rx="2" fill="#CDEBFF"/>
      ${icons.map((c, i) => `<rect x="${79 + (i % 3) * 16}" y="${24 + Math.floor(i / 3) * 16}" width="11" height="11" rx="3" fill="${c}"/>`).join('')}
      <text x="100" y="105" text-anchor="middle" font-size="12" font-family="Fredoka, sans-serif" fill="#2b2b2b">12:30</text><rect x="92" y="9" width="16" height="3" rx="1.5" fill="#555"/><circle cx="100" cy="129" r="3.5" fill="#555"/>`;
  },
  chocolateBar() {
    let sq = '';
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) sq += `<rect x="${24 + j * 24}" y="${33 + i * 25}" width="20" height="21" rx="2" fill="#7B4A2D" stroke="#4E2A16" stroke-width="1.5"/><path d="M${27 + j * 24},${50 + i * 25} L${27 + j * 24},${36 + i * 25} L${41 + j * 24},${36 + i * 25}" fill="none" stroke="#A0694A" stroke-width="2"/>`;
    return `<rect x="20" y="29" width="160" height="82" fill="#5E3520" ${SW}/>${sq}
      <path d="M118,29 L126,40 L120,52 L128,64 L121,76 L129,88 L120,100 L126,111 L118,111 Z" fill="#D9D9D9" stroke="${INK}" stroke-width="1.5"/>
      <rect x="124" y="29" width="56" height="82" fill="#7E3FB0" ${SW}/><text x="152" y="76" text-anchor="middle" font-size="13" font-weight="700" fill="#FFD93D" font-family="Fredoka, sans-serif">CHOC</text>`;
  },
  football() {
    const C = [100, 70], R = 64, cp = regular(5, 17, -90, C[0], C[1]);
    let g = `<polygon points="${pts(cp)}" fill="#2b2b2b"/>`;
    const outerCenters = [];
    for (let k = 0; k < 5; k++) {
      const phi = -90 + 72 * k, oc = [C[0] + 56 * Math.cos(rad(phi)), C[1] + 56 * Math.sin(rad(phi))];
      const ov = regular(5, 15, phi + 180, oc[0], oc[1]);
      outerCenters.push(ov);
      g += `<polygon points="${pts(ov)}" fill="#2b2b2b"/>`;
      const inner = ov[0];
      g += `<line x1="${r1(cp[k][0])}" y1="${r1(cp[k][1])}" x2="${r1(inner[0])}" y2="${r1(inner[1])}" stroke="${INK}" stroke-width="2"/>`;
    }
    for (let k = 0; k < 5; k++) {
      const A = outerCenters[k], B = outerCenters[(k + 1) % 5];
      let best = null;
      for (const p of A) for (const q of B) { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (!best || d < best.d) best = { d, p, q }; }
      g += `<line x1="${r1(best.p[0])}" y1="${r1(best.p[1])}" x2="${r1(best.q[0])}" y2="${r1(best.q[1])}" stroke="${INK}" stroke-width="2"/>`;
    }
    return `<rect width="200" height="140" fill="#7CC36E"/><defs><clipPath id="ball"><circle cx="100" cy="70" r="${R}"/></clipPath></defs>
      <circle cx="100" cy="70" r="${R}" fill="#fff"/><g clip-path="url(#ball)">${g}</g><circle cx="100" cy="70" r="${R}" fill="none" ${SW}/>
      <polygon points="${pts(cp)}" fill="none" stroke="#FFD93D" stroke-width="3" stroke-linejoin="round"/>`;
  },
  cookie() {
    const chips = [[90, 50], [116, 58], [80, 80], [106, 86], [124, 100], [96, 110], [70, 104], [134, 76], [100, 30]];
    return `<rect width="200" height="140" fill="#FBE9E7"/><polygon points="${reg(5, 70, -90, 100, 76)}" fill="#E6A85C" stroke="#9C6326" stroke-width="3" stroke-linejoin="round"/>
      <polygon points="${reg(5, 60, -90, 100, 76)}" fill="#EDB873"/>${chips.map(([x, y]) => `<path d="M${x - 5},${y + 3} Q${x},${y - 8} ${x + 5},${y + 3} Z" fill="#4E2A16"/>`).join('')}`;
  },
  chocBox() {
    return `<rect width="200" height="140" fill="#FFF0F5"/><polygon points="${reg(5, 70, -90, 100, 76)}" fill="#8E44AD" ${SW}/><polygon points="${reg(5, 60, -90, 100, 76)}" fill="#A55BC6" stroke="#F4D35E" stroke-width="3"/>
      <line x1="100" y1="6" x2="100" y2="132" stroke="#F4D35E" stroke-width="7"/>
      <path d="M100,72 C82,52 66,64 80,76 C88,82 96,76 100,72 C104,76 112,82 120,76 C134,64 118,52 100,72 Z" fill="#F4D35E" ${SW}/><circle cx="100" cy="73" r="5" fill="#E2B93B" ${SW}/>`;
  },
  honeycomb() {
    const r = 30, d = Math.sqrt(3) * r, C = [100, 74];
    let g = '';
    for (let k = 0; k < 6; k++) { const a = rad(k * 60); g += `<polygon points="${reg(6, r - 2, -90, C[0] + d * Math.cos(a), C[1] + d * Math.sin(a))}" fill="#F6B93B" stroke="#C47F12" stroke-width="3"/>`; }
    return `<rect width="200" height="140" fill="#FBD66B"/>${g}<polygon points="${reg(6, r + 2, -90, C[0], C[1])}" fill="#FFB300" ${SW}/>
      <path d="M86,82 Q100,96 114,82" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/>
      <g transform="translate(150,26)"><ellipse cx="-6" cy="-10" rx="8" ry="6" fill="#fff" opacity=".85" stroke="${INK}" stroke-width="1.5"/><ellipse cx="6" cy="-10" rx="8" ry="6" fill="#fff" opacity=".85" stroke="${INK}" stroke-width="1.5"/>
      <ellipse cx="0" cy="0" rx="14" ry="10" fill="#FFD93D" stroke="${INK}" stroke-width="2"/><path d="M-4,-9 L-4,9 M4,-9 L4,9" stroke="${INK}" stroke-width="3"/><circle cx="11" cy="-2" r="1.8" fill="${INK}"/></g>`;
  },
  nut() {
    return `<rect width="200" height="140" fill="#E8EEF3"/><polygon points="${reg(6, 64, -90, 100, 70)}" fill="#A9B4BF" ${SW}/><polygon points="${reg(6, 52, -90, 100, 70)}" fill="#C3CCD5" stroke="#8D98A3" stroke-width="2"/>
      <circle cx="100" cy="70" r="27" fill="#E8EEF3" ${SW}/><circle cx="100" cy="70" r="22" fill="none" stroke="#8D98A3" stroke-width="2" stroke-dasharray="4 3"/>
      <path d="M66,40 L80,30" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`;
  },
  pencilEnd() {
    return `<rect width="200" height="140" fill="#F5F1E8"/><polygon points="${reg(6, 64, -90, 100, 70)}" fill="#F4C430" ${SW}/>
      ${regular(6, 64, -90, 100, 70).map(([x, y]) => `<line x1="100" y1="70" x2="${r1(x)}" y2="${r1(y)}" stroke="#D9A915" stroke-width="1.5"/>`).join('')}
      <circle cx="100" cy="70" r="38" fill="#E8C39E" stroke="#B88A5A" stroke-width="2"/><circle cx="100" cy="70" r="24" fill="none" stroke="#D3A97B" stroke-width="1.5"/>
      <circle cx="100" cy="70" r="11" fill="#444" stroke="${INK}" stroke-width="2"/>`;
  },
  stopSign() {
    return `<rect width="200" height="140" fill="#D7F0FF"/><polygon points="${reg(8, 70, -112.5, 100, 70)}" fill="#D62828" ${SW}/><polygon points="${reg(8, 62, -112.5, 100, 70)}" fill="none" stroke="#fff" stroke-width="3.5"/>
      <text x="100" y="83" text-anchor="middle" font-size="36" font-weight="700" fill="#fff" font-family="Fredoka, sans-serif">STOP</text>`;
  },
  umbrella() {
    const v = regular(8, 70, -112.5, 100, 70), cols = ['#E23B3B', '#FFD93D', '#2F6FD6', '#3BA55C'];
    const panels = v.map((p, i) => `<polygon points="${pts([[100, 70], p, v[(i + 1) % 8]])}" fill="${cols[i % 4]}" stroke="${INK}" stroke-width="1.5"/>`).join('');
    return `<rect width="200" height="140" fill="#9FB8C8"/>${[20, 50, 150, 180].map((x) => `<line x1="${x}" y1="10" x2="${x - 8}" y2="30" stroke="#fff" stroke-width="2" opacity=".7"/><line x1="${x + 6}" y1="100" x2="${x - 2}" y2="120" stroke="#fff" stroke-width="2" opacity=".7"/>`).join('')}
      ${panels}<polygon points="${pts(v)}" fill="none" ${SW}/><circle cx="100" cy="70" r="6" fill="#555" ${SW}/>`;
  },
  octWindow() {
    return `<rect width="200" height="140" fill="#E5D3B3"/>${[0, 1, 2, 3, 4, 5].map((i) => `<line x1="0" y1="${12 + i * 24}" x2="200" y2="${12 + i * 24}" stroke="#CDB894" stroke-width="2"/>`).join('')}
      <polygon points="${reg(8, 68, -112.5, 100, 70)}" fill="#8B5A2B" ${SW}/><polygon points="${reg(8, 56, -112.5, 100, 70)}" fill="#8FD3FF" stroke="${INK}" stroke-width="2"/>
      <line x1="100" y1="14" x2="100" y2="126" stroke="#8B5A2B" stroke-width="6"/><line x1="44" y1="70" x2="156" y2="70" stroke="#8B5A2B" stroke-width="6"/>
      <path d="M62,52 L78,36 M114,104 L134,86" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`;
  },
  playingCard() {
    const diamond = (cx, cy, s) => `<polygon points="${pts([[cx, cy - s * 1.35], [cx + s, cy], [cx, cy + s * 1.35], [cx - s, cy]])}" fill="#E23B3B"/>`;
    return `<rect width="200" height="140" fill="#2E7D32"/><rect x="56" y="4" width="88" height="132" rx="8" fill="#fff" ${SW}/>
      <text x="66" y="24" font-size="16" font-weight="700" fill="#E23B3B" font-family="Fredoka, sans-serif">A</text>${diamond(70, 34, 5)}
      <g transform="rotate(180 100 70)"><text x="66" y="24" font-size="16" font-weight="700" fill="#E23B3B" font-family="Fredoka, sans-serif">A</text>${diamond(70, 34, 5)}</g>
      <polygon points="${pts([[100, 30], [128, 70], [100, 110], [72, 70]])}" fill="#E23B3B" ${SW}/>`;
  },
  argyleSock() {
    return `<defs><clipPath id="sock"><path d="M70,4 L130,4 L130,84 C130,96 150,100 164,104 C182,110 182,136 160,136 L96,136 C78,136 70,124 70,108 Z"/></clipPath></defs>
      <rect width="200" height="140" fill="#F7F1E3"/>
      <g clip-path="url(#sock)"><rect width="200" height="140" fill="#3B5BA9"/>
      ${[[100, 22], [100, 70], [100, 118], [70, 46], [130, 46], [70, 94], [130, 94], [160, 118]].map(([x, y], i) => `<polygon points="${pts([[x, y - 24], [x + 15, y], [x, y + 24], [x - 15, y]])}" fill="${i % 2 ? '#F4C430' : '#E23B3B'}" stroke="${INK}" stroke-width="1.5"/>`).join('')}
      <rect x="60" y="4" width="80" height="14" fill="#fff"/></g>
      <path d="M70,4 L130,4 L130,84 C130,96 150,100 164,104 C182,110 182,136 160,136 L96,136 C78,136 70,124 70,108 Z" fill="none" ${SW}/>
      <polygon points="${pts([[100, 46], [115, 70], [100, 94], [85, 70]])}" fill="none" stroke="#fff" stroke-width="3"/>`;
  },
  shortbread() {
    return `<rect width="200" height="140" fill="#E9F3FB"/><polygon points="${pts([[100, 4], [150, 70], [100, 136], [50, 70]])}" fill="#F2CF8D" stroke="#B98A3E" stroke-width="3" stroke-linejoin="round"/>
      <polygon points="${pts([[100, 20], [138, 70], [100, 120], [62, 70]])}" fill="#F6DBA5"/>
      ${[[100, 44], [88, 64], [112, 64], [100, 84], [88, 104], [112, 104], [100, 64]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#C99A52"/>`).join('')}
      <path d="M92,74 Q100,66 108,74 Q100,82 92,74 Z" fill="#E23B3B" stroke="#A8261F" stroke-width="1.5"/>`;
  },
  lampshade() {
    return `<rect width="200" height="140" fill="#3D3B6E"/><circle cx="100" cy="58" r="56" fill="#FFF3B0" opacity=".25"/>
      <rect x="94" y="80" width="12" height="40" fill="#C9A227" ${SW}/><path d="M70,134 Q70,118 100,118 Q130,118 130,134 Z" fill="#C9A227" ${SW}/>
      <polygon points="${pts([[72, 14], [128, 14], [158, 84], [42, 84]])}" fill="#F7C873" ${SW}/>
      ${[0, 1, 2, 3].map((i) => `<line x1="${80 + i * 13.3}" y1="14" x2="${58 + i * 28}" y2="84" stroke="#E4A84B" stroke-width="2"/>`).join('')}`;
  },
  popcorn() {
    const corn = [[64, 26], [80, 18], [98, 22], [116, 16], [134, 24], [72, 10], [108, 8], [126, 6], [90, 6], [146, 34], [54, 34]];
    const stripes = [0, 1, 2, 3, 4].map((i) => {
      const xt = 50 + i * 20, xb = 66 + i * 13.6;
      return `<polygon points="${pts([[xt, 34], [xt + 10, 34], [xb + 6.8, 134], [xb, 134]])}" fill="#E23B3B"/>`;
    }).join('');
    return `<rect width="200" height="140" fill="#FFF4D6"/>${corn.map(([x, y]) => `<g fill="#FFF7DC" stroke="#E2B04A" stroke-width="1.5"><circle cx="${x}" cy="${y}" r="10"/><circle cx="${x + 7}" cy="${y + 5}" r="7"/><circle cx="${x - 6}" cy="${y + 6}" r="7"/></g>`).join('')}
      <polygon points="${pts([[46, 34], [154, 34], [134, 134], [66, 134]])}" fill="#fff"/>${stripes}<polygon points="${pts([[46, 34], [154, 34], [134, 134], [66, 134]])}" fill="none" ${SW}/>
      <circle cx="100" cy="84" r="18" fill="#FFD93D" ${SW}/><text x="100" y="90" text-anchor="middle" font-size="15" font-weight="700" fill="#E23B3B" font-family="Fredoka, sans-serif">POP</text>`;
  },
  plantPot() {
    return `<rect width="200" height="140" fill="#EAF6E6"/>
      <path d="M100,66 C96,46 92,32 100,14 M100,58 C84,46 70,48 62,36 C78,30 92,40 100,58 M100,50 C114,38 128,40 138,28 C124,22 108,32 100,50" fill="#3BA55C" stroke="#226B37" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="100" cy="14" r="9" fill="#FF69B4" ${SW}/><circle cx="100" cy="14" r="3.5" fill="#FFD93D"/>
      <polygon points="${pts([[54, 64], [146, 64], [128, 136], [72, 136]])}" fill="#D2693C" ${SW}/><line x1="${54 + 4.5 * 1}" y1="80" x2="${146 - 4.5}" y2="80" stroke="#A84E26" stroke-width="2.5"/>`;
  },
  starfish() {
    const sv = star(70, 30, 100, 76);
    const dots = [];
    for (let k = 0; k < 5; k++) for (const d of [22, 38, 52]) { const a = rad(-90 + 72 * k); dots.push([100 + d * Math.cos(a), 76 + d * Math.sin(a)]); }
    return `<rect width="200" height="140" fill="#F7E3B5"/><path d="M0,120 Q50,110 100,122 T200,118 L200,140 L0,140 Z" fill="#8FD3FF" opacity=".6"/>
      <polygon points="${pts(sv)}" fill="#FF8C42" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      ${dots.map(([x, y]) => `<circle cx="${r1(x)}" cy="${r1(y)}" r="3" fill="#FFD0A8"/>`).join('')}
      <circle cx="92" cy="74" r="3" fill="${INK}"/><circle cx="108" cy="74" r="3" fill="${INK}"/><path d="M93,84 Q100,90 107,84" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`;
  },
  wand() {
    const sp = [[30, 30], [170, 24], [168, 110], [44, 118], [150, 64]];
    return `<rect width="200" height="140" fill="#3D3B6E"/>${sp.map(([x, y]) => `<path d="M${x},${y - 7} L${x + 2},${y - 2} L${x + 7},${y} L${x + 2},${y + 2} L${x},${y + 7} L${x - 2},${y + 2} L${x - 7},${y} L${x - 2},${y - 2} Z" fill="#FFF3B0"/>`).join('')}
      <line x1="100" y1="80" x2="64" y2="138" stroke="#fff" stroke-width="7" stroke-linecap="round"/><line x1="100" y1="80" x2="64" y2="138" stroke="#FF69B4" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="6 6"/>
      <polygon points="${pts(star(62, 23.7, 100, 64))}" fill="#FFD93D" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
  },
  starSticker() {
    return `<rect width="200" height="140" fill="#FFFFFF"/><rect x="0" y="0" width="200" height="140" fill="none"/>
      ${Array.from({ length: 7 }, (_, i) => `<line x1="0" y1="${12 + i * 20}" x2="200" y2="${12 + i * 20}" stroke="#BFD9F2" stroke-width="1.5"/>`).join('')}<line x1="26" y1="0" x2="26" y2="140" stroke="#F4A6A6" stroke-width="1.5"/>
      <polygon points="${pts(star(66, 25.2, 100, 76))}" fill="#F4C430" stroke="#B8860B" stroke-width="3" stroke-linejoin="round"/>
      <polygon points="${pts(star(54, 20.6, 100, 76))}" fill="#FFDD57"/>
      <text x="100" y="82" text-anchor="middle" font-size="12" font-weight="700" fill="#B8860B" font-family="Fredoka, sans-serif">WELL</text><text x="100" y="95" text-anchor="middle" font-size="12" font-weight="700" fill="#B8860B" font-family="Fredoka, sans-serif">DONE</text>`;
  },
  balloon() {
    return `<rect width="200" height="140" fill="#D7F0FF"/><path d="M100,92 C106,104 94,116 102,138" fill="none" stroke="${INK}" stroke-width="1.8"/>
      <g transform="translate(55,4) scale(0.9)"><path d="${SHAPES.heart.path}" fill="#E23B3B" stroke="${INK}" stroke-width="2.8" stroke-linejoin="round"/></g>
      <path d="M95,93 L105,93 L100,85 Z" fill="#C0392B" ${SW}/><path d="M70,28 C74,18 84,14 90,18" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>`;
  },
  heartBox() {
    return `<rect width="200" height="140" fill="#FFF0F5"/><g transform="translate(35,2) scale(1.3)"><path d="${SHAPES.heart.path}" fill="#C0392B" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <g transform="translate(50,50) scale(0.8) translate(-50,-50)"><path d="${SHAPES.heart.path}" fill="#E74C3C" stroke="#F4D35E" stroke-width="2.5"/></g></g>
      <path d="M100,64 C82,44 66,56 80,68 C88,74 96,68 100,64 C104,68 112,74 120,68 C134,56 118,44 100,64 Z" fill="#F4D35E" ${SW}/><circle cx="100" cy="65" r="5" fill="#E2B93B" ${SW}/>
      <path d="M96,68 L88,90 M104,68 L112,90" stroke="#F4D35E" stroke-width="5" stroke-linecap="round"/>`;
  },
  loveSweet() {
    return `<rect width="200" height="140" fill="#EAF6FF"/><g transform="translate(37,4) scale(1.26)"><path d="${SHAPES.heart.path}" fill="#F9C6D9" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <g transform="translate(50,50) scale(0.84) translate(-50,-50)"><path d="${SHAPES.heart.path}" fill="none" stroke="#E79AB8" stroke-width="2"/></g></g>
      <text x="100" y="58" text-anchor="middle" font-size="18" font-weight="700" fill="#D6336C" font-family="Fredoka, sans-serif">BE</text><text x="100" y="80" text-anchor="middle" font-size="18" font-weight="700" fill="#D6336C" font-family="Fredoka, sans-serif">KIND</text>`;
  },
};

/* ------------------------------------------------------------ deck content */
// Suits: red = sides & vertices, green = lines of symmetry, blue = angles, yellow = sides (straight / curved / parallel)
const SUITS = {
  red: { col: '#E23B3B', head: 'Sides & vertices', dia: diaVertices },
  green: { col: '#2E9E4F', head: 'Lines of symmetry', dia: diaSymmetry },
  blue: { col: '#2F6FD6', head: 'Angles', dia: diaAngles },
  yellow: { col: '#F2B705', head: 'Parallel & curved sides', dia: diaSides },
};

const DECK = [
  ['circle', { red: '1 curved side<br><b>0 vertices</b> (no corners)', green: '<b>Infinite!</b> Any line through the middle works', blue: 'No corners, so <b>no angles</b>', yellow: 'No straight sides, so <b>no parallel sides</b>' },
    [['pizza', 'Pizza'], ['sun', 'The Sun'], ['clock', 'Clock']]],
  ['semicircle', { red: '2 sides (1 straight, 1 curved)<br><b>2 vertices</b>', green: '<b>1</b> line of symmetry', blue: '<b>2 corners</b>, where the straight side meets the curve', yellow: '1 straight + 1 curved side<br><b>No parallel sides</b>' },
    [['watermelon', 'Watermelon slice'], ['rainbow', 'Rainbow'], ['protractor', 'Protractor']]],
  ['oval', { red: '1 curved side<br><b>0 vertices</b> (no corners)', green: '<b>2</b> lines of symmetry', blue: 'No corners, so <b>no angles</b>', yellow: 'No straight sides, so <b>no parallel sides</b>' },
    [['mirror', 'Mirror'], ['rug', 'Rug'], ['soap', 'Bar of soap']]],
  ['triangle', { red: '3 straight sides<br><b>3 vertices</b>', green: '<b>3</b> lines of symmetry', blue: '<b>3 acute angles</b>, each 60°', yellow: '<b>No parallel sides</b><br>All 3 sides equal' },
    [['warningSign', 'Warning sign'], ['musicTriangle', 'Musical triangle'], ['snookerRack', 'Snooker rack']]],
  ['square', { red: '4 straight sides<br><b>4 vertices</b>', green: '<b>4</b> lines of symmetry', blue: '<b>4 right angles</b> (90°)', yellow: '<b>2 pairs</b> of parallel sides<br>All 4 sides equal' },
    [['present', 'Present'], ['window', 'Window'], ['chessboard', 'Chessboard']]],
  ['rectangle', { red: '4 straight sides<br><b>4 vertices</b>', green: '<b>2</b> lines of symmetry', blue: '<b>4 right angles</b> (90°)', yellow: '<b>2 pairs</b> of parallel sides<br>Opposite sides equal' },
    [['door', 'Door'], ['phone', 'Phone'], ['chocolateBar', 'Chocolate bar']]],
  ['pentagon', { red: '5 straight sides<br><b>5 vertices</b>', green: '<b>5</b> lines of symmetry<br>(regular pentagon)', blue: '<b>5 obtuse angles</b>, each 108°', yellow: '<b>No parallel sides</b>' },
    [['football', 'Football patch'], ['cookie', 'Cookie'], ['chocBox', 'Box of chocolates']]],
  ['hexagon', { red: '6 straight sides<br><b>6 vertices</b>', green: '<b>6</b> lines of symmetry<br>(regular hexagon)', blue: '<b>6 obtuse angles</b>, each 120°', yellow: '<b>3 pairs</b> of parallel sides' },
    [['honeycomb', 'Honeycomb'], ['nut', 'Metal nut'], ['pencilEnd', 'End of a pencil']]],
  ['octagon', { red: '8 straight sides<br><b>8 vertices</b>', green: '<b>8</b> lines of symmetry<br>(regular octagon)', blue: '<b>8 obtuse angles</b>, each 135°', yellow: '<b>4 pairs</b> of parallel sides' },
    [['stopSign', 'Stop sign'], ['umbrella', 'Umbrella from above'], ['octWindow', 'Window']]],
  ['rhombus', { red: '4 straight sides<br><b>4 vertices</b>', green: '<b>2</b> lines of symmetry<br>(the diagonals)', blue: '<b>2 acute + 2 obtuse</b><br>No right angles', yellow: '<b>2 pairs</b> of parallel sides<br>All 4 sides equal' },
    [['playingCard', 'Playing card'], ['argyleSock', 'Argyle sock'], ['shortbread', 'Shortbread biscuit']]],
  ['trapezium', { red: '4 straight sides<br><b>4 vertices</b>', green: '<b>1</b> line of symmetry', blue: '<b>2 acute + 2 obtuse</b><br>No right angles', yellow: '<b>1 pair</b> of parallel sides' },
    [['lampshade', 'Lampshade'], ['popcorn', 'Popcorn box'], ['plantPot', 'Plant pot']]],
  ['star', { red: '10 straight sides<br><b>10 vertices</b>', green: '<b>5</b> lines of symmetry', blue: '<b>5 acute</b> angles (points)<br><b>5 reflex</b> angles (inside)', yellow: '10 straight sides,<br><b>all the same length</b>' },
    [['starfish', 'Starfish'], ['wand', 'Magic wand'], ['starSticker', 'Star sticker']]],
  ['heart', { red: '2 curved sides<br><b>2 vertices</b>', green: '<b>1</b> line of symmetry', blue: '<b>2 corners</b>: a point at the bottom, a dip at the top', yellow: 'Curved sides only,<br><b>no straight sides</b>' },
    [['balloon', 'Balloon'], ['heartBox', 'Box of chocolates'], ['loveSweet', 'Love heart sweet']]],
];
for (const [k, s] of Object.entries(SHAPES)) s.key = k;

/* ------------------------------------------------------------------ cards */
const icon = (s, col) => `<svg viewBox="-4 -4 108 108" class="ico">${outline(s, `fill="${col}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"`)}</svg>`;
function card(shapeKey, suit, artKey, label, text) {
  const s = SHAPES[shapeKey], su = SUITS[suit];
  const art = artKey ? ART[artKey]() : `<rect width="200" height="140" fill="#fff"/>${big(s)}`;
  return `<div class="card ${suit}" style="--c:${su.col}">
    <div class="top">${icon(s, su.col)}<span class="nm">${s.name}</span>${icon(s, su.col)}</div>
    <div class="pic"><svg viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${art}</svg></div>
    <div class="lbl">${label}</div>
    <div class="attr"><div class="ah">${su.head}</div><div class="ab"><div class="dia">${su.dia(s, su.col)}</div><div class="at">${text}</div></div></div>
  </div>`;
}
const cards = [];
for (const [key, attrs, objs] of DECK) {
  cards.push(card(key, 'red', null, `${/^[aeiou]/i.test(SHAPES[key].name) ? 'An' : 'A'} ${SHAPES[key].name.toLowerCase()}`, attrs.red));
  ['green', 'blue', 'yellow'].forEach((suit, i) => cards.push(card(key, suit, objs[i][0], objs[i][1], attrs[suit])));
}

const back = () => `<div class="card back"><svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="280" rx="10" fill="#1E3A6E"/>
  ${Array.from({ length: 40 }, (_, i) => { const x = 14 + (i % 5) * 43, y = 16 + Math.floor(i / 5) * 35; const ks = ['circle', 'triangle', 'square', 'hexagon', 'star', 'heart', 'pentagon', 'rhombus']; const s = SHAPES[ks[(i * 3) % ks.length]]; return `<g transform="translate(${x - 8},${y - 8}) scale(0.16)" opacity=".22">${outline(s, 'fill="#fff"')}</g>`; }).join('')}
  <rect x="18" y="80" width="164" height="120" rx="16" fill="#fff" stroke="#F2B705" stroke-width="5"/>
  <g transform="translate(46,104)"><polygon points="0,10 22,28 0,46" fill="#2F6FD6" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="62" cy="28" rx="44" ry="25" fill="#F2B705" stroke="${INK}" stroke-width="2.5"/>
  <polygon points="52,10 66,10 59,22" fill="#E23B3B" stroke="${INK}" stroke-width="1.5"/><circle cx="84" cy="22" r="5" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="85" cy="22" r="2.2" fill="${INK}"/>
  <rect x="40" y="30" width="10" height="10" fill="#2E9E4F" stroke="${INK}" stroke-width="1.5"/><path d="M94,34 Q98,38 102,34" fill="none" stroke="${INK}" stroke-width="2"/></g>
  <text x="100" y="180" text-anchor="middle" font-size="26" font-weight="700" fill="#1E3A6E" font-family="Fredoka, sans-serif">Shape Fish</text>
</svg></div>`;

/* ------------------------------------------------------------- rules page */
const keyRows = DECK.map(([k, a]) => `<tr><td class="kn">${icon(SHAPES[k], '#fff')} ${SHAPES[k].name}</td><td>${a.red}</td><td>${a.green}</td><td>${a.blue}</td><td>${a.yellow}</td></tr>`).join('');
const rules = `<section class="page rules">
  <h1>Shape Fish <span>a 2D shapes Go Fish game</span></h1>
  <div class="cols">
    <div>
      <h2>What's in the deck</h2>
      <p>52 cards: <b>13 shapes</b>, with 4 cards of each. Every shape has one card of each colour:</p>
      <ul class="suits">
        <li><i style="background:#E23B3B"></i><b>Red</b>: the plain shape, with its <b>sides & vertices</b></li>
        <li><i style="background:#2E9E4F"></i><b>Green</b>: a real-life object, with its <b>lines of symmetry</b></li>
        <li><i style="background:#2F6FD6"></i><b>Blue</b>: a real-life object, with its <b>angles</b></li>
        <li><i style="background:#F2B705"></i><b>Yellow</b>: a real-life object, with its <b>parallel & curved sides</b></li>
      </ul>
      <p>A <b>set</b> is all 4 cards of one shape (red, green, blue and yellow).</p>
      <h2>How to play</h2>
      <ol>
        <li>Shuffle. Deal <b>7 cards</b> each (2 players) or <b>5 each</b> (3+ players). Spread the rest face down as the <b>pond</b>.</li>
        <li>On your turn, ask one player for a shape you already hold: <i>"Have you got any hexagons?"</i></li>
        <li>If they have any, they hand them all over and you go again. If not, they say <b>"Go fish!"</b> and you take a card from the pond.</li>
        <li>When you collect all 4 cards of a shape, lay the set down and <b>read the 4 facts out loud</b>.</li>
        <li>The game ends when all 13 sets are made. Most sets wins!</li>
      </ol>
    </div>
    <div>
      <h2>Two levels, one game</h2>
      <div class="lvl"><h3>Level 1: ask by name</h3><p>"Have you got any <b>circles</b>?"<br>Great for learning shape names and spotting shapes in real life. When you lay down a set, just read out the red card (sides & corners).</p></div>
      <div class="lvl"><h3>Level 2: ask by property</h3><p>Ask using a fact instead of the name:<br>"Have you got a shape with <b>6 vertices</b>?"<br>"…with <b>4 right angles</b>?" (careful, square <i>and</i> rectangle!)<br>"…with <b>1 line of symmetry</b>?"<br>If more than one shape fits, the other player chooses which one to give.</p></div>
      <div class="lvl"><h3>Bonus challenges</h3><p>• Before you lay a set, <b>predict</b> one fact, then check the card.<br>• Find something in the house that matches a card.<br>• Use a mirror to test the lines of symmetry.</p></div>
      <h2>Printing</h2>
      <p>Print on card at <b>100% / actual size</b> (A4). Pages 3 to 8 are the fronts. Page 9 is the card backs: print it on the reverse of each front page if you like, then cut along the grey lines. Laminate for long life.</p>
    </div>
  </div>
</section>
<section class="page rules key">
  <h1>Answer key <span>all 13 shapes at a glance</span></h1>
  <table><thead><tr><th>Shape</th><th style="color:#E23B3B">Sides & vertices</th><th style="color:#2E9E4F">Lines of symmetry</th><th style="color:#2F6FD6">Angles</th><th style="color:#B98B00">Parallel & curved sides</th></tr></thead><tbody>${keyRows}</tbody></table>
  <p class="note">Words to know. <b>Vertex</b> (plural vertices): a corner where two sides meet. <b>Right angle</b>: a square corner, 90°. <b>Acute</b>: smaller than a right angle. <b>Obtuse</b>: bigger than a right angle but less than a straight line. <b>Reflex</b>: bigger than a straight line (180°). <b>Parallel</b>: lines that always stay the same distance apart, like train tracks. <b>Regular</b>: all sides and all angles are equal.</p>
</section>`;

/* ------------------------------------------------------------------ pages */
const pages = [];
for (let i = 0; i < cards.length; i += 9) pages.push(`<section class="page grid">${cards.slice(i, i + 9).join('')}</section>`);
pages.push(`<section class="page grid backs">${Array.from({ length: 9 }, back).join('')}</section>`);

const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>Shape Fish: 2D Shapes Go Fish</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=Fredoka:wght@500;600;700&display=swap" rel="stylesheet">
<style>
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Andika, sans-serif; color: ${INK}; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 210mm; height: 297mm; page-break-after: always; overflow: hidden; position: relative; }
.grid { display: grid; grid-template-columns: repeat(3, 63mm); grid-template-rows: repeat(3, 88mm); gap: 2mm; padding: 14.5mm 0 0 9.5mm; }
.card { width: 63mm; height: 88mm; border: 3.2mm solid var(--c); border-radius: 4mm; outline: 0.2mm solid #bbb; outline-offset: 0.6mm; background: #fff; display: flex; flex-direction: column; padding: 1.2mm 1.4mm 1.4mm; }
.top { display: flex; align-items: center; justify-content: space-between; height: 6.5mm; }
.top .nm { font-family: Fredoka, sans-serif; font-weight: 700; font-size: 13pt; letter-spacing: .2px; }
.ico { width: 5.2mm; height: 5.2mm; }
.pic { margin-top: 0.8mm; height: 37.2mm; flex: none; border-radius: 2mm; overflow: hidden; border: 0.3mm solid #ddd; }
.pic svg { width: 100%; height: 100%; display: block; }
.lbl { text-align: center; font-family: Fredoka, sans-serif; font-weight: 600; font-size: 9.5pt; margin: 0.9mm 0 1mm; }
.attr { flex: 1; border: 0.5mm solid var(--c); border-radius: 2mm; overflow: hidden; display: flex; flex-direction: column; }
.ah { background: var(--c); color: #fff; font-family: Fredoka, sans-serif; font-weight: 600; font-size: 8.3pt; text-align: center; padding: 0.4mm 0; }
.yellow .ah { color: ${INK}; }
.ab { flex: 1; display: flex; align-items: center; gap: 1.4mm; padding: 0.8mm 1.4mm; }
.dia { width: 18.5mm; height: 18.5mm; flex: none; }
.dia svg { width: 100%; height: 100%; }
.at { font-size: 8.2pt; line-height: 1.25; }
.at b { font-weight: 700; }
.back { padding: 0; border: none; outline: 0.2mm solid #bbb; outline-offset: 0.6mm; overflow: hidden; }
.back svg { width: 100%; height: 100%; display: block; }
.rules { padding: 16mm 16mm; }
.rules h1 { font-family: Fredoka, sans-serif; font-size: 26pt; color: #1E3A6E; margin-bottom: 6mm; }
.rules h1 span { display: block; font-size: 12pt; font-weight: 500; color: #555; }
.rules h2 { font-family: Fredoka, sans-serif; font-size: 13.5pt; color: #1E3A6E; margin: 4mm 0 2mm; }
.rules h3 { font-family: Fredoka, sans-serif; font-size: 11pt; margin-bottom: 1mm; }
.rules p, .rules li { font-size: 10.5pt; line-height: 1.4; }
.rules ol, .rules ul { padding-left: 5mm; }
.rules li { margin-bottom: 1.5mm; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 9mm; }
.suits { list-style: none; padding-left: 0 !important; }
.suits i { display: inline-block; width: 4mm; height: 4mm; border-radius: 1mm; margin-right: 2mm; vertical-align: -0.6mm; }
.lvl { background: #F3F6FB; border-left: 2mm solid #2F6FD6; border-radius: 2mm; padding: 2.5mm 3.5mm; margin-bottom: 3mm; }
table { width: 100%; border-collapse: collapse; font-size: 9pt; }
th { font-family: Fredoka, sans-serif; font-size: 10pt; text-align: left; border-bottom: 0.6mm solid #1E3A6E; padding: 1.5mm; }
td { border-bottom: 0.2mm solid #ddd; padding: 1.6mm 1.5mm; vertical-align: middle; line-height: 1.3; }
td.kn { font-family: Fredoka, sans-serif; font-weight: 600; white-space: nowrap; }
td.kn .ico { vertical-align: -1.2mm; margin-right: 1mm; }
.note { margin-top: 5mm; font-size: 9.5pt !important; background: #FFF8E1; border-radius: 2mm; padding: 3mm 4mm; }
@media screen { body { background: #888; } .page { background: #fff; margin: 8mm auto; box-shadow: 0 2px 12px rgba(0,0,0,.3); } }
</style></head><body>${rules}${pages.join('')}</body></html>`;

writeFileSync(path.join(here, 'shape-fish-go-fish.html'), html);

const { createRequire } = await import('node:module');
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + path.join(here, 'shape-fish-go-fish.html'), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: path.join(here, 'shape-fish-go-fish.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
if (process.argv.includes('--previews')) {
  await page.emulateMedia({ media: 'print' });
  const els = await page.$$('section.page');
  const out = process.env.PREVIEW_DIR || here;
  for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: path.join(out, `page-${i + 1}.png`) });
}
await browser.close();
console.log(`Built ${cards.length} cards on ${pages.length} card pages.`);
