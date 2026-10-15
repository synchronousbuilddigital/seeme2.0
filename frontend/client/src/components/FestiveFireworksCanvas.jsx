import { useEffect, useRef } from 'react'
import './FestiveFireworksCanvas.css'

const FestiveFireworksCanvas = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const handleResize = () => {
      if (!canvas) return
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)
    }

    window.addEventListener('resize', handleResize)

    // Rich Diwali Festive Color Palettes (Gold, Amber, Crimson Red, Royal Orange, Champagne)
    const PALETTES = [
      // Royal Indian Gold
      [
        { r: 217, g: 119, b: 6 },
        { r: 245, g: 158, b: 11 },
        { r: 251, g: 191, b: 36 },
        { r: 212, g: 175, b: 55 }
      ],
      // Golden Amber & Crimson Flame
      [
        { r: 225, g: 29, b: 72 },
        { r: 234, g: 88, b: 12 },
        { r: 245, g: 158, b: 11 },
        { r: 253, g: 224, b: 71 }
      ],
      // Radiant Orange & Marigold
      [
        { r: 234, g: 88, b: 12 },
        { r: 249, g: 115, b: 22 },
        { r: 251, g: 146, b: 60 },
        { r: 254, g: 240, b: 138 }
      ],
      // Champagne & Starlight Gold
      [
        { r: 180, g: 83, b: 9 },
        { r: 202, g: 138, b: 4 },
        { r: 250, g: 204, b: 21 },
        { r: 255, g: 255, b: 255 }
      ],
      // Emerald & Gold Festive Sparkle
      [
        { r: 5, g: 150, b: 105 },
        { r: 16, g: 185, b: 129 },
        { r: 245, g: 158, b: 11 },
        { r: 251, g: 191, b: 36 }
      ]
    ]

    const rockets = []
    const particles = []
    const sparklers = []
    const anarSparks = []

    // Rocket (Pataka Sky-shot)
    class Rocket {
      constructor(startX, startY, targetX, targetY, burstType) {
        this.x = startX
        this.y = startY
        this.targetX = targetX
        this.targetY = targetY
        this.burstType = burstType !== undefined ? burstType : Math.floor(Math.random() * 5)

        const dist = Math.hypot(targetX - startX, targetY - startY)
        const speed = Math.max(10, Math.min(dist / 24, 18))
        const angle = Math.atan2(targetY - startY, targetX - startX)

        this.vx = Math.cos(angle) * speed
        this.vy = Math.sin(angle) * speed
        this.trail = []
        this.trailLength = 8
        this.exploded = false
        this.palette = PALETTES[Math.floor(Math.random() * PALETTES.length)]
        this.headColor = this.palette[Math.floor(Math.random() * this.palette.length)]
      }

      update() {
        this.trail.push({ x: this.x, y: this.y })
        if (this.trail.length > this.trailLength) {
          this.trail.shift()
        }

        this.x += this.vx
        this.y += this.vy
        this.vy += 0.09 // gravity drag

        if (this.vy >= 0 || this.y <= this.targetY) {
          this.explode()
        }
      }

      draw() {
        ctx.save()
        ctx.beginPath()
        for (let i = 0; i < this.trail.length; i++) {
          const pt = this.trail[i]
          const progress = i / this.trail.length
          ctx.strokeStyle = `rgba(${this.headColor.r}, ${this.headColor.g}, ${this.headColor.b}, ${progress * 0.85})`
          ctx.lineWidth = progress * 3
          if (i === 0) ctx.moveTo(pt.x, pt.y)
          else ctx.lineTo(pt.x, pt.y)
        }
        ctx.stroke()

        // Glowing rocket head spark
        ctx.beginPath()
        ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.shadowColor = `rgb(${this.headColor.r}, ${this.headColor.g}, ${this.headColor.b})`
        ctx.shadowBlur = 12
        ctx.fill()
        ctx.restore()
      }

      explode() {
        this.exploded = true
        createBurst(this.x, this.y, this.burstType, this.palette)
      }
    }

    // Individual Spark Particle
    class Particle {
      constructor(x, y, angle, speed, color, type = 'normal') {
        this.x = x
        this.y = y
        this.prevX = x
        this.prevY = y
        this.vx = Math.cos(angle) * speed
        this.vy = Math.sin(angle) * speed
        this.color = color
        this.type = type
        this.alpha = 1.0
        this.decay = Math.random() * 0.016 + 0.012
        this.gravity = type === 'willow' ? 0.08 : (type === 'anar' ? 0.12 : 0.04)
        this.friction = type === 'starburst' ? 0.95 : 0.965
        this.size = Math.random() * 2.2 + 1.2
        this.twinkle = Math.random() > 0.35
      }

      update() {
        this.prevX = this.x
        this.prevY = this.y
        this.vx *= this.friction
        this.vy *= this.friction
        this.vy += this.gravity
        this.x += this.vx
        this.y += this.vy
        this.alpha -= this.decay
      }

      draw() {
        if (this.alpha <= 0) return
        ctx.save()
        const currentAlpha = this.twinkle && Math.random() > 0.3 ? this.alpha * 0.45 : this.alpha

        ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${currentAlpha})`
        ctx.lineWidth = this.size
        ctx.beginPath()
        ctx.moveTo(this.prevX, this.prevY)
        ctx.lineTo(this.x, this.y)
        ctx.stroke()

        // Sparkling center glow
        if (this.type === 'starburst' || Math.random() > 0.6) {
          ctx.beginPath()
          ctx.arc(this.x, this.y, this.size * 0.9, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.95})`
          ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.9)`
          ctx.shadowBlur = 8
          ctx.fill()
        }
        ctx.restore()
      }
    }

    // Spinning Chakri / Catherine Wheel Pataka
    class SparklerChakri {
      constructor(x, y, palette) {
        this.x = x
        this.y = y
        this.palette = palette
        this.rotation = 0
        this.radius = 0
        this.maxRadius = Math.random() * 50 + 45
        this.spokes = Math.floor(Math.random() * 8) + 14
        this.alpha = 1.0
        this.decay = 0.015
        this.rotSpeed = (Math.random() > 0.5 ? 1 : -1) * 0.12
      }

      update() {
        this.rotation += this.rotSpeed
        this.radius += (this.maxRadius - this.radius) * 0.14
        this.alpha -= this.decay
      }

      draw() {
        if (this.alpha <= 0) return
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)

        for (let i = 0; i < this.spokes; i++) {
          const angle = (i / this.spokes) * Math.PI * 2
          const len = this.radius * (0.85 + Math.sin(this.rotation * 4 + i) * 0.25)
          const px = Math.cos(angle) * len
          const py = Math.sin(angle) * len
          const col = this.palette[i % this.palette.length]

          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(px, py)
          ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${this.alpha * 0.85})`
          ctx.lineWidth = 1.8
          ctx.stroke()

          // Diamond spark tip
          ctx.beginPath()
          ctx.arc(px, py, 2.2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`
          ctx.shadowColor = `rgb(${col.r}, ${col.g}, ${col.b})`
          ctx.shadowBlur = 8
          ctx.fill()
        }
        ctx.restore()
      }
    }

    // Anar (Ground Fountain Sparks)
    class AnarFountainSpark {
      constructor(x, y, palette) {
        this.x = x + (Math.random() * 20 - 10)
        this.y = y
        this.prevX = this.x
        this.prevY = this.y
        const angle = -Math.PI / 2 + (Math.random() * 0.6 - 0.3)
        const speed = Math.random() * 7 + 6
        this.vx = Math.cos(angle) * speed
        this.vy = Math.sin(angle) * speed
        this.color = palette[Math.floor(Math.random() * palette.length)]
        this.alpha = 1.0
        this.decay = Math.random() * 0.025 + 0.018
        this.size = Math.random() * 2 + 1.2
      }

      update() {
        this.prevX = this.x
        this.prevY = this.y
        this.vy += 0.18 // gravity
        this.x += this.vx
        this.y += this.vy
        this.alpha -= this.decay
      }

      draw() {
        if (this.alpha <= 0) return
        ctx.save()
        ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${this.alpha})`
        ctx.lineWidth = this.size
        ctx.beginPath()
        ctx.moveTo(this.prevX, this.prevY)
        ctx.lineTo(this.x, this.y)
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
        ctx.restore()
      }
    }

    function createBurst(x, y, burstType, palette) {
      // 0: Royal Starburst Ring (matches user's image)
      // 1: Willow Golden Cascading Rain
      // 2: Dual Ring Chrysanthemum
      // 3: Spinning Chakri / Starburst Flower
      // 4: Crackling Ladi Salvo

      if (burstType === 3) {
        sparklers.push(new SparklerChakri(x, y, palette))
      }

      const particleCount = burstType === 1 ? 65 : (burstType === 2 ? 70 : 48)

      for (let i = 0; i < particleCount; i++) {
        let speed
        let pType = 'normal'

        if (burstType === 0) {
          // Classic Starburst
          pType = 'starburst'
          speed = Math.random() * 5.2 + 2.5
        } else if (burstType === 1) {
          // Cascading Willow
          pType = 'willow'
          speed = Math.random() * 4.2 + 1.8
        } else if (burstType === 2) {
          // Dual Ring
          pType = 'starburst'
          speed = (i % 2 === 0) ? (Math.random() * 2.5 + 4.5) : (Math.random() * 2 + 2)
        } else {
          speed = Math.random() * 5.5 + 2
        }

        const angle = (i / particleCount) * Math.PI * 2 + (Math.random() * 0.15 - 0.075)
        const col = palette[i % palette.length]
        particles.push(new Particle(x, y, angle, speed, col, pType))
      }

      // Secondary micro crackle pops for crackling ladi effect
      if (burstType === 4 || Math.random() > 0.5) {
        setTimeout(() => {
          for (let k = 0; k < 16; k++) {
            const crackleAngle = Math.random() * Math.PI * 2
            const crackleSpeed = Math.random() * 3 + 1
            const crackleCol = palette[Math.floor(Math.random() * palette.length)]
            particles.push(new Particle(x + (Math.random() * 30 - 15), y + (Math.random() * 30 - 15), crackleAngle, crackleSpeed, crackleCol, 'starburst'))
          }
        }, 120)
      }
    }

    // Launch Single or Multi-Shot Rocket
    function launchRocket() {
      if (document.hidden) return
      if (particles.length > 550) return

      const startX = Math.random() * (width * 0.85) + width * 0.075
      const startY = height + 10
      const targetX = startX + (Math.random() * 200 - 100)
      const targetY = Math.random() * (height * 0.38) + height * 0.06
      const burstType = Math.floor(Math.random() * 5)

      rockets.push(new Rocket(startX, startY, targetX, targetY, burstType))
    }

    // Rapid Salvo (Multiple rockets bursting together like Diwali sky shots!)
    function launchSalvo() {
      if (document.hidden || particles.length > 500) return
      const count = Math.floor(Math.random() * 3) + 2
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          launchRocket()
        }, i * 160)
      }
    }

    // Trigger Anar fountain sparks from bottom left / bottom right
    function triggerAnar() {
      if (document.hidden || anarSparks.length > 80) return
      const leftAnar = Math.random() > 0.5
      const anarX = leftAnar ? (width * 0.05 + Math.random() * 40) : (width * 0.95 - Math.random() * 40)
      const anarY = height - 20
      const pal = PALETTES[0]

      for (let i = 0; i < 4; i++) {
        anarSparks.push(new AnarFountainSpark(anarX, anarY, pal))
      }
    }

    // Launch Timer with higher, energetic festive frequency
    let lastLaunchTime = Date.now()
    let nextLaunchDelay = 450 // Launch every 350ms - 800ms
    let lastAnarTime = Date.now()

    // Interactive launch on click anywhere
    const handleDocumentClick = (e) => {
      const targetX = e.clientX
      const targetY = e.clientY
      const startX = targetX + (Math.random() * 80 - 40)
      const startY = height + 10
      rockets.push(new Rocket(startX, startY, targetX, targetY, Math.floor(Math.random() * 5)))

      // Extra festive click burst
      setTimeout(() => {
        rockets.push(new Rocket(startX + 40, startY, targetX + 50, targetY - 20, Math.floor(Math.random() * 5)))
      }, 100)
    }
    window.addEventListener('click', handleDocumentClick)

    // Main 60FPS Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height)

      const now = Date.now()

      // Frequent Rocket Launches
      if (now - lastLaunchTime > nextLaunchDelay) {
        if (Math.random() > 0.45) {
          launchSalvo() // multi-rocket salvo!
        } else {
          launchRocket()
        }
        lastLaunchTime = now
        nextLaunchDelay = Math.random() * 550 + 350 // every 0.35s - 0.9s
      }

      // Continuous Anar Fountain Sparks
      if (now - lastAnarTime > 80) {
        triggerAnar()
        lastAnarTime = now
      }

      // Update & Draw Rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i]
        r.update()
        r.draw()
        if (r.exploded) {
          rockets.splice(i, 1)
        }
      }

      // Update & Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.update()
        p.draw()
        if (p.alpha <= 0) {
          particles.splice(i, 1)
        }
      }

      // Update & Draw Chakri Sparklers
      for (let i = sparklers.length - 1; i >= 0; i--) {
        const s = sparklers[i]
        s.update()
        s.draw()
        if (s.alpha <= 0) {
          sparklers.splice(i, 1)
        }
      }

      // Update & Draw Anar Sparks
      for (let i = anarSparks.length - 1; i >= 0; i--) {
        const a = anarSparks[i]
        a.update()
        a.draw()
        if (a.alpha <= 0) {
          anarSparks.splice(i, 1)
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    // Launch initial opening salvo of patake
    launchRocket()
    setTimeout(() => launchSalvo(), 200)

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('click', handleDocumentClick)
    }
  }, [])

  return (
    <div className="festive-fireworks-wrapper" aria-hidden="true">
      <canvas ref={canvasRef} className="festive-fireworks-canvas" />
    </div>
  )
}

export default FestiveFireworksCanvas
