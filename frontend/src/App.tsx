import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PurchasePromiseAnalyzer } from './components/PurchasePromiseAnalyzer';
import { SellerHistoryIntelligence } from './components/SellerHistoryIntelligence';
import { ProblemSolution } from './components/ProblemSolution';
import { Features } from './components/Features';
import { VerificationPreview } from './components/VerificationPreview';
import { ArchitectureSection } from './components/ArchitectureSection';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#070d18] text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <PurchasePromiseAnalyzer />
        <SellerHistoryIntelligence />
        <ProblemSolution />
        <Features />
        <VerificationPreview />
        <ArchitectureSection />
      </main>
      <Footer />
    </div>
  );
};

export default App;
