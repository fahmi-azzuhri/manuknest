import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'

// Aset ada di public/tiko/ (hasil potongan dari gambar Tiko_Mascot_Animation_Showcase.png)
const IMG = {
  nest: '/tiko/nest-idle.webp', // Tiko diam di sarang
  nestEmpty: '/tiko/nest-empty.webp', // sarang kosong (saat Tiko terbang)
  fly1: '/tiko/fly-1.webp', // sayap naik
  fly2: '/tiko/fly-2.webp', // sayap turun
}
const FLY_ASPECT = 360 / 394 // tinggi / lebar frame terbang

// `mood` dipertahankan supaya pemakaian lama <Mascot mood="..."/> tidak error.
type Props = { mood?: 'happy' | 'sleepy' | 'peek'; small?: boolean }
type Phase = 'nest' | 'flying' | 'landed'
type Origin = { x: number; y: number; w: number; h: number }
type Flyer = Origin

const FLY_MS = 9000 // lama terbang (ubah di sini)
const LANDED_MS = 2400

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const cr = (p0: number, p1: number, p2: number, p3: number, t: number) =>
  0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)

/** Jalur terbang acak & mulus (Catmull-Rom) di ruang layar, berawal & berakhir di mulut sarang. */
function buildKeyframes(o: Origin): Keyframe[] {
  const vw = document.documentElement.clientWidth
  const vh = window.innerHeight
  const sx = window.scrollX
  const sy = window.scrollY
  const minX = sx + 8
  const maxX = Math.max(minX, sx + vw - o.w * 1.12 - 8)
  const minY = sy + 8
  const maxY = Math.max(minY, sy + vh - o.h * 1.12 - 84)
  const far = Math.min(vw, vh) * 0.38

  const pts = [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: -o.h * 0.08 },
    { x: 0, y: -o.h * 0.35 },
    { x: 0, y: -o.h * 0.85 },
  ]
  let last = pts[pts.length - 1]
  for (let i = 0; i < 7; i++) {
    let c = last
    for (let t = 0; t < 14; t++) {
      c = { x: minX + Math.random() * (maxX - minX) - o.x, y: minY + Math.random() * (maxY - minY) - o.y }
      if (Math.hypot(c.x - last.x, c.y - last.y) >= far) break
    }
    pts.push(c)
    last = c
  }
  pts.push(
    { x: 0, y: -o.h * 0.75 },
    { x: 0, y: -o.h * 0.32 },
    { x: 0, y: -o.h * 0.07 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  )

  const P = (i: number) => pts[clamp(i, 0, pts.length - 1)]
  const seg = pts.length - 1
  const N = seg * 32 + 1
  const pos = Array.from({ length: N }, (_, k) => {
    const off = k / (N - 1)
    const u = (0.8 * off + 0.2 * off * off * (3 - 2 * off)) * seg // hampir linear: lepas landas cukup sigap
    const i = Math.min(Math.floor(u), seg - 1)
    const t = u - i
    return {
      off,
      x: cr(P(i - 1).x, P(i).x, P(i + 1).x, P(i + 2).x, t),
      y: cr(P(i - 1).y, P(i).y, P(i + 1).y, P(i + 2).y, t),
    }
  })
  let facing = 1
  return pos.map((p, k) => {
    const dx = (pos[Math.min(k + 1, N - 1)].x - pos[Math.max(k - 1, 0)].x) / 2
    if (Math.abs(dx) > 1) facing = dx < 0 ? -1 : 1
    const tilt = clamp(dx * 0.35, -12, 12)
    const sc = 1 + 0.1 * Math.sin(Math.PI * p.off)
    return { offset: p.off, transform: `translate(${p.x}px,${p.y}px) rotate(${tilt}deg) scaleX(${facing}) scale(${sc})` }
  })
}

