// Registra il deck (../index.html?record) in un MP4 ad alta risoluzione.
// Ogni fotogramma è esatto: il deck ha un orologio virtuale (__advance) e Chrome headless cattura un PNG per volta,
// anche se in 4K ci mette più del tempo reale. Poi ffmpeg: deck + slot della demo in fondo → out/polenta-<profilo>-<h>p<fps>.mp4
//
// Uso:  node record.mjs --profile full|submission [--scale 2] [--fps 30] [--crf 14] [--limit 5] [--chrome <path>]
//   --scale 2 → 3840×2160 (4K), --scale 1 → 1920×1080 (anteprima veloce)
//   --limit N → solo i primi N secondi del deck, senza demo (prova)
import { chromium } from 'playwright-core'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url)), deckDir = join(here, '..')
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d }
const PROFILE = arg('profile', 'full'), SCALE = +arg('scale', 2), FPS = +arg('fps', 30), CRF = arg('crf', '14'), LIMIT = +arg('limit', 0)
const CHROME = arg('chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
const FFMPEG = process.env.FFMPEG || ffmpegInstaller.path // ffmpeg con libx264 dentro node_modules: non dipende da Homebrew
const W = 1920, H = 1080, OW = W * SCALE, OH = H * SCALE

const tl = JSON.parse(readFileSync(join(here, 'timeline.json'), 'utf8')).profiles[PROFILE]
if (!tl) throw new Error(`profilo sconosciuto: ${PROFILE} (vedi timeline.json)`)
const steps = LIMIT ? clip(tl.steps, LIMIT) : tl.steps, demo = LIMIT ? null : tl.demo
const deckSec = steps.reduce((n, s) => n + s[2], 0), total = deckSec + (demo?.seconds || 0)
if (tl.max_seconds && total > tl.max_seconds) {
  console.error(`✗ ${PROFILE}: ${total.toFixed(1)} s > ${tl.max_seconds} s, il limite della submission. Accorcia timeline.json.`)
  process.exit(1)
}
function clip(list, sec) { const out = []; let t = 0; for (const [s, st, d] of list) { if (t >= sec) break; out.push([s, st, Math.min(d, sec - t)]); t += d } return out }

const outDir = join(here, 'out'); mkdirSync(outDir, { recursive: true })
const tag = `${PROFILE}${LIMIT ? '-test' : ''}-${OH}p${FPS}`
const deckMp4 = join(outDir, `deck-${tag}.mp4`), demoMp4 = join(outDir, `demo-${tag}.mp4`), finalMp4 = join(outDir, `polenta-${tag}.mp4`)
const X264 = ['-c:v', 'libx264', '-preset', 'slow', '-crf', CRF, '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS), '-video_track_timescale', String(FPS * 1000), '-movflags', '+faststart']
const run = args => { const r = spawnSync(FFMPEG, args, { stdio: 'inherit' }); if (r.status !== 0) throw new Error(`ffmpeg è uscito con ${r.status ?? r.error}`) }
const duration = f => { const m = spawnSync(FFMPEG, ['-hide_banner', '-i', f]).stderr.toString().match(/Duration: (\d+):(\d+):([\d.]+)/); return m ? m[1] * 3600 + m[2] * 60 + +m[3] : NaN }

// server statico del deck: solo file locali
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.mp4': 'video/mp4', '.png': 'image/png' }
const server = createServer((req, res) => {
  const f = join(deckDir, normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^[/\\]+/, '') || 'index.html')
  if (!f.startsWith(deckDir) || !existsSync(f) || statSync(f).isDirectory()) return res.writeHead(404).end()
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' })
  createReadStream(f).pipe(res)
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`

const browser = await chromium.launch({ executablePath: CHROME, args: ['--hide-scrollbars', '--force-color-profile=srgb', '--font-render-hinting=none'] })
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE })
page.on('pageerror', e => console.error('errore nella pagina:', e.message))
await page.route('**/*', r => (r.request().url().startsWith(base) ? r.continue() : r.abort())) // niente internet: font locali in ../fonts

try {
  // 1) il deck, passo per passo, un PNG per fotogramma dentro ffmpeg
  console.log(`· deck ${PROFILE}: ${steps.length} passi, ${deckSec.toFixed(1)} s${demo?.seconds ? ` + demo ${demo.seconds} s` : ''} · ${OW}×${OH} · ${FPS} fps`)
  await page.goto(`${base}/index.html?record#1.0`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => document.fonts.ready)
  if (!(await page.evaluate(() => typeof window.__advance === 'function'))) throw new Error('il deck non è in modalità ?record')
  console.log('· deck caricato, registro i fotogrammi')
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', ...X264, deckMp4], { stdio: ['pipe', 'inherit', 'inherit'] })
  let dead = null // se ffmpeg muore, ci si ferma subito invece di aspettare per sempre
  const done = new Promise((ok, ko) => ff.on('close', c => { dead = new Error(`ffmpeg è uscito con ${c}`); c ? ko(dead) : ok() }))
  done.catch(() => {})
  ff.stdin.on('error', () => {})
  const write = buf => new Promise((ok, ko) => { if (dead) return ko(dead); ff.stdin.write(buf) ? ok() : ff.stdin.once('drain', ok); ff.once('close', () => ko(dead)) })
  const dt = 1000 / FPS, nTot = Math.round(deckSec * FPS), t0 = Date.now()
  let n = 0
  for (const [slide, step, sec] of steps) {
    await page.evaluate(([s, st]) => go(s - 1, st), [slide, step])
    for (let i = 0, k = Math.round(sec * FPS); i < k; i++) {
      await page.evaluate(ms => window.__advance(ms), dt)
      await write(await page.screenshot({ type: 'png', timeout: 0 }))
      if (++n % FPS === 0 || n === nTot) process.stdout.write(`\r  deck ${n}/${nTot} fotogrammi · ${((Date.now() - t0) / 1000).toFixed(0)} s`)
    }
  }
  ff.stdin.end(); await done
  console.log(`\n✓ deck ${deckSec.toFixed(1)} s → ${deckMp4}`)

  // 2) lo slot della demo: il video vero se c'è, altrimenti un segnaposto nello stile del deck
  if (demo?.seconds) {
    const src = join(here, 'demo', demo.file)
    if (existsSync(src)) {
      run(['-y', '-loglevel', 'error', '-i', src, '-t', String(demo.seconds), '-an',
        '-vf', `scale=${OW}:${OH}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${OW}:${OH}:(ow-iw)/2:(oh-ih)/2:color=0x04060a,fps=${FPS}`, ...X264, demoMp4])
      console.log(`✓ demo da ${src}`)
    } else {
      await page.goto(`${base}/video/placeholder.html?s=${demo.seconds}&f=${encodeURIComponent(demo.file)}&t=${encodeURIComponent(demo.title || '')}`)
      await page.evaluate(() => document.fonts.ready)
      const png = join(outDir, `placeholder-${OH}p.png`)
      await page.screenshot({ path: png, type: 'png' })
      run(['-y', '-loglevel', 'error', '-loop', '1', '-framerate', String(FPS), '-i', png, '-t', String(demo.seconds), '-tune', 'stillimage', ...X264, demoMp4])
      console.log(`✓ demo: segnaposto di ${demo.seconds} s (manca ${src})`)
    }
  }

  // 3) unione senza ricodifica (stessi parametri) e controllo della durata
  const parts = [deckMp4, ...(demo?.seconds ? [demoMp4] : [])], list = join(outDir, `concat-${tag}.txt`)
  writeFileSync(list, parts.map(f => `file '${f}'`).join('\n'))
  run(['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', finalMp4])
  const dur = duration(finalMp4)
  console.log(`✓ ${finalMp4}\n  ${OW}×${OH} · ${FPS} fps · ${dur.toFixed(2)} s · ${((Date.now() - t0) / 60000).toFixed(1)} min`)
  if (tl.max_seconds && dur > tl.max_seconds + 0.05) { console.error(`✗ ${dur.toFixed(2)} s > ${tl.max_seconds} s`); process.exitCode = 1 }
} finally {
  await browser.close(); server.close()
}
