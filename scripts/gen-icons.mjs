// Generate PNG PWA icons from public/icon.svg
import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve } from "path";

const svgPath = resolve(process.cwd(), "public/icon.svg");
const svg = readFileSync(svgPath);

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

async function main() {
  for (const { name, size } of sizes) {
    const out = resolve(process.cwd(), "public", name);
    await sharp(svg, { density: 384 })
      .resize(size, size, { fit: "cover" })
      .png()
      .toFile(out);
    console.log(`wrote public/${name} (${size}x${size})`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
