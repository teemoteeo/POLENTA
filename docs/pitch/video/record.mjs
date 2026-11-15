// Registra il video del pitch: una sequenza di blocchi (deck, clip della demo, deck) uniti da dissolvenze.
// I blocchi del deck sono fotogrammi esatti: il deck ha un orologio virtuale (__advance) e Chrome headless cattura
// un PNG per volta, anche se in 4K ci mette più del tempo reale. Le clip vengono da video/demo/ (o un segnaposto).
//
// Uso:  node record.mjs --profile pitch|submission [--scale 2] [--fps 30] [--crf 16] [--compose-only]
//   --scale 2 → 3840×2160 (4K), --scale 1 → 1920×1080 (anteprima veloce)
//   --compose-only → riusa i blocchi del deck già registrati in out/ e rifà solo clip e montaggio
import { chromium } from 'playwright-core'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:http'
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url)), deckDir = join(here, '..')
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d }
const PROFILE = arg('profile', 'pitch'), SCALE = +arg('scale', 2), FPS = +arg('fps', 30), CRF = arg('crf', '16')
const COMPOSE_ONLY = process.argv.includes('--compose-only')
const CHROME = arg('chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
const FFMPEG = process.env.FFMPEG || ffmpegInstaller.path // ffmpeg con libx264 dentro node_modules: non dipende da Homebrew
const W = 1920, H = 1080, OW = W * SCALE, OH = H * SCALE

const prof = JSON.parse(readFileSync(join(here, 'timeline.json'), 'utf8')).profiles[PROFILE]
if (!prof) throw new Error(`profilo sconosciuto: ${PROFILE} (vedi timeline.json)`)
const T = prof.transition?.seconds || 0, seq = prof.sequence
const secOf = b => (b.deck ? b.deck.reduce((n, s) => n + s[2], 0) : b.seconds)
const total = seq.reduce((n, b) => n + secOf(b), 0) - T * (seq.length - 1)
if (prof.max_seconds && total > prof.max_seconds) {
  console.error(`✗ ${PROFILE}: ${total.toFixed(1)} s > ${prof.max_seconds} s. Accorcia timeline.json.`)
  process.exit(1)
}

const outDir = join(here, 'out'); mkdirSync(outDir, { recursive: true })
const tag = `${PROFILE}-${OH}p${FPS}`, seg = i => join(outDir, `seg${i}-${tag}.mp4`), finalMp4 = join(outDir, `polenta-${tag}.mp4`)
const X264 = ['-c:v', 'libx264', '-preset', 'medium', '-crf', CRF, '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS), '-movflags', '+faststart']
const run = args => { const r = spawnSync(FFMPEG, args, { stdio: 'inherit' }); if (r.status !== 0) throw new Error(`ffmpeg è uscito con ${r.status ?? r.error}`) }
const duration = f => { const m = spawnSync(FFMPEG, ['-hide_banner', '-i', f]).stderr.toString().match(/Duration: (\d+):(\d+):([\d.]+)/); return m ? m[1] * 3600 + m[2] * 60 + +m[3] : NaN }
const t0 = Date.now(), el = () => `${((Date.now() - t0) / 60000).toFixed(1)} min`
console.log(`· ${PROFILE}: ${seq.length} blocchi, ${total.toFixed(1)} s · ${OW}×${OH} · ${FPS} fps`)

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
  // 1) i blocchi del deck, nella stessa pagina (lo stato continua da un blocco all'altro)
  const decks = seq.map((b, i) => [b, i]).filter(([b]) => b.deck)
  if (!COMPOSE_ONLY || decks.some(([, i]) => !existsSync(seg(i)))) {
    await page.goto(`${base}/index.html?record#1.0`, { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => document.fonts.ready)
    if (!(await page.evaluate(() => typeof window.__advance === 'function'))) throw new Error('il deck non è in modalità ?record')
    const dt = 1000 / FPS
    for (const [b, i] of decks) {
      if (COMPOSE_ONLY && existsSync(seg(i))) continue // --compose-only: si rifanno solo i blocchi che mancano
      const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', ...X264, seg(i)], { stdio: ['pipe', 'inherit', 'inherit'] })
      let dead = null // se ffmpeg muore ci si ferma subito
      const done = new Promise((ok, ko) => ff.on('close', c => { dead = new Error(`ffmpeg è uscito con ${c}`); c ? ko(dead) : ok() }))
      done.catch(() => {}); ff.stdin.on('error', () => {})
      const write = buf => new Promise((ok, ko) => { if (dead) return ko(dead); ff.stdin.write(buf) ? ok() : ff.stdin.once('drain', ok); ff.once('close', () => ko(dead)) })
      const nTot = Math.round(secOf(b) * FPS)
      let n = 0
      for (const [slide, step, sec] of b.deck) {
        await page.evaluate(([s, st]) => go(s - 1, st), [slide, step])
        for (let k = 0, m = Math.round(sec * FPS); k < m; k++) {
          await page.evaluate(ms => window.__advance(ms), dt)
          await write(await page.screenshot({ type: 'png', timeout: 0 }))
          if (++n % FPS === 0 || n === nTot) process.stdout.write(`\r  blocco ${i + 1}: ${n}/${nTot} fotogrammi · ${el()}`)
        }
      }
      ff.stdin.end(); await done
      console.log(`\n✓ blocco ${i + 1} (deck, ${secOf(b).toFixed(1)} s)`)
    }
  }

  // 2) le clip: il video della demo se c'è, altrimenti un segnaposto nello stile del deck
  for (const [b, i] of seq.map((b, i) => [b, i]).filter(([b]) => b.clip)) {
    const src = join(here, 'demo', b.clip)
    if (existsSync(src)) {
      run(['-y', '-loglevel', 'error', '-i', src, '-t', String(b.seconds), '-an',
        '-vf', `scale=${OW}:${OH}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${OW}:${OH}:(ow-iw)/2:(oh-ih)/2:color=0x04060a,fps=${FPS},setsar=1`, ...X264, seg(i)])
      console.log(`✓ blocco ${i + 1} (clip ${b.clip}, ${Math.min(b.seconds, duration(src)).toFixed(1)} s)`)
    } else {
      await page.goto(`${base}/video/placeholder.html?s=${b.seconds}&f=${encodeURIComponent(b.clip)}&t=${encodeURIComponent(b.title || '')}`)
      await page.evaluate(() => document.fonts.ready)
      const png = join(outDir, `placeholder-${OH}p.png`)
      await page.screenshot({ path: png, type: 'png' })
      run(['-y', '-loglevel', 'error', '-loop', '1', '-framerate', String(FPS), '-i', png, '-t', String(b.seconds), '-tune', 'stillimage', ...X264, seg(i)])
      console.log(`✓ blocco ${i + 1}: segnaposto di ${b.seconds} s (manca ${src})`)
    }
  }

  // 3) montaggio con le dissolvenze (xfade) e controllo della durata
  const durs = seq.map((b, i) => duration(seg(i)))
  let chain = '', last = '[0:v]', off = 0
  for (let i = 1; i < seq.length; i++) {
    off += durs[i - 1] - T
    const out = i === seq.length - 1 ? '[v]' : `[x${i}]`
    chain += `${last}[${i}:v]xfade=transition=${prof.transition?.type || 'fade'}:duration=${T}:offset=${off.toFixed(3)}${out};`
    last = out
  }
  run(['-y', '-loglevel', 'error', ...seq.flatMap((b, i) => ['-i', seg(i)]),
    ...(seq.length > 1 ? ['-filter_complex', chain.slice(0, -1), '-map', '[v]'] : []), ...X264, finalMp4])
  const dur = duration(finalMp4)
  console.log(`✓ ${finalMp4}\n  ${OW}×${OH} · ${FPS} fps · ${dur.toFixed(2)} s · ${el()}`)
  if (prof.max_seconds && dur > prof.max_seconds + 0.05) { console.error(`✗ ${dur.toFixed(2)} s > ${prof.max_seconds} s`); process.exitCode = 1 }
} finally {
  await browser.close(); server.close()
}
