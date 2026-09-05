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
  return (
    <>
      <Seo description="Berita, program, dan kegiatan Cinta Kasih Fatimah — pendidikan, kesehatan, beasiswa, dan pemberdayaan masyarakat." />
      <HeroCarousel />
      <StatsCounter />
      <AboutSection />
      <ProgramsGrid />
      <LatestPosts />
      <Testimonials />
      <PartnersMarquee />
      <CtaDonation />
    </>
  );
}
