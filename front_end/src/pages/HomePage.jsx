import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import ServicesSection from "../components/ServicesSection";
import AboutSection from "../components/AboutSection";
import StatsSection from "../components/StatsSection";
import CTASection from "../components/CTASection";
import LocalisationSection from "../components/LocalisationSection";
import Footer from "../components/Footer";
import ScrollToTopButton from "../components/ui/ScrollToTopButton";
import AuthModal from "../components/auth/AuthModal";
import { useAuth } from "../context/AuthContext";
import { getDashboardPath } from "../utils/auth";

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const handleRdvClick = (e) => {
    e?.preventDefault();
    if (isAuthenticated) {
      navigate(getDashboardPath(user));
    } else {
      setModalOpen(true);
    }
  };

  return (
    <>
      <a className="skip-link" href="#main-content">
        Aller au contenu principal
      </a>
      <Navbar />
      <main id="main-content" role="main">
        <HeroSection onRdvClick={handleRdvClick} />
        <ServicesSection />
        <AboutSection onRdvClick={handleRdvClick} />
        <StatsSection />
        <CTASection onRdvClick={handleRdvClick} />
        <LocalisationSection />
      </main>
      <Footer />
      <ScrollToTopButton />

      <AuthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialView="login"
      />
    </>
  );
}
