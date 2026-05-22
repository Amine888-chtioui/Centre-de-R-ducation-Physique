import { AuthProvider } from "./context/AuthContext";
import "./components/auth/auth.css"; // styles des formulaires auth

// Tes composants existants
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import ServicesSection from "./components/ServicesSection";
import AboutSection from "./components/AboutSection";
import StatsSection from "./components/StatsSection";
import CTASection from "./components/CTASection";
import LocalisationSection from "./components/LocalisationSection";
import Footer from "./components/Footer";

export default function App() {
  return (
    /*
     * AuthProvider doit entourer TOUT le reste de l'application.
     * Ainsi, Navbar, les pages, etc. peuvent accéder à useAuth().
     * Si tu oublies AuthProvider, useAuth() lancera une erreur.
     */
    <AuthProvider>
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
    </AuthProvider>
  );
}
