import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Pianeta a puntini per la scelta iniziale: stessi puntini [lon, lat, peso] della mappa, su una sfera che gira.
export default function DotPlanet({ dots, color, fill, dot = 2.2 }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!dots.length) return
    const el = ref.current, r = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    r.setPixelRatio(Math.min(devicePixelRatio, 2))
    el.appendChild(r.domElement)
    const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100)
    cam.position.set(0, 1.1, 4.1); cam.lookAt(0, 0, 0)
    const pos = new Float32Array(dots.length * 3), col = new Float32Array(dots.length * 4), D = Math.PI / 180
    dots.forEach(([lon, lat, w], i) => {
      const c = Math.cos(lat * D)
      pos.set([c * Math.sin(lon * D), Math.sin(lat * D), c * Math.cos(lon * D)], i * 3)
      col.set([color[0] / 255, color[1] / 255, color[2] / 255, (color[3] / 255) * w], i * 4)
    })
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 4))
    const mat = new THREE.PointsMaterial({ size: dot, sizeAttenuation: false, vertexColors: true, transparent: true, depthWrite: false })
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.995, 64, 32), new THREE.MeshBasicMaterial({ color: fill })) // nasconde i puntini dietro
    const planet = new THREE.Group().add(ball, new THREE.Points(g, mat))
    scene.add(planet)
    const size = () => { r.setSize(el.clientWidth, el.clientHeight); cam.aspect = el.clientWidth / el.clientHeight; cam.updateProjectionMatrix() }
    size()
    const ro = new ResizeObserver(size); ro.observe(el)
    let raf
    const loop = t => { planet.rotation.y = t / 9000; r.render(scene, cam); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); g.dispose(); mat.dispose(); ball.geometry.dispose(); ball.material.dispose(); r.dispose(); r.domElement.remove() }
  }, [dots, color, fill, dot])
  return <div ref={ref} className="dotplanet" />
}
