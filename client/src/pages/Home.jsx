import { useSettings } from '../context/SettingsContext';
import HeroCarousel from '../components/home/HeroCarousel';
import StatsCounter from '../components/home/StatsCounter';
import AboutSection from '../components/home/AboutSection';
import ProgramsGrid from '../components/home/ProgramsGrid';
import LatestPosts from '../components/home/LatestPosts';
import Testimonials from '../components/home/Testimonials';
import PartnersMarquee from '../components/home/PartnersMarquee';
import CtaDonation from '../components/home/CtaDonation';
import Seo from '../components/Seo';

export default function Home() {
  const { settings } = useSettings();

  const showHero = settings.home_show_hero !== 'false';
  const showStats = settings.home_show_stats !== 'false';
  const showAbout = settings.home_show_about !== 'false';
  const showPrograms = settings.home_show_programs !== 'false';
  const showPosts = settings.home_show_posts !== 'false';
  const showTestimonials = settings.home_show_testimonials !== 'false';
  const showPartners = settings.home_show_partners !== 'false';
  const showCta = settings.home_show_cta !== 'false' && settings.menu_donasi_enabled !== 'false';

  return (
    <>
      <Seo description="Berita, program, dan kegiatan Cinta Kasih Fatimah — pendidikan, kesehatan, beasiswa, dan pemberdayaan masyarakat." />
      {showHero && <HeroCarousel />}
      {showStats && <StatsCounter />}
      {showAbout && <AboutSection />}
      {showPrograms && <ProgramsGrid />}
      {showPosts && <LatestPosts />}
      {showTestimonials && <Testimonials />}
      {showPartners && <PartnersMarquee />}
      {showCta && <CtaDonation />}
    </>
  );
}
