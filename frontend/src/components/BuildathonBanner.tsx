import React from 'react';

/**
 * Keep the organizer-provided sticker unchanged. The surrounding navy/purple
 * framing blends its white artwork into ShopShield's navy-and-teal palette.
 */
export const BuildathonBanner: React.FC = () => (
  <div className="w-full mx-auto overflow-hidden rounded-2xl border border-[#46305b]/70 bg-[#130e25] bg-[radial-gradient(ellipse_at_15%_45%,rgba(91,41,136,0.26),transparent_50%),radial-gradient(ellipse_at_83%_55%,rgba(20,184,166,0.11),transparent_52%)] shadow-[0_8px_35px_-22px_rgba(122,63,144,0.55)]">
    <a
      href="https://yunet-aignite26.devpost.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-center justify-center px-4 py-4 sm:px-6 sm:py-5 lg:min-h-[270px] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-400 transition-colors hover:bg-white/[0.02]"
      aria-label="Built For Ostad Presents YUNet AIgnite Buildathon 2026 — official Devpost event"
      title="Built For Ostad Presents YUNet AIgnite Buildathon 2026"
    >
      <picture className="block w-full max-w-[760px]">
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
