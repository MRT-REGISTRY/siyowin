import { createClient } from '@/utils/supabase/server';
import { SiteContent, SiteLecturerSection } from '@/types/siteContent';
import { lecturerSections } from '@/data/teachers';

const localHeroImages = [
  { id: 'hero-1', src: '/photos/bggrund (1).jpg', alt: 'Siyowin academy classroom event', width: 2048, height: 2048 },
  { id: 'hero-2', src: '/photos/bggrund (3).jpg', alt: 'Siyowin higher education institute', width: 2048, height: 1542 },
];

const localMobileHeroImages = [
  { id: 'mobile-hero-1', src: '/photos/bggrund (1).jpg', alt: 'Siyowin academy classroom event mobile view', width: 2048, height: 2048 },
  { id: 'mobile-hero-2', src: '/photos/mobile/bggrund (3).jpg', alt: 'Siyowin higher education institute mobile view', width: 2048, height: 1542 },
];

const localGalleryImages = [
  {
    id: 1,
    src: '/gallery/475317163_122196069374165588_4690794810965554752_n.jpg',
    alt: 'Siyowin Academy gallery moment',
    category: 'indoor' as const,
  },
  {
    id: 2,
    src: '/gallery/475337732_122196069272165588_1143609790566936612_n.jpg',
    alt: 'Siyowin Academy student event',
    category: 'outdoor' as const,
  },
  {
    id: 3,
    src: '/gallery/476208571_122197350860165588_2265152398739208658_n.jpg',
    alt: 'Siyowin Academy classroom moment',
    category: 'indoor' as const,
  },
  {
    id: 4,
    src: '/gallery/602364342_122249120564165588_5955145948022491244_n.jpg',
    alt: 'Siyowin Academy campus gathering',
    category: 'outdoor' as const,
  },
];

const fallbackSiteContent: SiteContent = {
  heroImages: localHeroImages,
  mobileHeroImages: localMobileHeroImages,
  aboutFeatures: [
    { id: 'feature-1', text: 'Classes from Grade 1 to 13, including O/L and A/L' },
    { id: 'feature-2', text: 'Open courses for practical, continued learning' },
    { id: 'feature-3', text: 'Student-focused academic and career guidance' },
    { id: 'feature-4', text: 'Dedicated scholarship and exam preparation support' },
  ],
  aboutStats: [
    { id: 'students', value: '5,000+', label: 'Students Enrolled' },
    { id: 'teachers', value: '30+', label: 'Expert Teachers' },
    { id: 'established', value: '2024', label: 'Established' },
  ],
  lecturerSections,
  galleryImages: localGalleryImages,
  articles: [
    {
      id: 1,
      title: 'Siyowin Kegalle opens 2026 Grade 6–11 Mathematics classes with Rukshan Kulakumara, helping students build confidence and achieve better results.',
      description: 'Siyowin Kegalle opens 2026 Grade 6–11 Mathematics classes with Rukshan Kulakumara, helping students build confidence and achieve better results.',
      image: '/news/maths.jpg',
      date: '2026',
      category: 'News',
      readTime: 'Maths',
      href: '#',
    },
    {
      id: 2,
      title: '2026 A/L Sinhala Revision Begins with Hemaloka Hamuduruwo',
      description: 'Siyowin Kegalle continues to guide Advanced Level students through focused Sinhala revision classes, helping them improve writing skills, exam confidence, and final performance.',
      image: '/news/sinhala.jpg',
      date: '2026',
      category: 'News',
      readTime: 'Sinhala',
      href: '#',
    },
  ],
};

const getRows = async <T>(table: string, orderColumn = 'display_order') => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(table).select('*').order(orderColumn, { ascending: true });

    if (error) {
      const fallback = getFallbackRows(table);

      if (fallback) {
        return fallback as T[];
      }

      throw new Error(`Unable to load ${table}: ${error.message}`);
    }

    return (data ?? []) as T[];
  } catch {
    const fallback = getFallbackRows(table);

    if (fallback) {
      return fallback as T[];
    }

    throw new Error(`Unable to load ${table}: Supabase client initialization failed.`);
  }
};

const getFallbackRows = (table: string) => {
  switch (table) {
    case 'site_hero_images':
      return fallbackSiteContent.heroImages;
    case 'site_about_features':
      return fallbackSiteContent.aboutFeatures;
    case 'site_about_stats':
      return fallbackSiteContent.aboutStats;
    case 'site_lecturer_sections':
      return fallbackSiteContent.lecturerSections.map(({ lecturers, ...section }) => section);
    case 'site_lecturers':
      return fallbackSiteContent.lecturerSections.flatMap((section) => section.lecturers.map((lecturer) => ({ ...lecturer, section_id: section.id })));
    case 'site_gallery_images':
      return fallbackSiteContent.galleryImages;
    case 'site_articles':
      return fallbackSiteContent.articles;
    default:
      return null;
  }
};

export async function getSiteContent(): Promise<SiteContent> {
  const [
    aboutFeatures,
    aboutStats,
    lecturerSections,
    lecturers,
    articles,
  ] = await Promise.all([
    getRows<any>('site_about_features'),
    getRows<any>('site_about_stats'),
    getRows<any>('site_lecturer_sections'),
    getRows<any>('site_lecturers'),
    getRows<any>('site_articles'),
  ]);

  const sections: SiteLecturerSection[] = lecturerSections.map((section) => ({
    id: section.id,
    title: section.title,
    highlight: section.highlight,
    description: section.description,
    viewAllHref: section.view_all_href,
    lecturers: lecturers
      .filter((lecturer) => lecturer.section_id === section.id)
      .map((lecturer) => ({
        id: lecturer.id,
        name: lecturer.name,
        subject: lecturer.subject,
        credentials: lecturer.credentials,
        image: lecturer.image,
        photoBg: lecturer.photo_bg,
        infoBg: lecturer.info_bg,
        accent: lecturer.accent,
      })),
  }));

  return {
    heroImages: localHeroImages.map((image) => ({
      id: image.id,
      src: image.src,
      alt: image.alt,
      width: image.width,
      height: image.height,
    })),
    mobileHeroImages: localMobileHeroImages.map((image) => ({
      id: image.id,
      src: image.src,
      alt: image.alt,
      width: image.width,
      height: image.height,
    })),
    aboutFeatures: aboutFeatures.map((feature) => ({ id: feature.id, text: feature.text })),
    aboutStats: aboutStats.map((stat) => ({ id: stat.id, value: stat.value, label: stat.label })),
    lecturerSections: sections,
    galleryImages: localGalleryImages.map((image) => ({
      id: image.id,
      src: image.src,
      alt: image.alt,
      category: image.category,
    })),
    articles: articles.map((article) => ({
      id: article.id,
      title: article.title,
      description: article.description,
      image: article.image,
      date: article.published_label,
      category: article.category,
      readTime: article.read_time,
      href: article.href,
    })),
  };
}
