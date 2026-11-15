// Copia i font del deck da @fontsource in ../fonts e scrive ../fonts/fonts.css (deck offline, niente Google Fonts).
// Si lancia una volta sola: npm run fonts
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url)), out = join(here, '..', 'fonts')
const FONTS = [['Libre Franklin', 'libre-franklin', [300, 400, 500, 600]], ['Space Mono', 'space-mono', [400, 700]], ['Michroma', 'michroma', [400]]]
mkdirSync(out, { recursive: true })
let css = '/* generato da video/fonts.mjs (font OFL da @fontsource) */\n'
for (const [family, id, weights] of FONTS) for (const w of weights) {
  const file = `${id}-latin-${w}-normal.woff2`
  copyFileSync(join(here, 'node_modules', '@fontsource', id, 'files', file), join(out, file))
  css += `@font-face{font-family:"${family}";font-style:normal;font-weight:${w};font-display:block;src:url(${file}) format("woff2")}\n`
}
writeFileSync(join(out, 'fonts.css'), css)
console.log(`fonts: ${FONTS.reduce((n, f) => n + f[2].length, 0)} file in ${out}`)