export default function Mascot({ small = false }: Props) {
  const [phase, setPhase] = useState<Phase>('nest')
  const [flyer, setFlyer] = useState<Flyer | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const flyerRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach(window.clearTimeout)
    timers.current = []
  }
  useEffect(() => clearTimers, [])
  useEffect(() => {
    Object.values(IMG).forEach((src) => { const i = new Image(); i.src = src }) // preload
  }, [])

  const land = useCallback(() => {
    setFlyer(null)
    setPhase('landed')
    timers.current.push(window.setTimeout(() => setPhase('nest'), LANDED_MS))
  }, [])

  const fly = useCallback(() => {
    if (phase === 'flying') return
    clearTimers()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      land()
      return
    }
    const r = boxRef.current?.getBoundingClientRect()
    if (!r) return
    const w = r.width * 0.82
    const h = w * FLY_ASPECT
    const bx = r.left + window.scrollX
    const by = r.top + window.scrollY
    // Keep the takeoff sprite centered and small enough to emerge through the nest opening.
    setFlyer({
      x: bx + (r.width - w) / 2,
      y: by - h * 0.04,
      w,
      h,
    })
    setPhase('flying')
  }, [phase, land])

  useEffect(() => {
    if (!flyer || !flyerRef.current) return
    const anim = flyerRef.current.animate(buildKeyframes(flyer), { duration: FLY_MS, easing: 'linear', fill: 'forwards' })
    anim.onfinish = land
    return () => {
      anim.onfinish = null
      anim.cancel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyer])

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fly()
    }
  }

  return (
    <>
      <div
        className={`mascot-wrap tiko ${small ? 'mascot-small' : ''} is-${phase}`}
        role="button"
        tabIndex={0}
        aria-label="Tiko, burung kecil di sarang. Klik untuk membuatnya terbang."
        onClick={fly}
        onKeyDown={onKey}
      >
        <div className="mascot-shadow" />
        <div ref={boxRef} className="tk-box">
          <img className="tk-nest" src={phase === 'flying' ? IMG.nestEmpty : IMG.nest} alt="" draggable={false} />
          {/* kedip: kelopak menutup mata, dilukis di atas mata terbuka */}
          <svg className="tk-blink" viewBox="0 0 430 358" aria-hidden="true">
            <ellipse cx="196.6" cy="177" rx="14" ry="18" fill="#f8efdd" />
            <ellipse cx="288" cy="164.6" rx="14" ry="18" fill="#f8efdd" />
            <path d="M184 181 Q196.6 190 209 181 M276 169 Q288 178 300 169" fill="none" stroke="#3b2b24" strokeWidth="4.5" strokeLinecap="round" />
          </svg>
          <svg className="tk-heart" viewBox="-16 -12 32 28" aria-hidden="true">
            <path d="M0 -2 C-6 -10 -15 -2 0 9 C15 -2 6 -10 0 -2Z" fill="#e8806f" />
          </svg>
        </div>
      </div>

      {/* Tiko terbang bebas di layar (di luar kontainer supaya tidak ter-clip) */}
      {flyer &&
        createPortal(
          <div ref={flyerRef} className="tk-flyer" aria-hidden="true"
            style={{ left: flyer.x, top: flyer.y, width: flyer.w, height: flyer.h }}>
            <div className="tk-flyer-shadow" />
            <div className="tk-flyer-inner">
              <img className="tk-frame tk-frame-a" src={IMG.fly1} alt="" draggable={false} />
              <img className="tk-frame tk-frame-b" src={IMG.fly2} alt="" draggable={false} />
              <svg className="tk-arc" viewBox="0 0 200 180" fill="none" stroke="#7a8f5a" strokeWidth="3" strokeLinecap="round">
                <path d="M14 96 Q2 112 8 132" />
                <path d="M26 108 Q18 120 22 136" />
                <path d="M186 96 Q198 112 192 132" />
                <path d="M174 108 Q182 120 178 136" />
              </svg>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
