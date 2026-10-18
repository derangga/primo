import { writeFileSync } from "node:fs";
import { crc32, deflateSync } from "node:zlib";

// Writes public/icon-512.png: the favicon's rounded diamond (public/favicon.svg) in the light accent
// colour on the light page colour. Link previews and the home-screen icon use it. There is no SVG
// renderer in the toolchain, so this fills the shape itself, with 4 by 4 samples per pixel.
// Run it with `bun apps/web/scripts/render-icon.ts` after the favicon's shape or colours change.
const size = 512;

const samples = 4;

const background = [0xf3, 0xf4, 0xf6];

const accent = [0x35, 0x38, 0xa8];

// The favicon's 24 by 24 box: a 14 unit square with 3 unit corners, turned 45 degrees about (12, 12).
const scale = 24 / size;

const half = 7;

const corner = 3;

// The distance from a point to the diamond's outline, negative inside.
function distance(x: number, y: number) {
  const dx = (x - 12) * Math.SQRT1_2;
  const dy = (y - 12) * Math.SQRT1_2;
  const u = Math.abs(dx + dy) - (half - corner);
  const v = Math.abs(dy - dx) - (half - corner);

  return Math.hypot(Math.max(u, 0), Math.max(v, 0)) + Math.min(Math.max(u, v), 0) - corner;
}

// The share of a pixel the diamond covers.
function coverage(px: number, py: number) {
  let inside = 0;

  for (let sy = 0; sy < samples; sy++) {
    for (let sx = 0; sx < samples; sx++) {
      const x = (px + (sx + 0.5) / samples) * scale;
      const y = (py + (sy + 0.5) / samples) * scale;

      if (distance(x, y) <= 0) {
        inside++;
      }
    }
  }

  return inside / (samples * samples);
}

const rows = Buffer.alloc(size * (1 + size * 3));

for (let py = 0; py < size; py++) {
  const row = py * (1 + size * 3);

  for (let px = 0; px < size; px++) {
    const share = coverage(px, py);

    for (let channel = 0; channel < 3; channel++) {
      const mixed = background[channel]! * (1 - share) + accent[channel]! * share;

      rows[row + 1 + px * 3 + channel] = Math.round(mixed);
    }
  }
}

function chunk(type: string, data: Buffer) {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const length = Buffer.alloc(4);
  const sum = Buffer.alloc(4);

  length.writeUInt32BE(data.length);
  sum.writeUInt32BE(crc32(body));

  return Buffer.concat([length, body, sum]);
}

const header = Buffer.alloc(13);

header.writeUInt32BE(size, 0);

header.writeUInt32BE(size, 4);

// 8 bits per channel, colour type 2 (RGB), no interlace.
header.set([8, 2, 0, 0, 0], 8);

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", header),
  chunk("IDAT", deflateSync(rows, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

writeFileSync(new URL("../public/icon-512.png", import.meta.url), png);
