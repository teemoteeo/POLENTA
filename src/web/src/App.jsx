import { useEffect, useMemo, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import { MapboxOverlay } from '@deck.gl/mapbox'
import { H3HexagonLayer } from '@deck.gl/geo-layers'
import { ARTEMIS_SITES, TESTS, FACILITIES, getResults } from './data.js'

const PARAM_LABEL = {
  slope_p90: 'Pendenza', roughness: 'Rugosità', crater_density: 'Crateri', rock_cover: 'Rocce',
  low_sun_frac: 'Sole radente', albedo: 'Albedo', grain_proxy: 'Granulometria', bulk_density: 'Densità del suolo',
  rock_class: 'Tipo di roccia', gravity_1_6: 'Gravità 1/6', vacuum: 'Vuoto', electrostatic_dust: 'Polvere elettrostatica',
  plume_vacuum: 'Getto del motore nel vuoto', cryo_psr: 'Gelo delle zone in ombra', agglutinates: 'Agglutinati',
}
const BREAK = 0.3

const STYLE = {
  version: 8,
  projection: { type: 'globe' },
  sources: {
    // NASA GIBS Blue Marble fino a z8, poi Esri per il dettaglio
    gibs: { type: 'raster', tileSize: 256, maxzoom: 8, attribution: 'NASA GIBS Blue Marble',
      tiles: ['https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg'] },
    esri: { type: 'raster', tileSize: 256, maxzoom: 19, attribution: 'Esri World Imagery',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'] },
  },
  layers: [
    { id: 'gibs', type: 'raster', source: 'gibs' },
    { id: 'esri', type: 'raster', source: 'esri', minzoom: 6 },
  ],
}

const SKY = {
  dark: { 'sky-color': '#05070d', 'horizon-color': '#1b3a6b', 'fog-color': '#05070d', 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0] },
  light: { 'sky-color': '#eef2f7', 'horizon-color': '#bcd3ee', 'fog-color': '#eef2f7', 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0] },
}

const heat = s => [255, Math.round(214 - 150 * s), Math.round(40 * (1 - s)), Math.round(25 + 120 * s)]
const pct = s => Math.round(s * 100)

