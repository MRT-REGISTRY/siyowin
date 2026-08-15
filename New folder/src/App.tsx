import { useState, useEffect } from 'react'
import logoImg from '@/imports/logo.png'
import heroBg1 from '@/imports/bggrund__1_.jpg'
import heroBg3 from '@/imports/bggrund__3_.jpg'

// ── translations ──────────────────────────────────────────────────────────────

const translations = {
  en: {
    nav: [
      { label: 'Home', id: 'home' },
      { label: 'About', id: 'about' },
      { label: 'Teachers', id: 'teachers' },
      { label: 'Timetable', id: 'timetable' },
      { label: 'Contact', id: 'contact' },
    ],
    login: 'LMS Login',
    slides: [
      { title: 'Empowering Minds,\nShaping Futures', sub: "Sri Lanka's trusted Learning Management System for O/L & A/L students.", cta: 'Explore Courses' },
      { title: 'Expert Teachers,\nProven Results', sub: 'Learn from highly qualified educators dedicated to your success.', cta: 'Meet Our Teachers' },
      { title: 'Learn Anytime,\nAnywhere', sub: 'Access all your lessons and resources online from any device.', cta: 'Get Started Today' },
    ],
    aboutTitle: 'About Siyowin',
    aboutBody: "Siyowin is Sri Lanka's premier education institute, empowering O/L and A/L students with world-class teaching and a modern LMS platform. We combine expert educators with cutting-edge digital tools to help every student reach their full potential.",
    stats: [
      { n: '50+', l: 'Expert Teachers' },
      { n: '2,000+', l: 'Students Enrolled' },
      { n: '98%', l: 'Pass Rate' },
      { n: '10+', l: 'Years of Excellence' },
    ],
    olTitle: 'O/L Teachers',
    alTitle: 'A/L Teachers',
    contactTitle: 'Get In Touch',
    contactSub: "We'd love to hear from you. Reach out to us anytime.",
    phone: 'Phone',
    email: 'Email',
    timetableTitle: 'Class Timetable',
    timetableSub: 'Weekly schedule for O/L and A/L classes',
    footerTagline: 'Empowering students to achieve excellence.',
    footerRights: '© 2024 Siyowin Institute. All rights reserved.',
  },
  si: {
    nav: [
      { label: 'මුල් පිටුව', id: 'home' },
      { label: 'අප ගැන', id: 'about' },
      { label: 'ගුරුවරුන්', id: 'teachers' },
      { label: 'කාල සටහන', id: 'timetable' },
      { label: 'සම්බන්ධ', id: 'contact' },
    ],
    login: 'LMS පිවිසුම',
    slides: [
      { title: 'මනස සවිබල\nකරනු ලැබේ', sub: 'O/L සහ A/L සිසුන් සඳහා ශ්‍රී ලංකාවේ විශ්වාසනීය LMS.', cta: 'පාඨමාලා බලන්න' },
      { title: 'විශේෂඥ ගුරුවරුන්,\nඔප්පු කළ ප්‍රතිඵල', sub: 'ඔබේ සාර්ථකත්වය සඳහා කැපවූ ගුරුවරුන්ගෙන් ඉගෙනගන්න.', cta: 'ගුරුවරුන් හමුවන්න' },
      { title: 'ඕනෑම වේලාවක\nඉගෙනගන්න', sub: 'ඕනෑම උපකරණයකින් ඔබේ සියලු පාඩම් ලබා ගන්න.', cta: 'ආරම්භ කරන්න' },
    ],
    aboutTitle: 'සියොවින් ගැන',
    aboutBody: 'සියොවින් යනු O/L සහ A/L සිසුන් සඳහා ලෝකයේ ප්‍රථම ශ්‍රේණියේ ඉගැන්වීම සහ නවීන LMS වේදිකාවක් ලබා දෙන ශ්‍රී ලංකාවේ ප්‍රමුඛ අධ්‍යාපන ආයතනයයි.',
    stats: [
      { n: '50+', l: 'විශේෂඥ ගුරුවරුන්' },
      { n: '2,000+', l: 'ලියාපදිංචි සිසුන්' },
      { n: '98%', l: 'සාර්ථක අනුපාතය' },
      { n: '10+', l: 'ශ්‍රේෂ්ඨ වර්ෂ' },
    ],
    olTitle: 'O/L ගුරුවරුන්',
    alTitle: 'A/L ගුරුවරුන්',
    contactTitle: 'අප හා සම්බන්ධ වන්න',
    contactSub: 'ඕනෑම විටෙක අප හා සම්බන්ධ වීමට ඔබව සාදරයෙන් පිළිගනිමු.',
    phone: 'දුරකථනය',
    email: 'විද්‍යුත් තැපෑල',
    timetableTitle: 'පන්ති කාල සටහන',
    timetableSub: 'O/L සහ A/L පන්ති සඳහා සතිපතා කාලසටහන',
    footerTagline: 'සිසුන් ශ්‍රේෂ්ඨත්වය කරා සවිබල ගන්වනු.',
    footerRights: '© 2024 සියොවින් ආයතනය. සියලු හිමිකම් ඇවිරිණි.',
  },
}

