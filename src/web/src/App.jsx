import { useEffect, useMemo, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { H3HexagonLayer } from '@deck.gl/geo-layers'
import { ScatterplotLayer } from '@deck.gl/layers'
import DotModel, { preload } from './DotModel.jsx'
import DotPlanet from './DotPlanet.jsx'
import './trek.js' // registra il protocollo trek:// prima della mappa
import { SITES, TESTS, MODELS, EXPORTED_AT, loadDots, getResults } from './data.js'
import { coord } from './format.js'
import { TEST_EN } from './i18n.js'
import PlaceCard from './PlaceCard.jsx'
import ResultsList from './ResultsList.jsx'
import { logisticsLayers, logisticsMarkers, homeMarker, campaignPose } from './logistics.js'
import { Benchmark, Method } from './Sheets.jsx'

// Colori per tema e mondo: pagina, sfera, puntini
const PALETTE = {
  dark: { page: '#04060a', moon: '#17181c', mars: '#1d1512', earth: '#0b1018', moonDot: [205, 208, 215, 150], marsDot: [255, 165, 120, 225], earthDot: [190, 215, 255, 175], accent: [255, 90, 31] },
  // chiaro ma non abbagliante: fondo grigio-azzurro medio, pianeti con corpo; i puntini sono scurissimi perché la curva di resa li schiarisce
  light: { page: '#c9ced6', moon: '#b4b8bf', mars: '#d0ad9c', earth: '#b3bfcd', moonDot: [8, 9, 12, 215], marsDot: [70, 14, 4, 220], earthDot: [17, 40, 80, 170], accent: [255, 90, 31] },
}

// Luna, Marte e Terra sono lo stesso oggetto: puntini da lontano, foto da vicino, stessa soglia di zoom
const FADE = [3.5, 5]
// sotto FADE[0] - 0,5 i raster non scaricano nulla (minzoom): da lontano bastano i puntini
const IMG_FADE = ['interpolate', ['linear'], ['zoom'], FADE[0], 0, FADE[1], 1]
const RASTERS = { moon: ['moon'], mars: ['mars'], earth: ['gibs', 'esri'] }
// size: raggio rispetto a Marte (Luna 1.737 km, Marte 3.390 km)
const PLANETS = { mars: { name: 'Mars', what: '2 landing sites', size: 1 }, moon: { name: 'Moon', what: '3 Artemis III regions at the South Pole · Aristarchus Plateau', size: 0.51 } }
// durate (ms) dei passaggi, uguali in andata e ritorno; curve: OUT rallenta alla fine, IN è la stessa rovesciata
const T = { planet: 2600, site: 4500, siteBack: 2600, warp: 3000, card: 2600, next: 1200 } // siteBack: il ritorno dal sito è più corto dell'andata
const OUT = t => 1 - (1 - t) ** 3, IN = t => t ** 3
const SOFT = t => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2) // parte e arriva piano: uguale nei due versi

