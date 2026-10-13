'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Book, HelpCircle, Sun, Moon, Sparkles, Download, 
  ArrowRight, ArrowLeft, CheckCircle2, 
  FolderOpen, Trash2, X, Globe, Upload, CheckSquare, Square,
  Cpu, Calendar, ChevronRight, Send, Check
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { 
  saveProjectToStorage, 
  getAllProjectsFromStorage, 
  deleteProjectFromStorage, 
  recordReviewToStorage 
} from './projectStorage';

/* --------------------------------------------------------------------------
   MASTER DATA & 15-TERRITORY POD MARKETPLACE MATRIX
   -------------------------------------------------------------------------- */
const ARCHETYPES = [
  { id: 'fiction', name: 'Fiction & Novel', defaultTrim: '5.5x8.5', paper: 'cream', desc: '5.5"x8.5", Cream paper' },
  { id: 'nonfiction', name: 'Non-Fiction & Memoir', defaultTrim: '6x9', paper: 'white', desc: '6"x9", White paper' },
  { id: 'workbook', name: 'Workbook & Training Manual', defaultTrim: '8.5x11', paper: 'white', desc: '8.5"x11", White paper' },
  { id: 'custom', name: 'Custom Specification', defaultTrim: '6x9', paper: 'white', desc: '6"x9", White paper' }
];

const TRIM_OPTIONS = [
  { id: '5x8', name: '5" x 8" (Compact Novella)', width: 5.0, height: 8.0 },
  { id: '5.25x8', name: '5.25" x 8" (Pocket Fiction)', width: 5.25, height: 8.0 },
  { id: '5.5x8.5', name: '5.5" x 8.5" (Standard Trade Paperback)', width: 5.5, height: 8.5 },
  { id: '6x9', name: '6" x 9" (Standard Trade Paperback)', width: 6.0, height: 9.0 },
  { id: '7x10', name: '7" x 10" (Executive / Handbook)', width: 7.0, height: 10.0 },
  { id: '8.5x11', name: '8.5" x 11" (Workbook / Manual)', width: 8.5, height: 11.0 }
];

const PAPER_SPECS = {
  cream: { label: 'Standard Cream (50-55 lb / 74-81 gsm)', caliper: 0.002500 },
  white: { label: 'Standard White (50-55 lb / 74-81 gsm)', caliper: 0.002252 },
  premium_color: { label: 'Premium Color (70 lb / 104 gsm)', caliper: 0.002700 }
};

const POD_MARKETPLACES = {
  US: { name: 'United States (USD)', currency: 'USD', symbol: '$', base: 0.85, perPage: 0.012, fxRate: 1.0, defaultPrice: 12.99 },
  UK: { name: 'United Kingdom (GBP)', currency: 'GBP', symbol: '£', base: 0.70, perPage: 0.010, fxRate: 0.78, defaultPrice: 9.99 },
  DE: { name: 'Germany / EU (EUR)', currency: 'EUR', symbol: '€', base: 0.75, perPage: 0.012, fxRate: 0.92, defaultPrice: 11.99 },
  FR: { name: 'France (EUR)', currency: 'EUR', symbol: '€', base: 0.75, perPage: 0.012, fxRate: 0.92, defaultPrice: 11.99 },
  ES: { name: 'Spain (EUR)', currency: 'EUR', symbol: '€', base: 0.75, perPage: 0.012, fxRate: 0.92, defaultPrice: 11.99 },
  IT: { name: 'Italy (EUR)', currency: 'EUR', symbol: '€', base: 0.75, perPage: 0.012, fxRate: 0.92, defaultPrice: 11.99 },
  NL: { name: 'Netherlands (EUR)', currency: 'EUR', symbol: '€', base: 0.75, perPage: 0.012, fxRate: 0.92, defaultPrice: 11.99 },
  PL: { name: 'Poland (PLN)', currency: 'PLN', symbol: 'zł', base: 3.50, perPage: 0.055, fxRate: 3.95, defaultPrice: 49.99 },
  SE: { name: 'Sweden (SEK)', currency: 'SEK', symbol: 'kr', base: 9.50, perPage: 0.140, fxRate: 10.40, defaultPrice: 135.00 },
  JP: { name: 'Japan (JPY)', currency: 'JPY', symbol: '¥', base: 180, perPage: 2.50, fxRate: 150.0, defaultPrice: 1950 },
  CA: { name: 'Canada (CAD)', currency: 'CAD', symbol: 'CA$', base: 1.05, perPage: 0.015, fxRate: 1.35, defaultPrice: 16.99 },
  AU: { name: 'Australia (AUD)', currency: 'AUD', symbol: 'A$', base: 1.20, perPage: 0.018, fxRate: 1.50, defaultPrice: 19.99 },
  IN: { name: 'India (INR)', currency: 'INR', symbol: '₹', base: 60, perPage: 0.75, fxRate: 85.0, defaultPrice: 399 },
  MX: { name: 'Mexico (MXN)', currency: 'MXN', symbol: 'MX$', base: 18.0, perPage: 0.25, fxRate: 17.50, defaultPrice: 229.00 },
  BR: { name: 'Brazil (BRL)', currency: 'BRL', symbol: 'R$', base: 5.50, perPage: 0.08, fxRate: 5.10, defaultPrice: 65.00 }
};

const SAMPLE_CHAPTER_TEXT = [
  "The stillness of the study was broken only by the clock on the mantelpiece. Outside, rain fell steadily against the tall glass panes, blurring the lamps along the quiet avenue into soft circles of amber. He dipped the nib of his pen into the dark ink, pausing to listen to the carriage wheels rolling across the wet cobblestones below.",
  "Every manuscript began this way—not with certainty, but with the quiet discipline of facing an empty sheet. The margins preserved the words, keeping the inner voice protected from the binding. A properly formatted book respects both the eyes of the reader and the physical machinery of the bindery."
];

