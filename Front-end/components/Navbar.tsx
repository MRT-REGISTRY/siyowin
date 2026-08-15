'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import LmsLoginModal from './LmsLoginModal'
import { useLanguage } from './LanguageProvider'

const navLinks = [
  { label: 'Home', sinhalaLabel: 'මුල් පිටුව', href: '/' },
  { label: 'About', sinhalaLabel: 'අප ගැන', href: '/#about' },
  { label: 'Teachers', sinhalaLabel: 'ගුරුවරුන්', href: '/teachers' },
  { label: 'Timetable', sinhalaLabel: 'කාල සටහන', href: '/#timetable' },
  { label: 'Contact', sinhalaLabel: 'සම්බන්ධ වන්න', href: '/#contact' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  
  const { isSinhala, toggleLanguage } = useLanguage()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = () => setShowLogin(true)
    window.addEventListener('open-lms-login', handler)
    return () => window.removeEventListener('open-lms-login', handler)
  }, [])

  const closeMenu = () => setMobileOpen(false)

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          boxShadow: scrolled ? '0 2px 24px rgba(20,54,125,0.10)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center" onClick={closeMenu}>
            <img src="/photos/logo.png" alt="Siyowin Logo" className="h-16 md:h-20 w-auto object-contain py-1" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium transition-colors duration-200"
                style={{ color: scrolled ? '#374151' : 'rgba(255,255,255,0.9)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#C0182E')}
                onMouseLeave={e => (e.currentTarget.style.color = scrolled ? '#374151' : 'rgba(255,255,255,0.9)')}
              >
                {isSinhala ? link.sinhalaLabel : link.label}
              </Link>
            ))}

            <button
              onClick={toggleLanguage}
              className="text-sm font-semibold px-4 py-1.5 rounded-full border-2 transition-all duration-200"
              style={{
                borderColor: scrolled ? '#14367D' : 'rgba(255,255,255,0.6)',
                color: scrolled ? '#14367D' : '#fff',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = '#14367D'
                el.style.color = '#fff'
                el.style.borderColor = '#14367D'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = 'transparent'
                el.style.color = scrolled ? '#14367D' : '#fff'
                el.style.borderColor = scrolled ? '#14367D' : 'rgba(255,255,255,0.6)'
              }}
            >
              {isSinhala ? 'English' : 'සිංහල'}
            </button>

            <button
              onClick={() => setShowLogin(true)}
              className="text-sm font-semibold px-5 py-2 rounded-lg text-white transition-all duration-200"
              style={{ background: '#C0182E' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#9B0F22')}
              onMouseLeave={e => (e.currentTarget.style.background = '#C0182E')}
            >
              {isSinhala ? 'LMS පිවිසුම' : 'LMS Login'}
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button className="lg:hidden p-2" onClick={() => setMobileOpen((o) => !o)}>
            <div className="flex flex-col gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="block w-6 h-0.5 transition-all"
                  style={{ background: scrolled ? '#14367D' : '#fff' }}
                />
              ))}
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className="lg:hidden overflow-hidden transition-all duration-300"
          style={{ maxHeight: mobileOpen ? '400px' : '0', background: 'rgba(255,255,255,0.98)' }}
        >
          <div className="px-5 py-4 flex flex-col gap-4 border-t border-gray-100">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={closeMenu}
                className="text-gray-700 text-sm font-medium text-left hover:text-[#C0182E] transition-colors w-full block"
              >
                {isSinhala ? link.sinhalaLabel : link.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  toggleLanguage()
                  closeMenu()
                }}
                className="text-sm font-semibold px-4 py-1.5 rounded-full border-2 border-[#14367D] text-[#14367D]"
              >
                {isSinhala ? 'English' : 'සිංහල'}
              </button>
              <button
                onClick={() => {
                  setShowLogin(true)
                  closeMenu()
                }}
                className="bg-[#C0182E] text-white text-sm font-semibold px-5 py-2 rounded-lg"
              >
                {isSinhala ? 'LMS පිවිසුම' : 'LMS Login'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      <LmsLoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  )
}
