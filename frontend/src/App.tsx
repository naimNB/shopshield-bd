import React from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { BuildathonBanner } from './components/BuildathonBanner';
import { Hero } from './components/Hero';
import { BuyerVerificationHub } from './components/BuyerVerificationHub';
import { HowItWorks } from './components/HowItWorks';
import { AboutSection } from './components/AboutSection';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <div className="min-h-screen flex flex-col bg-[#070c18] text-slate-100 antialiased selection:bg-teal-500 selection:text-white">
        <Navbar />
        <BuildathonBanner />
        <main className="flex-grow">
          <Hero />
          <BuyerVerificationHub />
          <HowItWorks />
          <AboutSection />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
};

export default App;
