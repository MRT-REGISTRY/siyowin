'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { SiteHeroImage } from '@/types/siteContent'
import { useLanguage } from './LanguageProvider'

const slidesData = {
  en: [
    { title: 'Learn Anytime,\nAnywhere', sub: 'Access all your lessons and resources online from any device.', cta: 'Get Started Today' },
    { title: 'Learn Anytime,\nAnywhere', sub: 'Access all your lessons and resources online from any device.', cta: 'Get Started Today' },
  ],
  si: [
    { title: 'ඕනෑම වේලාවක\nඉගෙනගන්න', sub: 'ඕනෑම උපකරණයකින් ඔබේ සියලු පාඩම් ලබා ගන්න.', cta: 'ආරම්භ කරන්න' },
    { title: 'ඕනෑම වේලාවක\nඉගෙනගන්න', sub: 'ඕනෑම උපකරණයකින් ඔබේ සියලු පාඩම් ලබා ගන්න.', cta: 'ආරම්භ කරන්න' },
  ]
}

export default function HeroSection({
  images,
  mobileImages = [],
}: {
  images?: SiteHeroImage[]
  mobileImages?: SiteHeroImage[]
}) {
  const [active, setActive] = useState(0)
  const { isSinhala } = useLanguage()

  const heroImages = ['/photos/bggrund (1).jpg', '/photos/bggrund (3).jpg']
  
  const lang = isSinhala ? 'si' : 'en'
  const slides = slidesData[lang]

  useEffect(() => {
    const timer = setInterval(() => setActive((a) => (a + 1) % slides.length), 5500)
    return () => clearInterval(timer)
  }, [slides.length])

  const slide = slides[active]

  const handleCtaClick = () => {
    if (active === 1) {
      document.getElementById('teachers')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.dispatchEvent(new CustomEvent('open-lms-login'))
    }
  }

  return (
    <section id="home" className="relative w-full h-screen min-h-[600px] overflow-hidden">
      {/* Slides */}
      {slides.map((_, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === active ? 1 : 0 }}
        >
          <Image 
            src={heroImages[i % heroImages.length]} 
            alt="Hero Background" 
            fill 
            priority={i === 0} 
            className="w-full h-full object-cover" 
          />
        </div>
      ))}

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(120deg, rgba(20,54,125,0.82) 0%, rgba(192,24,46,0.55) 60%, rgba(0,0,0,0.45) 100%)' }}
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-16 max-w-7xl mx-auto">
        <div className="max-w-2xl mt-16 md:mt-0">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-white mb-6"
            style={{ background: 'rgba(192,24,46,0.7)', border: '1px solid rgba(255,255,255,0.25)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Siyowin Institute
          </div>
          <h1
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5 transition-all duration-500 whitespace-pre-line"
            key={active}
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
          >
            {slide.title}
          </h1>
          <p className="text-white/80 text-base sm:text-lg mb-8 max-w-xl leading-relaxed">
            {slide.sub}
          </p>
          <button
            onClick={handleCtaClick}
            className="inline-flex items-center gap-2 font-semibold px-7 py-3.5 rounded-lg text-white transition-all duration-200 text-sm sm:text-base cursor-pointer"
            style={{ background: '#C0182E', boxShadow: '0 4px 20px rgba(192,24,46,0.4)' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#9B0F22')}
            onMouseLeave={e => (e.currentTarget.style.background = '#C0182E')}
          >
            {slide.cta}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === active ? '28px' : '8px',
              height: '8px',
              background: i === active ? '#C0182E' : 'rgba(255,255,255,0.5)',
            }}
          />
        ))}
      </div>

    </section>
  )
}
