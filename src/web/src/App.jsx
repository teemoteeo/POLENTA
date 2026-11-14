import { useEffect, useMemo, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { H3HexagonLayer } from '@deck.gl/geo-layers'
import { ScatterplotLayer } from '@deck.gl/layers'
import DotModel from './DotModel.jsx'
import { ARTEMIS_SITES, TESTS, FACILITIES, MODELS, buildMoonDots, getResults } from './data.js'

const PARAM_LABEL = {
  slope_p90: 'Pendenza', roughness: 'Rugosità', crater_density: 'Crateri', rock_cover: 'Rocce',
  low_sun_frac: 'Sole radente', albedo: 'Albedo', grain_proxy: 'Granulometria', bulk_density: 'Densità del suolo',
  rock_class: 'Tipo di roccia', gravity_1_6: 'Gravità 1/6', vacuum: 'Vuoto', electrostatic_dust: 'Polvere elettrostatica',
  plume_vacuum: 'Getto del motore nel vuoto', soil_density: 'Densità della regolite', cryo_psr: 'Gelo delle zone in ombra', agglutinates: 'Agglutinati',
}
const BREAK = 0.3

// Colori per tema e mondo: pagina, sfera, puntini
const PALETTE = {
  dark: { page: '#04060a', moon: '#101114', earth: '#0b1018', moonDot: [205, 208, 215, 150], earthDot: [190, 215, 255, 175], accent: [255, 90, 31] },
  light: { page: '#eef1f5', moon: '#e3e4e7', earth: '#dfe5ec', moonDot: [40, 42, 48, 120], earthDot: [17, 40, 80, 140], accent: [255, 90, 31] },
}

const STYLE = {
  version: 8,
  projection: { type: 'globe' },
  sources: {
    // NASA GIBS Blue Marble, poi Esri per il dettaglio: entrano solo da vicino
    gibs: { type: 'raster', tileSize: 256, maxzoom: 8, attribution: 'NASA GIBS Blue Marble',
      tiles: ['https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg'] },
    esri: { type: 'raster', tileSize: 256, maxzoom: 19, attribution: 'Esri World Imagery',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'] },
  },
  layers: [
    { id: 'sphere', type: 'background', paint: { 'background-color': PALETTE.dark.moon } },
    { id: 'gibs', type: 'raster', source: 'gibs', layout: { visibility: 'none' }, paint: { 'raster-opacity': ['interpolate', ['linear'], ['zoom'], 3.5, 0, 5, 1] } },
    { id: 'esri', type: 'raster', source: 'esri', minzoom: 6, layout: { visibility: 'none' } },
  ],
}

const HOME = { center: [25, -35], zoom: 2.45, pitch: 35, bearing: -18 }
const heat = s => [255, Math.round(200 - 140 * s), Math.round(40 * (1 - s)), Math.round(20 + 100 * s)]
const pct = s => Math.round(s * 100)

function initialTheme() {
  try { return localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') } catch { return 'dark' }
}

export default function App() {
  const box = useRef(null), map = useRef(null), overlay = useRef(null), spinning = useRef(true), markers = useRef([])
  const [theme, setTheme] = useState(initialTheme)
  const [world, setWorld] = useState('moon')
  const [step, setStep] = useState('site')
  const [site, setSite] = useState(null)
  const [testId, setTestId] = useState(null)
  const [hoverTest, setHoverTest] = useState(null)
  const [picked, setPicked] = useState(0)
  const [zoom, setZoom] = useState(HOME.zoom)
  const [earthDots, setEarthDots] = useState([])
  const [moonDots, setMoonDots] = useState([])

  const data = useMemo(() => (site && testId ? getResults(site.name, testId) : null), [site, testId])
  const test = testId && TESTS[testId]
  const result = data?.results[picked]
  const model = step === 'test' ? MODELS[hoverTest || 'rover_mobility'] : null
  const pal = PALETTE[theme]

  useEffect(() => {
    fetch('/earth-dots.json').then(r => r.json()).then(setEarthDots)
    buildMoonDots().then(setMoonDots)
    const m = new maplibregl.Map({ container: box.current, style: STYLE, ...HOME, maxPitch: 70, minZoom: -1.5, attributionControl: { compact: true } })
    map.current = m
    overlay.current = new MapboxOverlay({ interleaved: false, layers: [] }) // interleaved non disegna H3 sul globo
    m.addControl(overlay.current)
    const pad = () => m.setPadding(innerWidth > 820 ? { left: innerWidth * 0.5, top: 0, right: 0, bottom: 0 } : { left: 0, top: 0, right: 0, bottom: innerHeight * 0.42 })
    pad(); m.on('resize', pad)
    m.on('zoom', () => setZoom(Math.round(m.getZoom() * 4) / 4))
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
      for (const id of ['gibs', 'esri']) m.setLayoutProperty(id, 'visibility', world === 'earth' ? 'visible' : 'none')
      m.setSky({ 'sky-color': 'rgba(0,0,0,0)', 'horizon-color': world === 'earth' ? (theme === 'dark' ? '#2a5aa0' : '#a9c6ea') : pal.page,
        'fog-color': 'rgba(0,0,0,0)', 'atmosphere-blend': world === 'earth' ? ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0] : 0 })
    }
    if (m.isStyleLoaded()) apply(); else m.once('load', apply)
  }, [theme, world]) // eslint-disable-line react-hooks/exhaustive-deps

  // layer deck: puntini, siti Artemis, heat map H3
  useEffect(() => {
    const dotsFade = world === 'earth' ? Math.max(0, Math.min(1, (5 - zoom) / 1.5)) : 1
    const layers = [new ScatterplotLayer({
      id: 'dots-' + world, data: world === 'moon' ? moonDots : earthDots, getPosition: d => [d[0], d[1]],
      radiusUnits: 'pixels', getRadius: world === 'moon' ? d => (0.7 + 0.7 * d[2]) * (1 + Math.max(0, zoom - 2.5) * 0.3) : 1.4, getFillColor: world === 'moon' ? d => [...pal.moonDot.slice(0, 3), pal.moonDot[3] * d[2]] : pal.earthDot,
      opacity: dotsFade, visible: dotsFade > 0, updateTriggers: { getFillColor: theme, getRadius: zoom },
    })]
    if (world === 'moon') layers.push(new ScatterplotLayer({
      id: 'artemis', data: ARTEMIS_SITES, getPosition: d => [d.lon, d.lat], radiusUnits: 'pixels',
      getRadius: d => (d === site ? 9 : 5), getFillColor: d => (d === site ? pal.accent : [...pal.accent, 170]),
      stroked: true, getLineColor: [255, 255, 255, 220], lineWidthUnits: 'pixels', getLineWidth: d => (d === site ? 2 : 0),
      pickable: true, onClick: ({ object }) => object && chooseSite(object), updateTriggers: { getRadius: site?.name, getFillColor: site?.name, getLineWidth: site?.name },
    }))
    if (world === 'earth' && data) layers.push(new H3HexagonLayer({
      id: 'h3', data: data.cells, getHexagon: d => d.h3, getFillColor: d => heat(d.score), stroked: false, extruded: false,
    }))
    overlay.current?.setProps({ layers })
  }, [world, earthDots, moonDots, site, data, zoom, theme]) // eslint-disable-line react-hooks/exhaustive-deps

  // pin dei risultati sulla Terra
  useEffect(() => {
    markers.current.forEach(mk => mk.remove())
    markers.current = world !== 'earth' || !data ? [] : data.results.map((r, i) => {
      const el = document.createElement('button')
      el.className = 'pin' + (i === picked ? ' on' : '')
      el.textContent = i + 1
      el.onclick = () => choosePlace(i)
      return new maplibregl.Marker({ element: el }).setLngLat([r.lon, r.lat]).addTo(map.current)
    })
  }, [world, data, picked]) // eslint-disable-line react-hooks/exhaustive-deps

  const fly = (opts, then) => {
    spinning.current = false
    map.current.flyTo({ essential: true, ...opts })
    if (then) map.current.once('moveend', then)
  }

  // "camera che gira": la vista scorre di lato sfocata sulle stelle, cambia mondo, rientra dall'altro lato
  function pan(swap, then) {
    const root = document.documentElement
    root.classList.add('pan-out')
    setTimeout(() => {
      swap()
      root.classList.replace('pan-out', 'pan-in')
      requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('pan-in')))
      setTimeout(then, 800)
    }, 750)
  }

  function chooseSite(s) {
    setSite(s); setStep('test'); setTestId(null)
    const go = () => fly({ center: [s.lon, s.lat + 2], zoom: 3.3, pitch: 55, bearing: -18, duration: 2800 })
    if (world === 'earth') pan(() => { setWorld('moon'); map.current.jumpTo({ center: [s.lon + 90, -40], zoom: 0.6, pitch: 0, bearing: 0 }) }, go)
    else go()
  }
  function chooseTest(id) {
    setTestId(id); setPicked(0); setStep('results')
    const first = getResults(site.name, id).results[0]
    // 1. ci si allontana dalla Luna  2. la camera gira verso la Terra  3. si vola sul posto migliore
    fly({ zoom: -1.2, pitch: 0, bearing: 0, duration: 2200 }, () => pan(
      () => { setWorld('earth'); map.current.jumpTo({ center: [first.lon + 100, 10], zoom: -0.6, pitch: 0, bearing: 0 }) },
      () => fly({ center: [first.lon, first.lat], zoom: 6.5, pitch: 50, bearing: -20, duration: 5500, curve: 1.6 }),
    ))
  }
  function choosePlace(i) {
    setPicked(i); setStep('card')
    const r = data.results[i]
    fly({ center: [r.lon, r.lat], zoom: 7, pitch: 50, bearing: -20, speed: 0.9 })
  }
  function back() {
    if (step === 'card') return setStep('results')
    if (step === 'results') return chooseSite(site)
    restart()
  }
  function restart() {
    setSite(null); setTestId(null); setStep('site'); setWorld('moon')
    fly({ ...HOME, duration: 2000 }, () => (spinning.current = true))
  }

  const broken = result ? Object.entries(result.params).filter(([, s]) => s < BREAK).map(([p]) => p) : []
  const STEPS = [['site', 'Sito'], ['test', 'Test'], ['results', 'Dove']]
  const stepIdx = { site: 0, test: 1, results: 2, card: 2 }[step]

  return (
    <>
      <div className="stars" />
      <div ref={box} className="map" />

      <div className="left">
        <header className={'hero' + (step === 'site' ? '' : ' small')}>
          <p className="brand">FVG Station</p>
          <h1>Dove testare sulla Terra l'hardware per il Polo Sud della Luna.</h1>
        </header>

        <section className="panel glass">
          <nav className="steps">
            {step !== 'site' && <button className="backbtn" onClick={back} aria-label="Indietro">←</button>}
            {STEPS.map(([k, l], i) => (
              <span key={k} className={i === stepIdx ? 'on' : i < stepIdx ? 'done' : ''}><b className="fig">{i + 1}</b>{l}</span>
            ))}
          </nav>
          {(site || test) && <p className="crumb">{[site?.name, test?.nome].filter(Boolean).join(' · ')}</p>}

          {step === 'site' && (<>
            <h2>Dove atterri?</h2>
            <p className="lbl">Le 9 regioni candidate di Artemis III. Scegline una qui o sulla Luna.</p>
            <ul className="grid2">
              {ARTEMIS_SITES.map(s => <li key={s.name}><button onClick={() => chooseSite(s)}>{s.name}</button></li>)}
            </ul>
          </>)}

          {step === 'test' && (<>
            <h2>Cosa vuoi testare?</h2>
            <ul className="list">
              {Object.entries(TESTS).map(([id, t]) => (
                <li key={id}>
                  <button disabled={t.stato === 'coming_soon'} onClick={() => chooseTest(id)}
                    onMouseEnter={() => setHoverTest(id)} onMouseLeave={() => setHoverTest(null)} onFocus={() => setHoverTest(id)}>
                    <span>{t.nome}{t.stato !== 'mvp' && <em className="tag">{t.stato === 'preview' ? 'anteprima' : 'presto'}</em>}</span>
                    <small>{t.cosa_si_testa}</small>
                  </button>
                </li>
              ))}
            </ul>
          </>)}

          {step === 'results' && data && (<>
            <h2>Dove farlo sulla Terra</h2>
            <ol className="list">
              {data.results.map((r, i) => (
                <li key={r.name}>
                  <button className="row" onClick={() => choosePlace(i)}>
                    <span><b className="fig">{i + 1}</b> {r.name}</span><span className="fig score">{pct(r.score)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </>)}

          {step === 'card' && result && (<>
            <div className="pager">
              <button disabled={picked === 0} onClick={() => choosePlace(picked - 1)} aria-label="Sito precedente">←</button>
              <span className="fig">{picked + 1} / {data.results.length}</span>
              <button disabled={picked === data.results.length - 1} onClick={() => choosePlace(picked + 1)} aria-label="Sito successivo">→</button>
            </div>
            <h2>{result.name}</h2>
            <p className="lbl">Analogo di {site.name} per {test.nome.toLowerCase()} · <span className="fig">{pct(result.score)}</span>/100</p>
            <ul className="bars">
              {Object.entries(result.params).map(([p, s]) => (
                <li key={p} className={s < BREAK ? 'brk' : ''}>
                  <span>{PARAM_LABEL[p] || p}</span>
                  <i><b style={{ width: pct(s) + '%' }} /></i>
                  <span className="fig">{s < BREAK ? 'si rompe' : pct(s)}</span>
                </li>
              ))}
            </ul>
            <h3>Cosa fare al chiuso</h3>
            <ul className="cover">
              {[...test.indoor, ...broken].map(p => (
                <li key={p}><span>{PARAM_LABEL[p] || p}</span><span className="lbl">{(FACILITIES[p] || ['da cercare in facilities.csv']).join(' · ')}</span></li>
              ))}
            </ul>
          </>)}

          <p className="lbl foot">Dati di prova, in attesa dell'export della pipeline.</p>
        </section>
      </div>

      {model && (
        <figure className="stage" key={model.src}>
          <DotModel src={model.src} color={theme === 'dark' ? '#e6edf7' : '#1a1d24'} />
          <figcaption className="lbl">{model.name} · modello NASA 3D Resources</figcaption>
        </figure>
      )}

      <div className="tools">
        <button className="glass pill" onClick={restart}>Ricomincia</button>
        <button className="glass pill" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'Chiaro' : 'Scuro'}</button>
      </div>
    </>
  )
}
