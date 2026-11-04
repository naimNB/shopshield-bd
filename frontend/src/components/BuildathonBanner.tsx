import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * BuildathonBanner
 * Houses the official organizer-provided Buildathon sticker without modification,
 * framed in a subtle deep-purple panel (#231331 / border #624377) that naturally
 * connects the sticker's purple brand cues with ShopShield's navy background.
 */
export const BuildathonBanner: React.FC = () => {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl border border-[#624377]/50 bg-[#231331] bg-gradient-to-b from-[#271538] to-[#1c0f2a] p-4 sm:p-5 shadow-lg shadow-purple-950/30 transition-all">
      <div className="flex flex-col items-center justify-center text-center">
        {/* Official Sticker - Preserves original artwork, aspect ratio (1912x679), no crop or distort */}
        <a
          href="https://yunet-aignite26.devpost.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-xl"
          title="Built For Ostad Presents YUNet AIgnite Buildathon 2026 — Devpost"
          aria-label="Built For Ostad Presents YUNet AIgnite Buildathon 2026 — Devpost"
        >
          <picture className="block mx-auto">
            <source srcSet="/assets/built-for-aignite-2026.webp" type="image/webp" />
            <img
              src="/assets/built-for-aignite-2026.png"
              alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"
              width={1912}
              height={679}
              loading="eager"
              decoding="async"
              className="h-14 sm:h-16 md:h-20 w-auto max-w-full mx-auto object-contain drop-shadow-md group-hover:scale-[1.01] transition-transform rounded-xl"
            />
          </picture>
        </a>

        {/* Clean, accessible Devpost pill */}
        <div className="mt-2.5 sm:mt-3">
          <a
            href="https://yunet-aignite26.devpost.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-purple-200 hover:text-white bg-[#331c47] hover:bg-[#3f2358] border border-[#624377]/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            <span className="font-sans">
              {isBn ? 'অফিশিয়াল বিল্ডাথন ইভেন্ট (Devpost)' : 'Official Buildathon Event (Devpost)'}
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-purple-300" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default BuildathonBanner;
