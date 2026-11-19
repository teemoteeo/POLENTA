// Worker: scarica le mosaiche della Luna da NASA Moon Trek (LRO WAC e NAC, Kaguya TC), le fonde e ridisegna le tile
// fuori dal thread principale, così zoom e volo restano fluidi. Vedi trek.js per la geometria.
const D = Math.PI / 180, HALF = 1095930 // semilato della griglia stereografica della Luna, m (WMTSCapabilities)
// Trek passa dal nostro dominio (/trek: proxy in vite.config.js, rewrite in vercel.json): Trek parla solo HTTP/1.1, quindi
// il browser gli apre 6 connessioni alla volta; da noi va in HTTP/2, tutto in parallelo, e i 404 sono leggibili (niente CORS)
const TREK = self.location.origin + '/trek', TMS = '1.0.0/default/default028mm'
const R = 1737400 // raggio lunare, m
// griglie equirettangolari (2^(l+1) colonne × 2^l righe, riga 0 a nord) o stereografica polare sud
const LAYERS = {
  moonEq: { size: 256, max: 8, url: (l, r, c) => `${TREK}/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/${TMS}/${l}/${r}/${c}.jpg` }, // LRO WAC 100 m/px
  moonSp: { size: 256, max: 5, polar: true, url: (l, r, c) => `${TREK}/Moon/SP/LRO_WAC_Mosaic_SPole60_100m_v02/${TMS}/${l}/${r}/${c}.png` },
  // Kaguya TC ortho: ~21 m/px su quasi tutta la Luna (i livelli 11-12 danno 404). Sotto i -70° ha buchi e strisciate
  // con luce diversa, quindi sfuma verso la WAC tra -66° e -72°
  kaguya: { size: 256, max: 10, url: (l, r, c) => `${TREK}/Moon/EQ/Kaguya_TCortho_Mosaic_Global_4096ppd/${TMS}/${l}/${r}/${c}.png` },
  // LROC NAC, media di più passaggi: ombre già riempite, solo sotto i -85,5° (quadrato di ±136,5 km).
  // Fermata al livello 9 (~17 m/px) per avere la stessa nitidezza di Kaguya su tutta la Luna
  moonNac: { size: 256, max: 9, polar: true, url: (l, r, c) => `${TREK}/Moon/SP/LRO_NAC_AvgMosaic_SPole855_1mp/${TMS}/${l}/${r}/${c}.png` },
  // LOLA hillshade 30 m, luce uniforme calcolata dalla quota: riempie le ombre del sole radente sotto i -75°
  // (si mescola anche alla NAC: dentro i crateri in ombra permanente mostra il rilievo invece del nero)
  lola: { size: 256, max: 8, polar: true, url: (l, r, c) => `${TREK}/Moon/SP/LRO_LOLA_Shade_SPole75_30mp_v04/${TMS}/${l}/${r}/${c}.png` },
}

// curve di tono per sorgente, tarate sui percentili dove le mosaiche si sovrappongono:
// la WAC al polo è scura (sole radente), Kaguya ~10% più scura della WAC, la NAC compressa (mediana ~45)
const lut = f => Uint8ClampedArray.from({ length: 256 }, (_, v) => 255 * Math.min(1, f(v / 255)))
const BRIGHT = lut(v => 1.2 * v ** 0.75), KAG = lut(v => 1.3 * v ** 0.75), NAC = lut(v => (v * 255 / 140) ** 0.8), HILL = lut(v => 0.8 * v)
// peso 0 → 1 tra le latitudini a e b (gradi), smoothstep: i passaggi tra sorgenti non hanno bordi
const ramp = (a, b) => la => { const t = Math.min(1, Math.max(0, (la / D - a) / (b - a))); return t * t * (3 - 2 * t) }
Object.assign(LAYERS.moonSp, { tone: BRIGHT, w: la => +(la < -61 * D) })
Object.assign(LAYERS.moonEq, { tone: BRIGHT, w: la => +(la >= -61 * D) })
Object.assign(LAYERS.kaguya, { tone: KAG, w: ramp(-72, -66) })
Object.assign(LAYERS.moonNac, { tone: NAC, w: ramp(-85.5, -87) }) // dentro il cerchio coperto dalla NAC
Object.assign(LAYERS.lola, { tone: HILL, w: ramp(-75.2, -76.5), fill: true })
const ORDER = [LAYERS.moonSp, LAYERS.moonEq, LAYERS.kaguya, LAYERS.moonNac, LAYERS.lola] // dal basso; il riempimento per ultimo

