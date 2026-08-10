import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import AcademyInfo from '@/components/AcademyInfo'
import LecturerCarousel from '@/components/LecturerCarousel'
import TimetablePreview from '@/components/TimetablePreview'
import ContactSection from '@/components/ContactSection'
import Footer from '@/components/Footer'
import { getSiteContent } from '@/utils/siteContent'

export default async function Home() {
  const content = await getSiteContent()

  return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <HeroSection images={content.heroImages} mobileImages={content.mobileHeroImages} />
        <AcademyInfo features={content.aboutFeatures} stats={content.aboutStats} />
        <div id="teachers" className="scroll-mt-20">
          {content.lecturerSections.map((section, index) => (
            <LecturerCarousel
              key={section.id}
              section={section}
              showTopWave={index === 0}
              showBottomWave={false}
            />
          ))}
        </div>
        <TimetablePreview />
        <ContactSection />
        <Footer />
      </main>
  )
}