function initialTheme() {
  try { return localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') } catch { return 'dark' }
}

export default function App() {
  const box = useRef(null), map = useRef(null), overlay = useRef(null), spinning = useRef(true), markers = useRef([])
  const [theme, setTheme] = useState(initialTheme)
  const [site, setSite] = useState(null)
  const [testId, setTestId] = useState(null)
  const [picked, setPicked] = useState(0)

  const data = useMemo(() => (site && testId ? getResults(site, testId) : null), [site, testId])
  const test = testId && TESTS[testId]
  const result = data?.results[picked]

  // mappa + rotazione del globo finché nessuno sceglie
  useEffect(() => {
    const m = new maplibregl.Map({ container: box.current, style: STYLE, center: [12, 30], zoom: 1.6, attributionControl: { compact: true } })
    map.current = m
    overlay.current = new MapboxOverlay({ interleaved: false, layers: [], onError: e => console.warn('deck', e?.message || String(e)) })
    m.addControl(overlay.current)
    const pad = () => m.setPadding(innerWidth > 720 ? { left: 400, top: 0, right: 0, bottom: 0 } : { left: 0, top: 0, right: 0, bottom: innerHeight * 0.5 })
    pad(); m.on('resize', pad)
    m.on('mousedown', () => (spinning.current = false))
    m.on('touchstart', () => (spinning.current = false))
    let raf
    const spin = () => {
      if (spinning.current && !m.isMoving()) m.setCenter([m.getCenter().lng - 0.06, m.getCenter().lat])
      raf = requestAnimationFrame(spin)
    }
    m.on('load', () => { m.setSky(SKY[document.documentElement.dataset.theme] || SKY.dark); spin() })
    return () => { cancelAnimationFrame(raf); m.remove() }
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('theme', theme) } catch { /* privato */ }
    const m = map.current
    if (m?.isStyleLoaded()) m.setSky(SKY[theme])
  }, [theme])

  // heat map H3 + pin + volo sul risultato scelto
  useEffect(() => {
    overlay.current?.setProps({ layers: data ? [new H3HexagonLayer({
      id: 'h3', data: data.cells, getHexagon: d => d.h3, getFillColor: d => heat(d.score), stroked: false, extruded: false,
    })] : [] })
    markers.current.forEach(mk => mk.remove())
    markers.current = (data?.results || []).map((r, i) => {
      const el = document.createElement('button')
      el.className = 'pin' + (i === picked ? ' on' : '')
      el.textContent = i + 1
      el.onclick = () => setPicked(i)
      return new maplibregl.Marker({ element: el }).setLngLat([r.lon, r.lat]).addTo(map.current)
    })
    if (result) {
      spinning.current = false
      map.current.flyTo({ center: [result.lon, result.lat], zoom: 6.5, speed: 0.8, curve: 1.6, essential: true })
    }
  }, [data, picked]) // eslint-disable-line react-hooks/exhaustive-deps

  function reset() {
    setTestId(null); setPicked(0)
    map.current.flyTo({ center: [map.current.getCenter().lng, 30], zoom: 1.6, speed: 1.2 })
    map.current.once('moveend', () => (spinning.current = true))
  }

  const broken = result ? Object.entries(result.params).filter(([, s]) => s < BREAK).map(([p]) => p) : []
  const indoor = test ? [...new Set([...test.indoor])] : []

  return (
    <>
      <div ref={box} className="map" />

      <aside className="panel glass">
        <header>
          <h1>FVG Station</h1>
          <p className="lbl">Dove testare sulla Terra l'hardware per il Polo Sud lunare</p>
        </header>

        <section>
          <h2><span className="fig">1</span> Sito Artemis III</h2>
          <ul className="list">
            {(site ? [site] : ARTEMIS_SITES).map(s => (
              <li key={s}><button className={s === site ? 'on' : ''} onClick={() => { setSite(s === site ? null : s); setPicked(0) }}>{s}{s === site && <span className="lbl">cambia</span>}</button></li>
            ))}
          </ul>
        </section>

        <section className={site ? '' : 'off'}>
          <h2><span className="fig">2</span> Che test vuoi fare</h2>
          <ul className="list tests">
            {Object.entries(TESTS).filter(([id]) => !testId || id === testId).map(([id, t]) => (
              <li key={id}>
                <button disabled={!site || t.stato === 'coming_soon'} className={id === testId ? 'on' : ''} onClick={() => { setTestId(id === testId ? null : id); setPicked(0) }}>
                  <span>{t.nome}{t.stato !== 'mvp' && <em className="tag">{t.stato === 'preview' ? 'anteprima' : 'presto'}</em>}</span>
                  <small>{t.cosa_si_testa}</small>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {data && (
          <section>
            <h2><span className="fig">3</span> Dove farlo</h2>
            <ol className="list results">
              {data.results.map((r, i) => (
                <li key={r.name}>
                  <button className={i === picked ? 'on' : ''} onClick={() => setPicked(i)}>
                    <span>{r.name}</span><span className="fig">{pct(r.score)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        )}

        {result && (
          <section className="card">
            <h2>{result.name}</h2>
            <p className="lbl">contro {site}</p>
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
              {[...indoor, ...broken].map(p => (
                <li key={p}><span>{PARAM_LABEL[p] || p}</span><span className="lbl">{(FACILITIES[p] || ['da cercare in facilities.csv']).join(' · ')}</span></li>
              ))}
            </ul>
          </section>
        )}

        <p className="lbl foot">Dati di prova: in attesa dell'export della pipeline.</p>
      </aside>

      <div className="tools">
        <button className="glass pill" onClick={reset}>Globo</button>
        <button className="glass pill" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? 'Chiaro' : 'Scuro'}</button>
      </div>
    </>
  )
}
