import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

// i GLB NASA sono compressi con Draco: decoder copiato in public/draco
const loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'))

// Il modello NASA diventa una nuvola di puntini campionati sulla superficie (densità uniforme per area).
const TILT = 0.2 // la camera guarda il modello un po' dall'alto (radianti)
const cache = {}
function cloud(src, n = 26000) {
  return (cache[src] ||= loader.loadAsync(src).then(({ scene }) => {
    scene.updateMatrixWorld(true)
    const meshes = []
    scene.traverse(o => o.isMesh && meshes.push(o))
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), tri = new THREE.Triangle()
    const areas = meshes.map(m => {
      const pos = m.geometry.attributes.position, idx = m.geometry.index, k = idx ? idx.count : pos.count
      let s = 0
      for (let i = 0; i + 2 < k; i += 3) {
        const [i0, i1, i2] = idx ? [idx.getX(i), idx.getX(i + 1), idx.getX(i + 2)] : [i, i + 1, i + 2]
        a.fromBufferAttribute(pos, i0).applyMatrix4(m.matrixWorld)
        b.fromBufferAttribute(pos, i1).applyMatrix4(m.matrixWorld)
        c.fromBufferAttribute(pos, i2).applyMatrix4(m.matrixWorld)
        s += tri.set(a, b, c).getArea()
      }
      return s
    })
    // contorni: spigoli con angolo > 35° tra le facce
    const lines = []
    for (const m of meshes) {
      const e = new THREE.EdgesGeometry(m.geometry, 35).attributes.position
      for (let i = 0; i < e.count; i++) { a.fromBufferAttribute(e, i).applyMatrix4(m.matrixWorld); lines.push(a.x, a.y, a.z) }
    }
    const total = areas.reduce((x, y) => x + y, 0) || 1, p = new THREE.Vector3(), out = []
    meshes.forEach((m, i) => {
      const count = Math.round((n * areas[i]) / total)
      if (!count) return
      const s = new MeshSurfaceSampler(m).build()
      for (let j = 0; j < count; j++) { s.sample(p); p.applyMatrix4(m.matrixWorld); out.push(p.x, p.y, p.z) }
    })
    // mescola l'ordine: l'animazione di comparsa riempie la sagoma in modo uniforme
    for (let i = out.length / 3 - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      for (let k = 0; k < 3; k++) [out[3 * i + k], out[3 * j + k]] = [out[3 * j + k], out[3 * i + k]]
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3))
    g.computeBoundingBox()
    const center = g.boundingBox.getCenter(new THREE.Vector3())
    g.translate(-center.x, -center.y, -center.z)
    const l = new THREE.BufferGeometry()
    l.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3))
    l.translate(-center.x, -center.y, -center.z)
    // Ingombro esatto sullo schermo durante tutto il giro (camera ortografica inclinata di TILT, asse di rotazione verticale):
    // un punto a quota y e distanza r dall'asse occupa in verticale da y·cos − r·sin a y·cos + r·sin, in orizzontale ±r.
    let top = -Infinity, bottom = Infinity, radius = 0
    for (const p of [g.attributes.position, l.attributes.position]) for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) * Math.cos(TILT), r = Math.hypot(p.getX(i), p.getZ(i))
      top = Math.max(top, y + r * Math.sin(TILT)); bottom = Math.min(bottom, y - r * Math.sin(TILT)); radius = Math.max(radius, r)
    }
    return { g, l, top, bottom, radius }
  }))
}

// Scarica e calcola la nuvola prima che serva: il calcolo blocca il thread per ~0,2 s, meglio a camera ferma
export const preload = src => cloud(src)

export default function DotModel({ src, color }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current, r = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    r.setPixelRatio(Math.min(devicePixelRatio, 2))
    el.appendChild(r.domElement)
    const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
    cam.position.set(0, 10 * Math.sin(TILT), 10 * Math.cos(TILT)); cam.lookAt(0, 0, 0)
    const mat = new THREE.PointsMaterial({ color, size: 0.8, sizeAttenuation: false, transparent: true, opacity: 0.45, depthWrite: false })
    const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false })
    let pts, edges, raf, alive = true, born = 0, box
    // Il riquadro inquadra esattamente l'ingombro del modello, centrato, con l'8% di margine: non sporge mai, a nessun angolo
    const size = () => {
      const w = el.clientWidth, h = el.clientHeight
      r.setSize(w, h)
      if (!box) return
      const half = 1.08 * Math.max((box.top - box.bottom) / 2, (box.radius * h) / w), mid = (box.top + box.bottom) / 2
      cam.left = (-half * w) / h; cam.right = (half * w) / h; cam.top = mid + half; cam.bottom = mid - half
      cam.updateProjectionMatrix()
    }
    cloud(src).then(({ g, l, ...extent }) => {
      if (!alive) return
      box = extent; size()
      pts = new THREE.Points(g, mat); pts.geometry.setDrawRange(0, 0)
      edges = new THREE.LineSegments(l, lineMat)
      scene.add(pts, edges); born = performance.now()
    })
    size()
    const ro = new ResizeObserver(size); ro.observe(el)
    const loop = t => {
      if (pts) {
        const n = pts.geometry.attributes.position.count
        pts.geometry.setDrawRange(0, Math.min(n, Math.floor((n * (t - born)) / 900))) // i puntini compaiono in 0,9 s
        pts.rotation.y = edges.rotation.y = t / 5000
        lineMat.opacity = Math.min(0.35, Math.max(0, (t - born - 500) / 1500)) // i contorni arrivano dopo i puntini
      }
      r.render(scene, cam)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); mat.dispose(); lineMat.dispose(); r.dispose(); r.domElement.remove() }
  }, [src, color])
  return <div ref={ref} className="dotmodel" />
}
