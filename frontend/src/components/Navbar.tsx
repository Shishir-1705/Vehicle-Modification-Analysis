"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Menu, Play } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { ProfileDropdown } from '@/components/ProfileDropdown';
import { MobileDrawer } from '@/components/MobileDrawer';

interface NavbarProps {
  onOpenPlatform?: () => void;
  onOpenDemoVideo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenPlatform, onOpenDemoVideo }) => {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const sectionLinks = [
    { name: 'Demo', href: '#demo', id: 'demo' },
    { name: 'Solutions', href: '#solutions', id: 'solutions' },
    { name: 'Technology', href: '#technology', id: 'technology' },
    { name: 'Pricing', href: '#pricing', id: 'pricing' },
    { name: 'FAQ', href: '#faq', id: 'faq' },
  ];

  // Scroll Shrink & Active Section Scroll-Spy Observer
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);

    // Scroll-Spy Observer for Active Section Highlighting
    const sectionIds = ['demo', 'solutions', 'technology', 'pricing', 'faq'];
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    };

    const handleIntersection: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled 
            ? 'bg-[#050505]/85 backdrop-blur-xl border-b border-white/10 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.8)]' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          {/* LEFT SIDE GROUP: Hamburger Trigger (☰) + AXION Logo */}
          <div className="flex items-center space-x-4">
            {/* Hamburger Trigger Button */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="p-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-white/20 transition-all flex items-center justify-center group"
              aria-label="Open Navigation Drawer"
            >
              <Menu className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            {/* AXION Brand Logo */}
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#00e5a8] to-[#3b82f6] p-[1px] shadow-[0_0_20px_rgba(0,229,168,0.3)]">
                <div className="w-full h-full bg-[#050505] rounded-[11px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-[#00e5a8] group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <span className="font-space font-extrabold text-xl tracking-tight text-white flex items-center space-x-1.5">
                <span>AXION</span>
                <span className="w-2 h-2 rounded-full bg-[#00e5a8] animate-pulse" />
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links with Active Scroll-Spy Highlighting */}
          <nav className="hidden lg:flex items-center space-x-7">
            {sectionLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.id)}
                  className={`text-xs font-bold uppercase tracking-wider transition-colors relative py-1 group font-mono-tech ${
                    isActive ? 'text-[#00e5a8] drop-shadow-[0_0_8px_rgba(0,229,168,0.6)]' : 'text-slate-300 hover:text-[#00e5a8]'
                  }`}

                >
                  {link.name}
                  <span 
                    className={`absolute bottom-0 left-0 h-[2px] bg-[#00e5a8] transition-all duration-300 ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`} 
                  />
                </a>
              );
            })}
          </nav>

          {/* RIGHT SIDE GROUP: Watch Demo | Try Platform | Notification Bell | Profile */}
          <div className="flex items-center space-x-3 md:space-x-4 font-mono-tech text-xs">
            {/* Watch Demo Button */}
            <button
              onClick={onOpenDemoVideo}
              className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-space font-bold uppercase tracking-wider transition-all flex items-center space-x-2"
              title="Watch Cinematic Demo Video"
            >
              <Play className="w-3.5 h-3.5 text-[#00e5a8] fill-[#00e5a8]" />
              <span className="hidden sm:inline">Watch Demo</span>
            </button>

            {user ? (
              <div className="flex items-center space-x-3">
                {/* Try Platform Button */}
                <Link
                  href="/dashboard"
                  className="hidden md:inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-space font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(0,229,168,0.35)] hover:shadow-[0_0_30px_rgba(0,229,168,0.6)] transition-all active:scale-95"
                >
                  <span>Try Platform</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {/* Notification Bell Dropdown */}
                <NotificationDropdown />

                {/* Profile Dropdown */}
                <ProfileDropdown />
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="font-bold text-slate-300 hover:text-[#00e5a8] px-3 py-2 transition-colors uppercase"
                >
                  Sign In
                </Link>

                <Link
                  href="/dashboard"
                  className="group relative inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-space font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(0,229,168,0.35)] hover:shadow-[0_0_30px_rgba(0,229,168,0.6)] transition-all active:scale-95"
                >
                  <span>Try Platform</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Left-Side Sliding Navigation Drawer */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        navLinks={sectionLinks}
        activeSection={activeSection}
        onOpenDemoVideo={onOpenDemoVideo}
      />
    </>
  );
};
