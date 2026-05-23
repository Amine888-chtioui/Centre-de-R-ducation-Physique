import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import ServicesSection from "../components/ServicesSection";
import AboutSection from "../components/AboutSection";
import StatsSection from "../components/StatsSection";
import CTASection from "../components/CTASection";
import LocalisationSection from "../components/LocalisationSection";
import Footer from "../components/Footer";

export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Aller au contenu principal
      </a>
      <Navbar />
      <main id="main-content" role="main">
        <HeroSection />
        <ServicesSection />
        <AboutSection />
        <StatsSection />
        <CTASection />
        <LocalisationSection />
      </main>
      <Footer />
    </>
  );
}
