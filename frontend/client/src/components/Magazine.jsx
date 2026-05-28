import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { getImageUrl } from '../utils/imageHelper'
import { API_ENDPOINTS } from '../config/api'
import './Magazine.css'

const Magazine = () => {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [magazineStories, setMagazineStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFlipping, setIsFlipping] = useState(false)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    fetchMagazineStories()
  }, [])

  const fetchMagazineStories = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.MAGAZINE)
      const data = await response.json()

      const fallbacks = [
        {
          _id: 'story1',
          title: 'Silk and the River City',
          description: 'The Banarasi loom turns repetition into ritual. Every shuttle movement carries a tempo that has outlived trends, and every finished textile becomes a reminder that cloth can contain geography, labor, and inheritance at once. This chapter follows the loom room from daylight to dusk, moving past dye vats, thread books, and folded lengths of silk waiting for their last inspection.',
          image: '/images/magazine/silk_river_city.png'
        },
        {
          _id: 'story2',
          title: 'The Banarasi Weaving Legacy',
          description: 'From the looms of Varanasi to the modern wardrobe. Discover how we preserve the intricate patterns of traditional Banarasi silk while adapting them for the contemporary woman. A celebration of texture, heritage, and the dedicated hands that guide every metallic thread through the loom to form legendary motifs.',
          image: '/images/magazine/banarasi_weaving.png'
        },
        {
          _id: 'story3',
          title: 'Mastery in the Atelier',
          description: 'Step inside the SEEMEE design studio where royal grandeur meets modern ease. Every cut is measured with spatial precision, every embroidery pattern is placed to silhouette the form, and every seam is hand-finished. We balance ancestral skills with contemporary tailoring, ensuring every single dress carries the human soul inside.',
          image: '/images/magazine/artisan_craftsmanship.png'
        },
        {
          _id: 'story4',
          title: 'The Architecture of the Loom',
          description: 'A study of the mechanical elegance of hand-operated looms. The warp holds the tension of history while the weft introduces the variable paths of human touch. Here, we analyze how jacquard cards translate complex botanical drawings into textile relief, showing that the loom is both a machine and an extension of the weaver\'s imagination.',
          image: '/images/magazine/banarasi_silk_loom.png'
        },
        {
          _id: 'story5',
          title: 'The Weight of Velvet',
          description: 'As the sun sets, the richness of royal velvet takes center stage. Our nocturnal collection features deep emeralds and midnight tones, hand-embroidered with tilla work that captures the moon\'s reflection. Here, we explore the physical weight and drape of velvet, showing how it falls in heavy, majestic drapes while remaining incredibly soft and fluid.',
          image: '/images/magazine/weight_of_velvet.png'
        }
      ]

      if (data.success && data.data.length > 0) {
        let loaded = [...data.data]
        if (loaded.length < 5) {
          const remaining = fallbacks.slice(loaded.length, 5)
          loaded = [...loaded, ...remaining]
        }
        setMagazineStories(loaded.slice(0, 5))
      } else {
        setMagazineStories(fallbacks)
      }
    } catch (error) {
      console.error('Error fetching magazine stories:', error)
    } finally {
      setLoading(false)
    }
  }

  const flip = (dir) => {
    if (isFlipping) return
    setIsFlipping(true)
    setDirection(dir)

    setTimeout(() => {
      setCurrentIndex((prev) =>
        dir > 0
          ? (prev + 1) % magazineStories.length
          : (prev - 1 + magazineStories.length) % magazineStories.length
      )
      setIsFlipping(false)
    }, 350)
  }

  if (loading || magazineStories.length === 0) return null

  const currentStory = magazineStories[currentIndex]

  return (
    <section className="relative py-32 bg-[#faf9f6] overflow-hidden flex flex-col items-center" id="magazine">
      <div className="w-full max-w-screen-2xl px-6 flex flex-col items-center">
        <div className="relative w-full flex justify-center items-center mt-10">
          {/* Navigation Arrows - Positioned relative to the viewport/container */}
          <button
            className="hidden lg:flex absolute left-4 xl:left-20 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/90 backdrop-blur-md border border-black/5 rounded-full items-center justify-center cursor-pointer z-50 hover:bg-[#D4AF37] hover:text-white transition-all duration-500 shadow-xl group"
            onClick={() => flip(-1)}
            disabled={isFlipping}
          >
            <span className="text-2xl transform group-hover:-translate-x-1 transition-transform">←</span>
          </button>

          <button
            className="hidden lg:flex absolute right-4 xl:right-20 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/90 backdrop-blur-md border border-black/5 rounded-full items-center justify-center cursor-pointer z-50 hover:bg-[#D4AF37] hover:text-white transition-all duration-500 shadow-xl group"
            onClick={() => flip(1)}
            disabled={isFlipping}
          >
            <span className="text-2xl transform group-hover:translate-x-1 transition-transform">→</span>
          </button>

          {/* Main Magazine Stage */}
          <div className="w-full max-w-[1100px] h-[500px] md:h-[700px] perspective-[3000px] relative mx-auto">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                className="flex w-full h-full absolute inset-0 transform-gpu preserve-3d shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] rounded-sm overflow-hidden bg-white"
                initial={{ rotateY: direction > 0 ? 90 : -90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{
                  rotateY: direction > 0 ? -90 : 90,
                  opacity: 0,
                  transition: { duration: 0.6, ease: [0.32, 0, 0.67, 0] }
                }}
                transition={{
                  duration: 1.2,
                  ease: [0.22, 1, 0.36, 1],
                  opacity: { duration: 0.4 }
                }}
                style={{ transformOrigin: "center" }}
              >
                {/* Left Page (Visual Spread) */}
                <div className="relative flex-1 h-full bg-[#f4f4f4] border-r border-black/10 overflow-hidden group">
                  <img src={currentStory.image} alt="" className="w-full h-full object-cover grayscale-[0.1] contrast-[1.1] brightness-[0.95] hover:scale-105 transition-transform duration-[2s]" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent"></div>
                  <div className="absolute bottom-8 left-8 text-[10px] tracking-[0.4em] text-white/90 uppercase font-medium">Plate No. 00{currentIndex + 1}</div>
                </div>

                {/* Right Page (Editorial Spread) */}
                <div className="relative flex-1 h-full bg-[#fdfdfc] border-l border-black/5 flex flex-col justify-start py-16 px-8 md:px-12 lg:px-16 overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>

                  <div className="relative z-10 w-full">
                    <span className="block text-[10px] uppercase tracking-[0.6em] text-[#D4AF37] font-bold mb-6 opacity-80">Editorial Journal</span>

                    <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl text-[#1a1a1a] leading-[1.3] mb-6 tracking-tight flex items-start">
                      <span className="text-6xl md:text-7xl leading-[0.8] pr-4 text-[#D4AF37] font-serif font-extralight drop-shadow-sm mt-1">{currentStory.title.charAt(0)}</span>
                      <span className="pt-1">{currentStory.title.slice(1)}</span>
                    </h3>

                    <div className="w-12 h-[1px] bg-[#D4AF37]/50 mb-8"></div>

                    <p className="font-sans text-sm md:text-base lg:text-lg leading-relaxed text-[#4a4a4a] mb-10 font-light italic">
                      {currentStory.description}
                    </p>

                    <div className="flex justify-between items-center pt-6 border-t border-black/5 mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[8px] tracking-[0.3em] text-black/30 uppercase font-bold mb-1">Curation</span>
                        <span className="text-[9px] tracking-widest text-black/60 uppercase">The Artisan Collective</span>
                      </div>
                      <button className="text-[9px] font-bold uppercase tracking-[0.3em] border-b border-[#D4AF37] pb-1 hover:tracking-[0.4em] transition-all duration-300">Read Story</button>
                    </div>
                  </div>

                  <div className="absolute bottom-6 right-8 text-[9px] tracking-[0.3em] text-black/20 uppercase font-mono">P.{currentIndex * 2 + 2}</div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Spine Shadows */}
            <div className="absolute left-1/2 top-0 bottom-0 w-16 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/[0.08] to-transparent z-40 pointer-events-none"></div>
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] -translate-x-1/2 bg-black/5 z-40 pointer-events-none"></div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Magazine
