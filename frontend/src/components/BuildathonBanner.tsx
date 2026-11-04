import React from 'react';

export const BuildathonBanner: React.FC = () => (
  <a
    href="https://yunet-aignite26.devpost.com/"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center justify-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 transition-opacity hover:opacity-90"
    aria-label="Built For Ostad Presents YUNet AIgnite Buildathon 2026 — official Devpost event"
    title="Built For Ostad Presents YUNet AIgnite Buildathon 2026"
  >
    <picture>
      <source srcSet="/assets/built-for-aignite-2026.webp" type="image/webp" />
      <img
        src="/assets/built-for-aignite-2026.png"
        alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026"
        width={1912}
        height={679}
        loading="eager"
        decoding="async"
        className="block h-14 sm:h-16 w-auto max-w-[90vw] object-contain rounded-xl"
      />
    </picture>
  </a>
);

export default BuildathonBanner;
