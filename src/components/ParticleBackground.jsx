import { useEffect, useRef } from 'react'

// Gaussian-ish random number in roughly [-1, 1]
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5

export default function ParticleBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let ctx
    try {
      ctx = canvas.getContext('2d')
    } catch {
      return
    }
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let raf = 0
    let particles = []

    const build = () => {
      const count = w < 700 ? 380 : 780
      particles = Array.from({ length: count }, () => {
        const r = Math.random()
        const hue = r < 0.08 ? 190 + Math.random() * 15 : r < 0.5 ? 220 + Math.random() * 30 : 255 + Math.random() * 40
        return {
          t: Math.random(),
          spread: gauss(),
          size: 0.4 + Math.random() * 1.7,
          alpha: 0.2 + Math.random() * 0.8,
          hue,
          phase: Math.random() * Math.PI * 2,
          speed: 0.15 + Math.random() * 0.35,
          amp: 2 + Math.random() * 7,
        }
      })
    }

    const draw = (now) => {
      const time = reduced ? 0 : now / 1000
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      for (const p of particles) {
        const x = p.t * w
        const wave = Math.sin(p.t * Math.PI * 1.7 + 0.6 + time * 0.12)
        const band = 0.35 + 0.65 * Math.sin(p.t * Math.PI) // thicker in the middle
        const y =
          h * 0.66 -
          wave * h * 0.13 -
          p.t * h * 0.12 +
          p.spread * h * 0.11 * band +
          Math.sin(time * p.speed + p.phase) * p.amp
        const twinkle = reduced ? 1 : 0.7 + 0.3 * Math.sin(time * p.speed * 2 + p.phase)
        ctx.beginPath()
        ctx.fillStyle = `hsla(${p.hue}, 95%, 68%, ${p.alpha * twinkle * 0.85})`
        ctx.shadowColor = `hsla(${p.hue}, 95%, 65%, 0.9)`
        ctx.shadowBlur = p.size * 4
        ctx.arc(x, y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0
      ctx.globalCompositeOperation = 'source-over'
    }

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = Math.max(1, rect.width)
      h = Math.max(1, rect.height)
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      build()
      draw(performance.now())
    }

    const loop = (now) => {
      draw(now)
      raf = requestAnimationFrame(loop)
    }

    resize()
    let ro
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(resize)
      ro.observe(canvas.parentElement)
    } else {
      window.addEventListener('resize', resize)
    }
    if (!reduced) raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro?.disconnect()
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="particles" aria-hidden="true">
      <div className="particle-glow" />
      <canvas ref={canvasRef} />
    </div>
  )
}