// tile sorgente decodificate (RGBA); la coda dei download e la cache su disco le gestisce il browser
const mem = new Map()
// overlay: Kaguya, NAC e LOLA stanno sopra la WAC. Se Trek non risponde neanche dopo i tentativi, la tile manca
// e sotto resta la WAC invece di un buco
function source(url, size, overlay) {
  if (!mem.has(url)) {
    if (mem.size > 800) mem.delete(mem.keys().next().value) // ponytail: FIFO, LRU se servisse
    mem.set(url, (async () => {
      let res
      for (let k = 0; !res; k++) { // sotto carico Trek risponde a volte con errori: si riprova con attesa crescente
        const r = await fetch(url).catch(() => null)
        if (r?.status === 404) return null // fuori copertura: resta trasparente
        if (r?.ok) res = r
        else if (k === 3 && overlay) return null
        else if (k === 3) throw new Error('Trek non risponde: ' + url)
        else await new Promise(w => setTimeout(w, 500 * 2 ** k))
      }
      const g = new OffscreenCanvas(size, size).getContext('2d', { willReadFrequently: true })
      g.drawImage(await createImageBitmap(await res.blob()), 0, 0, size, size)
      return g.getImageData(0, 0, size, size).data
    })().catch(e => { mem.delete(url); throw e })) // la tile della mappa fallisce invece di restare con un buco
  }
  return mem.get(url)
}

// livello della sorgente: pixel al massimo 1,4 volte più grandi di quelli richiesti (fino a 4 volte meno tile che con il più fine)
const level = (layer, mpp) => Math.max(0, Math.min(layer.max, Math.round(Math.log2((layer.polar ? 2 * HALF : Math.PI * R) / layer.size / mpp))))

// punto (lat, lon in radianti) → tile sorgente (P.r, P.c) e posizione dentro, in pixel della sorgente (P.u, P.v)
const P = { r: 0, c: 0, u: 0, v: 0 }
function at(layer, l, lat, lon) {
  let fx, fy
  if (layer.polar) { const m = (2 * HALF) / 2 ** l, rho = 2 * R * Math.tan(Math.PI / 4 + lat / 2); fx = (HALF + rho * Math.sin(lon)) / m; fy = (HALF - rho * Math.cos(lon)) / m }
  else { const span = Math.PI / 2 ** l; fx = (lon + Math.PI) / span; fy = (Math.PI / 2 - lat) / span }
  P.c = fx | 0; P.r = fy | 0; P.u = (fx - P.c) * layer.size; P.v = (fy - P.r) * layer.size
}

// lettura bilineare dentro la tile sorgente (canale ch); -1 se non c'è il dato
function read(s, S, u, v, ch) {
  if (!s) return -1
  const x = Math.min(S - 1.001, Math.max(0, u - 0.5)), y = Math.min(S - 1.001, Math.max(0, v - 0.5))
  const x0 = x | 0, y0 = y | 0, ax = x - x0, ay = y - y0, o = (y0 * S + x0) * 4 + ch, row = S * 4
  return (s[o] * (1 - ax) + s[o + 4] * ax) * (1 - ay) + (s[o + row] * (1 - ax) + s[o + row + 4] * ax) * ay
}

