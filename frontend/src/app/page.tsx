"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Play, ShieldCheck, Cpu, Scan, CheckCircle2, 
  ChevronDown, Star, Sparkles, Building2, Zap, Lock, Terminal, Globe, ArrowUpRight, HelpCircle
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Hero3DBike } from '@/components/Hero3DBike';
import { BentoGrid } from '@/components/BentoGrid';
import { DemoSection } from '@/components/DemoSection';
import { PipelineDiagram } from '@/components/PipelineDiagram';

import { PlatformModal } from '@/components/PlatformModal';
import { VideoModal } from '@/components/VideoModal';

function HomeContent() {

  const searchParams = useSearchParams();
  const [platformModalOpen, setPlatformModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Auto-open video modal if URL contains ?demo=true
  useEffect(() => {
    if (searchParams?.get('demo') === 'true') {
      setVideoModalOpen(true);
    }
  }, [searchParams]);

  const mockLogos = [
    { name: 'State Traffic Police', tag: 'POLICE ENFORCEMENT' },
    { name: 'National Transport Authority', tag: 'REGULATORY RTO' },
    { name: 'Cyber Underwriters', tag: 'INSURANCE TECH' },
    { name: 'FleetGuard Global', tag: 'COMMERCIAL FLEET' },
    { name: 'Apex Motors Labs', tag: 'AUTOMOTIVE AUDIT' },
  ];

  const steps = [
    { num: '01', title: 'Stream or Upload Input', desc: 'Feed 1080p CCTV camera feed or drag-and-drop single inspection imagery into the console.' },
    { num: '02', title: 'YOLOv8 + Sigmoid Analysis', desc: 'Parallel multi-label neural networks segment regional modifications and component bounding boxes.' },
    { num: '03', title: 'OCR & RTO Data Fetch', desc: 'EasyOCR extracts license plate text to query state motor vehicle registries in under 40ms.' },
    { num: '04', title: 'CMVR Legal Compliance Check', desc: 'Automated rules engine matches alterations against legal statutes and calculates penalty values.' },
    { num: '05', title: 'Court-Ready PDF Generation', desc: 'Download official stamped compliance reports complete with Grad-CAM visual evidence.' },
  ];

  const stats = [
    { value: '1,245,000+', label: 'VEHICLES INSPECTED', sub: 'Across 14 Traffic Checkpoints' },
    { value: '99.4%', label: 'DETECTION PRECISION', sub: 'Verified by Forensic Labs' },
    { value: '< 120ms', label: 'INFERENCE LATENCY', sub: 'GPU Accelerated Sigmoid Pass' },
    { value: '450,000+', label: 'COMPLIANCE PDFS EXPORTED', sub: 'Accepted in Traffic Courts' },
  ];

  const testimonials = [
    {
      name: 'Inspector R. K. Varma',
      role: 'Chief Traffic Operations Officer',
      org: 'Metropolitan Enforcement Wing',
      quote: 'AXION reduced our manual vehicle inspection time by 85%. The Grad-CAM visual heatmaps provide undeniable evidence in traffic court.',
      rating: 5,
    },
    {
      name: 'Sarah Jenkins',
      role: 'Head of Automotive Risk',
      org: 'Apex Insurance Group',
      quote: 'The automated license plate OCR and RTO metadata lookup helped us identify non-compliant vehicle modifications prior to policy underwriting.',
      rating: 5,
    },
    {
      name: 'Marcus Vance',
      role: 'VP of Commercial Security',
      org: 'FleetGuard Logistics',
      quote: 'Integrating AXION into our warehouse check-in cameras ensured zero altered or unsafe vehicles entered our fleet facilities.',
      rating: 5,
    },
  ];

  const pricingTiers = [
    {
      name: 'Starter',
      desc: 'Ideal for local law enforcement checkpoints and single station audits.',
      priceMonthly: '$499',
      priceAnnual: '$399',
      features: ['Up to 10,000 Scans / mo', 'YOLOv8 Modification Detection', 'EasyOCR License Plate Reader', 'Standard PDF Export', 'Email Support'],
      popular: false,
    },
    {
      name: 'Professional',
      desc: 'Built for regional transport hubs and multi-lane CCTV monitoring.',
      priceMonthly: '$1,299',
      priceAnnual: '$999',
      features: ['Unlimited Scans', 'Real-Time RTSP Stream Integration', 'Grad-CAM XAI Saliency Heatmaps', 'RTO Metadata Integration', 'Court-Ready PDF Reporter', '24/7 Dedicated Support'],
      popular: true,
    },
    {
      name: 'Enterprise',
      desc: 'Custom deployment for state authorities, insurance networks, & fleets.',
      priceMonthly: 'Custom',
      priceAnnual: 'Custom',
      features: ['On-Premise / Edge GPU Deployment', 'Custom Model Fine-Tuning', 'Direct RTO Database Sync', 'Unlimited RTSP Camera Channels', 'SLA Guarantee & Dedicated Architect'],
      popular: false,
    },
  ];

  const faqs = [
    {
      q: 'How does AXION detect illegal modifications?',
      a: 'The platform utilizes a dual-engine architecture: YOLOv8 isolates regional vehicle components (exhausts, handlebars, mirrors, crash guards), while a multi-label Sigmoid classifier evaluates structural deviations against factory stock baseline embeddings.',
    },
    {
      q: 'Does it map violations against Motor Vehicle Rules?',
      a: 'Yes. The integrated Legal Compliance Engine cross-references detected alterations against Central Motor Vehicle Rules (CMVR) statutes, citing specific rule violations and standard fine brackets automatically.',
    },
    {
      q: 'Can we connect live CCTV or RTSP cameras?',
      a: 'Absolutely. AXION includes a built-in RTSP stream receiver capable of processing 1080p 60fps video streams at checkpoint gates with sub-120ms inference latency.',
    },
    {
      q: 'What formats are exported for evidence?',
      a: 'The system generates official stamped PDF Compliance Reports complete with timestamps, license plate OCR data, bounding boxes, and Grad-CAM saliency heatmaps suitable for legal proceedings.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#00e5a8]/30 selection:text-[#00e5a8] scroll-smooth">
      {/* SECTION 1: Sticky Transparent Navbar */}
      <Navbar 
        onOpenPlatform={() => setPlatformModalOpen(true)} 
        onOpenDemoVideo={() => setVideoModalOpen(true)}
      />

      {/* SECTION 2: HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-mesh-glow blur-[140px] pointer-events-none opacity-80" />


        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Hero Content */}
          <div className="flex flex-col items-start z-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#00e5a8]/10 border border-[#00e5a8]/30 text-[#00e5a8] text-xs font-mono-tech font-bold uppercase tracking-widest mb-6 shadow-[0_0_15px_rgba(0,229,168,0.2)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00e5a8]" />
              <span>AXION NEURAL INSPECTION ENGINE</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-space font-extrabold tracking-tighter leading-[0.95] text-white mb-6"
            >
              AI-Powered <br />
              <span className="gradient-mint-text">AXION Inspection</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-slate-400 text-base md:text-xl font-inter leading-relaxed max-w-xl mb-10"
            >
              Automated computer vision platform detecting illegal motorcycle modifications, verifying legal CMVR compliance, and executing real-time ANPR telematics.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 w-full sm:w-auto"
            >
              <button
                onClick={() => setPlatformModalOpen(true)}
                className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-space font-extrabold text-sm uppercase tracking-wider shadow-[0_0_35px_rgba(0,229,168,0.4)] hover:shadow-[0_0_50px_rgba(0,229,168,0.7)] transition-all active:scale-95 flex items-center justify-center space-x-3 w-full sm:w-auto"
              >
                <span>Try Platform</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setVideoModalOpen(true)}
                className="px-8 py-4 rounded-2xl glass-luxury glass-luxury-hover text-white font-space font-bold text-sm uppercase tracking-wider flex items-center justify-center space-x-3 w-full sm:w-auto cursor-pointer"
              >
                <Play className="w-4 h-4 text-[#00e5a8] fill-[#00e5a8]" />
                <span>Watch Demo</span>
              </button>
            </motion.div>
          </div>

          {/* Right Interactive 3D Model Visualization */}
          <div className="z-10 w-full">
            <Hero3DBike />
          </div>
        </div>
      </section>

      {/* SECTION 3: Trusted By Ticker */}
      <section className="py-12 border-y border-white/5 bg-[#0d0d0d]/40 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-4 text-center">
          <span className="text-[11px] font-mono-tech font-bold uppercase tracking-widest text-slate-500">
            DEPLOYED BY LEADING TRANSPORTATION & SECURITY AUTHORITIES
          </span>
        </div>

        {/* Ticker Container */}
        <div className="flex space-x-12 overflow-hidden py-4 opacity-70 hover:opacity-100 transition-opacity">
          <motion.div
            animate={{ x: [0, -1000] }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            className="flex space-x-12 shrink-0 items-center"
          >
            {mockLogos.concat(mockLogos).map((l, idx) => (
              <div key={idx} className="flex items-center space-x-3 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                <Building2 className="w-4 h-4 text-[#00e5a8]" />
                <span className="font-space font-bold text-xs text-white uppercase tracking-wider">{l.name}</span>
                <span className="text-[9px] font-mono-tech text-slate-400 bg-white/10 px-2 py-0.5 rounded">{l.tag}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SECTION 4: DEMO SECTION (id="demo") */}
      <section id="demo" className="pt-16 pb-12 scroll-mt-24">
        <DemoSection onOpenDemoVideo={() => setVideoModalOpen(true)} />
      </section>


      {/* SECTION 5: SOLUTIONS SECTION (id="solutions") */}
      <section id="solutions" className="pt-16 pb-12 scroll-mt-24">
        <BentoGrid onOpenPlatform={() => setPlatformModalOpen(true)} />
      </section>


      {/* SECTION 6: TECHNOLOGY SECTION (id="technology") */}
      <section id="technology" className="py-24 max-w-7xl mx-auto px-6 md:px-12 space-y-16 scroll-mt-24">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-xs font-mono-tech font-bold text-[#00e5a8] uppercase tracking-widest">
            INFERENCE ARCHITECTURE
          </span>
          <h2 className="text-4xl md:text-5xl font-space font-extrabold text-white">
            How <span className="gradient-mint-text">AXION Works</span>
          </h2>
          <p className="text-slate-400 text-base">
            End-to-end computer vision pipeline processing raw camera streams into court-ready compliance certificates.
          </p>
        </div>

        {/* 5 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {steps.map((s, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="glass-luxury p-6 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <span className="font-space font-extrabold text-3xl text-[#00e5a8] block">{s.num}</span>
                <h3 className="font-space font-bold text-base text-white">{s.title}</h3>
                <p className="text-xs text-slate-400 font-inter leading-relaxed">{s.desc}</p>
              </div>
              <div className="pt-3 border-t border-white/10 text-[10px] font-mono-tech text-emerald-400 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>STEP {idx + 1} VERIFIED</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Visual Pipeline Diagram */}
        <PipelineDiagram />
      </section>

      {/* SECTION 7: Key Metrics Statistics Grid */}
      <section className="py-20 border-y border-white/10 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((st, idx) => (
            <div key={idx} className="glass-luxury p-8 rounded-3xl border border-white/10 text-center space-y-2">
              <h3 className="text-4xl lg:text-5xl font-space font-extrabold text-[#00e5a8]">{st.value}</h3>
              <p className="font-mono-tech text-xs font-bold text-white uppercase tracking-wider">{st.label}</p>
              <p className="text-xs text-slate-400 font-inter">{st.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 8: Testimonials */}
      <section className="py-24 max-w-7xl mx-auto px-6 md:px-12 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-xs font-mono-tech font-bold text-[#00e5a8] uppercase tracking-widest">
            TESTIMONIALS & CASE STUDIES
          </span>
          <h2 className="text-4xl md:text-5xl font-space font-extrabold text-white">
            Trusted by <span className="gradient-mint-text">Enforcement Officers</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div key={idx} className="glass-luxury p-8 rounded-3xl border border-white/10 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex text-amber-400 space-x-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-slate-300 font-inter italic leading-relaxed">"{t.quote}"</p>
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="font-space font-bold text-sm text-white">{t.name}</p>
                <p className="text-xs text-[#00e5a8] font-mono-tech">{t.role}</p>
                <p className="text-xs text-slate-400 font-inter">{t.org}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 9: PRICING SECTION (id="pricing") */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-6 md:px-12 space-y-16 scroll-mt-24">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-3 p-1 rounded-xl bg-white/5 border border-white/10 font-mono-tech text-xs">
            <button
              onClick={() => setAnnualBilling(true)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${annualBilling ? 'bg-[#00e5a8] text-[#050505]' : 'text-slate-400'}`}
            >
              Annual (20% OFF)
            </button>
            <button
              onClick={() => setAnnualBilling(false)}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${!annualBilling ? 'bg-[#00e5a8] text-[#050505]' : 'text-slate-400'}`}
            >
              Monthly Billing
            </button>
          </div>

          <h2 className="text-4xl md:text-5xl font-space font-extrabold text-white">
            Transparent <span className="gradient-mint-text">Enterprise Pricing</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {pricingTiers.map((tier, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3 }}
              className={`glass-luxury p-8 rounded-3xl border flex flex-col justify-between relative transition-all ${
                tier.popular 
                  ? 'border-[#00e5a8] shadow-[0_0_50px_rgba(0,229,168,0.3)] md:scale-105 z-10 bg-[#0c0c0c]/90' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-mono-tech font-extrabold text-[10px] uppercase tracking-wider shadow-[0_0_15px_rgba(0,229,168,0.5)]">
                  MOST POPULAR PLAN
                </span>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="font-space font-extrabold text-2xl text-white">{tier.name}</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{tier.desc}</p>
                </div>

                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-space font-extrabold text-white">
                    {annualBilling ? tier.priceAnnual : tier.priceMonthly}
                  </span>
                  {tier.priceMonthly !== 'Custom' && <span className="text-xs text-slate-400">/ month</span>}
                </div>

                <ul className="space-y-3 pt-4 border-t border-white/10 text-xs font-inter text-slate-300">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-[#00e5a8] shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setPlatformModalOpen(true)}
                className={`w-full mt-8 py-3.5 rounded-xl font-space font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.03] active:scale-95 cursor-pointer ${
                  tier.popular
                    ? 'bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] shadow-[0_0_25px_rgba(0,229,168,0.4)] hover:shadow-[0_0_40px_rgba(0,229,168,0.7)]'
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}
              >
                Get Started
              </button>
            </motion.div>
          ))}
        </div>

      </section>

      {/* SECTION 10: FAQ SECTION (id="faq") */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6 md:px-12 space-y-12 scroll-mt-24">
        <div className="text-center space-y-4">
          <span className="text-xs font-mono-tech font-bold text-[#00e5a8] uppercase tracking-widest">
            TECHNICAL KNOWLEDGE BASE
          </span>
          <h2 className="text-4xl font-space font-extrabold text-white">
            Frequently Asked <span className="gradient-mint-text">Questions</span>
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="glass-luxury rounded-2xl border border-white/10 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-6 text-left flex justify-between items-center font-space font-bold text-base text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-[#00e5a8] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-6 pb-6 text-slate-400 text-sm font-inter leading-relaxed border-t border-white/5 pt-4"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 11: Final Call to Action */}
      <section className="py-20 max-w-7xl mx-auto px-6 md:px-12">
        <div className="glass-luxury p-12 md:p-20 rounded-3xl border border-white/10 text-center space-y-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00e5a8]/10 via-[#3b82f6]/5 to-transparent blur-3xl pointer-events-none" />
          <h2 className="text-4xl md:text-6xl font-space font-extrabold text-white max-w-3xl mx-auto">
            Ready to Automate Vehicle Enforcement with <span className="gradient-mint-text">AXION</span>?
          </h2>
          <p className="text-slate-400 text-lg font-inter max-w-2xl mx-auto">
            Deploy state-of-the-art computer vision to your traffic checkpoints today.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => setPlatformModalOpen(true)}
              className="px-10 py-5 rounded-2xl bg-gradient-to-r from-[#00e5a8] to-[#3b82f6] text-[#050505] font-space font-extrabold text-sm uppercase tracking-wider shadow-[0_0_40px_rgba(0,229,168,0.5)] hover:shadow-[0_0_60px_rgba(0,229,168,0.8)] transition-all hover:scale-105 inline-flex items-center space-x-3"
            >
              <span>Launch AXION Console</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 12: Minimal Luxury Footer */}
      <footer className="border-t border-white/10 bg-[#030303] py-16 relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand & Status */}
          <div className="space-y-4">
            <a href="#" className="flex items-center space-x-2 font-space font-extrabold text-xl text-white">
              <span>AXION</span>
              <span className="w-2 h-2 rounded-full bg-[#00e5a8] animate-pulse" />
            </a>
            <p className="text-slate-400 text-xs font-inter leading-relaxed">
              Next-generation AI computer vision platform for automated vehicle modification detection and legal compliance.
            </p>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono-tech font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AXION ENGINE OPERATIONAL (14ms)</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h5 className="font-space font-bold text-xs uppercase tracking-wider text-white mb-4">Platform</h5>
            <ul className="space-y-2.5 text-xs text-slate-400 font-inter">
              <li><a href="#demo" className="hover:text-[#00e5a8] transition-colors">Demo Console</a></li>
              <li><a href="#solutions" className="hover:text-[#00e5a8] transition-colors">Solutions</a></li>
              <li><a href="#technology" className="hover:text-[#00e5a8] transition-colors">Technology Pipeline</a></li>
              <li><a href="#pricing" className="hover:text-[#00e5a8] transition-colors">Enterprise Pricing</a></li>
            </ul>
          </div>

          {/* Col 3: Resources */}
          <div>
            <h5 className="font-space font-bold text-xs uppercase tracking-wider text-white mb-4">Resources</h5>
            <ul className="space-y-2.5 text-xs text-slate-400 font-inter">
              <li><a href="#faq" className="hover:text-[#00e5a8] transition-colors">CMVR Knowledge Base</a></li>
              <li><a href="#" className="hover:text-[#00e5a8] transition-colors">API Documentation</a></li>
              <li><a href="#" className="hover:text-[#00e5a8] transition-colors">Grad-CAM Technical Paper</a></li>
              <li><a href="#" className="hover:text-[#00e5a8] transition-colors">Security Whitepaper</a></li>
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div className="space-y-3">
            <h5 className="font-space font-bold text-xs uppercase tracking-wider text-white">Subscribe to AXION Insights</h5>
            <p className="text-slate-400 text-xs font-inter">Get quarterly updates on computer vision and traffic enforcement tech.</p>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono-tech text-white outline-none focus:border-[#00e5a8] w-full"
              />
              <button className="px-4 py-2 bg-[#00e5a8] text-[#050505] font-space font-bold text-xs rounded-xl hover:shadow-[0_0_15px_rgba(0,229,168,0.5)]">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-inter">
          <p>© 2026 AXION Engine Inc. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Service</a>
            <a href="#" className="hover:text-slate-300">Security</a>
          </div>
        </div>
      </footer>

      {/* Interactive Platform Console Modal Drawer */}
      <PlatformModal
        isOpen={platformModalOpen}
        onClose={() => setPlatformModalOpen(false)}
      />

      {/* Cinematic HTML5 Video Modal */}
      <VideoModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">Loading AXION...</div>}>

      <HomeContent />
    </Suspense>
  );
}

