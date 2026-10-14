import { fileURLToPath } from "node:url";
import sharp from "sharp";

const source = fileURLToPath(
  new URL("../public/tiko/nest-idle.webp", import.meta.url),
);
const output = fileURLToPath(new URL("../assets/icon.png", import.meta.url));

await sharp(source)
  .resize(1024, 1024, {
    fit: "contain",
    background: { r: 244, g: 240, b: 231, alpha: 1 },
  })
  .png()
  .toFile(output);
