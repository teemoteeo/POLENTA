// Scrittore minimo di archivi .zip senza compressione (metodo 0, "stored"), per scaricare il pacchetto Simulink in un file solo.
// Formato: PKWARE APPNOTE.TXT 6.3.x, sez. 4.3 (local file header, central directory, end of central directory).
// Nomi in UTF-8 (bit 11 del general purpose flag). Niente ZIP64: va bene sotto i 4 GB e i 65535 file.

const CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

export function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const utf8 = s => new TextEncoder().encode(s)

// data e ora MS-DOS (APPNOTE 4.4.6): ora = h<<11 | m<<5 | s/2, data = (anno-1980)<<9 | mese<<5 | giorno
function dosTime(d) {
  return [(d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()]
}

// files: [{ name, data: Uint8Array | string }] → bytes del file .zip
export function zipFiles(files, date = new Date()) {
  const [time, day] = dosTime(date)
  const parts = [], central = []
  let offset = 0
  for (const f of files) {
    const name = utf8(f.name)
    const data = typeof f.data === 'string' ? utf8(f.data) : f.data
    const crc = crc32(data)
    const local = new Uint8Array(30 + name.length), lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x0800, true); lv.setUint16(8, 0, true)
    lv.setUint16(10, time, true); lv.setUint16(12, day, true); lv.setUint32(14, crc, true)
    lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true); lv.setUint16(26, name.length, true)
    local.set(name, 30)
    const cd = new Uint8Array(46 + name.length), cv = new DataView(cd.buffer)
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x0800, true)
    cv.setUint16(12, time, true); cv.setUint16(14, day, true); cv.setUint32(16, crc, true)
    cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true); cv.setUint16(28, name.length, true)
    cv.setUint32(42, offset, true)
    cd.set(name, 46)
    parts.push(local, data)
    central.push(cd)
    offset += local.length + data.length
  }
  const cdSize = central.reduce((t, c) => t + c.length, 0)
  const end = new Uint8Array(22), ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true)
  ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true)
  const all = [...parts, ...central, end]
  const out = new Uint8Array(all.reduce((t, p) => t + p.length, 0))
  let o = 0
  for (const p of all) { out.set(p, o); o += p.length }
  return out
}
