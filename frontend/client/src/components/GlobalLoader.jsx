import React, { useState, useEffect } from 'react'
import './GlobalLoader.css'

const GlobalLoader = ({ duration = 4500, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isHiding, setIsHiding] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHiding(true)
      const hideTimer = setTimeout(() => {
        setIsVisible(false)
        if (onComplete) onComplete()
      }, 550)
      return () => clearTimeout(hideTimer)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onComplete])

  if (!isVisible) return null

  return (
    <div
      id="sm-loader"
      className={isHiding ? 'sm-hide' : ''}
      role="status"
      aria-live="polite"
      aria-label="SEEMEE is loading"
    >
      <div className="sm-beam"></div>

      <div className="sm-center">
        {/* 1. Gold Outline Lotus SVG Logo */}
        <svg className="sm-lotus" viewBox="0 0 120 100" aria-hidden="true">
          <path pathLength="1" d="M60 8L63 14L60 20L57 14Z" />
          <path pathLength="1" d="M60 28C46 40 46 58 60 74C74 58 74 40 60 28Z" />
          <path pathLength="1" d="M60 74C44 66 38 52 40 40C28 46 22 56 24 64C30 76 46 82 60 80" />
          <path pathLength="1" d="M60 74C76 66 82 52 80 40C92 46 98 56 96 64C90 76 74 82 60 80" />
          <circle className="sm-dot" cx="60" cy="52" r="2" />
        </svg>

        {/* 2. Brand Title with Letter-by-Letter Blur-up Reveal */}
        <h1 className="sm-brand" aria-label="SEEMEE">
          <span>S</span><span>E</span><span>E</span><span>M</span><span>E</span><span>E</span>
        </h1>

        {/* 3. Hairline Divider & Diamond Accent */}
        <div className="sm-rule"><i></i><b></b><i></i></div>

        {/* 4. Tagline */}
        <p className="sm-tag">Ethnic wear for every you</p>

        {/* 5. Gold & Wine Circular Gradient Spinner */}
        <svg className="sm-spinner" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <linearGradient id="gSmReact" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#b98a45" />
              <stop offset="1" stopColor="#8e2744" />
            </linearGradient>
          </defs>
          <circle className="track" cx="50" cy="50" r="42" />
          <circle className="arc" cx="50" cy="50" r="42" stroke="url(#gSmReact)" />
          <g className="head"><circle cx="50" cy="8" r="5" fill="#8e2744" /></g>
        </svg>

        {/* 6. Loading Text with Staggered Bouncing Dots */}
        <p className="sm-load">Loading<em>.</em><em>.</em><em>.</em></p>
      </div>

      {/* Dynamic Falling Petals */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="sm-petal"
          style={{
            left: `${(i * 10 + Math.random() * 8) % 100}%`,
            animationDuration: `${9 + (i % 5) * 1.8}s`,
            animationDelay: `${(i * 0.7) % 8}s`,
            transform: `scale(${0.6 + (i % 4) * 0.2})`
          }}
        />
      ))}
    </div>
  )
}

export default GlobalLoader
