// Generate PNG icons from a simple SVG using node's built-in canvas via @napi-rs/canvas… or
// keep it dependency-free by rendering an SVG, then using sharp if available; as a fallback,
// we write an SVG and raw raster PNG using pngjs-free manual encoding of a simple gradient.
//
// To keep zero extra deps, we emit a deterministic PNG using a minimal encoder (pako-free,
// zlib via node:zlib). Draw a radial-glow firefly.

import { writeFileSync, mkdirSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { deflateSync, crc32 } from 'node:zlib';

const outDir = new URL('../public/', import.meta.url);
mkdirSync(outDir, { recursive: true });

function makePng(size, maskable) {
  const w = size;
  const h = size;
  const pad = maskable ? Math.round(size * 0.22) : 0;
  const cx = w / 2;
  const cy = h / 2;
  const bgA = [0x0a, 0x0e, 0x27];
  const bgB = [0x05, 0x07, 0x1a];
  const glow = [0xff, 0xd6, 0x66];
  const rim = [0xff, 0xb3, 0x47];

  // Raw RGBA pixel buffer.
  const stride = w * 4;
  const pixels = Buffer.alloc((stride + 1) * h);

  for (let y = 0; y < h; y++) {
    pixels[y * (stride + 1)] = 0; // filter byte
    for (let x = 0; x < w; x++) {
      // radial bg gradient (brighter near center, darker edges)
      const dxBg = (x - cx) / cx;
      const dyBg = (y - cy) / cy;
      const rBg = Math.min(1, Math.sqrt(dxBg * dxBg + dyBg * dyBg));
      const t = rBg;
      const br = Math.round(bgA[0] * (1 - t) + bgB[0] * t);
      const bg = Math.round(bgA[1] * (1 - t) + bgB[1] * t);
      const bb = Math.round(bgA[2] * (1 - t) + bgB[2] * t);

      // firefly glow (smaller circle in center, stronger for maskable safe-zone)
      const innerR = (size / 2 - pad) * 0.7;
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const g = Math.max(0, 1 - d / innerR);
      const core = Math.pow(g, 2.2);
      const halo = Math.pow(g, 1.2);

      const rFin = Math.min(255, Math.round(br + (glow[0] - br) * core + (rim[0] - br) * halo * 0.25));
      const gFin = Math.min(255, Math.round(bg + (glow[1] - bg) * core + (rim[1] - bg) * halo * 0.25));
      const bFin = Math.min(255, Math.round(bb + (glow[2] - bb) * core + (rim[2] - bb) * halo * 0.25));

      const off = y * (stride + 1) + 1 + x * 4;
      pixels[off] = rFin;
      pixels[off + 1] = gFin;
      pixels[off + 2] = bFin;
      pixels[off + 3] = 255;
    }
  }

  // Build PNG.
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idatRaw = deflateSync(pixels);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatRaw),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync(new URL('icon-192.png', outDir), makePng(192, false));
writeFileSync(new URL('icon-512.png', outDir), makePng(512, false));
writeFileSync(new URL('icon-maskable-512.png', outDir), makePng(512, true));
console.log('Wrote icons to', outDir.pathname);
