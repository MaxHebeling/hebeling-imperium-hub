'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function CommandPage() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="w-full h-screen bg-background overflow-hidden">
      {/* Full Screen Hero */}
      <section className="relative w-full h-screen flex items-center justify-center">
        {/* Background Image with Overlays */}
        <div className="absolute inset-0">
          <Image
            src="/imperium-command-bg.jpg"
            alt="Hebeling Imperium Command Center"
            fill
            className="object-cover"
            priority
            quality={100}
          />

          {/* Dark Overlay (45%) */}
          <div className="absolute inset-0 bg-black/45" />

          {/* Subtle Vignette Effect */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/30" />

          {/* Subtle Gradient Overlay for Depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/40" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-4">
          {/* Global Network Effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg
              className="w-full h-full opacity-10"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <radialGradient id="globalGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#d4af37" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Orbital Lines */}
              <circle
                cx="500"
                cy="500"
                r="200"
                fill="none"
                stroke="#d4af37"
                strokeWidth="0.5"
                opacity="0.3"
              />
              <circle
                cx="500"
                cy="500"
                r="350"
                fill="none"
                stroke="#d4af37"
                strokeWidth="0.5"
                opacity="0.2"
              />

              {/* Connection Points */}
              <circle cx="500" cy="250" r="3" fill="#d4af37" opacity="0.4" />
              <circle cx="700" cy="450" r="3" fill="#d4af37" opacity="0.4" />
              <circle cx="500" cy="700" r="3" fill="#d4af37" opacity="0.4" />
              <circle cx="300" cy="450" r="3" fill="#d4af37" opacity="0.4" />
              <circle cx="650" cy="350" r="2" fill="#d4af37" opacity="0.3" />
              <circle cx="350" cy="650" r="2" fill="#d4af37" opacity="0.3" />

              {/* Connecting Lines */}
              <line
                x1="500"
                y1="250"
                x2="700"
                y2="450"
                stroke="#d4af37"
                strokeWidth="0.3"
                opacity="0.2"
              />
              <line
                x1="700"
                y1="450"
                x2="500"
                y2="700"
                stroke="#d4af37"
                strokeWidth="0.3"
                opacity="0.2"
              />
              <line
                x1="500"
                y1="700"
                x2="300"
                y2="450"
                stroke="#d4af37"
                strokeWidth="0.3"
                opacity="0.2"
              />
              <line
                x1="300"
                y1="450"
                x2="500"
                y2="250"
                stroke="#d4af37"
                strokeWidth="0.3"
                opacity="0.2"
              />

              {/* Central Radial Gradient */}
              <circle cx="500" cy="500" r="300" fill="url(#globalGlow)" />
            </svg>
          </div>

          {/* Central Illumination - Subtle Golden Halo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-yellow-500/10 via-yellow-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Logo Container */}
          <div
            className={`relative z-20 flex flex-col items-center gap-6 md:gap-8 transition-all duration-1000 ${
              isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            {/* Main Logo */}
            <div className="relative">
              {/* Logo Glow Effect */}
              <div className="absolute inset-0 bg-gradient-radial from-yellow-500/20 to-transparent blur-2xl -z-10" />

              <Image
                src="/logo-command.png"
                alt="Hebeling Imperium"
                width={280}
                height={280}
                className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-2xl"
                priority
              />
            </div>

            {/* Title - HEBELING IMPERIUM COMMAND */}
            <div
              className={`flex flex-col items-center gap-3 transition-all duration-1000 delay-200 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-widest text-white text-center leading-tight">
                HEBELING IMPERIUM
              </h1>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-widest text-white text-center">
                COMMAND
              </h2>
            </div>

            {/* Subtitle - ecosistema digital */}
            <div
              className={`transition-all duration-1000 delay-400 ${
                isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <p className="text-lg md:text-xl font-light tracking-widest text-gray-300 text-center">
                ecosistema digital
              </p>
            </div>
          </div>

          {/* Animated Particles - Golden Dust Effect */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-yellow-400/30 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `float ${4 + Math.random() * 4}s ease-in-out infinite`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            opacity: 0;
            transform: translateY(0) translateX(0);
          }
          50% {
            opacity: 0.3;
            transform: translateY(-20px) translateX(10px);
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .bg-gradient-radial {
          background: radial-gradient(ellipse at center, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
}
