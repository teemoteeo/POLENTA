// Strumento interno (test.html): i risultati della pipeline per ogni sito × test, su un planisfero e in tabella.
const FILES = import.meta.glob('../../../data/export/sites/*.json', { eager: true, import: 'default' })
const data = Object.values(FILES)
const $ = id => document.getElementById(id)
const uniq = k => [...new Set(data.map(d => d[k]))]
for (const k of ['site', 'test']) $(k).innerHTML = uniq(k).map(v => `<option>${v}</option>`).join('')

const ctx = $('map').getContext('2d'), W = 2400, H = 1200
const xy = (lon, lat) => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H] // planisfero equirettangolare
const land = await fetch('/earth-dots.json').then(r => r.json())

function draw() {
  const d = data.find(d => d.site === $('site').value && d.test === $('test').value)
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#3a4152'
  for (const [lon, lat] of land) { const [x, y] = xy(lon, lat); ctx.fillRect(x, y, 3, 3) }
  if (!d) { $('meta').textContent = 'Nessun file per questa coppia.'; $('rows').innerHTML = ''; return }
  $('meta').textContent = `${d.mock ? 'DATI FINTI' : 'dati veri'} · generato ${d.generated_at} · parametri usati: ${(d.params_used || []).join(', ') || '—'} · mancanti: ${(d.params_missing || []).join(', ') || 'nessuno'} · celle con voto: ${d.cells.length}`
  ctx.font = '600 26px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ;[...d.results].reverse().forEach(r => { // il primo in classifica disegnato per ultimo, sopra gli altri
    const [x, y] = xy(r.lon, r.lat), n = d.results.indexOf(r) + 1
    ctx.fillStyle = '#ff5a1f'; ctx.beginPath(); ctx.arc(x, y, 22, 0, 7); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.fillText(n, x, y + 1)
  })
  $('rows').innerHTML = d.results.map((r, i) => `<tr><td>${i + 1}</td><td>${r.name}</td><td>${r.lat}</td><td>${r.lon}</td><td>${r.score}</td><td>${r.kappa}</td><td>${r.h3_cells.length}</td><td>${r.new ? 'sì' : 'no'}</td><td>${r.known_site || '—'}</td>`
    + `<td>${Object.entries(r.params).map(([p, v]) => `${p} ${v}`).join(' · ')}</td><td><a target="_blank" href="https://www.google.com/maps/@${r.lat},${r.lon},40000m/data=!3m1!1e3">mappa</a></td></tr>`).join('')
}
$('site').onchange = $('test').onchange = draw
draw()