// ── data ──────────────────────────────────────────────────────────────────────

const heroImages = [heroBg1, heroBg3]

const olTeachers = [
  { name: 'Mr. Kamal Perera', subject: 'Mathematics', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&auto=format' },
  { name: 'Ms. Nimali Silva', subject: 'Science', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&auto=format' },
  { name: 'Mr. Ruwan Fernando', subject: 'English', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&auto=format' },
  { name: 'Ms. Chamari Dias', subject: 'History', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&auto=format' },
  { name: 'Mr. Isuru Bandara', subject: 'ICT', photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop&auto=format' },
  { name: 'Ms. Dilini Mendis', subject: 'Sinhala Language', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&auto=format' },
]

const alTeachers = [
  { name: 'Dr. Priya Wickramasinghe', subject: 'Physics', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&auto=format' },
  { name: 'Mr. Asanka Jayasuriya', subject: 'Chemistry', photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop&auto=format' },
  { name: 'Ms. Dilani Rajapaksa', subject: 'Biology', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&auto=format' },
  { name: 'Mr. Nuwan Herath', subject: 'Combined Maths', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop&auto=format' },
  { name: 'Ms. Sachini Perera', subject: 'Business Studies', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&auto=format' },
  { name: 'Mr. Dinesh Kumar', subject: 'Economics', photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=300&h=300&fit=crop&auto=format' },
]

const timetable = [
  { day: 'Monday', olClass: 'Mathematics 8:00 – 10:00 AM', alClass: 'Physics 2:00 – 4:00 PM' },
  { day: 'Tuesday', olClass: 'English 8:00 – 10:00 AM', alClass: 'Chemistry 2:00 – 4:00 PM' },
  { day: 'Wednesday', olClass: 'Science 8:00 – 10:00 AM', alClass: 'Biology 2:00 – 4:00 PM' },
  { day: 'Thursday', olClass: 'History 8:00 – 10:00 AM', alClass: 'Combined Maths 2:00 – 4:00 PM' },
  { day: 'Friday', olClass: 'ICT 8:00 – 10:00 AM', alClass: 'Business Studies 2:00 – 4:00 PM' },
  { day: 'Saturday', olClass: 'Sinhala 8:00 – 11:00 AM', alClass: 'Economics 9:00 AM – 12:00 PM' },
]

// ── sub-components ────────────────────────────────────────────────────────────

function NavBar({ lang, setLang, t }: { lang: 'en' | 'si'; setLang: (l: 'en' | 'si') => void; t: typeof translations.en }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-400"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        boxShadow: scrolled ? '0 2px 24px rgba(20,54,125,0.10)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between">
        {/* Logo */}
        <button className="flex items-center" onClick={() => scrollTo('home')}>
          <img src={logoImg} alt="Siyowin Logo" className="h-16 w-16 object-contain" />
        </button>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-7">
          {t.nav.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: scrolled ? '#374151' : 'rgba(255,255,255,0.9)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#C0182E')}
              onMouseLeave={e => (e.currentTarget.style.color = scrolled ? '#374151' : 'rgba(255,255,255,0.9)')}
            >
              {item.label}
            </button>
          ))}

          <button
            onClick={() => setLang(lang === 'en' ? 'si' : 'en')}
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
            {lang === 'en' ? 'සිං' : 'EN'}
          </button>

          <button
            className="text-sm font-semibold px-5 py-2 rounded-lg text-white transition-all duration-200"
            style={{ background: '#C0182E' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#9B0F22')}
            onMouseLeave={e => (e.currentTarget.style.background = '#C0182E')}
          >
            {t.login}
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
          {t.nav.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="text-gray-700 text-sm font-medium text-left hover:text-brand-red transition-colors"
            >
              {item.label}
            </button>
          ))}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setLang(lang === 'en' ? 'si' : 'en')}
              className="text-sm font-semibold px-4 py-1.5 rounded-full border-2 border-brand-blue text-brand-blue"
            >
              {lang === 'en' ? 'සිං' : 'EN'}
            </button>
            <button className="bg-brand-red text-white text-sm font-semibold px-5 py-2 rounded-lg">
              {t.login}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

function HeroSection({ t }: { t: typeof translations.en }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setActive((a) => (a + 1) % heroImages.length), 5500)
    return () => clearInterval(timer)
  }, [])

  const slide = t.slides[active]

  return (
    <section id="home" className="relative w-full h-screen min-h-[600px] overflow-hidden">
      {/* Slides */}
      {heroImages.map((img, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === active ? 1 : 0 }}
        >
          <img src={img} alt="" className="w-full h-full object-cover" />
        </div>
      ))}

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(120deg, rgba(20,54,125,0.82) 0%, rgba(192,24,46,0.55) 60%, rgba(0,0,0,0.45) 100%)' }}
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-16 max-w-7xl mx-auto">
        <div className="max-w-2xl">
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
            className="inline-flex items-center gap-2 font-semibold px-7 py-3.5 rounded-lg text-white transition-all duration-200 text-sm sm:text-base"
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
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2.5">
        {heroImages.map((_, i) => (
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

function AboutSection({ t }: { t: typeof translations.en }) {
  return (
    <section id="about" style={{ background: '#F5F7FC' }} className="py-20 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div
              className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded mb-4"
              style={{ background: 'rgba(192,24,46,0.1)', color: '#C0182E' }}
            >
              Who We Are
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-5" style={{ color: '#14367D' }}>
              {t.aboutTitle}
            </h2>
            <p className="text-gray-600 leading-relaxed text-base mb-6">{t.aboutBody}</p>
            <button
              className="font-semibold text-sm px-6 py-2.5 rounded-lg text-white transition-all"
              style={{ background: '#14367D' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1E4FAB')}
              onMouseLeave={e => (e.currentTarget.style.background = '#14367D')}
            >
              Learn More
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {t.stats.map((s) => (
              <div
                key={s.l}
                className="rounded-xl p-6 text-center"
                style={{ background: '#fff', border: '1px solid #e5e9f5', boxShadow: '0 2px 12px rgba(20,54,125,0.06)' }}
              >
                <div className="font-display text-4xl font-bold mb-1" style={{ color: '#C0182E' }}>
                  {s.n}
                </div>
                <div className="text-sm text-gray-500 font-medium">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TeacherCard({ teacher, accent }: { teacher: { name: string; subject: string; photo: string }; accent: string }) {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden transition-all duration-300 group cursor-pointer"
      style={{ border: '1px solid #e8ecf4', boxShadow: '0 2px 16px rgba(20,54,125,0.07)' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(20,54,125,0.15)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 16px rgba(20,54,125,0.07)')}
    >
      <div className="p-6 flex flex-col items-center text-center">
        <div
          className="w-24 h-24 rounded-full overflow-hidden mb-4 ring-4 ring-offset-2 transition-all duration-300"
          style={{ ringColor: accent }}
        >
          <img
            src={teacher.photo}
            alt={teacher.name}
            className="w-full h-full object-cover"
            onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=14367D&color=fff&size=200` }}
          />
        </div>
        <h3 className="font-semibold text-gray-800 text-base mb-2 leading-snug">{teacher.name}</h3>
        <span
          className="inline-block text-xs font-bold px-3 py-1 rounded-full"
          style={{ background: `${accent}18`, color: accent }}
        >
          {teacher.subject}
        </span>
      </div>
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }}
      />
    </div>
  )
}

function TeacherCarousel({ teachers, accent }: { teachers: typeof olTeachers; accent: string }) {
  const perPage = 3
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(teachers.length / perPage)
  const visible = teachers.slice(page * perPage, (page + 1) * perPage)

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 min-h-[260px]">
        {visible.map((teacher) => (
          <TeacherCard key={teacher.name} teacher={teacher} accent={accent} />
        ))}
      </div>
      <div className="flex justify-center items-center gap-3 mt-8">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
          style={{ background: '#fff', border: `2px solid ${accent}`, color: accent }}
          onMouseEnter={e => { if (page > 0) { e.currentTarget.style.background = accent; e.currentTarget.style.color = '#fff' } }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = accent }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            className="w-2.5 h-2.5 rounded-full transition-all duration-300"
            style={{ background: i === page ? accent : '#D1D5DB', transform: i === page ? 'scale(1.3)' : 'scale(1)' }}
          />
        ))}
        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page === totalPages - 1}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30"
          style={{ background: '#fff', border: `2px solid ${accent}`, color: accent }}
          onMouseEnter={e => { if (page < totalPages - 1) { e.currentTarget.style.background = accent; e.currentTarget.style.color = '#fff' } }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = accent }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function TeachersSection({ t }: { t: typeof translations.en }) {
  const [tab, setTab] = useState<'ol' | 'al'>('ol')

  return (
    <section id="teachers" className="py-20 px-5 sm:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded mb-4"
            style={{ background: 'rgba(20,54,125,0.08)', color: '#14367D' }}
          >
            Our Educators
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3" style={{ color: '#14367D' }}>
            Meet Our Teachers
          </h2>
          <p className="text-gray-500 text-base max-w-lg mx-auto">
            Dedicated professionals committed to your academic excellence.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex justify-center mb-10">
          <div
            className="flex rounded-xl p-1 gap-1"
            style={{ background: '#EEF2FA' }}
          >
            {(['ol', 'al'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                style={
                  tab === key
                    ? { background: key === 'ol' ? '#C0182E' : '#14367D', color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                    : { color: '#6B7280' }
                }
              >
                {key === 'ol' ? t.olTitle : t.alTitle}
              </button>
            ))}
          </div>
        </div>

        {/* Section heading */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-1 h-8 rounded-full"
            style={{ background: tab === 'ol' ? '#C0182E' : '#14367D' }}
          />
          <h3
            className="font-display text-2xl font-bold"
            style={{ color: tab === 'ol' ? '#C0182E' : '#14367D' }}
          >
            {tab === 'ol' ? t.olTitle : t.alTitle}
          </h3>
        </div>

        {tab === 'ol' ? (
          <TeacherCarousel teachers={olTeachers} accent="#C0182E" />
        ) : (
          <TeacherCarousel teachers={alTeachers} accent="#14367D" />
        )}
      </div>
    </section>
  )
}

function TimetableSection({ t }: { t: typeof translations.en }) {
  return (
    <section id="timetable" style={{ background: '#F5F7FC' }} className="py-20 px-5 sm:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded mb-4"
            style={{ background: 'rgba(192,24,46,0.1)', color: '#C0182E' }}
          >
            Schedule
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#14367D' }}>
            {t.timetableTitle}
          </h2>
          <p className="text-gray-500">{t.timetableSub}</p>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E2E8F5', boxShadow: '0 2px 20px rgba(20,54,125,0.08)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#14367D' }}>
                <th className="text-left text-white text-sm font-semibold px-5 py-4">Day</th>
                <th className="text-left text-white text-sm font-semibold px-5 py-4">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                    O/L Class
                  </span>
                </th>
                <th className="text-left text-white text-sm font-semibold px-5 py-4">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-300 inline-block" />
                    A/L Class
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {timetable.map((row, i) => (
                <tr
                  key={row.day}
                  className="transition-colors"
                  style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFE' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#EEF2FA')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#F8FAFE')}
                >
                  <td className="px-5 py-3.5 font-semibold text-sm" style={{ color: '#14367D' }}>{row.day}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{row.olClass}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{row.alClass}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function ContactSection({ t }: { t: typeof translations.en }) {
  return (
    <section id="contact" className="py-20 px-5 sm:px-8" style={{ background: '#14367D' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <div
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded mb-4"
            style={{ background: 'rgba(192,24,46,0.3)', color: '#FCA5A5' }}
          >
            Contact Us
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3">
            {t.contactTitle}
          </h2>
          <p className="text-white/60 text-base">{t.contactSub}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Phone */}
          <div
            className="flex items-center gap-5 p-6 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(192,24,46,0.3)' }}
            >
              <svg className="w-6 h-6 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1">{t.phone}</div>
              <a
                href="tel:0705281466"
                className="text-white font-semibold text-xl transition-colors hover:text-red-300"
              >
                0705 281 466
              </a>
            </div>
          </div>

          {/* Email */}
          <div
            className="flex items-center gap-5 p-6 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(192,24,46,0.3)' }}
            >
              <svg className="w-6 h-6 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1">{t.email}</div>
              <a
                href="mailto:info@siyowin.lk"
                className="text-white font-semibold text-xl transition-colors hover:text-red-300"
              >
                info@siyowin.lk
              </a>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div
          className="rounded-2xl p-8"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          <h3 className="text-white font-semibold text-lg mb-6">Send us a message</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Your Name"
              className="px-4 py-3 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-red-400 transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', '::placeholder': { color: 'rgba(255,255,255,0.4)' } } as React.CSSProperties}
            />
            <input
              type="email"
              placeholder="Your Email"
              className="px-4 py-3 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-red-400 transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
            />
          </div>
          <textarea
            rows={4}
            placeholder="Your Message"
            className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-red-400 transition-all resize-none mb-4"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
          />
          <button
            className="font-semibold text-sm px-6 py-3 rounded-lg text-white transition-all"
            style={{ background: '#C0182E' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#9B0F22')}
            onMouseLeave={e => (e.currentTarget.style.background = '#C0182E')}
          >
            Send Message
          </button>
        </div>
      </div>
    </section>
  )
}

function Footer({ t }: { t: typeof translations.en }) {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <footer className="py-10 px-5 sm:px-8" style={{ background: '#0D2558' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="Siyowin" className="h-14 w-14 object-contain" />
            <div className="text-white/40 text-xs max-w-[180px]">{t.footerTagline}</div>
          </div>
          <div className="flex items-center gap-6">
            {t.nav.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-white/50 hover:text-white text-xs transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-white/30 text-xs">{t.footerRights}</p>
        </div>
      </div>
    </footer>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [lang, setLang] = useState<'en' | 'si'>('en')
  const t = translations[lang]

  return (
    <div className="min-h-screen">
      <NavBar lang={lang} setLang={setLang} t={t} />
      <HeroSection t={t} />
      <AboutSection t={t} />
      <TeachersSection t={t} />
      <TimetableSection t={t} />
      <ContactSection t={t} />
      <Footer t={t} />
    </div>
  )
}
