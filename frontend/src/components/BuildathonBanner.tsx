import React from 'react';

/**
 * Keep the organizer-provided sticker unchanged. The surrounding navy/purple
 * framing blends its white artwork into ShopShield's navy-and-teal palette.
 */
export const BuildathonBanner: React.FC = () => (
  <div className="w-full max-w-[1600px] mx-auto overflow-hidden rounded-2xl border border-slate-700/40 bg-[#0d1425] bg-[radial-gradient(ellipse_at_25%_45%,rgba(77,37,116,0.20),transparent_48%),radial-gradient(ellipse_at_78%_55%,rgba(20,184,166,0.09),transparent_48%)]">
    <a
      href="https://yunet-aignite26.devpost.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-center justify-center px-4 py-4 sm:px-6 sm:py-5 lg:h-[300px] lg:py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-400 transition-colors hover:bg-white/[0.02]"
      aria-label="Built For Ostad Presents YUNet AIgnite Buildathon 2026 — official Devpost event"
      title="Built For Ostad Presents YUNet AIgnite Buildathon 2026"
    >
      <picture className="block w-full max-w-[790px]">
        <source srcSet="/assets/built-for-aignite-2026.webp" type="image/webp" />
        <img
          src="/assets/built-for-aignite-2026.png"
          alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"
          width={1912}
          height={679}
          loading="eager"
          decoding="async"
          className="block w-full h-auto max-h-[270px] object-contain"
        />
      </picture>
    </a>
  </div>
);

export default BuildathonBanner;
