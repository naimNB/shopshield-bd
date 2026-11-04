import React from 'react';

export const BuildathonBanner: React.FC = () => (
  <a
    href="https://yunet-aignite26.devpost.com/"
    target="_blank"
    rel="noopener noreferrer"
    className="block w-full max-w-[1600px] mx-auto rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 hover:opacity-95 transition-opacity"
    aria-label="Built For Ostad Presents YUNet AIgnite Buildathon 2026 — official Devpost event"
    title="Built For Ostad Presents YUNet AIgnite Buildathon 2026"
  >
    <picture className="flex w-full items-center justify-center">
      <source srcSet="/assets/built-for-aignite-2026.webp" type="image/webp" />
      <img
        src="/assets/built-for-aignite-2026.png"
        alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"
        width={1912}
        height={679}
        loading="eager"
        decoding="async"
        className="block w-full h-auto sm:h-[220px] lg:h-[300px] object-contain"
      />
    </picture>
  </a>
);

export default BuildathonBanner;
