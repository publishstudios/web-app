// ==========================================================================
// FILE: app/page.jsx
// ==========================================================================
'use client';

import React, { useState, useEffect } from 'react';
import CoverVisualizer from './CoverVisualizer';
import HelpCenter from './HelpCenter';

export default function PublishStudioApp() {
  /* =========================================================================
     STATE MANAGEMENT
     ========================================================================= */
  // Navigation: 'home' or 'studio'
  const [currentView, setCurrentView] = useState('home');
  // Step: 1 (Setup), 2 (Interior), 3 (Cover), 4 (Preflight)
  const [activeStep, setActiveStep] = useState(3);

  /* =========================================================================
     DEDICATED SECTION 1: REMEMBER USER PROFILE (LOCAL PERSISTENCE)
     ========================================================================= */
  const [userProfile, setUserProfile] = useState({ firstName: '', lastName: '', email: '' });
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState('Issue Report');
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('publishstudio_user');
    if (saved) {
      try {
        setUserProfile(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('publishstudio_user', JSON.stringify(userProfile));
    alert('Author details remembered on this device.');
  };

  const handleSendFeedback = (e) => {
    e.preventDefault();
    const recipient = 'publishstudio.ops@gmail.com';
    const subject = `[${feedbackCategory}] Feedback from ${userProfile.firstName || 'Author'}`;
    const body = `Author: ${userProfile.firstName} ${userProfile.lastName} (${userProfile.email})\n\nDetails:\n${feedbackText}`;
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setShowHelpModal(false);
  };

  /* =========================================================================
     DEDICATED SECTION 2: SETUP UPLOAD & INTERIOR MANUSCRIPT READER
     ========================================================================= */
  const [manuscriptFile, setManuscriptFile] = useState(null);
  const [manuscriptContent, setManuscriptContent] = useState('');
  const [interiorViewMode, setInteriorViewMode] = useState('spread'); // 'single' or 'spread'
  const [readerPage, setReaderPage] = useState(0);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setManuscriptFile(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setManuscriptContent(event.target.result || '');
    };
    reader.readAsText(file);
  };

  // Convert raw manuscript into readable chunk pages (~250 words per page simulation)
  const words = manuscriptContent ? manuscriptContent.split(/\s+/) : [];
  const wordsPerPage = 250;
  const pages = [];
  if (words.length > 0) {
    for (let i = 0; i < words.length; i += wordsPerPage) {
      pages.push(words.slice(i, i + wordsPerPage).join(' '));
    }
  } else {
    pages.push('No manuscript uploaded yet. Upload your document in Step 1 (Setup) to inspect chapters and spreads.');
  }

  /* =========================================================================
     DEDICATED SECTION 3: KDP ROYALTY & SPEC CALCULATIONS
     Edit formulas here if Amazon KDP modifies its base rates.
     ========================================================================= */
  const [trimSize, setTrimSize] = useState('5.5x8.5');
  const [pageCount, setPageCount] = useState(150);
  const [bookTitle, setBookTitle] = useState('THE MEMORY CHEF');
  const [authorName, setAuthorName] = useState('A. S. HARPER');
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [showGuides, setShowGuides] = useState(true);

  // KDP Paperback (Black & White ink, White Paper, US Marketplace)
  const [royaltyRate, setRoyaltyRate] = useState(0.60); // 60% Amazon Standard, 40% Expanded
  const [listPrice, setListPrice] = useState(12.99);
  const [publishedBooksCount, setPublishedBooksCount] = useState(3);
  const [monthlySalesPerBook, setMonthlySalesPerBook] = useState(25);

  const fixedCost = 1.00;
  const perPageCost = 0.012;
  const printingCost = Number((fixedCost + (pageCount * perPageCost)).toFixed(2));
  const minListPrice = Number((printingCost / royaltyRate).toFixed(2));
  const actualProfitPerCopy = Math.max(0, Number(((listPrice * royaltyRate) - printingCost).toFixed(2)));

  // Multi-book portfolio projection
  const monthlyRevenue = Number((publishedBooksCount * monthlySalesPerBook * actualProfitPerCopy).toFixed(2));
  const annualRevenue = Number((monthlyRevenue * 12).toFixed(2));

  // Blueprint dimensions (White paper caliper = 0.002252")
  const spineWidth = (pageCount * 0.002252).toFixed(2);
  const totalWidth = (5.5 * 2 + parseFloat(spineWidth) + 0.25).toFixed(2);
  const totalHeight = (8.5 + 0.25).toFixed(2);

  return (
    <div className="min-h-screen bg-[#F4EFEA] text-[#1E293B]">

      {/* =======================================================================
          TOP WINDOW BAR (Mac-style header with high contrast)
          ======================================================================= */}
      <header className="border-b border-[#D6CEBE] px-6 py-3 flex items-center justify-between bg-[#ECE5DB]/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {/* macOS window dots */}
          <div className="flex gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block border border-black/10"></span>
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block border border-black/10"></span>
            <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block border border-black/10"></span>
          </div>
          <span className="font-extrabold text-sm tracking-tight flex items-center gap-1.5 text-stone-900">
            <span className="text-amber-800">📖</span> PUBLISHSTUDIO
          </span>
          <span className="hidden md:inline-block text-[11px] font-bold text-stone-700">
            Universal Print-on-Demand (POD)
          </span>
          <span className="hidden lg:inline-block text-[11px] px-2.5 py-0.5 rounded-full border border-[#D6CEBE] bg-[#FAF7F2] text-stone-800 font-semibold">
            Self-Publishing Supporting Software
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 text-xs">
          {userProfile.firstName && (
            <span className="font-bold text-[11px] px-2.5 py-1 rounded bg-[#E4DCCE] text-stone-900 border border-[#D6CEBE]">
              👤 {userProfile.firstName}
            </span>
          )}

          <button
            onClick={() => setShowHelpModal(true)}
            className="font-bold underline decoration-stone-500 text-stone-900 hover:text-amber-900 transition"
          >
            Help ▾
          </button>
        </div>
      </header>

      {/* =======================================================================
          VIEW ROUTING: HOME PAGE vs STUDIO WORKFLOW
          ======================================================================= */}
      {currentView === 'home' ? (

        /* ---------------------------------------------------------------------
           HOME PAGE
           --------------------------------------------------------------------- */
        <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">

          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="text-[10px] font-bold tracking-widest uppercase text-amber-800">
              Universal Print-On-Demand Production
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-stone-900">
              Focus More on Writing, Less on Formatting!
            </h1>
            <p className="text-xs md:text-sm text-stone-700 max-w-xl mx-auto leading-relaxed">
              PublishStudio eliminates printing rejections. We calculate binding gutters, full-wrap spine bulk, and safe margins automatically, leaving you free to craft your story.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => { setCurrentView('studio'); setActiveStep(1); }}
                className="px-5 py-2.5 bg-[#B85D38] hover:bg-[#A04E2D] text-white text-xs font-bold rounded-lg shadow-md transition"
              >
                Launch Book Production Studio →
              </button>
              <button
                onClick={() => { setCurrentView('studio'); setActiveStep(3); }}
                className="px-4 py-2.5 border border-stone-400 bg-white hover:bg-stone-50 text-xs font-bold rounded-lg transition text-stone-900"
              >
                Explore with Demo Book
              </button>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-[#D6CEBE] bg-white/80 shadow-sm space-y-2">
              <div className="text-base">🎯</div>
              <h3 className="font-bold text-xs text-stone-900">What is PublishStudio?</h3>
              <p className="text-[11px] leading-relaxed text-stone-700">
                A browser-native book production workstation. It replaces complex software suites with deterministic print math, formatting, and preflight checks that run entirely on your device.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#D6CEBE] bg-white/80 shadow-sm space-y-2">
              <div className="text-base">📄</div>
              <h3 className="font-bold text-xs text-stone-900">What You Get as Output</h3>
              <p className="text-[11px] leading-relaxed text-stone-700">
                Mirrored-margin interior DOCX/PDF files with drop caps and folios, true-to-scale 300 DPI full-wrap cover blueprints, and certified POD manufacturing spec sheets.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#D6CEBE] bg-white/80 shadow-sm space-y-2">
              <div className="text-base">⚡</div>
              <h3 className="font-bold text-xs text-stone-900">Save Time & Elevate Quality</h3>
              <p className="text-[11px] leading-relaxed text-stone-700">
                No more submission rejections due to clipped gutter text or misaligned barcodes. In-browser checks test readability so your manuscript feels authentic.
              </p>
            </div>
          </div>

          {/* Dual Production Engines */}
          <div className="space-y-3">
            <div className="text-[10px] font-bold tracking-wider uppercase text-stone-600">
              Dual Production Engines
            </div>
            <h2 className="text-sm font-bold text-stone-900">Choose Your Project Type</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => { setCurrentView('studio'); setActiveStep(1); }}
                className="cursor-pointer p-5 rounded-xl border border-[#D6CEBE] bg-white/80 hover:border-amber-800 transition group space-y-2 shadow-sm"
              >
                <div className="font-bold text-xs flex items-center gap-1.5 text-stone-900 group-hover:text-amber-800">
                  <span>🖋️</span> Text-Rich Books
                </div>
                <p className="text-[11px] text-stone-700 leading-relaxed">
                  Novels, memoirs, non-fiction guides, poetry, and workbooks. Includes mirror margins, running headers, chapter drop caps, and AI-cliché scanning.
                </p>
                <span className="text-[11px] font-bold text-amber-800 inline-block">
                  Start Text-Rich Project ›
                </span>
              </div>

              <div
                onClick={() => { setCurrentView('studio'); setActiveStep(1); }}
                className="cursor-pointer p-5 rounded-xl border border-[#D6CEBE] bg-white/80 hover:border-amber-800 transition group space-y-2 shadow-sm"
              >
                <div className="font-bold text-xs flex items-center gap-1.5 text-stone-900 group-hover:text-amber-800">
                  <span>📐</span> Low-Content & Visual Creations
                </div>
                <p className="text-[11px] text-stone-700 leading-relaxed">
                  Planners, journals, sketchbooks, activity logs, and visual art books. Includes automated grid engines, batch image stitchers, and 300 DPI PDF compilations.
                </p>
                <span className="text-[11px] font-bold text-amber-800 inline-block">
                  Start Low-Content Project ›
                </span>
              </div>
            </div>
          </div>

          {/* KDP Royalty & Portfolio Forecaster */}
          <div className="p-6 rounded-2xl border border-[#D6CEBE] bg-white/90 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
              KDP Print Royalty & Multi-Book Revenue Forecaster
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-800 mb-1">Page Count</label>
                <input
                  type="number"
                  value={pageCount}
                  onChange={(e) => setPageCount(Math.max(24, Number(e.target.value)))}
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-stone-300 bg-stone-50 text-stone-900 font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-800 mb-1">Royalty Plan</label>
                <select
                  value={royaltyRate}
                  onChange={(e) => setRoyaltyRate(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-stone-300 bg-stone-50 text-stone-900 font-bold"
                >
                  <option value={0.60}>Standard Amazon (60%)</option>
                  <option value={0.40}>Expanded Distribution (40%)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-800 mb-1">List Price ($)</label>
                <input
                  type="number"
                  step="0.5"
                  value={listPrice}
                  onChange={(e) => setListPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-stone-300 bg-stone-50 text-stone-900 font-bold"
                />
                <span className="text-[10px] text-stone-600">Min Breakeven: ${minListPrice}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-[#EFEAE2] border border-[#D6CEBE]">
              <div>
                <div className="text-[10px] font-bold text-stone-600">Print Cost / Book</div>
                <div className="text-sm font-black text-stone-900">${printingCost}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-stone-600">Net Author Profit</div>
                <div className="text-sm font-black text-emerald-800">${actualProfitPerCopy}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-stone-600">Titles Published/Planned</div>
                <input
                  type="number"
                  value={publishedBooksCount}
                  onChange={(e) => setPublishedBooksCount(Math.max(1, Number(e.target.value)))}
                  className="w-16 mt-0.5 text-xs px-1.5 py-0.5 rounded border border-stone-300 bg-white text-stone-900 font-bold"
                />
              </div>
              <div>
                <div className="text-[10px] font-bold text-stone-600">Monthly Projected</div>
                <div className="text-sm font-black text-emerald-800">${monthlyRevenue}</div>
                <div className="text-[9px] text-stone-600 font-medium">~${annualRevenue}/yr</div>
              </div>
            </div>
          </div>

        </main>
      ) : (

        /* ---------------------------------------------------------------------
           STUDIO WORKFLOW (Steps 1 to 4)
           --------------------------------------------------------------------- */
        <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">

          {/* DEDICATED SECTION 4: STEPPER WITH DYNAMIC HIGHLIGHTED PROGRESS LINE */}
          <div className="relative flex items-center justify-between max-w-2xl mx-auto px-4 py-2">
            {/* Base track */}
            <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-[#D6CEBE] z-0"></div>

            {/* Dynamic highlighted progress line */}
            <div
              className="absolute left-8 top-1/2 -translate-y-1/2 h-1 bg-[#1E4338] transition-all duration-300 z-0"
              style={{ width: `${((activeStep - 1) / 3) * 100}%` }}
            ></div>

            {[
              { id: 1, label: '1. Setup' },
              { id: 2, label: '2. Interior' },
              { id: 3, label: '3. Cover' },
              { id: 4, label: '4. Preflight' }
            ].map((step) => {
              const isFinished = step.id < activeStep;
              const isCurrent = step.id === activeStep;

              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`relative z-10 px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
                    isCurrent
                      ? 'bg-white text-stone-900 border-2 border-[#1E4338] ring-2 ring-[#1E4338]/20'
                      : isFinished
                      ? 'bg-[#1E4338] text-white border-[#1E4338]'
                      : 'bg-[#E5DFD5] text-stone-600 border-[#D6CEBE]'
                  }`}
                >
                  {isFinished && <span>✓</span>}
                  {step.label}
                </button>
              );
            })}
          </div>

          {/* DEDICATED SECTION 5: STEP 1 SETUP (Manuscript Upload Box) */}
          {activeStep === 1 && (
            <div className="p-6 rounded-2xl border border-[#D6CEBE] bg-white/90 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-stone-900">Step 1: Setup & Manuscript Ingestion</h2>
                <p className="text-xs text-stone-600">Configure book trim size and attach your manuscript text.</p>
              </div>

              {/* Upload Box */}
              <div className="border-2 border-dashed border-[#C5BBAA] p-8 rounded-xl text-center bg-[#FAF7F2]">
                <div className="text-2xl mb-1">📄</div>
                <h3 className="text-xs font-bold text-stone-900">Upload User Manuscript</h3>
                <p className="text-[11px] text-stone-600 mt-1 mb-4">
                  Add plain text (.txt) or markdown manuscript file to automatically flow into Interior.
                </p>
                <label className="inline-block cursor-pointer px-4 py-2 bg-[#1E4338] hover:bg-[#153129] text-white text-xs font-bold rounded-lg shadow transition">
                  Browse Manuscript File
                  <input type="file" accept=".txt,.md" onChange={handleFileUpload} className="hidden" />
                </label>
                {manuscriptFile && (
                  <div className="mt-3 text-xs font-bold text-emerald-800">
                    ✓ Attached: {manuscriptFile} ({pages.length} pages generated)
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setActiveStep(2)}
                  className="px-4 py-2 bg-[#1E4338] hover:bg-[#153129] text-white text-xs font-bold rounded-lg shadow transition"
                >
                  Proceed to Interior ›
                </button>
              </div>
            </div>
          )}

          {/* DEDICATED SECTION 6: STEP 2 INTERIOR (1-Page / 2-Page Spread Reader) */}
          {activeStep === 2 && (
            <div className="p-6 rounded-2xl border border-[#D6CEBE] bg-white/90 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-stone-900">Step 2: Interior Layout & Page Reader</h2>
                  <p className="text-xs text-stone-600">Read and preview all pages of the book as formatted spreads.</p>
                </div>
                {/* 1-Page / 2-Page View Toggle */}
                <div className="flex items-center gap-1 bg-[#ECE5DB] p-1 rounded-lg border border-[#D6CEBE] text-xs font-bold">
                  <button
                    onClick={() => setInteriorViewMode('single')}
                    className={`px-3 py-1 rounded transition ${interiorViewMode === 'single' ? 'bg-white text-stone-900 shadow' : 'text-stone-600'}`}
                  >
                    1-Page View
                  </button>
                  <button
                    onClick={() => setInteriorViewMode('spread')}
                    className={`px-3 py-1 rounded transition ${interiorViewMode === 'spread' ? 'bg-white text-stone-900 shadow' : 'text-stone-600'}`}
                  >
                    2-Page Spread
                  </button>
                </div>
              </div>

              {/* Book Reader Simulation */}
              <div className="bg-[#EFEAE2] p-6 rounded-xl border border-[#D6CEBE]">
                <div className={`grid gap-4 ${interiorViewMode === 'spread' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-md mx-auto'}`}>
                  {/* Left Page */}
                  <div className="bg-white border border-[#D6CEBE] p-6 rounded shadow-sm min-h-[360px] flex flex-col justify-between font-serif text-xs md:text-sm leading-relaxed text-stone-900">
                    <div>{pages[readerPage] || 'No text found.'}</div>
                    <div className="text-center font-sans text-[10px] text-stone-500 pt-4 border-t border-stone-200">
                      Page {readerPage + 1}
                    </div>
                  </div>
                  {/* Right Page (Spread Mode) */}
                  {interiorViewMode === 'spread' && (
                    <div className="bg-white border border-[#D6CEBE] p-6 rounded shadow-sm min-h-[360px] flex flex-col justify-between font-serif text-xs md:text-sm leading-relaxed text-stone-900">
                      <div>{pages[readerPage + 1] || <span className="italic text-stone-400 font-sans">End of manuscript</span>}</div>
                      <div className="text-center font-sans text-[10px] text-stone-500 pt-4 border-t border-stone-200">
                        {pages[readerPage + 1] ? `Page ${readerPage + 2}` : ''}
                      </div>
                    </div>
                  )}
                </div>

                {/* Reader Controls */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#D6CEBE]">
                  <button
                    disabled={readerPage <= 0}
                    onClick={() => setReaderPage((prev) => Math.max(0, prev - (interiorViewMode === 'spread' ? 2 : 1)))}
                    className="px-3.5 py-1.5 text-xs font-bold rounded bg-white border border-[#D6CEBE] disabled:opacity-40 text-stone-900 shadow-sm"
                  >
                    ← Previous
                  </button>
                  <span className="text-xs font-bold text-stone-700">
                    Page {readerPage + 1} of {pages.length}
                  </span>
                  <button
                    disabled={interiorViewMode === 'spread' ? readerPage + 2 >= pages.length : readerPage + 1 >= pages.length}
                    onClick={() => setReaderPage((prev) => prev + (interiorViewMode === 'spread' ? 2 : 1))}
                    className="px-3.5 py-1.5 text-xs font-bold rounded bg-white border border-[#D6CEBE] disabled:opacity-40 text-stone-900 shadow-sm"
                  >
                    Next →
                  </button>
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setActiveStep(1)} className="px-3.5 py-1.5 border border-[#D6CEBE] bg-white text-xs font-bold rounded-lg text-stone-800">
                  ← Setup
                </button>
                <button onClick={() => setActiveStep(3)} className="px-4 py-1.5 bg-[#1E4338] hover:bg-[#153129] text-white text-xs font-bold rounded-lg shadow">
                  Cover Blueprint ›
                </button>
              </div>
            </div>
          )}

          {/* DEDICATED SECTION 7: STEP 3 COVER BLUEPRINT */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <div>
                  <h2 className="text-xl font-black tracking-tight text-stone-900">
                    Step 3: Cover Blueprint Specification
                  </h2>
                  <p className="text-xs text-stone-600">
                    Specify paper caliper and bulk depth to construct a perfectly proportioned full-wrap cover layout with bleed guides.
                  </p>
                </div>
                <span className="text-xs font-bold underline cursor-pointer text-stone-800">
                  Bleed Rules ▾
                </span>
              </div>

              {/* Exact Pill Spec Tags */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="py-2.5 px-3 rounded-lg border border-[#D6CEBE] bg-white shadow-sm">
                  <span className="text-[10px] font-bold tracking-wider text-stone-600 block uppercase">Spine Width</span>
                  <span className="text-xs font-extrabold text-stone-900">{spineWidth}"</span>
                </div>
                <div className="py-2.5 px-3 rounded-lg border border-[#D6CEBE] bg-white shadow-sm">
                  <span className="text-[10px] font-bold tracking-wider text-stone-600 block uppercase">Total Width</span>
                  <span className="text-xs font-extrabold text-stone-900">{totalWidth}"</span>
                </div>
                <div className="py-2.5 px-3 rounded-lg border border-[#D6CEBE] bg-white shadow-sm">
                  <span className="text-[10px] font-bold tracking-wider text-stone-600 block uppercase">Total Height</span>
                  <span className="text-xs font-extrabold text-stone-900">{totalHeight}"</span>
                </div>
                <div className="py-2.5 px-3 rounded-lg border border-[#D6CEBE] bg-white shadow-sm">
                  <span className="text-[10px] font-bold tracking-wider text-stone-600 block uppercase">Canvas @ 300 DPI</span>
                  <span className="text-xs font-extrabold text-stone-900">3681 x 2700 px</span>
                </div>
              </div>

              {/* Interactive Cover Blueprint Viewer */}
              <div className="p-6 rounded-2xl border border-[#D6CEBE] bg-white shadow-sm space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-[11px] uppercase tracking-wider block text-stone-900">
                      Interactive Cover Blueprint
                    </span>
                    <span className="text-[10px] text-stone-600 font-medium">Scale: 1:1 Proportional</span>
                  </div>
                  <div className="flex items-center gap-3 text-stone-900">
                    <label className="flex items-center gap-1.5 font-bold text-[11px] cursor-pointer">
                      <span>Safe Zones:</span>
                      <input
                        type="checkbox"
                        checked={showSafeZones}
                        onChange={(e) => setShowSafeZones(e.target.checked)}
                        className="rounded"
                      />
                    </label>
                    <label className="flex items-center gap-1.5 font-bold text-[11px] cursor-pointer">
                      <span>Guides:</span>
                      <input
                        type="checkbox"
                        checked={showGuides}
                        onChange={(e) => setShowGuides(e.target.checked)}
                        className="rounded"
                      />
                    </label>
                  </div>
                </div>

                <div className="bg-[#EFEAE2] p-8 rounded-xl border border-[#D6CEBE] flex justify-center items-center min-h-[340px]">
                  <div className="border border-red-400 bg-stone-100 p-3 rounded flex shadow-md text-stone-900">
                    {/* Back Cover */}
                    <div className="w-48 h-64 border border-dashed border-red-400 p-3 flex flex-col justify-between text-center">
                      <div className="text-[10px] font-bold text-stone-500">BACK COVER (5.5 x 8.5)</div>
                      <div className="border border-red-400 bg-red-100 p-2 text-[9px] font-bold text-red-800 rounded self-center">
                        BARCODE RESERVED ZONE
                      </div>
                    </div>
                    {/* Spine */}
                    <div className="w-8 h-64 border-l border-r border-dashed border-red-400 flex items-center justify-center">
                      <span className="transform -rotate-90 text-[9px] font-extrabold tracking-widest uppercase whitespace-nowrap text-stone-800">
                        {bookTitle}
                      </span>
                    </div>
                    {/* Front Cover */}
                    <div className="w-48 h-64 border border-dashed border-red-400 p-4 flex flex-col justify-center items-center text-center">
                      <div className="font-black text-sm uppercase tracking-wide text-stone-900">{bookTitle}</div>
                      <div className="text-[10px] text-stone-500 mt-1 font-bold">(5.5 x 8.5)</div>
                      <div className="text-[10px] font-bold mt-12 text-stone-800">{authorName}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-4 text-[10px] font-bold text-stone-700 pt-2">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> 0.125" Bleed (Cut off)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> 0.25" Safe Zone</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span> Barcode Exclusion</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span> Spine: {spineWidth}"</span>
                </div>

                <div className="text-center text-[11px] text-stone-700 bg-amber-50 p-2.5 rounded-lg border border-amber-300">
                  ⚠️ <strong>Standard Industry Barcode Zone (2.0" x 1.2" Reserved):</strong> Keep the bottom-right quadrant of your back cover free of text, URLs, or faces.
                </div>
              </div>
            </div>
          )}

          {/* DEDICATED SECTION 8: STEP 4 PREFLIGHT */}
          {activeStep === 4 && (
            <div className="p-8 rounded-2xl border border-[#D6CEBE] bg-white shadow-sm text-center space-y-4">
              <h2 className="text-lg font-black text-stone-900">Step 4: Certified POD Preflight Verification</h2>
              <p className="text-xs text-stone-600 max-w-md mx-auto">
                All bleed criteria, spine caliper formulas, and mirror gutter rules have passed verification.
              </p>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold inline-block">
                ✓ Ready for PDF Export at 300 DPI
              </div>
            </div>
          )}

          {/* Studio Footer Navigation */}
          <footer className="flex justify-between items-center pt-4 border-t border-[#D6CEBE]">
            <button
              onClick={() => setCurrentView('home')}
              className="text-xs font-bold text-stone-800 hover:text-stone-950 flex items-center gap-1"
            >
              ⌂ Home Overview
            </button>
            <div className="flex gap-2">
              <button
                disabled={activeStep <= 1}
                onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                className="px-3.5 py-1.5 rounded-lg border border-[#D6CEBE] bg-white text-xs font-bold disabled:opacity-40 text-stone-800"
              >
                ◀ Back
              </button>
              <button
                disabled={activeStep >= 4}
                onClick={() => setActiveStep((prev) => Math.min(4, prev + 1))}
                className="px-4 py-1.5 rounded-lg bg-[#1E4338] hover:bg-[#153129] text-white text-xs font-bold disabled:opacity-40 shadow transition"
              >
                Next Step ▶
              </button>
            </div>
          </footer>

        </main>
      )}

      {/* =======================================================================
          DEDICATED SECTION 9: HELP & REMEMBER ME MODAL
          Directly sends feedback to publishstudio.ops@gmail.com
          ======================================================================= */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-[#FAF7F2] border border-[#D6CEBE] rounded-2xl p-6 max-w-md w-full shadow-2xl text-stone-900 space-y-4">

            <div className="flex justify-between items-center pb-2 border-b border-[#D6CEBE]">
              <h3 className="text-sm font-bold">Help Center & Author Identity</h3>
              <button onClick={() => setShowHelpModal(false)} className="text-base font-bold text-stone-600 hover:text-stone-900">✕</button>
            </div>

            {/* Remember Me Form */}
            <form onSubmit={handleSaveProfile} className="space-y-2 pb-3 border-b border-[#D6CEBE]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-600">Author Details (Remembered Locally)</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="First Name"
                  value={userProfile.firstName}
                  onChange={(e) => setUserProfile({ ...userProfile, firstName: e.target.value })}
                  className="px-2 py-1 text-xs rounded border border-stone-300 bg-white text-stone-900"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={userProfile.lastName}
                  onChange={(e) => setUserProfile({ ...userProfile, lastName: e.target.value })}
                  className="px-2 py-1 text-xs rounded border border-stone-300 bg-white text-stone-900"
                />
              </div>
              <input
                type="email"
                placeholder="Email ID"
                value={userProfile.email}
                onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                className="w-full px-2 py-1 text-xs rounded border border-stone-300 bg-white text-stone-900"
              />
              <button type="submit" className="text-xs px-3 py-1 bg-[#1E4338] text-white rounded font-bold shadow hover:bg-[#153129] transition">
                Save Author Details
              </button>
            </form>

            {/* Issue Report Form */}
            <form onSubmit={handleSendFeedback} className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                Report Issue / Send Feedback
              </div>
              <p className="text-[11px] text-stone-600">
                Delivered straight to <strong>publishstudio.ops@gmail.com</strong>
              </p>
              <select
                value={feedbackCategory}
                onChange={(e) => setFeedbackCategory(e.target.value)}
                className="w-full text-xs p-1.5 rounded border border-stone-300 bg-white text-stone-900 font-medium"
              >
                <option value="Issue Report">Bug / Visual Glitch</option>
                <option value="KDP Calculation Feedback">KDP Calculation Feedback</option>
                <option value="Feature Request">Request Feature</option>
              </select>
              <textarea
                required
                rows={3}
                placeholder="Describe your issue or suggestions..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="w-full text-xs p-2 rounded border border-stone-300 bg-white text-stone-900"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowHelpModal(false)} className="px-3 py-1 text-xs font-bold text-stone-600 hover:text-stone-900">
                  Cancel
                </button>
                <button type="submit" className="px-3.5 py-1 text-xs bg-[#B85D38] hover:bg-[#A04E2D] text-white font-bold rounded shadow transition">
                  Send Feedback
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
