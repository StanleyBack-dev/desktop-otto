// Draws the Otto icons (a ring with a dot, the "listening" mark) as PNG
// files, with no image library: resources/icon.png (installer, window) and
// resources/tray.png (notification area). Run with `npm run icons`.
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const COLOR = [37, 99, 235]; // blue-600

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(size) {
  const center = (size - 1) / 2;
  const outer = size * 0.46;
  const inner = size * 0.3;
  const dot = size * 0.13;
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - center, y - center);
      // Soft edges: coverage of the ring or the dot at this pixel.
      const ring = Math.min(
        Math.max(0, Math.min(1, outer - d + 0.5)),
        Math.max(0, Math.min(1, d - inner + 0.5)),
      );
      const centerDot = Math.max(0, Math.min(1, dot - d + 0.5));
      const alpha = Math.max(ring, centerDot);
      row.set([...COLOR, Math.round(alpha * 255)], 1 + x * 4);
    }
    rows.push(row);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("resources", { recursive: true });
writeFileSync("resources/icon.png", png(256));
writeFileSync("resources/tray.png", png(32));
console.log("resources/icon.png and resources/tray.png written");