async function tile(z, tx, ty) {
  const n = 256 * 2 ** z, LL = [0, 0]
  // pixel della tile (anche frazionario) → lat, lon reali; la Luna è ruotata: mappa (x', y', z') → reale (z', y', -x')
  const ll = (px, py) => {
    const la = Math.atan(Math.sinh(Math.PI * (1 - (2 * (ty * 256 + py)) / n))), lo = (2 * Math.PI * (tx * 256 + px)) / n - Math.PI, cl = Math.cos(la)
    LL[0] = Math.asin(-cl * Math.cos(lo)); LL[1] = Math.atan2(cl * Math.sin(lo), Math.sin(la))
    return LL
  }
  const mpp = ((2 * Math.PI * R) / n) * Math.cos(Math.atan(Math.sinh(Math.PI * (1 - (2 * (ty + 0.5)) / 2 ** z)))) // m/px al centro
  // la WAC globale sta sempre sotto Kaguya piena (sopra i -61°): serve solo nei buchi, basta 4 volte più grossolana
  const plan = ORDER.map(L => [L, Math.max(0, level(L, mpp) - (L === LAYERS.moonEq ? 2 : 0))]), key = (k, r, c) => (k * 16384 + r) * 16384 + c

  // 1) sorgenti necessarie, da una griglia di 33×33 punti (le tile sorgente coprono sempre più di 8 pixel)
  // ponytail: scarica anche la WAC sotto Kaguya; saltarla dove Kaguya è piena se Trek diventa il collo di bottiglia
  const needed = new Map()
  for (let gy = 0; gy <= 256; gy += 8) for (let gx = 0; gx <= 256; gx += 8) {
    const [la, lo] = ll(gx, gy)
    plan.forEach(([layer, l], k) => {
      if (!layer.w(la)) return
      at(layer, l, la, lo)
      const kk = key(k, P.r, P.c)
      if (!needed.has(kk)) needed.set(kk, source(layer.url(l, P.r, P.c), layer.size, k > 1))
    })
  }
  const got = await Promise.all(needed.values()), data = new Map([...needed.keys()].map((k, i) => [k, got[i]]))

  // 2) pixel: ogni strato copre quello sotto in proporzione al suo alfa e al suo peso; l'hillshade alza solo le ombre
  const out = new Uint8ClampedArray(65536 * 4)
  for (let py = 0; py < 256; py++) for (let px = 0; px < 256; px++) {
    const [la, lo] = ll(px + 0.5, py + 0.5), o = (py * 256 + px) * 4
    let v = 0, a = 0 // v premoltiplicato per a
    for (let k = 0; k < plan.length; k++) {
      const [layer, l] = plan[k], lw = layer.w(la)
      if (!lw) continue
      at(layer, l, la, lo)
      const s = data.get(key(k, P.r, P.c)), g = read(s, layer.size, P.u, P.v, 0)
      if (g < 0) continue
      const w = (read(s, layer.size, P.u, P.v, 3) / 255) * lw, t = layer.tone[g | 0]
      // hillshade: alza le ombre fino al 70% della sua luce e copre il 40% della foto, che nella WAC polare ha tagli tra le riprese
      if (layer.fill) { const p = a > 0 ? v / a : t, c = Math.max(p, 0.7 * t); a = Math.max(a, w); v = (p + (c * 0.6 + t * 0.4 - p) * w) * a }
      else { v = v * (1 - w) + t * w; a = a + (1 - a) * w }
    }
    if (a > 0) { out[o] = out[o + 1] = out[o + 2] = v / a; out[o + 3] = 255 * a }
  }
  return createImageBitmap(new ImageData(out, 256, 256))
}

self.onmessage = async ({ data: m }) => {
  try {
    const [z, x, y] = m.tile.slice(12).split('/') // 'trek://moon/z/x/y'
    const bmp = await tile(+z, +x, +y)
    self.postMessage({ id: m.id, result: bmp }, [bmp])
  } catch (e) {
    self.postMessage({ id: m.id, error: String(e.message || e) })
  }
}
