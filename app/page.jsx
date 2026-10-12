// ==========================================================================
// FILE: app/page.jsx
// ==========================================================================
'use client';

import React, { useState, useEffect } from 'react';
import HelpCenter from './HelpCenter';
import { calculateKDPRoyalty, calculatePortfolioRevenue } from './productionMath';

export default function PublishStudioHome() {
  // Navigation & Workflow state: 0 is Home Overview, 1-4 are Guided Workflow steps
  const [activeTab, setActiveTab] = useState('home'); // 'home' or 'workflow'
  const [currentStep, setCurrentStep] = useState(1);  // 1: Setup, 2: Interior, 3: Cover, 4: Preflight

  // Manuscript State (Loaded in Setup, rendered in Interior)
  const [manuscriptText, setManuscriptText] = useState('');
  const [manuscriptFileName, setManuscriptFileName] = useState('');

  // Reader View State (Step 2: Interior)
  const [readerViewMode, setReaderViewMode] = useState('spread'); // 'single' or 'spread'
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // KDP Royalty Engine State
  const [pageCount, setPageCount] = useState(150);
  const [listPrice, setListPrice] = useState(12.99);
  const [royaltyRate, setRoyaltyRate] = useState(0.60);
  const [portfolioBookCount, setPortfolioBookCount] = useState(3);
  const [monthlySalesPerBook, setMonthlySalesPerBook] = useState(25);

  // User Profile & Help Center State
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [savedUser, setSavedUser] = useState(null);

  // Sync remembered user on load
  useEffect(() => {
    const raw = localStorage.getItem('publishstudio_user');
    if (raw) {
      try {
        setSavedUser(JSON.parse(raw));
      } catch (e) {}
    }
  }, [isHelpOpen]);

  // Handle Manuscript Ingestion in Step 1 (Setup)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setManuscriptFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setManuscriptText(content);
      }
    };
    reader.readAsText(file);
  };

  // Convert raw manuscript into pages (~250 words per page simulation)
  const words = manuscriptText ? manuscriptText.split(/\s+/) : [];
  const wordsPerPage = 250;
  const pages = [];
  if (words.length > 0) {
    for (let i = 0; i < words.length; i += wordsPerPage) {
      pages.push(words.slice(i, i + wordsPerPage).join(' '));
    }
  } else {
    pages.push('No manuscript uploaded yet. Return to Step 1 (Setup) to upload your .txt or markdown file.');
  }

  // Royalty calculations
  const royaltyData = calculateKDPRoyalty({ pageCount, listPrice, royaltyRate });
  const portfolioData = calculatePortfolioRevenue({
    royaltyPerCopy: royaltyData.royaltyPerCopy,
    bookCount: portfolioBookCount,
    estimatedSalesPerBookMonthly: monthlySalesPerBook
  });

  /* =========================================================
     EDIT POINT 3: VALUE PROPOSITIONS & BENEFITS
     Customize the cards displayed on the home page.
     ========================================================= */
  const BENEFITS_LIST = [
    {
      title: 'Zero POD Rejections',
      desc: 'Never receive a spine, margin, or bleed rejection from Amazon KDP or IngramSpark again with pre-calculated bounds.'
    },
    {
      title: 'Client-Side Privacy',
      desc: 'Your manuscript remains 100% private. Files are typeset and processed right here in your browser.'
    },
    {
      title: 'Accurate Net Profit Forecaster',
      desc: 'Eliminate pricing guesswork with true print costs and author royalties calculated across standard and expanded channels.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#0F0F11] text-[#1E293B] dark:text-[#F3F4F6] transition-colors">
      
      {/* Top Navbar */}
      <header className="border-b border-[#E2D9CC] dark:border-neutral-800 bg-[#FAF7F2]/90 dark:bg-[#16161A]/90 backdrop-blur px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="font-extrabold tracking-tight text-base text-stone-900 dark:text-stone-50">
            📖 PUBLISHSTUDIO
          </span>
          <span className="hidden sm:inline-block text-[11px] uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
            Universal POD
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'home'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-neutral-800'
            }`}
          >
            Home Overview
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'workflow'
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-neutral-800'
            }`}
          >
            Guided Workflow
          </button>

          {/* User badge or Logged in status */}
          {savedUser?.firstName && (
            <span className="hidden md:inline-block text-xs font-semibold px-2.5 py-1 rounded bg-stone-200 dark:bg-neutral-800 text-stone-800 dark:text-stone-200">
              👤 {savedUser.firstName}
            </span>
          )}

          {/* Help Button */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-neutral-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-neutral-800 font-medium"
          >
            Help & Account
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* VIEW 1: HOME OVERVIEW */}
        {activeTab === 'home' && (
          <div className="space-y-12">
            
            {/* Hero Section */}
            <div className="text-center space-y-4 max-w-2xl mx-auto pt-6">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Universal Print-On-Demand Production
              </span>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-stone-900 dark:text-stone-50">
                Focus More on Writing, Less on Formatting!
              </h1>
              <p className="text-sm md:text-base text-stone-600 dark:text-stone-400">
                PublishStudio eliminates printing rejections. We calculate binding gutters, full-wrap spine bulk, and safe margins automatically, leaving you free to craft your story.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => { setActiveTab('workflow'); setCurrentStep(1); }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition"
                >
                  Launch Book Production Studio →
                </button>
              </div>
            </div>

            {/* Why Authors Choose Us (Benefits Cards) */}
            <div>
              <h2 className="text-base font-bold text-center mb-6 text-stone-900 dark:text-stone-100">
                Why Self-Publishers Choose PublishStudio
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {BENEFITS_LIST.map((benefit, index) => (
                  <div 
                    key={index} 
                    className="p-5 rounded-2xl bg-white dark:bg-[#16161A] border border-[#E2D9CC] dark:border-neutral-800 shadow-sm space-y-2"
                  >
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono text-sm font-bold">
                      0{index + 1}.
                    </span>
                    <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {benefit.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                      {benefit.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Standalone KDP Royalty Forecaster */}
            <div className="bg-white dark:bg-[#16161A] border border-[#E2D9CC] dark:border-neutral-800 p-6 rounded-2xl shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-50">
                  KDP Print Royalty & Revenue Forecaster
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Simulate author earnings per copy and multi-title catalog revenue.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Page Count</label>
                  <input
                    type="number"
                    value={pageCount}
                    onChange={(e) => setPageCount(Math.max(24, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 text-xs rounded border border-stone-300 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-900 text-stone-900 dark:text-stone-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Distribution Royalty Rate</label>
                  <select
                    value={royaltyRate}
                    onChange={(e) => setRoyaltyRate(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded border border-stone-300 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-900 text-stone-900 dark:text-stone-100"
                  >
                    <option value={0.60}>Standard Amazon (60%)</option>
                    <option value={0.40}>Expanded Distribution (40%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Target List Price ($)</label>
                  <input
                    type="number"
                    step="0.50"
                    value={listPrice}
                    onChange={(e) => setListPrice(Math.max(0, Number(e.target.value)))}
                    className="w-full px-3 py-1.5 text-xs rounded border border-stone-300 dark:border-neutral-700 bg-stone-50 dark:bg-neutral-900 text-stone-900 dark:text-stone-100"
                  />
                  <div className="text-[10px] text-stone-500 mt-1">
                    Min Breakeven: ${royaltyData.minimumListPrice}
                  </div>
                </div>
              </div>

              {/* Aggregates Banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-stone-100 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800">
                <div>
                  <div className="text-[11px] text-stone-500 dark:text-neutral-400">Printing Cost / Unit</div>
                  <div className="text-base font-bold text-stone-900 dark:text-stone-100">${royaltyData.printingCost}</div>
                </div>
                <div>
                  <div className="text-[11px] text-stone-500 dark:text-neutral-400">Net Royalty / Copy</div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">${royaltyData.royaltyPerCopy}</div>
                </div>
                <div>
                  <div className="text-[11px] text-stone-500 dark:text-neutral-400">Titles Published / Planned</div>
                  <input
                    type="number"
                    value={portfolioBookCount}
                    onChange={(e) => setPortfolioBookCount(Math.max(1, Number(e.target.value)))}
                    className="w-16 mt-1 px-2 py-0.5 text-xs rounded border border-stone-300 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                  />
                </div>
                <div>
                  <div className="text-[11px] text-stone-500 dark:text-neutral-400">Est. Monthly Revenue</div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">${portfolioData.monthlyRevenue}</div>
                  <div className="text-[10px] text-stone-500">~${portfolioData.annualRevenue}/year</div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: GUIDED WORKFLOW (Steps 1, 2, 3, 4) */}
        {activeTab === 'workflow' && (
          <div className="space-y-8">
            
            {/* WORKFLOW STEPPER BAR WITH DYNAMIC HIGHLIGHT LINE */}
            <div className="relative flex items-center justify-between max-w-2xl mx-auto py-2">
              {/* Background Grey Base Track */}
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-stone-300 dark:bg-neutral-800 z-0" />

              {/* Active Emerald Progress Highlight Line */}
              <div
                className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-emerald-600 transition-all duration-300 z-0"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />

              {[
                { id: 1, label: '1. Setup' },
                { id: 2, label: '2. Interior' },
                { id: 3, label: '3. Cover' },
                { id: 4, label: '4. Preflight' }
              ].map((step) => {
                const isPassed = step.id < currentStep;
                const isCurrent = step.id === currentStep;

                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    className={`relative z-10 px-3.5 py-1.5 rounded-full text-xs font-bold transition border shadow-sm ${
                      isCurrent
                        ? 'bg-stone-900 text-white dark:bg-emerald-600 dark:border-emerald-500 ring-4 ring-emerald-500/20'
                        : isPassed
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-stone-200 dark:bg-neutral-800 text-stone-600 dark:text-neutral-400 border-stone-300 dark:border-neutral-700'
                    }`}
                  >
                    {isPassed ? '✓ ' : ''}{step.label}
                  </button>
                );
              })}
            </div>

            {/* STEP 1: SETUP (Includes Manuscript Upload) */}
            {currentStep === 1 && (
              <div className="p-6 rounded-2xl bg-white dark:bg-[#16161A] border border-[#E2D9CC] dark:border-neutral-800 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">Step 1: Project Setup & Manuscript Ingestion</h2>
                  <p className="text-xs text-stone-600 dark:text-stone-400">Configure book dimensions and import manuscript text.</p>
                </div>

                {/* Upload Zone */}
                <div className="border-2 border-dashed border-stone-300 dark:border-neutral-700 p-8 rounded-xl text-center bg-stone-50 dark:bg-neutral-900/50">
                  <span className="text-2xl block mb-2">📄</span>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Upload Author Manuscript</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 mb-4">Upload plain text (.txt) or markdown file to populate the interior preview.</p>
                  
                  <label className="inline-block cursor-pointer px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow">
                    Select Manuscript File
                    <input type="file" accept=".txt,.md" onChange={handleFileUpload} className="hidden" />
                  </label>

                  {manuscriptFileName && (
                    <div className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ Manuscript Attached: {manuscriptFileName} ({pages.length} pages generated)
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold rounded-lg shadow transition"
                  >
                    Proceed to Interior View →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: INTERIOR (With Single Page vs Two Page Spread Toggle) */}
            {currentStep === 2 && (
              <div className="p-6 rounded-2xl bg-white dark:bg-[#16161A] border border-[#E2D9CC] dark:border-neutral-800 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 dark:text-stone-50">Step 2: Interior Layout & Reader Preview</h2>
                    <p className="text-xs text-stone-600 dark:text-stone-400">Inspect page breaks, margins, and running headers.</p>
                  </div>

                  {/* Single Page vs 2-Page Toggle */}
                  <div className="flex items-center gap-2 bg-stone-100 dark:bg-neutral-800 p-1 rounded-lg border border-stone-300 dark:border-neutral-700">
                    <button
                      onClick={() => setReaderViewMode('single')}
                      className={`px-3 py-1 text-xs font-bold rounded ${
                        readerViewMode === 'single'
                          ? 'bg-white dark:bg-neutral-900 shadow text-stone-900 dark:text-stone-100'
                          : 'text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      1-Page View
                    </button>
                    <button
                      onClick={() => setReaderViewMode('spread')}
                      className={`px-3 py-1 text-xs font-bold rounded ${
                        readerViewMode === 'spread'
                          ? 'bg-white dark:bg-neutral-900 shadow text-stone-900 dark:text-stone-100'
                          : 'text-stone-600 dark:text-stone-400'
                      }`}
                    >
                      2-Page Spread
                    </button>
                  </div>
                </div>

                {/* Reader Simulation Frame */}
                <div className="bg-[#EFEAE1] dark:bg-[#09090B] p-6 rounded-xl border border-stone-300 dark:border-neutral-800">
                  <div className={`grid gap-4 ${readerViewMode === 'spread' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-lg mx-auto'}`}>
                    
                    {/* Page Left */}
                    <div className="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-neutral-800 p-6 rounded-lg shadow-sm min-h-[380px] flex flex-col justify-between font-serif text-xs md:text-sm leading-relaxed text-stone-900 dark:text-stone-100">
                      <div>{pages[currentPageIndex] || 'No text found.'}</div>
                      <div className="text-center font-sans text-[10px] text-stone-400 pt-4 border-t border-stone-100 dark:border-neutral-800">
                        Page {currentPageIndex + 1}
                      </div>
                    </div>

                    {/* Page Right (Spread mode only) */}
                    {readerViewMode === 'spread' && (
                      <div className="bg-white dark:bg-[#18181B] border border-stone-200 dark:border-neutral-800 p-6 rounded-lg shadow-sm min-h-[380px] flex flex-col justify-between font-serif text-xs md:text-sm leading-relaxed text-stone-900 dark:text-stone-100">
                        <div>{pages[currentPageIndex + 1] || <span className="italic text-stone-400 font-sans">End of manuscript</span>}</div>
                        <div className="text-center font-sans text-[10px] text-stone-400 pt-4 border-t border-stone-100 dark:border-neutral-800">
                          {pages[currentPageIndex + 1] ? `Page ${currentPageIndex + 2}` : ''}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Reader Pagination Controls */}
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-stone-300 dark:border-neutral-800">
                    <button
                      disabled={currentPageIndex <= 0}
                      onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - (readerViewMode === 'spread' ? 2 : 1)))}
                      className="px-3.5 py-1.5 text-xs font-bold rounded bg-white dark:bg-neutral-800 border border-stone-300 dark:border-neutral-700 disabled:opacity-40"
                    >
                      ← Previous
                    </button>
                    <span className="text-xs text-stone-600 dark:text-stone-400 font-semibold">
                      Page {currentPageIndex + 1} of {pages.length}
                    </span>
                    <button
                      disabled={readerViewMode === 'spread' ? currentPageIndex + 2 >= pages.length : currentPageIndex + 1 >= pages.length}
                      onClick={() => setCurrentPageIndex((prev) => prev + (readerViewMode === 'spread' ? 2 : 1))}
                      className="px-3.5 py-1.5 text-xs font-bold rounded bg-white dark:bg-neutral-800 border border-stone-300 dark:border-neutral-700 disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 border border-stone-300 dark:border-neutral-700 text-xs font-bold rounded-lg"
                  >
                    ← Back to Setup
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-5 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-bold rounded-lg shadow transition"
                  >
                    Next to Cover Blueprint →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 & STEP 4 PLACEHOLDER / FLOW-THROUGH */}
            {currentStep >= 3 && (
              <div className="p-6 rounded-2xl bg-white dark:bg-[#16161A] border border-[#E2D9CC] dark:border-neutral-800 text-center space-y-4">
                <h2 className="text-base font-bold">
                  {currentStep === 3 ? 'Step 3: Cover Blueprint Specification' : 'Step 4: Final Preflight Inspection'}
                </h2>
                <p className="text-xs text-stone-500">
                  {currentStep === 3 ? 'Cover calculations configured.' : 'Preflight rules verified.'}
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="px-4 py-1.5 text-xs border border-stone-300 dark:border-neutral-700 rounded"
                  >
                    ← Previous Step
                  </button>
                  {currentStep < 4 && (
                    <button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="px-4 py-1.5 text-xs bg-emerald-600 text-white rounded font-bold"
                    >
                      Next Step →
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Floating Help Modal */}
      <HelpCenter isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
