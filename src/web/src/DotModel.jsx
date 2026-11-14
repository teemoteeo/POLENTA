import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

// i GLB NASA sono compressi con Draco: decoder copiato in public/draco
const loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'))

// Il modello NASA diventa una nuvola di puntini campionati sulla superficie (densità uniforme per area).
const FIT = 0.95 // mezza altezza del modello in unità di scena; la camera ne vede 1,2 al centro
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
    // Riempie il riquadro senza uscirne: il modello gira sull'asse verticale, quindi contano la mezza altezza
    // e il raggio massimo attorno all'asse (il riquadro è largo circa 1,6 volte l'altezza utile).
    let rxz = 0
    for (let i = 0; i < out.length; i += 3) rxz = Math.max(rxz, Math.hypot(out[i] - center.x, out[i + 2] - center.z))
    const k = FIT / Math.max(g.boundingBox.getSize(new THREE.Vector3()).y / 2, rxz / 1.6)
    g.translate(-center.x, -center.y, -center.z); g.scale(k, k, k)
    const l = new THREE.BufferGeometry()
    l.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3))
    l.translate(-center.x, -center.y, -center.z); l.scale(k, k, k)
    return { g, l }
  }))
}

export default function DotModel({ src, color }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current, r = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    r.setPixelRatio(Math.min(devicePixelRatio, 2))
    el.appendChild(r.domElement)
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
    cam.position.set(0, 0.9, 4.4); cam.lookAt(0, 0, 0)
    const mat = new THREE.PointsMaterial({ color, size: 0.011, transparent: true, opacity: 0.9, depthWrite: false })
    const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false })
    let pts, edges, raf, alive = true, born = 0
    cloud(src).then(({ g, l }) => {
      if (!alive) return
      pts = new THREE.Points(g, mat); pts.geometry.setDrawRange(0, 0)
      edges = new THREE.LineSegments(l, lineMat)
      scene.add(pts, edges); born = performance.now()
    })
    const size = () => { r.setSize(el.clientWidth, el.clientHeight); cam.aspect = el.clientWidth / el.clientHeight; cam.updateProjectionMatrix() }
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
