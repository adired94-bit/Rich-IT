import "server-only";
import path from "node:path";
import { Font } from "@react-pdf/renderer";

let registered = false;

/** Registers the Rubik family (Hebrew + Cyrillic + Latin in one face) for PDF rendering. */
export function registerPdfFonts() {
  if (registered) return;
  const dir = path.join(process.cwd(), "public", "fonts");
  Font.register({
    family: "Rubik",
    fonts: [
      { src: path.join(dir, "Rubik-Regular.ttf"), fontWeight: 400 },
      { src: path.join(dir, "Rubik-Medium.ttf"), fontWeight: 500 },
      { src: path.join(dir, "Rubik-Bold.ttf"), fontWeight: 700 },
    ],
  });
  // @react-pdf/renderer's Yoga layout tries to hyphenate; disable for Hebrew/Cyrillic text.
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}
