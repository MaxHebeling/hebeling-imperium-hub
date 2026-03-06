'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function CommandPage() {
  return (
    <div className="w-full h-screen overflow-hidden bg-[#050a14] font-sans">
      {/* Hero Section */}
      <section className="hero-command relative h-screen w-full flex flex-col justify-center items-center text-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/imperium-command-bg.jpg"
            alt="Corporate Skyline"
            fill
            className="object-cover"
            priority
            quality={100}
          />
        </div>

        {/* Radial Overlay / Vignette */}
        <div className="hero-overlay absolute inset-0 z-[1]" />

        {/* Global Grid Effect */}
        <div className="global-grid absolute inset-0 z-[2]" />

        {/* Particles Drift */}
        <div className="particles absolute inset-0 z-[3] pointer-events-none" />

        {/* Orbital Lines - Rotating */}
        <div className="orbital-lines absolute z-[2]" />

        {/* Main Content */}
        <div className="main-content relative z-10 flex flex-col items-center max-w-[90vw]">
          {/* Logo Halo */}
          <div className="logo-halo" />

          {/* Logo Container */}
          <div className="logo-container">
            <Image
              src="/logo-command.png"
              alt="Hebeling Logo"
              width={280}
              height={280}
              className="w-full h-auto"
              priority
            />
          </div>

          {/* Title */}
          <h1 className="title">HEBELING IMPERIUM COMMAND</h1>

          {/* Subtitle */}
          <p className="subtitle">ecosistema digital</p>
        </div>

        {/* Staff Access - Top Right */}
        <div className="fixed top-8 right-8 z-50 staff-access">
          <Link
            href="/login"
            className="flex items-center gap-3 px-6 py-3 text-base font-semibold text-white border border-[#d4af37]/60 hover:border-[#d4af37] rounded-lg bg-black/40 hover:bg-[#d4af37]/10 backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:shadow-[#d4af37]/20"
          >
            <svg
              className="w-5 h-5 text-[#d4af37]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>Staff Login</span>
          </Link>
        </div>
      </section>

      <style jsx>{`
        /* Hero Overlay - Radial Vignette */
        .hero-overlay {
          background: radial-gradient(
            circle,
            rgba(5, 10, 20, 0.45) 0%,
            rgba(0, 0, 0, 0.9) 100%
          );
        }

        /* Global Grid Effect */
        .global-grid {
          background: radial-gradient(
            circle at center,
            transparent 30%,
            rgba(212, 175, 55, 0.05) 100%
          );
          opacity: 0.4;
        }

        /* Orbital Lines */
        .orbital-lines {
          width: 600px;
          height: 600px;
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 50%;
          animation: rotate 60s linear infinite;
        }

        .orbital-lines::before {
          content: '';
          position: absolute;
          top: -10%;
          left: -10%;
          right: -10%;
          bottom: -10%;
          border: 1px solid rgba(212, 175, 55, 0.05);
          border-radius: 50%;
        }

        /* Logo Halo */
        .logo-halo {
          position: absolute;
          width: 450px;
          height: 450px;
          background: radial-gradient(
            circle,
            rgba(212, 175, 55, 0.15) 0%,
            transparent 70%
          );
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: -1;
          filter: blur(40px);
        }

        /* Logo Container */
        .logo-container {
          width: 280px;
          margin-bottom: 40px;
          filter: drop-shadow(0 0 15px rgba(212, 175, 55, 0.3));
          animation: fadeInScale 1.8s ease-out forwards;
        }

        /* Title */
        .title {
          color: #ffffff;
          font-size: 2.8rem;
          font-weight: 700;
          letter-spacing: 0.4em;
          text-transform: uppercase;
          margin-bottom: 15px;
          opacity: 0;
          animation: slideUpFade 1.5s ease-out 0.5s forwards;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        /* Subtitle */
        .subtitle {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.1rem;
          font-weight: 200;
          letter-spacing: 0.6em;
          text-transform: lowercase;
          opacity: 0;
          animation: slideUpFade 1.5s ease-out 1s forwards;
        }

        /* Particles */
        .particles {
          background-image: radial-gradient(
            circle,
            #d4af37 1px,
            transparent 1px
          );
          background-size: 100px 100px;
          opacity: 0.1;
          animation: drift 20s linear infinite;
        }

        /* Staff Access */
        .staff-access {
          opacity: 0;
          animation: fadeIn 1s ease-out 1.5s forwards;
        }

        /* Animations */
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes drift {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 100px 100px;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .logo-container {
            width: 180px;
          }
          .title {
            font-size: 1.5rem;
            letter-spacing: 0.2em;
          }
          .subtitle {
            font-size: 0.8rem;
            letter-spacing: 0.4em;
          }
          .logo-halo {
            width: 300px;
            height: 300px;
          }
          .orbital-lines {
            width: 350px;
            height: 350px;
          }
        }
      `}</style>
    </div>
  );
}