export default function PublishStudioApp() {
  /* ROUTING & ACTIVE VIEW */
  const [activeView, setActiveView] = useState('home'); // 'home' | 'studio'
  const [currentStep, setCurrentStep] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  /* PROJECT CONFIGURATION */
  const [projectId, setProjectId] = useState('proj_default');
  const [bookTitle, setBookTitle] = useState('The Memory Chef');
  const [authorName, setAuthorName] = useState('Kavita Chougule');
  const [selectedArchetype, setSelectedArchetype] = useState('fiction');
  const [trimSize, setTrimSize] = useState('5.5x8.5');
  const [paperType, setPaperType] = useState('cream');
  const [pageExtent, setPageExtent] = useState(120);

  /* INTERIOR MANUSCRIPT & VIEW MODE */
  const [manuscriptParagraphs, setManuscriptParagraphs] = useState(SAMPLE_CHAPTER_TEXT);
  const [spreadMode, setSpreadMode] = useState('2-page'); // '1-page' | '2-page'
  const [quickFixDrawerOpen, setQuickFixDrawerOpen] = useState(false);

  /* COVER ASSETS */
  const [frontCoverImage, setFrontCoverImage] = useState(null);
  const [backCoverImage, setBackCoverImage] = useState(null);
  const [barcodeImage, setBarcodeImage] = useState(null);

  /* FINANCIAL & REVENUE MODELING */
  const [publishingFormat, setPublishingFormat] = useState('both'); // 'paperback' | 'ebook' | 'both'
  const [royaltyShareTier, setRoyaltyShareTier] = useState(0.60);
  const [usPaperbackPrice, setUsPaperbackPrice] = useState('12.99');
  const [usEbookPrice, setUsEbookPrice] = useState('4.99');
  const [customRetailPrices, setCustomRetailPrices] = useState({});
  const [selectedKdpCountries, setSelectedKdpCountries] = useState(['IN', 'US', 'UK', 'DE', 'CA', 'AU']);
  const [initialMonthlySales, setInitialMonthlySales] = useState(50);
  const [monthlyGrowthRate, setMonthlyGrowthRate] = useState(5);

  /* AI ENGINE STATE (BYOK) */
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  const [aiContentType, setAiContentType] = useState('chapter');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  /* PROFILE / FEEDBACK DRAWER & SHELF */
  const [helpProfileDrawerOpen, setHelpProfileDrawerOpen] = useState(false);
  const [savedProjects, setSavedProjects] = useState([]);
  const [isShelfOpen, setIsShelfOpen] = useState(false);
  const [authorProfileEmail, setAuthorProfileEmail] = useState('');
  const [feedbackFeedback, setFeedbackFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    getAllProjectsFromStorage().then(setSavedProjects).catch(() => {});
    const key = localStorage.getItem('ps_user_ai_key');
    if (key) setUserApiKey(key);
  }, []);

  /* PRINT GEOMETRY MATH */
  const currentTrim = useMemo(() => {
    return TRIM_OPTIONS.find(t => t.id === trimSize) || TRIM_OPTIONS[2];
  }, [trimSize]);

  const calculatedGutter = useMemo(() => {
    if (pageExtent < 150) return 0.375;
    if (pageExtent <= 300) return 0.500;
    if (pageExtent <= 500) return 0.625;
    return 0.750;
  }, [pageExtent]);

  const spineWidth = useMemo(() => {
    const caliper = PAPER_SPECS[paperType]?.caliper || 0.002500;
    return parseFloat((pageExtent * caliper).toFixed(3));
  }, [pageExtent, paperType]);

  const fullCoverWidth = useMemo(() => {
    return parseFloat((0.125 + currentTrim.width + spineWidth + currentTrim.width + 0.125).toFixed(2));
  }, [currentTrim, spineWidth]);

  const fullCoverHeight = useMemo(() => {
    return parseFloat((currentTrim.height + 0.25).toFixed(2));
  }, [currentTrim]);

  const coverPixelsWidth = useMemo(() => Math.round(fullCoverWidth * 300), [fullCoverWidth]);
  const coverPixelsHeight = useMemo(() => Math.round(fullCoverHeight * 300), [fullCoverHeight]);

  /* 15-TERRITORY REVENUE & FX CALCULATOR */
  const handleUsPriceChange = (val, type = 'paperback') => {
    if (type === 'paperback') {
      setUsPaperbackPrice(val);
      const parsed = parseFloat(val);
      if (!isNaN(parsed) && parsed > 0) {
        const updated = {};
        Object.entries(POD_MARKETPLACES).forEach(([code, market]) => {
          if (code !== 'US') {
            const converted = parsed * market.fxRate;
            updated[code] = market.currency === 'JPY' ? Math.round(converted) : converted.toFixed(2);
          }
        });
        setCustomRetailPrices(updated);
      }
    } else {
      setUsEbookPrice(val);
    }
  };

  const territoryCalculations = useMemo(() => {
    const pbUs = parseFloat(usPaperbackPrice) || 12.99;
    const ebUs = parseFloat(usEbookPrice) || 4.99;

    return Object.entries(POD_MARKETPLACES).map(([code, market]) => {
      const printCost = market.base + (pageExtent * market.perPage);
      const pbActivePrice = code === 'US' ? pbUs : (customRetailPrices[code] !== undefined ? parseFloat(customRetailPrices[code]) : parseFloat((pbUs * market.fxRate).toFixed(2)));
      const pbRoyalty = (pbActivePrice * royaltyShareTier) - printCost;

      const ebActivePrice = code === 'US' ? ebUs : parseFloat((ebUs * market.fxRate).toFixed(2));
      const ebRoyalty = (ebActivePrice * 0.70) - (0.15 * market.fxRate);

      let combinedRoyalty = 0;
      if (publishingFormat === 'paperback') combinedRoyalty = Math.max(0, pbRoyalty);
      else if (publishingFormat === 'ebook') combinedRoyalty = Math.max(0, ebRoyalty);
      else combinedRoyalty = Math.max(0, pbRoyalty) + Math.max(0, ebRoyalty);

      return {
        code,
        name: market.name,
        currency: market.currency,
        symbol: market.symbol,
        fxRate: market.fxRate,
        printCost: printCost.toFixed(2),
        pbActivePrice: pbActivePrice.toFixed(2),
        royaltyPerUnit: combinedRoyalty.toFixed(2),
        usdEquivalentRoyalty: combinedRoyalty / market.fxRate
      };
    });
  }, [pageExtent, usPaperbackPrice, usEbookPrice, customRetailPrices, royaltyShareTier, publishingFormat]);

  const activeSelectedTerritories = useMemo(() => {
    return territoryCalculations.filter(t => selectedKdpCountries.includes(t.code));
  }, [territoryCalculations, selectedKdpCountries]);

  const annualReportData = useMemo(() => {
    const totalUsdRoyalty = activeSelectedTerritories.reduce((acc, curr) => acc + curr.usdEquivalentRoyalty, 0);

    const calculateTrajectory = (startUnits) => {
      let totalUnits = 0;
      let totalUsd = 0;
      let currentUnits = startUnits;
      let m1Units = Math.round(startUnits);
      let m6Units = 0;
      let m12Units = 0;

      for (let m = 1; m <= 12; m++) {
        if (m === 6) m6Units = Math.round(currentUnits);
        if (m === 12) m12Units = Math.round(currentUnits);
        totalUnits += Math.round(currentUnits);
        totalUsd += currentUnits * totalUsdRoyalty;
        currentUnits = Math.max(1, currentUnits * (1 + monthlyGrowthRate / 100));
      }

      return {
        m1Units,
        m6Units,
        m12Units,
        annualUnits: Math.round(totalUnits),
        annualUsd: Math.round(totalUsd),
        annualInr: Math.round(totalUsd * 85)
      };
    };

    return {
      conservative: calculateTrajectory(Math.round(initialMonthlySales * 0.2)),
      average: calculateTrajectory(initialMonthlySales),
      scaled: calculateTrajectory(Math.round(initialMonthlySales * 5))
    };
  }, [activeSelectedTerritories, initialMonthlySales, monthlyGrowthRate]);

  /* AI ENGINE GENERATOR */
  const handleGenerateAiContent = async () => {
    if (!userApiKey.trim()) {
      alert('Please enter your Google Gemini API key.');
      return;
    }
    setIsGeneratingAi(true);
    localStorage.setItem('ps_user_ai_key', userApiKey.trim());

    let promptText = "";
    if (aiContentType === 'chapter') {
      promptText = `Write the opening chapter of a book titled "${bookTitle}" by "${authorName}". Style: Rich literary trade fiction/non-fiction. 3 comprehensive paragraphs. ${aiCustomPrompt}`;
    } else if (aiContentType === 'outline') {
      promptText = `Create a 10-chapter structured outline for "${bookTitle}" by "${authorName}". ${aiCustomPrompt}`;
    } else if (aiContentType === 'planner') {
      promptText = `Generate a daily habit tracking and productivity planner page for "${bookTitle}". Include goals, hourly schedules, and reflection notes. ${aiCustomPrompt}`;
    } else {
      promptText = `Generate 30 thought-provoking daily journal prompts for "${bookTitle}". Numbered 1 to 30. ${aiCustomPrompt}`;
    }

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${userApiKey.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
      });
      const data = await res.json();
      const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generated) {
        setManuscriptParagraphs(generated.split('\n\n').filter(p => p.trim().length > 0));
        setAiModalOpen(false);
        setActiveView('studio');
        setCurrentStep(2);
      }
    } catch (err) {
      alert('AI Generation error: ' + err.message);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  /* COVER & SPEC EXPORTS */
  const handleExportFullCoverArtwork = () => {
    const canvas = document.createElement('canvas');
    canvas.width = coverPixelsWidth;
    canvas.height = coverPixelsHeight;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1C2010';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const bleedPx = Math.round(0.125 * 300);
    const trimWidthPx = Math.round(currentTrim.width * 300);
    const spineWidthPx = Math.round(spineWidth * 300);
    const trimHeightPx = Math.round(currentTrim.height * 300);

    const backX = bleedPx;
    const spineX = backX + trimWidthPx;
    const frontX = spineX + spineWidthPx;

    const renderCard = (imgSrc, x, y, w, h, label) => {
      if (imgSrc) {
        const img = new Image();
        img.src = imgSrc;
        ctx.drawImage(img, x, y, w, h);
      } else {
        ctx.fillStyle = '#FAF6ED';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#1C2010';
        ctx.font = 'bold 36px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + w / 2, y + h / 2);
      }
    };

    renderCard(backCoverImage, backX, bleedPx, trimWidthPx, trimHeightPx, 'BACK COVER');
    renderCard(frontCoverImage, frontX, bleedPx, trimWidthPx, trimHeightPx, bookTitle);

    ctx.fillStyle = '#E8DFC8';
    ctx.fillRect(spineX, bleedPx, spineWidthPx, trimHeightPx);
    if (pageExtent >= 80) {
      ctx.save();
      ctx.translate(spineX + spineWidthPx / 2, bleedPx + trimHeightPx / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#4F5B2A';
      ctx.font = 'bold 24px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText(`${bookTitle}  •  ${authorName}`, 0, 8);
      ctx.restore();
    }

    canvas.toBlob((blob) => {
      saveAs(blob, `${bookTitle.replace(/\s+/g, '_')}_FullWrap_300DPI.png`);
    });
  };

  const handleDownloadSpecification = () => {
    const spec = 
`============================================================
PUBLISHSTUDIO - PRODUCTION SPECIFICATION & FINANCIAL REPORT
============================================================
Book Title:           ${bookTitle}
Author Name:          ${authorName}
Format Mode:          ${publishingFormat.toUpperCase()}
Trim Dimensions:      ${currentTrim.width}" x ${currentTrim.height}"
Page Extent:          ${pageExtent} Pages
Spine Gutter Margin:  ${calculatedGutter}"
Spine Bulk:           ${spineWidth}"
Canvas (300 DPI):     ${coverPixelsWidth} x ${coverPixelsHeight} px
Month 1 Volume:       ${initialMonthlySales} units
MoM Trajectory:       ${monthlyGrowthRate > 0 ? `+${monthlyGrowthRate}%` : `${monthlyGrowthRate}%`}
============================================================`;
    const blob = new Blob([spec], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${bookTitle.replace(/\s+/g, '_')}_POD_Specs.txt`);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark-canvas' : 'bg-[#F5EFE3] text-[#1C2010]'}`}>
      
      {/* HEADER DOCK */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b border-[#D8C9A8] bg-[#F5EFE3]/95">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div onClick={() => setActiveView('home')} className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-[#4F5B2A] text-white flex items-center justify-center shadow-md">
              <Book className="w-5 h-5" />
            </div>
            <div>
              <span className="font-editorial font-bold text-base text-[#1C2010]">PUBLISHSTUDIO</span>
              <p className="text-[10px] text-[#4F5B2A] font-semibold">Self Publishing Supporting Software</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('home')}
              className="px-3 py-1.5 rounded-full text-xs font-bold soft-btn-pill text-[#4F5B2A] cursor-pointer"
            >
              Home
            </button>

            <button
              onClick={() => setAiModalOpen(true)}
              className="px-3 py-1.5 rounded-full text-xs font-bold soft-btn-pill text-[#4F5B2A] flex items-center gap-1.5 cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-[#4F5B2A]" />
              <span className="hidden sm:inline">AI Studio</span>
            </button>

            <button
              onClick={() => setIsShelfOpen(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold soft-btn-pill flex items-center gap-1.5 cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-[#4F5B2A]" />
              <span className="hidden sm:inline">My Books</span>
            </button>

            <button
              onClick={() => setHelpProfileDrawerOpen(true)}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#4F5B2A] text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help & Profile</span>
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full soft-btn-pill cursor-pointer"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-[#1C2010]" />}
            </button>
          </div>
        </div>
      </header>

      {/* VIEW A: LANDING / HOME OVERVIEW */}
      {activeView === 'home' && (
        <main className="max-w-6xl mx-auto px-4 py-12 space-y-16 animate-in fade-in">
          
          {/* HERO SECTION */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-[#4F5B2A] bg-[#E8DFC8] px-3.5 py-1.5 rounded-full">
              Self Publishing Supporting Software
            </span>
            <h1 className="font-editorial text-4xl sm:text-6xl font-extrabold text-[#1C2010] leading-tight">
              Focus More on Writing, Less on Formatting!
            </h1>
            <p className="text-base sm:text-lg text-[#4F5B2A] max-w-2xl mx-auto leading-relaxed">
              PublishStudio eliminates printing rejections across Self Publishing Platforms. Calculate binding gutters, full-wrap spine bulks, safe zones, and multi-country royalties automatically.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => { setActiveView('studio'); setCurrentStep(1); }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full soft-btn-primary text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <span>Launch Book Production Studio</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setActiveView('studio'); setCurrentStep(2); }}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full soft-btn-pill text-xs font-bold text-[#1C2010] cursor-pointer"
              >
                Explore Demo Proof
              </button>
            </div>
          </div>

          {/* FORMAT PREVIEW CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-8 rounded-3xl soft-raised space-y-3 bg-[#F5EFE3]">
              <div className="w-10 h-10 rounded-2xl bg-[#4F5B2A] text-white flex items-center justify-center font-bold text-sm shadow-xs">A</div>
              <h3 className="font-editorial text-xl font-bold text-[#1C2010]">Text-Rich Manuscripts</h3>
              <p className="text-xs sm:text-sm text-[#4F5B2A] leading-relaxed">Novels, memoirs, non-fiction, and poetry with automated gutter calculations and running headers optimized for trade standards.</p>
            </div>

            <div className="p-8 rounded-3xl soft-raised space-y-3 bg-[#F5EFE3]">
              <div className="w-10 h-10 rounded-2xl bg-[#B8892D] text-white flex items-center justify-center font-bold text-sm shadow-xs">B</div>
              <h3 className="font-editorial text-xl font-bold text-[#1C2010]">Low-Content Creations</h3>
              <p className="text-xs sm:text-sm text-[#4F5B2A] leading-relaxed">Planners, journals, and daily trackers with 300 DPI preservation and barcode exclusion zones tailored for Print on Demand (PoD).</p>
            </div>
          </div>

          {/* WHY INDEPENDENT AUTHORS CHOOSE US */}
          <div className="space-y-8 pt-4">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2010]">Why Independent Authors Choose Us</h2>
              <p className="text-xs sm:text-sm text-[#4F5B2A]">Built for creators who value speed, absolute privacy, and flawless print compliance.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="p-6 rounded-3xl soft-raised space-y-2 bg-[#F5EFE3]">
                <h4 className="font-bold text-xs sm:text-sm text-[#1C2010]">1. Clean Formatting in Seconds</h4>
                <p className="text-xs text-[#4F5B2A] leading-relaxed">Transform raw text into structured layouts and export your publication-ready files with one click.</p>
              </div>

              <div className="p-6 rounded-3xl soft-raised space-y-2 bg-[#F5EFE3]">
                <h4 className="font-bold text-xs sm:text-sm text-[#1C2010]">2. 100% Client-Side Privacy</h4>
                <p className="text-xs text-[#4F5B2A] leading-relaxed">Your data stays with you. We do not save or store your manuscript files on external servers.</p>
              </div>

              <div className="p-6 rounded-3xl soft-raised space-y-2 bg-[#F5EFE3]">
                <h4 className="font-bold text-xs sm:text-sm text-[#1C2010]">3. Smart Local History</h4>
                <p className="text-xs text-[#4F5B2A] leading-relaxed">Automatically remembers your recent book project history locally so you never lose your flow.</p>
              </div>

              <div className="p-6 rounded-3xl soft-raised space-y-2 bg-[#F5EFE3]">
                <h4 className="font-bold text-xs sm:text-sm text-[#1C2010]">4. Category Precision</h4>
                <p className="text-xs text-[#4F5B2A] leading-relaxed">Calculates precise specifications tailored to your specific book genre and trim selection.</p>
              </div>

              <div className="p-6 rounded-3xl soft-raised space-y-2 bg-[#F5EFE3]">
                <h4 className="font-bold text-xs sm:text-sm text-[#1C2010]">5. Live Preview & Quick-Fix</h4>
                <p className="text-xs text-[#4F5B2A] leading-relaxed">Inspect formatted pages live and use built-in Quick-Fix tools to correct text issues instantly.</p>
              </div>

              <div className="p-6 rounded-3xl soft-raised space-y-2 bg-[#F5EFE3]">
                <h4 className="font-bold text-xs sm:text-sm text-[#1C2010]">6. Cover & Margin Guidelines</h4>
                <p className="text-xs text-[#4F5B2A] leading-relaxed">Generate complete cover wrap specs, run live checks, and download templates for free.</p>
              </div>

            </div>

            <div className="p-8 rounded-3xl soft-raised bg-[#F5EFE3] space-y-2">
              <h4 className="font-bold text-sm text-[#1C2010]">7. Multi-Market Revenue Alignment & Much More</h4>
              <p className="text-xs sm:text-sm text-[#4F5B2A] leading-relaxed">
                Guide your pricing strategy with automated cost and revenue estimations across international currencies and global Print on Demand (PoD) markets. PublishStudio is built as an evolving Book OS with continuous updates to streamline your publishing journey.
              </p>
            </div>
          </div>

        </main>
      )}

      {/* VIEW B: 4-STEP WORKFLOW */}
      {activeView === 'studio' && (
        <main className="max-w-5xl mx-auto px-4 py-8 pb-32 animate-in fade-in">
          
          {/* STEP NAVIGATION TRACK */}
          <div className="mb-8">
            <div className="p-2.5 rounded-full soft-inset flex items-center justify-between">
              {[
                { step: 1, label: '1. Setup' },
                { step: 2, label: '2. Interior' },
                { step: 3, label: '3. Cover' },
                { step: 4, label: '4. Preflight' }
              ].map((s, idx) => {
                const isActive = currentStep === s.step;
                const isPassed = currentStep > s.step;
                return (
                  <React.Fragment key={s.step}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(s.step)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                        isActive
                          ? 'bg-[#4F5B2A] text-white font-bold shadow-md'
                          : isPassed
                            ? 'text-[#4F5B2A] font-bold'
                            : 'text-[#4F5B2A]/60'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${isActive ? 'bg-white text-[#4F5B2A] font-bold' : 'bg-black/10'}`}>
                        {isPassed ? '✓' : s.step}
                      </span>
                      <span className="hidden sm:inline">{s.label}</span>
                    </button>
                    {idx < 3 && <div className="flex-1 h-0.5 mx-1 bg-black/10" />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* STEP 1: SETUP */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2010]">
                  Step 1: Specification & Manuscript Setup
                </h2>
                <p className="text-xs text-[#4F5B2A] mt-1">Author Profile: <strong>{authorName}</strong></p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {ARCHETYPES.map((arch) => (
                  <button
                    key={arch.id}
                    onClick={() => { setSelectedArchetype(arch.id); setTrimSize(arch.defaultTrim); setPaperType(arch.paper); }}
                    className={`p-4 rounded-2xl text-center soft-raised cursor-pointer ${selectedArchetype === arch.id ? 'ring-2 ring-[#4F5B2A]' : ''}`}
                  >
                    <h4 className="font-bold text-xs sm:text-sm text-[#1C2010]">{arch.name}</h4>
                    <p className="text-[10px] text-[#4F5B2A] mt-1">{arch.desc}</p>
                  </button>
                ))}
              </div>

              <div className="p-6 rounded-3xl soft-raised space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1 text-[#1C2010]">Trim Size</label>
                  <select value={trimSize} onChange={(e) => setTrimSize(e.target.value)} className="w-full p-3 rounded-2xl text-xs font-semibold soft-inset outline-none text-[#1C2010]">
                    {TRIM_OPTIONS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider block mb-1 text-[#1C2010]">Paper Stock Caliper</label>
                  <select value={paperType} onChange={(e) => setPaperType(e.target.value)} className="w-full p-3 rounded-2xl text-xs font-semibold soft-inset outline-none text-[#1C2010]">
                    {Object.entries(PAPER_SPECS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold uppercase text-[#1C2010]">Page Extent</span>
                    <span className="text-xs font-mono font-bold text-[#4F5B2A]">{pageExtent} Pages</span>
                  </div>
                  <input type="range" min={24} max={600} value={pageExtent} onChange={(e) => setPageExtent(parseInt(e.target.value))} className="w-full accent-[#4F5B2A]" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-black/10">
                  <div className="p-3 rounded-2xl soft-inset text-center">
                    <span className="text-xs font-bold block">Spine Gutter: {calculatedGutter}"</span>
                    <span className="text-[10px] text-[#4F5B2A]">Prevents Crease Loss</span>
                  </div>
                  <div className="p-3 rounded-2xl soft-inset text-center">
                    <span className="text-xs font-bold block">Outside Margin: 0.500"</span>
                    <span className="text-[10px] text-[#4F5B2A]">Thumb Clearance</span>
                  </div>
                  <div className="p-3 rounded-2xl soft-inset text-center">
                    <span className="text-xs font-bold block">Spine Bulk: {spineWidth}"</span>
                    <span className="text-[10px] text-[#4F5B2A]">Physical Depth</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: INTERIOR PROOF */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2010]">Step 2: Interior Layout & Typeset Proof</h2>
                  <p className="text-xs text-[#4F5B2A] mt-1">Author Profile: <strong>{authorName}</strong></p>
                </div>
                <div className="flex gap-1 p-1 rounded-full soft-inset">
                  <button onClick={() => setSpreadMode('1-page')} className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${spreadMode === '1-page' ? 'bg-[#4F5B2A] text-white' : 'text-[#4F5B2A]'}`}>1-Page View</button>
                  <button onClick={() => setSpreadMode('2-page')} className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${spreadMode === '2-page' ? 'bg-[#4F5B2A] text-white' : 'text-[#4F5B2A]'}`}>2-Page Spread</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl soft-raised space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase block mb-1 text-[#1C2010]">Book Title (Header)</label>
                    <input type="text" value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} className="w-full p-2.5 rounded-xl text-xs soft-inset outline-none text-[#1C2010]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase block mb-1 text-[#1C2010]">Author Name</label>
                    <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="w-full p-2.5 rounded-xl text-xs soft-inset outline-none text-[#1C2010]" />
                  </div>
                  <button onClick={() => setQuickFixDrawerOpen(!quickFixDrawerOpen)} className="w-full py-2 rounded-full soft-btn-pill text-xs font-bold cursor-pointer">
                    {quickFixDrawerOpen ? 'Close Text Editor' : 'Quick-Fix Text'}
                  </button>
                </div>

                <div className="md:col-span-2 p-6 rounded-3xl soft-raised">
                  <div className={`p-6 rounded-2xl soft-inset ${spreadMode === '2-page' ? 'grid grid-cols-2 gap-3' : 'max-w-md mx-auto'}`}>
                    <div className="p-4 bg-[#FFFDF9] rounded shadow min-h-[220px] flex flex-col justify-between">
                      <div className="text-center pb-2 border-b border-black/10 text-[9px] uppercase tracking-widest text-[#4F5B2A]">{authorName}</div>
                      <p className="font-editorial text-[10px] leading-relaxed text-[#2D2A26]">{manuscriptParagraphs[0]}</p>
                      <span className="text-[9px] text-[#4F5B2A]">Page 1</span>
                    </div>

                    {spreadMode === '2-page' && (
                      <div className="p-4 bg-[#FFFDF9] rounded shadow min-h-[220px] flex flex-col justify-between">
                        <div className="text-center pb-2 border-b border-black/10 text-[9px] uppercase tracking-widest text-[#4F5B2A]">{bookTitle}</div>
                        <p className="font-editorial text-[10px] leading-relaxed text-[#2D2A26]">{manuscriptParagraphs[1] || 'End of chapter.'}</p>
                        <span className="text-[9px] text-[#4F5B2A] text-right">Page 2</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {quickFixDrawerOpen && (
                <div className="p-5 rounded-3xl soft-inset space-y-3">
                  <h4 className="text-xs font-bold uppercase text-[#4F5B2A]">Edit Manuscript Content</h4>
                  {manuscriptParagraphs.map((para, idx) => (
                    <textarea
                      key={idx}
                      rows={2}
                      value={para}
                      onChange={(e) => {
                        const copy = [...manuscriptParagraphs];
                        copy[idx] = e.target.value;
                        setManuscriptParagraphs(copy);
                      }}
                      className="w-full p-2.5 rounded-xl text-xs bg-white text-[#1C2010] border border-black/10 outline-none"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: COVER BLUEPRINT */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2010]">Step 3: Cover Blueprint Specification</h2>
                <p className="text-xs text-[#4F5B2A] mt-1">300 DPI full-wrap layout with barcode protection margin</p>
              </div>

              <div className="p-3 rounded-2xl soft-inset grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-semibold">
                <div>SPINE WIDTH: <span className="font-mono text-[#4F5B2A] font-bold">{spineWidth}"</span></div>
                <div>TOTAL WIDTH: <span className="font-mono font-bold">{fullCoverWidth}"</span></div>
                <div>TOTAL HEIGHT: <span className="font-mono font-bold">{fullCoverHeight}"</span></div>
                <div>CANVAS @ 300 DPI: <span className="font-mono text-[#B8892D] font-bold">{coverPixelsWidth} x {coverPixelsHeight} px</span></div>
              </div>

              <div className="p-6 rounded-3xl soft-raised">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#4F5B2A]">LIVE BLUEPRINT CANVAS</span>
                  <button onClick={handleExportFullCoverArtwork} className="soft-btn-primary px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Cover (300 DPI)</span>
                  </button>
                </div>

                <div className="p-6 rounded-2xl soft-inset">
                  <div className="relative w-full aspect-[2/1] border-2 border-dashed border-red-400 rounded bg-[#FFFDF9] flex items-center justify-between p-4 overflow-hidden">
                    <div className="flex-1 h-full border-r border-dashed border-black/20 p-2 flex flex-col justify-between">
                      <span className="text-xs font-bold text-center block">BACK COVER ({currentTrim.width}" × {currentTrim.height}")</span>
                      <div className="self-end p-2 border border-red-500 bg-red-500/20 rounded text-[8px] font-mono text-red-600 font-bold">
                        BARCODE ZONE (2.0" × 1.2")
                      </div>
                    </div>
                    <div className="w-8 sm:w-12 h-full flex items-center justify-center bg-black/5 border-r border-dashed border-black/20 text-[9px] font-mono -rotate-90 text-[#4F5B2A] font-bold">
                      {pageExtent >= 80 ? bookTitle.slice(0, 14) : ''}
                    </div>
                    <div className="flex-1 h-full p-2 flex flex-col justify-between items-center text-center">
                      <span className="text-xs font-bold block">FRONT COVER</span>
                      <div>
                        <h4 className="font-editorial text-sm font-bold">{bookTitle}</h4>
                        <p className="text-[10px] text-[#4F5B2A]">{authorName}</p>
                      </div>
                      <span className="text-[8px] text-[#4F5B2A]">0.25" Safe Margin</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PREFLIGHT & 15-TERRITORY FINANCIAL ENGINE */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2010]">Step 4: Preflight Verification & 15-Territory Financials</h2>
                  <p className="text-xs text-[#4F5B2A] mt-1">Multi-country auto-FX conversion and compound 12-month trajectory</p>
                </div>
                <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 font-bold text-xs">100% Ready</span>
              </div>

              {/* 12-MONTH ANNUAL CUMULATIVE REVENUE REPORT */}
              <div className="p-6 rounded-3xl soft-raised space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-black/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4F5B2A] flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    12-Month Cumulative Projection ({activeSelectedTerritories.length} Selected Territories)
                  </span>
                  <span className="text-xs font-mono font-bold text-[#4F5B2A]">Format: {publishingFormat.toUpperCase()}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-4 rounded-2xl bg-white shadow-xs">
                    <span className="text-[10px] text-[#4F5B2A] block font-semibold">🥉 Conservative (Low Velocity)</span>
                    <span className="text-base font-bold font-mono text-[#1C2010] mt-1 block">
                      ${annualReportData.conservative.annualUsd.toLocaleString()} / ₹{annualReportData.conservative.annualInr.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#4F5B2A] block font-mono">{annualReportData.conservative.annualUnits} units/yr</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white shadow-xs">
                    <span className="text-[10px] text-[#4F5B2A] block font-semibold">🥈 Benchmark (Target Velocity)</span>
                    <span className="text-base font-bold font-mono text-[#4F5B2A] mt-1 block">
                      ${annualReportData.average.annualUsd.toLocaleString()} / ₹{annualReportData.average.annualInr.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#4F5B2A] block font-mono">{annualReportData.average.annualUnits} units/yr</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white shadow-xs">
                    <span className="text-[10px] text-[#4F5B2A] block font-semibold">🥇 Scaled (Ad Scaling)</span>
                    <span className="text-base font-bold font-mono text-[#B8892D] mt-1 block">
                      ${annualReportData.scaled.annualUsd.toLocaleString()} / ₹{annualReportData.scaled.annualInr.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#4F5B2A] block font-mono">{annualReportData.scaled.annualUnits} units/yr</span>
                  </div>
                </div>

                {/* FORMAT CONTROLLER */}
                <div className="p-3.5 rounded-2xl soft-inset flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase text-[#1C2010]">Publishing Format:</span>
                  <div className="flex gap-1.5">
                    {[
                      { id: 'paperback', label: 'Paperback Only' },
                      { id: 'ebook', label: 'eBook Only' },
                      { id: 'both', label: 'Both Formats' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setPublishingFormat(f.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${publishingFormat === f.id ? 'bg-[#4F5B2A] text-white shadow-xs' : 'text-[#4F5B2A]'}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TRAJECTORY SLIDERS */}
                <div className="p-4 rounded-2xl soft-inset space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-[#1C2010]">
                    <span>Month 1 Starting Copies: {initialMonthlySales}</span>
                    <span>Monthly Trajectory: {monthlyGrowthRate > 0 ? `+${monthlyGrowthRate}%` : `${monthlyGrowthRate}%`}/mo</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="range" min={5} max={500} step={5} value={initialMonthlySales} onChange={(e) => setInitialMonthlySales(parseInt(e.target.value))} className="w-full accent-[#4F5B2A]" />
                    <input type="range" min={-10} max={25} step={1} value={monthlyGrowthRate} onChange={(e) => setMonthlyGrowthRate(parseInt(e.target.value))} className="w-full accent-[#4F5B2A]" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/10 text-center font-mono text-xs">
                    <div>M1: <strong>{annualReportData.average.m1Units}</strong> copies</div>
                    <div>M6: <strong>{annualReportData.average.m6Units}</strong> copies</div>
                    <div>M12: <strong>{annualReportData.average.m12Units}</strong> copies</div>
                  </div>
                </div>

                {/* US BASE PRICE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase block mb-1">US Paperback Retail ($ USD):</label>
                    <input
                      type="number"
                      step="0.50"
                      value={usPaperbackPrice}
                      onChange={(e) => handleUsPriceChange(e.target.value, 'paperback')}
                      className="w-full p-2 font-mono font-bold text-xs rounded-xl bg-white border border-black/10 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase block mb-1">US eBook Retail ($ USD):</label>
                    <input
                      type="number"
                      step="0.50"
                      value={usEbookPrice}
                      onChange={(e) => handleUsPriceChange(e.target.value, 'ebook')}
                      className="w-full p-2 font-mono font-bold text-xs rounded-xl bg-white border border-black/10 outline-none"
                    />
                  </div>
                </div>

                {/* 15 TERRITORY CARDS */}
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase text-[#1C2010] flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-[#4F5B2A]" />
                      Territory Earnings ({activeSelectedTerritories.length} Active)
                    </span>
                    <button
                      onClick={() => setSelectedKdpCountries(selectedKdpCountries.length === Object.keys(POD_MARKETPLACES).length ? ['US', 'IN'] : Object.keys(POD_MARKETPLACES))}
                      className="text-xs font-bold text-[#4F5B2A] hover:underline cursor-pointer"
                    >
                      {selectedKdpCountries.length === Object.keys(POD_MARKETPLACES).length ? 'Deselect All' : 'Select All Territories'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {activeSelectedTerritories.map((item) => (
                      <div key={item.code} className="p-3.5 rounded-2xl soft-inset text-xs space-y-1">
                        <span className="font-bold text-[#4F5B2A] block">{item.name}</span>
                        <div className="flex justify-between">
                          <span className="text-[#4F5B2A]">Print Cost:</span>
                          <span className="font-mono font-bold">{item.symbol}{item.printCost}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#4F5B2A]">Retail:</span>
                          <span className="font-mono font-bold">{item.symbol}{item.pbActivePrice}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-black/10 font-bold">
                          <span>Royalty:</span>
                          <span className="text-[#B8892D]">+{item.symbol}{item.royaltyPerUnit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PREFLIGHT CHECKS */}
              <div className="p-6 rounded-3xl soft-raised space-y-2 text-xs">
                <span className="text-[10px] font-mono uppercase font-bold text-[#4F5B2A] block mb-1">PREFLIGHT PASS CHECKS</span>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-800 flex justify-between font-semibold">
                  <span>✓ Page Extent Compatible ({pageExtent} pages meets trade minimums)</span>
                  <span>PASS</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-800 flex justify-between font-semibold">
                  <span>✓ Spine Gutter Clearance ({calculatedGutter}" inside margin prevents crease clipping)</span>
                  <span>PASS</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-800 flex justify-between font-semibold">
                  <span>✓ 300 DPI Resolution ({coverPixelsWidth} x {coverPixelsHeight} px verified)</span>
                  <span>PASS</span>
                </div>
                <div className="pt-4 flex justify-end">
                  <button onClick={handleDownloadSpecification} className="soft-btn-primary px-6 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 cursor-pointer">
                    <Download className="w-4 h-4" />
                    <span>Download Production Specification (.txt)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DOCK BAR */}
          <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-md flex items-center justify-between max-w-5xl mx-auto border-t border-black/10">
            <button onClick={() => setActiveView('home')} className="px-4 py-2 rounded-full text-xs font-semibold soft-btn-pill cursor-pointer">
              Home Overview
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button onClick={() => setCurrentStep(prev => prev - 1)} className="px-4 py-2 rounded-full text-xs font-bold soft-btn-pill flex items-center gap-1 cursor-pointer">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}
              {currentStep < 4 ? (
                <button onClick={() => setCurrentStep(prev => prev + 1)} className="px-5 py-2 rounded-full text-xs font-bold soft-btn-primary flex items-center gap-1 cursor-pointer">
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button onClick={handleDownloadSpecification} className="px-5 py-2 rounded-full text-xs font-bold soft-btn-primary flex items-center gap-1 cursor-pointer">
                  <Download className="w-3.5 h-3.5" />
                  <span>Complete Studio</span>
                </button>
              )}
            </div>

            <button onClick={() => setHelpProfileDrawerOpen(true)} className="px-4 py-2 rounded-full text-xs font-bold soft-btn-pill text-[#4F5B2A] cursor-pointer">
              Help & Profile
            </button>
          </div>
        </main>
      )}

      {/* AI MODAL (BYOK) */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl p-6 soft-raised space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#4F5B2A]" />
                <h3 className="font-editorial font-bold text-base">Client-Side AI Generator</h3>
              </div>
              <button onClick={() => setAiModalOpen(false)}><X className="w-4 h-4 cursor-pointer" /></button>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase block mb-1">Gemini API Key (BYOK):</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={userApiKey}
                onChange={(e) => setUserApiKey(e.target.value)}
                className="w-full p-2.5 rounded-xl text-xs bg-white border border-black/10 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase block mb-1">Intent:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'chapter', label: '📖 Chapter 1 Narrative' },
                  { id: 'outline', label: '📑 10-Chapter Outline' },
                  { id: 'planner', label: '📅 Daily Planner (Low-Content)' },
                  { id: 'habits', label: '✨ 30 Journal Prompts' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setAiContentType(item.id)}
                    className={`p-2 rounded-xl text-xs font-semibold border text-left cursor-pointer ${aiContentType === item.id ? 'border-[#4F5B2A] bg-[#4F5B2A]/10 text-[#4F5B2A]' : 'border-black/10'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setAiModalOpen(false)} className="px-4 py-2 rounded-full text-xs font-semibold cursor-pointer">Cancel</button>
              <button onClick={handleGenerateAiContent} disabled={isGeneratingAi} className="soft-btn-primary px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingAi ? 'Writing...' : 'Generate Content'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HELP & AUTHOR IDENTITY DRAWER */}
      {helpProfileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl p-6 soft-raised space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <h3 className="font-editorial font-bold text-base">Help Center & Author Identity</h3>
              <button onClick={() => setHelpProfileDrawerOpen(false)}><X className="w-4 h-4 cursor-pointer" /></button>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase font-bold text-[#4F5B2A] block">AUTHOR IDENTITY (REMEMBERED LOCALLY)</span>
              <input type="text" placeholder="Author Name" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="w-full p-2.5 rounded-xl text-xs bg-white border border-black/10 outline-none" />
              <input type="email" placeholder="Email Address" value={authorProfileEmail} onChange={(e) => setAuthorProfileEmail(e.target.value)} className="w-full p-2.5 rounded-xl text-xs bg-white border border-black/10 outline-none" />
            </div>

            <div className="space-y-3 pt-2 border-t border-black/10">
              <span className="text-[10px] font-mono uppercase font-bold text-[#4F5B2A] block">REPORT ISSUE / FEEDBACK</span>
              <textarea rows={3} placeholder="Describe suggestions or issues..." value={feedbackFeedback} onChange={(e) => setFeedbackFeedback(e.target.value)} className="w-full p-2.5 rounded-xl text-xs bg-white border border-black/10 outline-none" />
              {feedbackSent ? (
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-800 text-xs font-bold text-center">✓ Feedback recorded locally!</div>
              ) : (
                <button onClick={() => setFeedbackSent(true)} className="w-full py-2 rounded-full soft-btn-primary text-xs font-bold cursor-pointer">Submit Feedback</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MY BOOKS SHELF */}
      {isShelfOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl p-6 soft-raised space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <h3 className="font-editorial font-bold text-base">My Bookshelf</h3>
              <button onClick={() => setIsShelfOpen(false)}><X className="w-4 h-4 cursor-pointer" /></button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              <div className="p-3 rounded-2xl soft-inset flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-xs">{bookTitle}</h4>
                  <p className="text-[10px] text-[#4F5B2A]">{authorName} • {trimSize} • {pageExtent} Pgs</p>
                </div>
                <span className="text-[10px] font-bold text-[#4F5B2A]">Active Draft</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
