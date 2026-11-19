// Scrittore minimo di file MATLAB Level 5 (.mat, non compresso), leggibile da MATLAB, Octave e scipy.io.loadmat.
// Tipi supportati, quanto basta per l'export Simulink (simulink.js):
//   number / NaN / null      → double 1×1 (null → NaN)
//   array di numeri          → double 1×n
//   string                   → char 1×n (UTF-16)
//   oggetto semplice         → struct 1×1, campi nell'ordine delle chiavi
//   array di oggetti         → struct array 1×n, stessi campi in ogni elemento (in MATLAB: struct2table)
// Formato: MathWorks, "MAT-File Format" (Level 5): intestazione da 128 byte, poi elementi miMATRIX allineati a 8 byte.

const mi = { INT8: 1, INT32: 5, UINT32: 6, DOUBLE: 9, UINT16: 4, MATRIX: 14 }
const mx = { STRUCT: 2, CHAR: 4, DOUBLE: 6 }
const NAME_MAX = 31 // lunghezza massima dei nomi di variabile e di campo accettata ovunque (namelengthmax storico)

const pad8 = n => (8 - (n % 8)) % 8

// un sotto-elemento: tag (tipo, byte) + dati + padding a 8
function element(type, bytes) {
  const out = new Uint8Array(8 + bytes.length + pad8(bytes.length))
  const v = new DataView(out.buffer)
  v.setUint32(0, type, true)
  v.setUint32(4, bytes.length, true)
  out.set(bytes, 8)
  return out
}

const concat = parts => {
  const out = new Uint8Array(parts.reduce((t, p) => t + p.length, 0))
  let o = 0
  for (const p of parts) { out.set(p, o); o += p.length }
  return out
}

const int32s = xs => { const b = new Uint8Array(4 * xs.length), v = new DataView(b.buffer); xs.forEach((x, i) => v.setInt32(4 * i, x, true)); return b }
const ascii = s => Uint8Array.from(s, c => c.charCodeAt(0))

export function checkName(name) {
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name) || name.length > NAME_MAX) throw new Error(`nome MATLAB non valido: "${name}"`)
  return name
}

function flags(cls) {
  const b = new Uint8Array(8)
  new DataView(b.buffer).setUint32(0, cls, true)
  return element(mi.UINT32, b)
}

// un miMATRIX completo con nome (stringa vuota per i campi di una struct)
function matrix(name, value) {
  const head = cls => [flags(cls)]
  const nameEl = element(mi.INT8, ascii(name))
  let body
  if (value === null || value === undefined || typeof value === 'number') value = [value ?? NaN]
  if (Array.isArray(value) && value.length && value.every(x => x && typeof x === 'object' && !Array.isArray(x))) {
    // struct array 1×n: nomi dei campi una volta, poi gli elementi uno dopo l'altro, ciascuno con tutti i campi
    const keys = Object.keys(value[0]).map(checkName)
    for (const x of value) if (Object.keys(x).join() !== keys.join()) throw new Error(`struct array "${name}": campi diversi tra gli elementi`)
    const len = Math.max(...keys.map(k => k.length), 0) + 1
    const names = new Uint8Array(len * keys.length)
    keys.forEach((k, i) => names.set(ascii(k), i * len))
    body = [...head(mx.STRUCT), element(mi.INT32, int32s([1, value.length])), nameEl,
      element(mi.INT32, int32s([len])), element(mi.INT8, names),
      ...value.flatMap(x => keys.map(k => matrix('', x[k])))]
    return element(mi.MATRIX, concat(body))
  }
  if (Array.isArray(value)) {
    if (!value.every(x => x === null || typeof x === 'number')) throw new Error(`array non numerico in "${name}"`)
    const b = new Uint8Array(8 * value.length), v = new DataView(b.buffer)
    value.forEach((x, i) => v.setFloat64(8 * i, x ?? NaN, true))
    body = [...head(mx.DOUBLE), element(mi.INT32, int32s([1, value.length])), nameEl, element(mi.DOUBLE, b)]
  } else if (typeof value === 'string') {
    const b = new Uint8Array(2 * value.length), v = new DataView(b.buffer)
    for (let i = 0; i < value.length; i++) v.setUint16(2 * i, value.charCodeAt(i), true)
    body = [...head(mx.CHAR), element(mi.INT32, int32s([1, value.length])), nameEl, element(mi.UINT16, b)]
  } else if (typeof value === 'object') {
    const keys = Object.keys(value).map(checkName)
    const len = Math.max(...keys.map(k => k.length), 0) + 1
    const names = new Uint8Array(len * keys.length)
    keys.forEach((k, i) => names.set(ascii(k), i * len))
    body = [...head(mx.STRUCT), element(mi.INT32, int32s([1, 1])), nameEl,
      element(mi.INT32, int32s([len])), element(mi.INT8, names),
      ...keys.map(k => matrix('', value[k]))]
  } else {
    throw new Error(`tipo non supportato in "${name}": ${typeof value}`)
  }
  return element(mi.MATRIX, concat(body))
}

// vars: { nomeVariabile: valore } → bytes del file .mat
export function matFile(vars, description = 'MATLAB 5.0 MAT-file') {
  const header = new Uint8Array(128).fill(0x20)
  header.set(ascii(description.replace(/[^\x20-\x7e]/g, '?').slice(0, 116)))
  header.fill(0, 116, 124) // offset dei dati di sottosistema: nessuno
  const v = new DataView(header.buffer)
  v.setUint16(124, 0x0100, true)
  header.set(ascii('IM'), 126) // little-endian
  return concat([header, ...Object.entries(vars).map(([k, x]) => matrix(checkName(k), x))])
}
