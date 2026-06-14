'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useLanguage } from './LanguageProvider'

const quickLinks = [
  { label: 'Home', sinhalaLabel: 'මුල් පිටුව', href: '/' },
  { label: 'About Us', sinhalaLabel: 'අප ගැන', href: '/#about' },
  { label: 'Teachers', sinhalaLabel: 'ගුරුවරු', href: '/#teachers' },
  { label: 'Timetable', sinhalaLabel: 'කාලසටහන්', href: '/#timetable' },
  { label: 'Gallery', sinhalaLabel: 'ගැලරිය', href: '/#gallery' },
  { label: 'News', sinhalaLabel: 'පුවත්', href: '/#news' },
  { label: 'FAQ', sinhalaLabel: 'ප්‍රශ්න', href: '/#faq' },
  { label: 'Contact', sinhalaLabel: 'සම්බන්ධ වන්න', href: '/#contact' },
]

const locations = [
  { name: 'Branch 01', address: 'Palladeniya Road, Kegalle' },
  { name: 'Branch 02', address: 'Behind Commercial Bank, Kegalle' },
]

const socials = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61554967645663',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v7.037C18.343 21.129 22 16.99 22 12z" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/94705281466',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.941-1.424A9.953 9.953 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.95 7.95 0 0 1-4.076-1.117l-.292-.174-3.032.873.851-3.107-.19-.309A7.965 7.965 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
      </svg>
    ),
  },
]

export default function Footer() {
  const { isSinhala } = useLanguage()

  return (
    <footer className="relative bg-[#0d1117] text-white">
      {/* Top accent bar — brand gradient */}
      <div
        className="h-1 w-full"
        style={{ background: 'linear-gradient(to right, #D9232D, #F47920, #1B3A8C)' }}
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 lg:px-8">

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">

          {/* Brand column */}
          <div className="flex flex-col items-center text-center sm:col-span-2 sm:items-start sm:text-left lg:col-span-1">
            {/* Logo */}
            <div className="mb-5 inline-block rounded-xl bg-white p-3 shadow-lg">
              <Image
                src="/photos/logo.png"
                alt="Siyowin Logo"
                width={160}
                height={60}
                className="h-12 w-auto object-contain"
              />
            </div>
            <p className="mb-6 text-sm leading-relaxed text-gray-400">
              {isSinhala
                ? 'විශේෂඥ ගුරු මණ්ඩලය, සැලසුම්ගත ඉගෙනුම් පහසුකම් සහ ගුණාත්මක අධ්‍යාපනය තුළින් සිසුන්ගේ අධ්‍යාපනික අරමුණු සාර්ථක කර ගැනීමට සහාය වෙමු.'
                : 'Empowering students to achieve their academic goals through excellence in education, experienced faculty, and modern learning facilities. Branches: Palladeniya Road, Kegalle and Behind Commercial Bank, Kegalle.'}
            </p>

            <div className="flex justify-center gap-3 sm:justify-start">
              {socials.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-gray-400 transition-all duration-300 hover:scale-110 hover:bg-[#D9232D] hover:text-white"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                >
                  {s.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="hidden sm:flex flex-col items-center text-center sm:items-start sm:text-left">
            <h4 className="mb-5 text-sm font-bold uppercase tracking-widest text-white">
              {isSinhala ? 'ඉක්මන් සබැඳි' : 'Quick Links'}
            </h4>
            <ul className="flex flex-col items-center space-y-2.5 sm:items-start">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group flex items-center justify-center gap-2 text-sm text-gray-400 transition-colors duration-200 hover:text-white sm:justify-start"
                  >
                    <span
                      className="h-1.5 w-1.5 flex-shrink-0 rounded-full transition-colors duration-200 group-hover:bg-[#F47920]"
                      style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                    />
                    {isSinhala ? link.sinhalaLabel : link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Locations + Contact */}
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <div className="w-full">
              <h4 className="mb-5 text-sm font-bold uppercase tracking-widest text-white">
                {isSinhala ? 'අපගේ ස්ථාන' : 'Find Us'}
              </h4>
              <ul className="flex flex-col items-center space-y-4 sm:items-start">
                {locations.map((loc) => (
                  <li key={loc.name} className="flex flex-col items-center gap-2 sm:flex-row sm:items-start sm:gap-3">
                    <span className="mt-0.5 flex-shrink-0">
                      <svg className="h-4 w-4 text-[#F47920]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-200">{loc.name}</p>
                      <p className="text-xs text-gray-500">{loc.address}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact info */}
            <div className="mt-5 flex flex-col items-center space-y-2 sm:items-start">
              <a href="tel:+94705281466" className="flex items-center justify-center gap-2 text-sm text-gray-400 transition-colors duration-200 hover:text-white sm:justify-start">
                <svg className="h-4 w-4 flex-shrink-0 text-[#F47920]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                070 528 1466
              </a>
              <a href="mailto:info@siyowin.lk" className="flex items-center justify-center gap-2 text-sm text-gray-400 transition-colors duration-200 hover:text-white sm:justify-start">
                <svg className="h-4 w-4 flex-shrink-0 text-[#F47920]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                info@siyowin.lk
              </a>
            </div>
          </div>
        </div>

        <div className="pointer-events-none hidden lg:flex lg:flex-col lg:gap-2 lg:absolute lg:top-12 lg:right-8">
          <div className="flex h-24 w-24 flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">B1</p>
            <iframe
              title="Palladeniya Road, Kegalle"
              src="https://www.google.com/maps?q=Palladeniya%20Road%2C%20Kegalle&output=embed"
              className="h-full w-full rounded-md"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="flex h-24 w-24 flex-col items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">B2</p>
            <iframe
              title="Behind Commercial Bank, Kegalle"
              src="https://www.google.com/maps?q=Behind%20Commercial%20Bank%2C%20Kegalle&output=embed"
              className="h-full w-full rounded-md"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        {/* ── Divider ── */}
        <div
          className="my-8 h-px w-full"
          style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)' }}
        />

        {/* ── Bottom bar ── */}
        <div className="flex flex-col items-center justify-between gap-4 text-center text-xs text-gray-500 sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} Siyowin Higher Education Institute.
            <br className="sm:hidden" /> All rights reserved. Developed by{' '}
            <a
              href="https://skey7tech.mrt.lk"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-gray-300 transition-colors duration-200 hover:text-white"
            >
              Skey7Tech
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  )
}
