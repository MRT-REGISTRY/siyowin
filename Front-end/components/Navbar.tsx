'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import LmsLoginModal from './LmsLoginModal'
import { useLanguage } from './LanguageProvider'

const navLinks = [
  { label: 'Home', sinhalaLabel: 'මුල් පිටුව', href: '/' },
  { label: 'About', sinhalaLabel: 'අප ගැන', href: '/#about' },
  { label: 'Teachers', sinhalaLabel: 'ගුරුවරු', href: '/teachers' },
  { label: 'Timetable', sinhalaLabel: 'කාලසටහන්', href: '/#timetable' },
  { label: 'Contact', sinhalaLabel: 'සම්බන්ධ වන්න', href: '/#contact' },
]

export default function Navbar() {
  const [isOpen,    setIsOpen]    = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const { isSinhala, toggleLanguage } = useLanguage()

  // Listen for the Hero LMS button custom event
  useEffect(() => {
    const handler = () => setShowLogin(true)
    window.addEventListener('open-lms-login', handler)
    return () => window.removeEventListener('open-lms-login', handler)
  }, [])

  return (
    <>
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/20 bg-white/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">

            {/* Logo */}
            <div className="flex-shrink-0">
              <img src="/photos/logo.png" alt="Siyowin Logo" className="h-16 w-auto" />
            </div>

            {/* ── Desktop Menu ── */}
            <div className="hidden items-center gap-0.5 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="group relative px-3 py-1.5 text-sm font-semibold text-blue-700 transition-colors duration-200 hover:text-blue-900"
                >
                  {isSinhala ? link.sinhalaLabel : link.label}
                  {/* Animated underline */}
                  <span className="absolute bottom-0 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-blue-500 transition-all duration-300 ease-out group-hover:w-4/5" />
                </Link>
              ))}

              <button
                type="button"
                onClick={toggleLanguage}
                className="ml-2 rounded-full border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
              >
                {isSinhala ? 'English' : 'සිංහල'}
              </button>

              {/* LMS Button */}
              <button
                onClick={() => setShowLogin(true)}
                className="ml-4 rounded-full border-2 border-red-700 px-5 py-1.5 text-sm font-bold text-red-700 transition-all duration-300 hover:bg-red-700 hover:text-white hover:shadow-md active:scale-95"
              >
                {isSinhala ? 'LMS පිවිසුම' : 'LMS LOGIN'}
              </button>
            </div>

            {/* ── Hamburger (mobile) ── */}
            <button
              onClick={() => setIsOpen((p) => !p)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              className="relative flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-lg p-1.5 text-blue-700 transition-colors duration-200 hover:bg-blue-50 md:hidden"
            >
              <span
                className="block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.25,1,0.35,1)]"
                style={{ transform: isOpen ? 'translateY(7px) rotate(45deg)' : 'none' }}
              />
              <span
                className="block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.25,1,0.35,1)]"
                style={{ opacity: isOpen ? 0 : 1, transform: isOpen ? 'scaleX(0)' : 'none' }}
              />
              <span
                className="block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.25,1,0.35,1)]"
                style={{ transform: isOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }}
              />
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <div
          className="overflow-hidden md:hidden"
          style={{
            maxHeight: isOpen ? '600px' : '0px',
            transition: 'max-height 420ms cubic-bezier(0.25, 1, 0.35, 1)',
          }}
        >
          <div className="border-t border-blue-100 bg-white/95 px-4 pb-6 pt-4 backdrop-blur-md">
            <div className="flex flex-col items-center gap-1">
              {navLinks.map((link, i) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="group relative w-full px-4 py-2.5 text-center text-base font-semibold text-blue-700 transition-colors duration-200 hover:text-blue-900"
                  style={{
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? 'translateY(0)' : 'translateY(-8px)',
                    transition: `opacity 350ms ease ${i * 40}ms, transform 350ms ease ${i * 40}ms, color 200ms`,
                  }}
                >
                  {isSinhala ? link.sinhalaLabel : link.label}
                  <span className="absolute bottom-1.5 left-1/2 h-[2px] w-0 -translate-x-1/2 rounded-full bg-blue-400 transition-all duration-300 group-hover:w-1/3" />
                </Link>
              ))}

              <button
                type="button"
                onClick={() => { setIsOpen(false); toggleLanguage() }}
                className="mt-3 w-44 rounded-full border border-blue-200 py-2 text-sm font-bold text-blue-700 transition-all duration-300 hover:bg-blue-50 active:scale-95"
                style={{
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? 'translateY(0)' : 'translateY(-8px)',
                  transition: `opacity 350ms ease ${navLinks.length * 40}ms, transform 350ms ease ${navLinks.length * 40}ms`,
                }}
              >
                {isSinhala ? 'English' : 'සිංහල'}
              </button>

              {/* LMS Login — mobile */}
              <button
                onClick={() => { setIsOpen(false); setShowLogin(true) }}
                className="mt-3 w-44 rounded-full border-2 border-red-700 py-2 text-sm font-bold text-red-700 transition-all duration-300 hover:bg-red-700 hover:text-white active:scale-95"
                style={{
                  opacity: isOpen ? 1 : 0,
                  transform: isOpen ? 'translateY(0)' : 'translateY(-8px)',
                  transition: `opacity 350ms ease ${navLinks.length * 40}ms, transform 350ms ease ${navLinks.length * 40}ms`,
                }}
              >
                {isSinhala ? 'LMS පිවිසුම' : 'LMS LOGIN'}
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
