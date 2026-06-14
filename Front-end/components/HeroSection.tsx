'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { SiteHeroImage } from '@/types/siteContent'
import { useLanguage } from './LanguageProvider'

export default function HeroSection({
  images,
  mobileImages = [],
}: {
  images: SiteHeroImage[]
  mobileImages?: SiteHeroImage[]
}) {
  const [isMobile, setIsMobile] = useState(false)
  const { isSinhala } = useLanguage()
  const bgImages = isMobile && mobileImages.length > 0 ? mobileImages : images
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const selectedImage = bgImages.length > 0 ? bgImages[currentImageIndex % bgImages.length] : undefined

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? bgImages.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev === bgImages.length - 1 ? 0 : prev + 1))
  }

  useEffect(() => {
    if (bgImages.length < 2) return

    const imageTimer = window.setInterval(() => {
      setCurrentImageIndex((prev) => (prev === bgImages.length - 1 ? 0 : prev + 1))
    }, 5000)

    return () => window.clearInterval(imageTimer)
  }, [bgImages.length])

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)')
    const updateMatch = () => setIsMobile(query.matches)

    updateMatch()
    query.addEventListener('change', updateMatch)

    return () => query.removeEventListener('change', updateMatch)
  }, [])

  useEffect(() => {
    setCurrentImageIndex((current) => (bgImages.length > 0 ? current % bgImages.length : 0))
  }, [bgImages.length])

  if (!selectedImage) return null

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background Image with Overlay */}
      <Image
        src={selectedImage.src}
        alt={selectedImage.alt}
        fill
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
        className="object-cover"
        quality={85}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
          {isSinhala ? 'සාදරයෙන් පිළිගනිමු' : 'WELCOME TO'}{' '}
          <span className="text-red" style={{ color: 'red' , fontWeight: 'bold' }}>SIYOWIN</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-100 mb-8 drop-shadow-md">
          {isSinhala ? 'උසස් අධ්‍යාපනයෙන් දරුවන්ගේ අනාගතය දිරිමත් කරමින්' : 'Inspiring Minds Through Excellence in Education'}
        </p>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-lms-login'))}
          className="group relative overflow-hidden rounded-md bg-gradient-to-r from-[#D9232D] to-[#F47920] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-400/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-400/50 active:scale-95 cursor-pointer"
        >
          <span className="relative z-10 flex items-center gap-2">
            {isSinhala ? 'LMS පිවිසුම' : 'LMS Login'}
          </span>
          <span className="absolute inset-0 translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-0" />
        </button>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={handlePrevious}
        disabled={bgImages.length < 2}
        className="absolute left-4 top-1/2 z-20 transform -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-2 rounded-full transition duration-200"
        aria-label="Previous image"
      >
        <ChevronLeft size={32} />
      </button>

      <button
        onClick={handleNext}
        disabled={bgImages.length < 2}
        className="absolute right-4 top-1/2 z-20 transform -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white p-2 rounded-full transition duration-200"
        aria-label="Next image"
      >
        <ChevronRight size={32} />
      </button>

      {/* Bottom Wave Divider */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 overflow-hidden md:h-28">
        <svg
          className="hero-wave hero-wave-back absolute bottom-8 left-0 h-full w-[128%]"
          viewBox="0 0 1440 140"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="rgba(128, 0, 45, 0.34)"
            d="M0,78 C150,36 270,116 438,74 C612,30 726,42 890,84 C1066,130 1240,82 1440,42 L1440,140 L0,140 Z"
          />
        </svg>
        <svg
          className="hero-wave hero-wave-mid absolute bottom-5 left-0 h-full w-[124%]"
          viewBox="0 0 1440 140"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="rgba(182, 42, 90, 0.42)"
            d="M0,64 C184,114 314,18 494,62 C672,105 796,118 990,72 C1168,30 1276,44 1440,88 L1440,140 L0,140 Z"
          />
        </svg>
        <svg
          className="hero-wave hero-wave-near absolute bottom-2 left-0 h-full w-[120%]"
          viewBox="0 0 1440 140"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="rgba(226, 92, 128, 0.36)"
            d="M0,92 C172,46 286,58 432,88 C594,122 736,80 880,50 C1058,12 1230,88 1440,58 L1440,140 L0,140 Z"
          />
        </svg>
        <svg
          className="hero-wave hero-wave-white-soft absolute bottom-0 left-0 h-full w-[116%]"
          viewBox="0 0 1440 140"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="rgba(255, 255, 255, 0.86)"
            d="M0,86 C142,116 300,54 466,74 C638,96 754,128 946,84 C1132,42 1258,42 1440,74 L1440,140 L0,140 Z"
          />
        </svg>
        <svg
          className="hero-wave-white-front absolute bottom-[-1px] left-0 h-[55%] w-full"
          viewBox="0 0 1440 140"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="#ffffff"
            d="M0,96 C164,48 296,94 456,74 C640,50 728,20 904,66 C1080,112 1222,106 1440,56 L1440,140 L0,140 Z"
          />
        </svg>
      </div>
    </div>
  )
}