const STYLE = {
  version: 8,
  projection: { type: 'globe' },
  sources: {
    // NASA GIBS Blue Marble, poi Esri per il dettaglio: entrano solo da vicino
    gibs: { type: 'raster', tileSize: 256, maxzoom: 8, attribution: 'NASA GIBS Blue Marble',
      tiles: ['https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg'] },
    esri: { type: 'raster', tileSize: 256, maxzoom: 19, attribution: 'Esri World Imagery',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'] },
    // NASA Moon Trek ridisegnato al volo (trek.js): la Luna ha il Polo Sud sull'equatore
    moon: { type: 'raster', tileSize: 256, maxzoom: 8, attribution: 'NASA Moon Trek · LRO WAC', tiles: ['trek://moon/{z}/{x}/{y}'] },
    // Marte: Viking MDIM 2.1 a colori (NASA/USGS) già in tile web standard, servito da OpenPlanetaryMap
    mars: { type: 'raster', tileSize: 256, maxzoom: 7, scheme: 'tms', attribution: 'NASA/USGS Viking MDIM 2.1 · OpenPlanetaryMap',
      tiles: [location.origin + '/mars-tiles/{z}/{x}/{y}.png'] }, // proxy: S3 non manda CORS (vite.config.js, vercel.json)
  },
  layers: [
    { id: 'sphere', type: 'background', paint: { 'background-color': PALETTE.dark.moon } },
    { id: 'moon', type: 'raster', source: 'moon', minzoom: FADE[0] - 0.5, layout: { visibility: 'none' }, paint: { 'raster-opacity': IMG_FADE } },
    { id: 'mars', type: 'raster', source: 'mars', minzoom: FADE[0] - 0.5, layout: { visibility: 'none' }, paint: { 'raster-opacity': IMG_FADE } },
    { id: 'gibs', type: 'raster', source: 'gibs', minzoom: FADE[0] - 0.5, layout: { visibility: 'none' }, paint: { 'raster-opacity': IMG_FADE } },
    { id: 'esri', type: 'raster', source: 'esri', minzoom: 6, layout: { visibility: 'none' } },
  ],
}

// vista d'arrivo di ogni pianeta, con i siti in vista
const HOME = { moon: { center: [-4, -6], zoom: 2.45, pitch: 35, bearing: -18 }, mars: { center: [-174, 30], zoom: 2.3, pitch: 15, bearing: 0 } }

// il pianeta sta a destra del pannello (desktop) o sopra (mobile)
const basePad = () => (innerWidth > 820 ? { left: innerWidth * 0.5, top: 0, right: 0, bottom: 0 } : { left: 0, top: 0, right: 0, bottom: innerHeight * 0.42 })

function initialTheme() {
  try { return localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') } catch { return 'dark' }
}

export default function App() {
  const box = useRef(null), stars = useRef(null), map = useRef(null), overlay = useRef(null), spinning = useRef(true), markers = useRef([])
  const [theme, setTheme] = useState(initialTheme)
  const [world, setWorld] = useState('moon')
  const [step, setStep] = useState('planet')
  const [site, setSite] = useState(null)
  const [testId, setTestId] = useState(null)
  const [hoverTest, setHoverTest] = useState(null)
  const [picked, setPicked] = useState(0)
  const [sheet, setSheet] = useState(null) // null | 'benchmark' | 'method'
  const [zoom, setZoom] = useState(HOME.moon.zoom)
  const [dots, setDots] = useState({ moon: [], mars: [], earth: [] })
  const addDots = w => d => setDots(o => ({ ...o, [w]: d }))

  const data = useMemo(() => (site && testId ? getResults(site.id, testId) : null), [site, testId])
  const test = testId && TESTS[testId]
  const result = data?.results[picked]
  const model = step === 'test' ? MODELS[hoverTest] || MODELS.rover_mobility : null
  const pal = PALETTE[theme]

  useEffect(() => {
    for (const w of ['moon', 'mars', 'earth']) loadDots(w).then(addDots(w))
    const m = new maplibregl.Map({ container: box.current, style: STYLE, ...HOME.moon, maxPitch: 70, minZoom: -1.5, attributionControl: { compact: true } })
    map.current = m
    overlay.current = new MapboxOverlay({ interleaved: false, layers: [] }) // interleaved non disegna H3 sul globo
    m.addControl(overlay.current)
    const pad = () => m.setPadding(basePad())
    pad(); m.on('resize', pad)
    let pending = false // zoom aggiornato al massimo una volta per frame
    m.on('move', () => {
      if (pending) return
      pending = true
      requestAnimationFrame(() => { pending = false; setZoom(m.getZoom()) })
    })
    const stop = () => (spinning.current = false)
    m.on('mousedown', stop); m.on('touchstart', stop)
    let raf
    const spin = () => {
      if (spinning.current && !m.isMoving()) m.setCenter([m.getCenter().lng + 0.04, m.getCenter().lat])
      raf = requestAnimationFrame(spin)
    }
    m.on('load', spin)
    return () => { cancelAnimationFrame(raf); m.remove() }
  }, [])

  // tema e mondo: colore della sfera, atmosfera, raster solo sulla Terra
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('theme', theme) } catch { /* modalità privata */ }
    const m = map.current
    const apply = () => {
      m.setPaintProperty('sphere', 'background-color', pal[world])
      for (const [w, ids] of Object.entries(RASTERS)) for (const id of ids) m.setLayoutProperty(id, 'visibility', w === world ? 'visible' : 'none')
      m.setSky({ 'sky-color': 'rgba(0,0,0,0)', 'horizon-color': world === 'earth' ? (theme === 'dark' ? '#2a5aa0' : '#a9c6ea') : pal.page,
        'fog-color': 'rgba(0,0,0,0)', 'atmosphere-blend': world === 'earth' ? ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0] : 0 })
    }
    try { apply() } catch { m.once('load', apply) } // isStyleLoaded() è falso anche solo con tile in arrivo
  }, [theme, world]) // eslint-disable-line react-hooks/exhaustive-deps

  // layer deck: puntini
  useEffect(() => {
    // puntini che sfumano nella foto, sulla stessa soglia del raster (IMG_FADE); il raggio cambia con un uniform, senza ricalcolo
    const dotsFade = 1 - Math.max(0, Math.min(1, (zoom - FADE[0]) / (FADE[1] - FADE[0])))
    // i puntini crescono con il pianeta (fino a 4 volte): la superficie resta piena e chiara come nella prima pagina, invece di diradarsi
    const weighted = world !== 'earth', c = pal[world + 'Dot'] // Luna e Marte: puntini pesati dalla superficie
    // stessa resa della prima pagina: lì three.js schiarisce colori e trasparenze (lineare → sRGB), qui si applica la stessa curva
    const bright = c.slice(0, 3).map(v => 255 * (v / 255) ** (1 / 2.2))
    const layers = [new ScatterplotLayer({
      id: 'dots-' + world, data: dots[world], getPosition: d => [d[0], d[1]],
      radiusUnits: 'pixels', getRadius: world === 'moon' ? d => 0.7 + 0.7 * d[2] : world === 'mars' ? d => 1.1 + 0.6 * d[2] : 1.4, // Marte ha meno punti per superficie: più grandi radiusScale: weighted ? Math.min(4, 2 ** (zoom - pickZoom.current[world])) : 1,
      getFillColor: weighted ? d => [...bright, 255 * ((c[3] / 255) * d[2]) ** 0.6] : c,
      opacity: dotsFade, visible: dotsFade > 0, updateTriggers: { getFillColor: theme },
    })]
    // le zone del modello, un gruppo di esagoni per posto (il numero in classifica è il pin al centro); nella scheda spicca quella aperta
    if (world === 'earth' && data) layers.push(new H3HexagonLayer({ id: 'zones', data: data.zones, getHexagon: d => d.h3,
      getFillColor: d => [...pal.accent, step === 'card' && d.rank !== picked + 1 ? 45 : 150], updateTriggers: { getFillColor: [step, picked] },
      getLineColor: [255, 255, 255, 230], stroked: true, lineWidthMinPixels: 1, extruded: false, highPrecision: true }))
    if (world === 'earth' && step === 'card' && result) layers.push(...logisticsLayers({ result, accent: pal.accent, theme }))
    overlay.current?.setProps({ layers })
  }, [world, dots, data, zoom, theme, step, picked, result]) // eslint-disable-line react-hooks/exhaustive-deps

  // pin: siti con il nome su Luna e Marte, risultati numerati sulla Terra
  useEffect(() => {
    markers.current.forEach(mk => mk.remove())
    const pin = (cls, html, at, onclick, anchor) => {
      const el = document.createElement('button')
      el.className = cls; el.innerHTML = html; el.onclick = onclick
      // Terra: i pin dietro il globo spariscono del tutto (MapLibre di suo li lascia al 20%); Luna e Marte restano come prima
      return new maplibregl.Marker({ element: el, anchor, ...(world === 'earth' && { opacityWhenCovered: '0' }) }).setLngLat(at).addTo(map.current)
    }
    const base = step === 'planet' ? []
      : world !== 'earth' ? SITES.filter(s => s.world === world).map(s =>
        pin('site' + (s === site ? ' on' : ''), `<svg><line x2="${s.tag[0]}" y2="${s.tag[1]}"/></svg><i></i>`
          + `<span style="left:${s.tag[0]}px;top:${s.tag[1]}px;--tx:${s.tag[0] < 0 ? -100 : s.tag[0] > 0 ? 0 : -50}%">${s.name}</span>`, s.pos, () => chooseSite(s)))
      : !data ? [] : data.results.map((r, i) => pin('pin' + (i === picked ? ' on' : ''), i + 1, [r.lon, r.lat], () => jump(i)))
    const extra = world === 'earth' && step === 'card' && result ? logisticsMarkers(result).map(m => {
      const mk = pin(m.className, m.html, m.lngLat, () => {})
      mk.getElement().title = m.title || ''
      return mk
    }) : world === 'earth' && step === 'results' ? [homeMarker()].map(m => {
      const mk = pin(m.className, m.html, m.lngLat, () => {})
      mk.getElement().title = m.title
      return mk
    }) : []
    markers.current = [...base, ...extra]
  }, [world, step, site, data, picked, result]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Animazioni. Ogni passo ha una posa di camera; ogni passaggio tra due passi vicini ha una durata sola.
  // Avanti la curva rallenta alla fine (OUT), indietro è la stessa rovesciata (IN): il ritorno è l'andata al contrario.
  const pickZoom = useRef({ moon: 0.65, mars: 1.6 }) // zoom a cui la mappa ricalca il pianeta della prima pagina (aggiornato al click)
  const busy = useRef(false)
  const wait = ms => new Promise(r => setTimeout(r, ms))
  // coda saltabile del volo in corso: le curve OUT e SOFT rallentano alla fine, nell'ultimo secondo la camera è quasi ferma
  const tail = useRef(null)
  const fly = async opts => {
    spinning.current = false
    map.current.flyTo({ essential: true, padding: basePad(), ...opts })
    if (opts.easing === IN) return wait(opts.duration) // IN accelera alla fine: tagliarla darebbe uno stacco
    await new Promise(r => {
      const id = setTimeout(r, opts.duration)
      tail.current = { end: performance.now() + opts.duration, skip: () => { clearTimeout(id); r() } }
    })
    tail.current = null
  }
  // un'animazione alla volta: i click durante un movimento si ignorano, tranne l'ultimo fatto nell'ultimo secondo.
  // Quello parte subito se il volo sta solo rallentando (ne taglia la coda), altrimenti appena il movimento finisce
  const queued = useRef(null), again = useRef(false), home = useRef(null)
  const act = fn => async (...a) => {
    if (busy.current) {
      queued.current = { run: () => fn(...a), at: performance.now() }
      if (tail.current && tail.current.end - performance.now() <= 1000) tail.current.skip()
      return
    }
    busy.current = true
    try { await fn(...a) } finally {
      busy.current = false
      const q = queued.current
      queued.current = null
      if (again.current) { again.current = false; setTimeout(() => home.current()) } // "Ricomincia" chiesto durante il movimento: vince su tutto
      else if (q && performance.now() - q.at <= 1000) act(q.run)()
    }
  }
  // Posa della mappa che ricalca il pianeta a puntini della prima pagina al tempo t: stesso centro e raggio sullo schermo,
  // stessa faccia verso la camera. Così il pianeta cliccato "diventa" la mappa senza stacco, e al ritorno viceversa.
  // I numeri vengono da DotPlanet.jsx: giro ogni 9000·2π ms, camera 15° sopra l'equatore, sfera = 0,905 della mezza altezza.
  const likePicker = (w, t = performance.now()) => {
    const r = document.querySelector(`.planet[data-w=${w}] .dotplanet`).getBoundingClientRect()
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = (0.905 * 1.18 * r.height) / 2 // 1,18: il globo della mappa in prospettiva appare più piccolo del suo raggio (misurato)
    return {
      center: [((((-t / 9000) * 180) / Math.PI) % 360 + 540) % 360 - 180, 15], pitch: 0, bearing: 0,
      zoom: Math.log2((R * 2 * Math.PI * Math.cos((15 * Math.PI) / 180)) / 512),
      padding: { left: Math.max(0, 2 * cx - innerWidth), right: Math.max(0, innerWidth - 2 * cx), top: Math.max(0, 2 * cy - innerHeight), bottom: Math.max(0, innerHeight - 2 * cy) },
    }
  }
  const over = center => ({ center, zoom: 6.5, pitch: 50, bearing: -20 }) // sopra un sito o un posto
  const globe = center => ({ center, zoom: 1.8, pitch: 0, bearing: 0 }) // la Terra intera con tutte le zone calde

  // Cambio di pianeta, uguale nei due versi e specchiato: la camera si allontana e scorre di lato insieme (padding della mappa,
  // così il pianeta è sempre disegnato intero), il pianeta esce di campo, l'altro entra dal lato opposto mentre lo zoom avanti parte.
  async function warp(to, center, pose) {
    const m = map.current, dir = to === 'earth' ? 1 : -1, base = basePad(), W = innerWidth
    // il padding porta il centro del pianeta fino al bordo dello schermo (oltre, la mappa lo limita);
    // l'ultimo tratto lo fa lo scorrimento della mappa intera, quando il pianeta è già piccolo e lontano dal bordo opposto
    const side = d => ({ ...base, left: d > 0 ? 0 : W, right: d > 0 ? W : 0 })
    const slide = (from, to, duration, easing) => box.current.animate([{ transform: `translateX(${from * 45}vw)` }, { transform: `translateX(${to * 45}vw)` }], { duration, easing, fill: 'forwards' })
    // 240px = un tassello del cielo: a fine corsa lo sfondo è identico, niente salto
    const sky = (duration, easing) => stars.current.animate([{ backgroundPosition: '0 0' }, { backgroundPosition: `${-dir * 240}px 0` }], { duration, easing })
    spinning.current = false
    sky(T.warp, 'cubic-bezier(.55,0,1,.45)')
    slide(0, -dir, T.warp, 'cubic-bezier(.7,0,1,.5)')
    m.easeTo({ zoom: 1, pitch: 0, bearing: 0, padding: side(dir), duration: T.warp, easing: t => t * t, essential: true })
    await wait(T.warp)
    setWorld(to)
    m.jumpTo({ center, zoom: 1, pitch: 0, bearing: 0, padding: side(-dir) })
    sky(1800, 'cubic-bezier(.15,.65,.55,1)')
    slide(dir, 0, 1800, 'cubic-bezier(0,.5,.3,1)')
    await fly({ ...pose, duration: T.site, easing: OUT })
  }

  // Pianeti ↔ Sito
  const choosePlanet = act(async w => {
    spinning.current = false
    setWorld(w); setSite(null); setStep('site')
    const start = likePicker(w)
    pickZoom.current[w] = start.zoom
    map.current.jumpTo(start)
    // parte subito e piano: la dissolvenza incrociata (0,4 s) avviene mentre il pianeta è ancora quasi fermo
    await fly({ ...HOME[w], duration: T.planet, easing: SOFT })
    spinning.current = true
    // modelli 3D del passo Test pronti in anticipo, uno alla volta (il rover per primo: è quello mostrato all'arrivo)
    Object.values(MODELS).reduce((p, m) => p.then(() => preload(m.src)).catch(() => {}), Promise.resolve())
  })
  const toPlanets = act(async () => { // anche "Ricomincia", da qualsiasi passo: un solo zoom indietro, la mappa sfuma alla fine
    if (step === 'planet') return
    // da Luna o Marte la mappa si rimpicciolisce fino a ricalcare il suo pianeta della prima pagina; dalla Terra si allontana e sfuma
    await fly({ ...(world === 'earth' ? { zoom: 0.5, pitch: 0 } : likePicker(world, performance.now() + T.planet)), duration: T.planet, easing: world === 'earth' ? IN : SOFT })
    setStep('planet'); setSite(null); setTestId(null)
    await wait(400)
  })
  // "Ricomincia" vale sempre: da fermi parte subito, durante un movimento lo lascia finire (tagliandone la coda lenta) e poi torna all'inizio
  home.current = toPlanets // sempre l'ultima versione: legge passo e mondo correnti
  const restart = () => {
    if (!busy.current) return toPlanets()
    again.current = true
    if (tail.current && tail.current.end - performance.now() <= 1000) tail.current.skip()
  }
  // Sito ↔ Test
  const chooseSite = act(async s => {
    setSite(s); setTestId(null); setStep('test')
    if (world === 'earth') await warp(s.world, [s.pos[0] + 35, s.pos[1]], over(s.pos))
    else await fly({ ...over(s.pos), duration: T.site, easing: OUT })
  })
  const leaveSite = act(async () => {
    setStep('site'); setSite(null)
    await fly({ ...HOME[world], duration: T.siteBack, easing: IN })
    spinning.current = true
  })
  // Test ↔ Dove (il ritorno è chooseSite dalla Terra)
  const chooseTest = act(async id => {
    setTestId(id); setPicked(0); setStep('results')
    const first = getResults(site.id, id).results[0]
    await warp('earth', [first.lon + 35, first.lat], globe([first.lon, first.lat]))
  })
  // Dove ↔ Scheda
  const choosePlace = act(async i => {
    setPicked(i); setStep('card')
    const r = data.results[i]
    await fly({ ...over([r.lon, r.lat]), zoom: 7, duration: step === 'card' ? T.next : T.card, easing: OUT })
  })
  // da una scheda all'altra: niente coda, ogni click parte subito e interrompe il volo in corso
  const jump = i => {
    if (busy.current || step !== 'card') return choosePlace(i)
    const r = data.results[i]
    setPicked(i)
    map.current.flyTo({ ...over([r.lon, r.lat]), zoom: 7, duration: T.next, easing: OUT, essential: true, padding: basePad() })
  }
  const leaveCard = act(async () => { // torna alla Terra intera, centrata sul posto che si stava guardando
    setStep('results')
    await fly({ ...globe([result.lon, result.lat]), duration: T.card, easing: IN })
  })
  const back = () => ({ card: leaveCard, results: () => chooseSite(site), test: leaveSite, site: toPlanets })[step]?.()

  // campaign view: plain flights, outside act(); the effect below resets the label on any place/step change
  const [campaignView, setCampaignView] = useState(false)
  useEffect(() => setCampaignView(false), [picked, step, site, testId])
  const toggleCampaign = () => {
    if (busy.current || !result) return
    const next = !campaignView
    setCampaignView(next)
    map.current.flyTo({ ...(next ? campaignPose(result) : { ...over([result.lon, result.lat]), zoom: 7 }), duration: 1600, essential: true, padding: basePad() })
  }

  const STEPS = [['site', 'Site'], ['test', 'Test'], ['results', 'Where']]
  const stepIdx = { site: 0, test: 1, results: 2, card: 2 }[step]

  return (
    <>
      <div ref={stars} className="stars" />
      <div ref={box} className={'map' + (step === 'planet' ? ' off' : '')} />

      <div className="left">
        <header className={'hero' + (step === 'planet' || step === 'site' ? '' : ' small')}>
          <p className="brand">FVG Station</p>
          <h1>Where on Earth to test hardware<br />for the Moon and Mars.</h1>
          {step === 'planet' && <p className="lbl pick-hint">Pick where you go.</p>}
        </header>

        {step !== 'planet' && <section className="panel glass">
          <nav className="steps">
            <button className="backbtn" onClick={back} aria-label="Back">←</button>
            {STEPS.map(([k, l], i) => (
              <span key={k} className={i === stepIdx ? 'on' : i < stepIdx ? 'done' : ''}><b className="fig">{i + 1}</b>{l}</span>
            ))}
          </nav>
          {(site || test) && <p className="crumb">{[site && `${site.name} · ${coord(site.lat, 'N', 'S')} ${coord(site.lon, 'E', 'W')}`, test && TEST_EN[testId].name].filter(Boolean).join(' · ')}</p>}

          {step === 'site' && (<>
            <h2>Where do you land?</h2>
            <p className="lbl">{PLANETS[world]?.what}. Pick one here or on the planet.</p>
            <ul className="grid2">
              {SITES.filter(s => s.world === world).map(s => <li key={s.name}><button onClick={() => chooseSite(s)}>{s.name}</button></li>)}
            </ul>
          </>)}

          {step === 'test' && (<>
            <h2>What do you want to test?</h2>
            {model && (
              <figure className="panel-model" key={model.src}>
                <DotModel src={model.src} color={theme === 'dark' ? '#e6edf7' : '#1a1d24'} />
                <figcaption className="lbl">{model.name} · NASA 3D Resources</figcaption>
              </figure>
            )}
            <ul className="list">
              {Object.entries(TESTS).map(([id, t]) => (
                <li key={id}>
                  <button disabled={!getResults(site.id, id)} onClick={() => chooseTest(id)}
                    onMouseEnter={() => setHoverTest(id)} onMouseLeave={() => setHoverTest(null)} onFocus={() => setHoverTest(id)}>
                    <span>{TEST_EN[id].name}{!getResults(site.id, id) && <em className="tag">coming soon</em>}</span>
                    <small>{TEST_EN[id].what}</small>
                  </button>
                </li>
              ))}
            </ul>
          </>)}

          {step === 'results' && data && <ResultsList data={data} onPick={choosePlace} />}

          {step === 'card' && result && <PlaceCard data={data} picked={picked} site={site} test={{ name: TEST_EN[testId].name }} testId={testId} onJump={jump} />}

          <p className="lbl foot">Model by FVG Station on NASA, ESA and JAXA data · export of {new Date(EXPORTED_AT).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
        </section>}
      </div>

      <div className={'picker' + (step === 'planet' ? '' : ' off')}>
          {Object.entries(PLANETS).map(([w, p]) => (
            <button key={w} className="planet" data-w={w} style={{ '--s': p.size }} onClick={() => choosePlanet(w)}>
              <DotPlanet dots={dots[w]} color={pal[w + 'Dot']} fill={pal[w]} dot={1.2 + p.size} />
              <b>{p.name}</b><small className="lbl">{p.what}</small>
            </button>
          ))}
      </div>

      {world === 'earth' && step === 'card' && result && <div className="logi-ctl">
        <button className="logi-toggle glass pill" onClick={toggleCampaign}>{campaignView ? 'Back to site' : 'Campaign view'}</button>
        {campaignView && <div className="logi-legend glass">
          <span><b className="l" />Turin → field site</span>
          <span><b className="l n" />Turin → partner facility</span>
          <span><b className="d" />Facility</span>
        </div>}
      </div>}
      <div className="tools">
        <button className="glass pill" onClick={() => setSheet(sheet === 'benchmark' ? null : 'benchmark')}>Benchmark</button>
        <button className="glass pill" onClick={() => setSheet(sheet === 'method' ? null : 'method')}>Method &amp; data</button>
        <button className="glass pill" onClick={restart}>Start over</button>
        <button className="glass pill" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'Light' : 'Dark'}</button>
      </div>
      {sheet && <div className="sheet glass">
        <button className="close" aria-label="Close" onClick={() => setSheet(null)}>×</button>
        {sheet === 'benchmark' ? <Benchmark onOpen={() => {}} /> : <Method />}
      </div>}
    </>
  )
}
