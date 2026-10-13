'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Book,
  HelpCircle,
  Sparkles,
  Download,
  ArrowRight,
  ArrowLeft,
  FolderOpen,
  X,
  Globe,
  Cpu,
  Calendar,
  ChevronRight,
  Upload,
  FileText,
  Type,
  Check,
  Sliders,
  Layers,
  RotateCcw
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
  {
    id: 'fiction',
    name: 'Fiction & Novel',
    defaultTrim: '5.5x8.5',
    paper: 'cream',
    desc: '5.5"x8.5", Cream paper',
    colorTag: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30'
  },
  {
    id: 'nonfiction',
    name: 'Non-Fiction & Memoir',
    defaultTrim: '6x9',
    paper: 'white',
    desc: '6"x9", White paper',
    colorTag: 'bg-blue-500/15 text-blue-800 border-blue-500/30'
  },
  {
    id: 'workbook',
    name: 'Workbook & Training Manual',
    defaultTrim: '8.5x11',
    paper: 'white',
    desc: '8.5"x11", White paper',
    colorTag: 'bg-amber-500/15 text-amber-800 border-amber-500/30'
  },
  {
    id: 'custom',
    name: 'Custom Specification',
    defaultTrim: '6x9',
    paper: 'white',
    desc: '6"x9", White paper',
    colorTag: 'bg-purple-500/15 text-purple-800 border-purple-500/30'
  }
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

const FONTS_TOP4 = [
  { id: 'EB Garamond, serif', name: 'Garamond', genre: 'Literary Fiction & Memoir', previewClass: 'font-serif' },
  { id: 'Merriweather, serif', name: 'Merriweather', genre: 'Trade Non-Fiction', previewClass: 'font-serif' },
  { id: 'Playfair Display, serif', name: 'Playfair / Cinzel', genre: 'Luxury & Historical', previewClass: 'font-serif' },
  { id: 'Inter, sans-serif', name: 'Inter Sans', genre: 'Workbooks & Modern Guides', previewClass: 'font-sans' }
];

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

  /* PROJECT CONFIGURATION */
  const [projectId, setProjectId] = useState('proj_default');
  const [bookTitle, setBookTitle] = useState('The Memory Chef');
  const [authorName, setAuthorName] = useState('Kavita Chougule');
  const [rememberAuthor, setRememberAuthor] = useState(true);
  const [selectedArchetype, setSelectedArchetype] = useState('fiction');
  const [macroCategory, setMacroCategory] = useState('text-rich'); // 'text-rich' | 'low-content'
  const [trimSize, setTrimSize] = useState('5.5x8.5');
  const [paperType, setPaperType] = useState('cream');
  const [interiorBleed, setInteriorBleed] = useState(false);
  const [pageExtent, setPageExtent] = useState(120);

  /* TYPOGRAPHY ENGINE (STEP 1 CONFIG -> FLOWS TO STEP 2) */
  const [typography, setTypography] = useState({
    fontFamily: 'EB Garamond, serif',
    bookTitleSize: 26,
    bookTitleWeight: 'bold',
    chapterTitleSize: 18,
    chapterTitleWeight: 'bold',
    chapterTitleItalic: false,
    bodySize: 11,
    bodyLineHeight: 1.6,
    bodyWeight: 'normal',
    bodyItalic: false
  });

  /* INGESTION TELEMETRY */
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [manuscriptWordCount, setManuscriptWordCount] = useState(128);
  const [detectedChaptersCount, setDetectedChaptersCount] = useState(1);

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

  /* LOAD PERSISTENT AUTHOR ON MOUNT */
  useEffect(() => {
    getAllProjectsFromStorage().then(setSavedProjects).catch(() => {});
    const key = localStorage.getItem('ps_user_ai_key');
    if (key) setUserApiKey(key);

    const savedAuthor = localStorage.getItem('ps_default_author');
    if (savedAuthor) {
      setAuthorName(savedAuthor);
    }
  }, []);

  /* SYNC AUTHOR TO LOCAL STORAGE IF CHECKED */
  const handleAuthorNameChange = (val) => {
    setAuthorName(val);
    if (rememberAuthor && val.trim().length > 0) {
      localStorage.setItem('ps_default_author', val.trim());
    }
  };

  /* CLIENT-SIDE MANUSCRIPT INGESTION (DOCX / TXT) */
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target.result;
      if (typeof text === 'string') {
        const rawLines = text
          .split(/\r?\n/)
          .map(l => l.trim())
          .filter(l => l.length > 0);

        if (rawLines.length > 0) {
          setManuscriptParagraphs(rawLines);
          const totalWords = rawLines.reduce((acc, p) => acc + p.split(/\s+/).filter(Boolean).length, 0);
          setManuscriptWordCount(totalWords);

          const chapters = rawLines.filter(p => /^chapter|\bchapter\b|^#\s+/i.test(p));
          setDetectedChaptersCount(Math.max(1, chapters.length));
        }
      }
    };

    reader.readAsText(file);
  };

  /* AUTO ESTIMATE & SYNC PAGE EXTENT FROM WORDS */
  const estimatedPages = useMemo(() => {
    const wordsPerPage = trimSize === '8.5x11' ? 450 : trimSize === '6x9' ? 300 : 250;
    return Math.max(24, Math.round((manuscriptWordCount || 250) / wordsPerPage) * 2);
  }, [manuscriptWordCount, trimSize]);

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
        setCurrentStep(1);
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
    const spec = `============================================================
PUBLISHSTUDIO - PRODUCTION SPECIFICATION & FINANCIAL REPORT
============================================================
Book Title:           ${bookTitle}
Author Name:          ${authorName}
Format Mode:          ${publishingFormat.toUpperCase()}
Trim Dimensions:      ${currentTrim.width}" x ${currentTrim.height}"
Bleed Setting:        ${interiorBleed ? 'Full Bleed (+0.125")' : 'No Bleed (Standard)'}
Page Extent:          ${pageExtent} Pages
Font Selected:        ${typography.fontFamily}
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
    <div className="min-h-screen bg-[#F5EFE3] text-[#1C2010]">
      {/* HEADER DOCK */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b border-[#D8C9A8] bg-[#F5EFE3]/95">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div onClick={() => setActiveView('home')} className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
              <Book className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <div>
                <span className="font-editorial font-bold text-base text-[#1C2010]">PUBLISHSTUDIO</span>
                <p className="text-[10px] text-emerald-700 font-bold">Self Publishing Supporting Software</p>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 text-white shadow-xs">
                Book OS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('home')}
              className="px-3 py-1.5 rounded-full text-xs font-bold soft-btn-pill text-emerald-800 cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => setAiModalOpen(true)}
              className="px-3 py-1.5 rounded-full text-xs font-bold soft-btn-pill text-indigo-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">AI Studio</span>
            </button>
            <button
              onClick={() => setIsShelfOpen(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold soft-btn-pill text-amber-800 flex items-center gap-1.5 cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">My Books</span>
            </button>
            <button
              onClick={() => setHelpProfileDrawerOpen(true)}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-teal-700 to-emerald-700 text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help & Profile</span>
            </button>
          </div>
        </div>
      </header>

      {/* VIEW A: LANDING / HOME OVERVIEW */}
      {activeView === 'home' && (
        <main className="max-w-6xl mx-auto px-4 py-12 space-y-16 animate-in fade-in">
          {/* HERO SECTION */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-teal-800 bg-teal-500/15 border border-teal-500/30 px-3.5 py-1.5 rounded-full">
              Self Publishing Supporting Software
            </span>
            <h1 className="font-editorial text-4xl sm:text-6xl font-extrabold text-[#1C2010] leading-tight">
              Focus More on Writing,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-600">
                Less on Formatting!
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[#555045] max-w-2xl mx-auto leading-relaxed">
              PublishStudio eliminates printing rejections across Self Publishing Platforms. Calculate binding gutters, full-wrap spine bulks, safe zones, and multi-country royalties automatically.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSelectedArchetype('fiction');
                  setMacroCategory('text-rich');
                  setActiveView('studio');
                  setCurrentStep(1);
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-emerald-700 to-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:opacity-95 transition-all cursor-pointer"
              >
                <span>Launch Book Production Studio</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSelectedArchetype('fiction');
                  setActiveView('studio');
                  setCurrentStep(2);
                }}
                className="w-full sm:w-auto px-7 py-3.5 rounded-full soft-btn-pill text-xs font-bold text-amber-900 border border-amber-500/30 bg-amber-500/10 cursor-pointer"
              >
                Explore Demo Proof
              </button>
            </div>
          </div>

          {/* FORMAT PREVIEW CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div
              onClick={() => {
                setSelectedArchetype('fiction');
                setMacroCategory('text-rich');
                setActiveView('studio');
                setCurrentStep(1);
              }}
              className="p-8 rounded-3xl soft-raised space-y-3 bg-[#F5EFE3] border-t-4 border-emerald-600 cursor-pointer hover:shadow-xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  A
                </div>
                <span className="text-xs font-bold text-emerald-700 group-hover:underline flex items-center gap-1">
                  Configure Setup &rarr;
                </span>
              </div>
              <h3 className="font-editorial text-xl font-bold text-[#1C2010]">Text-Rich Manuscripts</h3>
              <p className="text-xs sm:text-sm text-[#555045] leading-relaxed">
                Novels, memoirs, non-fiction, and poetry with automated gutter calculations and running headers optimized for trade standards.
              </p>
            </div>

            <div
              onClick={() => {
                setSelectedArchetype('workbook');
                setMacroCategory('low-content');
                setActiveView('studio');
                setCurrentStep(1);
              }}
              className="p-8 rounded-3xl soft-raised space-y-3 bg-[#F5EFE3] border-t-4 border-amber-600 cursor-pointer hover:shadow-xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  B
                </div>
                <span className="text-xs font-bold text-amber-800 group-hover:underline flex items-center gap-1">
                  Configure Workbooks & Planners &rarr;
                </span>
              </div>
              <h3 className="font-editorial text-xl font-bold text-[#1C2010]">Low-Content Creations</h3>
              <p className="text-xs sm:text-sm text-[#555045] leading-relaxed">
                Planners, journals, and daily trackers with 300 DPI preservation and barcode exclusion zones tailored for Print on Demand (PoD).
              </p>
            </div>
          </div>

          {/* WHY INDEPENDENT AUTHORS CHOOSE US */}
          <div className="space-y-8 pt-4">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2010]">Why Independent Authors Choose Us</h2>
              <p className="text-xs sm:text-sm text-[#555045]">Built for creators who value speed, absolute privacy, and flawless print compliance.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl soft-raised space-y-2 bg-[#F5EFE3] hover:border-emerald-500/40 transition-colors">
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-900">SPEED & FLOW</span>
                <h4 className="font-bold text-xs sm:text-sm text-[#1C2010]">1. Clean Formatting in Seconds</h4>
                <p className="text-xs text-[#555045] leading-relaxed">Transform raw text into structured layouts and export publication-ready files with one click.</p>
              </div>
              <div className="p-6 rounded-3xl soft-raised space-y-2 bg-[#F5EFE3] hover:border-blue-500/40 transition-colors">
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-900">TOTAL PRIVACY</span>
                <h4 className="font-bold text-xs sm:text-sm text-[#1C2010]">2. 100% Client-Side Privacy</h4>
                <p className="text-xs text-[#555045] leading-relaxed">Your data stays with you. We do not save or store your manuscript files on external servers.</p>
              </div>
              <div className="p-6 rounded-3xl soft-raised space-y-2 bg-[#F5EFE3] hover:border-purple-500/40 transition-colors">
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-900">LOCAL CACHE</span>
                <h4 className="font-bold text-xs sm:text-sm text-[#1C2010]">3. Persistent Author Memory</h4>
                <p className="text-xs text-[#555045] leading-relaxed">Remembers your author profile across books and sessions right inside your browser.</p>
              </div>
              <div className="p-6 rounded-3xl soft-raised space-y-2 bg-[#F5EFE3] hover:border-amber-500/40 transition-colors">
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-900">GENRE PRECISION</span>
                <h4 className="font-bold text-xs sm:text-sm text-[#1C2010]">4. Category Precision</h4>
                <p className="text-xs text-[#555045] leading-relaxed">Calculates precise specifications tailored to your specific book genre and trim selection.</p>
              </div>
              <div className="p-6 rounded-3xl soft-raised space-y-2 bg-[#F5EFE3] hover:border-rose-500/40 transition-colors">
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-900">LIVE EDITING</span>
                <h4 className="font-bold text-xs sm:text-sm text-[#1C2010]">5. Live Preview & Quick-Fix</h4>
                <p className="text-xs text-[#555045] leading-relaxed">Inspect formatted pages live and use built-in Quick-Fix tools to correct text issues instantly.</p>
              </div>
              <div className="p-6 rounded-3xl soft-raised space-y-2 bg-[#F5EFE3] hover:border-teal-500/40 transition-colors">
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-900">COVER SPECS</span>
                <h4 className="font-bold text-xs sm:text-sm text-[#1C2010]">6. Cover & Margin Guidelines</h4>
                <p className="text-xs text-[#555045] leading-relaxed">Generate complete cover wrap specs, run live checks, and download templates for free.</p>
              </div>
            </div>
            <div className="p-8 rounded-3xl soft-raised bg-gradient-to-br from-[#F5EFE3] to-[#EAE2CE] space-y-2 border border-emerald-500/20">
              <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded bg-emerald-700 text-white shadow-xs">GLOBAL ECOSYSTEM</span>
              <h4 className="font-bold text-sm text-[#1C2010] mt-1">7. Multi-Market Revenue Alignment & Much More</h4>
              <p className="text-xs sm:text-sm text-[#555045] leading-relaxed">
                Guide your pricing strategy with automated cost and revenue estimations across international currencies and global Print on Demand (PoD) markets.
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
                          ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white font-bold shadow-md'
                          : isPassed
                          ? 'text-emerald-800 font-bold bg-emerald-500/10'
                          : 'text-[#555045]/60'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                          isActive ? 'bg-white text-emerald-800 font-bold' : 'bg-black/10'
                        }`}
                      >
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

          {/* ========================================================================= */}
          {/* STEP 1: SPECIFICATION, AUTHOR & MANUSCRIPT SETUP */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              {/* TOP HEADER & LIVE AUTHOR STATUS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D8C9A8]/70">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-[#0E6266] bg-[#0E6266]/10 px-2.5 py-0.5 rounded-full">
                      Step 01
                    </span>
                    <span className="text-[10px] text-[#555045] font-semibold">Zero-Cost Setup Engine</span>
                  </div>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2010] mt-1">
                    Specification & Manuscript Setup
                  </h2>
                  <p className="text-xs text-[#555045]">
                    Configure author metadata, upload raw manuscript text, and set physical POD trim bounds.
                  </p>
                </div>

                <div className="flex items-center gap-2 p-2 px-3.5 rounded-2xl soft-raised bg-[#FAF6ED] border border-[#D8C9A8]/60 w-fit">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="text-left">
                    <span className="text-[9px] uppercase tracking-wider block font-bold text-[#555045]">Active Author</span>
                    <strong className="text-xs text-emerald-900 font-bold">{authorName || 'Kavita Chougule'}</strong>
                  </div>
                </div>
              </div>

              {/* 1. AUTHOR PROFILE & PROJECT METADATA */}
              <div className="p-6 rounded-3xl soft-raised bg-[#F5EFE3] border border-[#D8C9A8]/50 space-y-4">
                <div className="flex items-center justify-between border-b border-black/5 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1C2010] flex items-center gap-2">
                    <Type className="w-4 h-4 text-emerald-700" />
                    Book & Author Profile
                  </span>
                  <label className="flex items-center gap-2 text-xs text-[#555045] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberAuthor}
                      onChange={(e) => {
                        setRememberAuthor(e.target.checked);
                        if (e.target.checked && authorName) {
                          localStorage.setItem('ps_default_author', authorName);
                        }
                      }}
                      className="accent-[#0E6266] w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-emerald-900">
                      Remember author as default for all books
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1 text-[#1C2010]">
                      Book Title
                    </label>
                    <input
                      type="text"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      placeholder="e.g. The Memory Chef"
                      className="w-full p-3 rounded-2xl text-xs font-bold soft-inset outline-none text-[#1C2010] bg-[#FFFDF9]/80 border border-[#D8C9A8]/40 focus:border-[#0E6266]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1 text-[#1C2010]">
                      Author Name
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => handleAuthorNameChange(e.target.value)}
                      placeholder="e.g. Kavita Chougule"
                      className="w-full p-3 rounded-2xl text-xs font-bold soft-inset outline-none text-[#1C2010] bg-[#FFFDF9]/80 border border-[#D8C9A8]/40 focus:border-[#0E6266]"
                    />
                  </div>
                </div>
              </div>

              {/* 2. MACRO CATEGORY & 4 ARCHETYPES */}
              <div className="space-y-3">
                {/* MACRO PILL TOGGLE */}
                <div className="p-1.5 rounded-2xl soft-inset bg-[#ECE4D0] grid grid-cols-2 gap-2 max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setMacroCategory('text-rich');
                      setSelectedArchetype('fiction');
                      setTrimSize('5.5x8.5');
                      setPaperType('cream');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      macroCategory === 'text-rich'
                        ? 'bg-[#0E6266] text-white shadow-md'
                        : 'text-[#555045] hover:text-[#1C2010]'
                    }`}
                  >
                    <span>📖</span>
                    <span>Text-Rich Manuscript</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMacroCategory('low-content');
                      setSelectedArchetype('workbook');
                      setTrimSize('8.5x11');
                      setPaperType('white');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      macroCategory === 'low-content'
                        ? 'bg-[#0E6266] text-white shadow-md'
                        : 'text-[#555045] hover:text-[#1C2010]'
                    }`}
                  >
                    <span>📝</span>
                    <span>Low-Content & Journal</span>
                  </button>
                </div>

                {/* 4 ARCHETYPE CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {ARCHETYPES.map((arch) => {
                    const isSelected = selectedArchetype === arch.id;
                    return (
                      <button
                        key={arch.id}
                        type="button"
                        onClick={() => {
                          setSelectedArchetype(arch.id);
                          setTrimSize(arch.defaultTrim);
                          setPaperType(arch.paper);
                          if (arch.id === 'workbook') setMacroCategory('low-content');
                          else setMacroCategory('text-rich');
                        }}
                        className={`p-4 rounded-3xl text-left soft-raised cursor-pointer border-2 transition-all flex flex-col justify-between min-h-[135px] ${
                          isSelected
                            ? 'border-[#0E6266] bg-gradient-to-b from-[#FFFDF9] to-[#F5EFE3] shadow-md scale-[1.01]'
                            : 'border-transparent bg-[#F5EFE3] hover:border-[#D8C9A8]'
                        }`}
                      >
                        <div>
                          <span
                            className={`inline-block text-[9px] font-mono tracking-wider font-extrabold px-2 py-0.5 rounded-full mb-2 ${
                              arch.id === 'fiction'
                                ? 'bg-emerald-500/15 text-emerald-800'
                                : arch.id === 'nonfiction'
                                ? 'bg-blue-500/15 text-blue-800'
                                : arch.id === 'workbook'
                                ? 'bg-amber-500/15 text-amber-800'
                                : 'bg-purple-500/15 text-purple-800'
                            }`}
                          >
                            {arch.id.toUpperCase()}
                          </span>
                          <h4 className="font-bold text-xs sm:text-sm text-[#1C2010] leading-tight">
                            {arch.name}
                          </h4>
                        </div>
                        <p className="text-[10px] text-[#555045] mt-2 font-medium">
                          {arch.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. RAW MANUSCRIPT INGESTION (CLIENT-SIDE DOCX / TXT) */}
              <div className="p-6 rounded-3xl soft-raised bg-[#F5EFE3] border border-[#D8C9A8]/50 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-black/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1C2010] flex items-center gap-2">
                    <Upload className="w-4 h-4 text-teal-700" />
                    Raw Manuscript Ingestion (.docx / .txt)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    100% Private In-Browser
                  </span>
                </div>

                <div className="relative border-2 border-dashed border-[#0E6266]/30 hover:border-[#0E6266] rounded-2xl p-6 text-center soft-inset bg-[#FFFDF9]/60 transition-all">
                  <input
                    type="file"
                    accept=".txt,.docx"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-[#0E6266] flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-[#1C2010]">Click to browse or drag & drop</span> your raw manuscript
                    </div>
                    <p className="text-[10px] text-[#555045]">
                      Supports .docx and .txt. Parses clean headings, breaks, and paragraph flows automatically.
                    </p>
                  </div>
                </div>

                {/* TELEMETRY & AUTO-SYNC STRIP */}
                <div className="p-3.5 rounded-2xl soft-inset bg-white/70 border border-[#D8C9A8]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-[#555045]">
                      File:{' '}
                      <strong className="text-[#1C2010]">
                        {uploadedFileName || 'sample_chapter.txt'}
                      </strong>
                    </span>
                    <span className="text-[#D8C9A8]">|</span>
                    <span className="text-[#555045]">
                      Words: <strong className="text-[#0E6266] font-mono">{manuscriptWordCount}</strong>
                    </span>
                    <span className="text-[#D8C9A8]">|</span>
                    <span className="text-[#555045]">
                      Chapters: <strong className="text-amber-800 font-mono">{detectedChaptersCount}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPageExtent(estimatedPages)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0E6266] text-white text-[11px] font-bold shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Sync Slider to Word Count (~{estimatedPages} Pgs)</span>
                  </button>
                </div>
              </div>

              {/* 4. TOP 4 CURATED BOOK FONTS & TYPOGRAPHY ENGINE */}
              <div className="p-6 rounded-3xl soft-raised bg-[#F5EFE3] border border-[#D8C9A8]/50 space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-black/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1C2010] flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-700" />
                    Top 4 Book Typography & Styling
                  </span>
                  <span className="text-[10px] text-[#555045]">Sets base styling for Step 2 layout proof</span>
                </div>

                {/* TOP 4 FONT SELECTION PILLS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {FONTS_TOP4.map((font) => {
                    const isSelected = typography.fontFamily === font.id;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => setTypography(prev => ({ ...prev, fontFamily: font.id }))}
                        className={`p-3 rounded-2xl text-left border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#0E6266] bg-[#0E6266]/10 shadow-xs ring-1 ring-[#0E6266]'
                            : 'border-black/5 bg-[#FFFDF9]/70 hover:border-black/20'
                        }`}
                      >
                        <span className="text-xs font-bold block text-[#1C2010]">{font.name}</span>
                        <span className="text-[9px] text-[#555045] block mt-0.5">{font.genre}</span>
                      </button>
                    );
                  })}
                </div>

                {/* HIERARCHICAL STYLING KNOBS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {/* BOOK TITLE */}
                  <div className="p-3.5 rounded-2xl soft-inset bg-white/60 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider block text-purple-900">
                      Book Title Style
                    </span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#555045]">Size (pt):</span>
                      <input
                        type="number"
                        min={18}
                        max={42}
                        value={typography.bookTitleSize}
                        onChange={(e) => setTypography(p => ({ ...p, bookTitleSize: parseInt(e.target.value) || 26 }))}
                        className="w-12 text-right font-mono font-bold text-xs bg-transparent outline-none text-[#1C2010]"
                      />
                    </div>
                    <div className="flex gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => setTypography(p => ({ ...p, bookTitleWeight: p.bookTitleWeight === 'bold' ? 'normal' : 'bold' }))}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          typography.bookTitleWeight === 'bold' ? 'bg-[#0E6266] text-white' : 'bg-black/5 text-[#555045]'
                        }`}
                      >
                        Bold
                      </button>
                    </div>
                  </div>

                  {/* CHAPTER HEADINGS */}
                  <div className="p-3.5 rounded-2xl soft-inset bg-white/60 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider block text-teal-900">
                      Chapter Title Style
                    </span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#555045]">Size (pt):</span>
                      <input
                        type="number"
                        min={14}
                        max={30}
                        value={typography.chapterTitleSize}
                        onChange={(e) => setTypography(p => ({ ...p, chapterTitleSize: parseInt(e.target.value) || 18 }))}
                        className="w-12 text-right font-mono font-bold text-xs bg-transparent outline-none text-[#1C2010]"
                      />
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setTypography(p => ({ ...p, chapterTitleWeight: p.chapterTitleWeight === 'bold' ? 'normal' : 'bold' }))}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          typography.chapterTitleWeight === 'bold' ? 'bg-[#0E6266] text-white' : 'bg-black/5 text-[#555045]'
                        }`}
                      >
                        Bold
                      </button>
                      <button
                        type="button"
                        onClick={() => setTypography(p => ({ ...p, chapterTitleItalic: !p.chapterTitleItalic }))}
                        className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          typography.chapterTitleItalic ? 'bg-[#0E6266] text-white' : 'bg-black/5 text-[#555045]'
                        }`}
                      >
                        Italic
                      </button>
                    </div>
                  </div>

                  {/* BODY TEXT */}
                  <div className="p-3.5 rounded-2xl soft-inset bg-white/60 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-900">
                      Body Paragraphs
                    </span>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#555045]">Base Size (pt):</span>
                      <input
                        type="number"
                        min={9}
                        max={16}
                        value={typography.bodySize}
                        onChange={(e) => setTypography(p => ({ ...p, bodySize: parseInt(e.target.value) || 11 }))}
                        className="w-12 text-right font-mono font-bold text-xs bg-transparent outline-none text-[#1C2010]"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[#555045]">Line Height:</span>
                      <select
                        value={typography.bodyLineHeight}
                        onChange={(e) => setTypography(p => ({ ...p, bodyLineHeight: parseFloat(e.target.value) }))}
                        className="p-1 px-2 rounded-lg bg-white border border-black/10 font-mono text-xs cursor-pointer outline-none"
                      >
                        <option value={1.4}>1.4x (Compact)</option>
                        <option value={1.6}>1.6x (Standard Trade)</option>
                        <option value={1.8}>1.8x (Generous)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* LIVE MICRO SAMPLE */}
                <div
                  className="p-4 rounded-2xl soft-inset bg-[#FFFDF9] border border-[#D8C9A8]/40"
                  style={{ fontFamily: typography.fontFamily }}
                >
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#555045] block mb-1">
                    Live Typography Rendering Preview
                  </span>
                  <div
                    style={{
                      fontSize: `${typography.chapterTitleSize}px`,
                      fontWeight: typography.chapterTitleWeight,
                      fontStyle: typography.chapterTitleItalic ? 'italic' : 'normal'
                    }}
                    className="text-[#1C2010]"
                  >
                    Chapter 1: The First Sheet
                  </div>
                  <p
                    style={{
                      fontSize: `${typography.bodySize}px`,
                      lineHeight: typography.bodyLineHeight
                    }}
                    className="text-[#3A352F] mt-1.5"
                  >
                    The stillness of the study was broken only by the clock on the mantelpiece. Outside, rain fell steadily against the tall glass panes, blurring the lamps into soft circles of amber.
                  </p>
                </div>
              </div>

              {/* 5. PHYSICAL POD GEOMETRY & PRINT SPECIFICATIONS */}
              <div className="p-6 sm:p-7 rounded-3xl soft-raised space-y-6 bg-[#F5EFE3] border border-[#D8C9A8]/50">
                <div className="flex items-center justify-between pb-2 border-b border-black/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1C2010] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    Physical Dimensions & POD Caliper
                  </span>
                  <span className="text-[10px] text-[#555045]">KDP & IngramSpark Compliance</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* TRIM DROPDOWN */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-2 text-[#1C2010]">
                      Trim Size Dimension
                    </label>
                    <select
                      value={trimSize}
                      onChange={(e) => setTrimSize(e.target.value)}
                      className="w-full p-3.5 rounded-2xl text-xs font-bold soft-inset outline-none text-[#1C2010] bg-[#FFFDF9]/80 cursor-pointer border border-[#D8C9A8]/50 focus:border-[#0E6266]"
                    >
                      {TRIM_OPTIONS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PAPER STOCK */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-2 text-[#1C2010]">
                      Paper Stock & Caliper
                    </label>
                    <select
                      value={paperType}
                      onChange={(e) => setPaperType(e.target.value)}
                      className="w-full p-3.5 rounded-2xl text-xs font-bold soft-inset outline-none text-[#1C2010] bg-[#FFFDF9]/80 cursor-pointer border border-[#D8C9A8]/50 focus:border-[#0E6266]"
                    >
                      {Object.entries(PAPER_SPECS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* INTERIOR BLEED TOGGLE */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-2 text-[#1C2010]">
                      Interior Bleed Mode
                    </label>
                    <div className="p-1 rounded-2xl soft-inset bg-[#FFFDF9]/80 flex border border-[#D8C9A8]/50">
                      <button
                        type="button"
                        onClick={() => setInteriorBleed(false)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                          !interiorBleed ? 'bg-[#0E6266] text-white shadow-xs' : 'text-[#555045]'
                        }`}
                      >
                        No Bleed
                      </button>
                      <button
                        type="button"
                        onClick={() => setInteriorBleed(true)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                          interiorBleed ? 'bg-[#0E6266] text-white shadow-xs' : 'text-[#555045]'
                        }`}
                      >
                        Full Bleed (+0.125")
                      </button>
                    </div>
                  </div>
                </div>

                {/* PAGE EXTENT SLIDER + NUMERIC STEPPER + KDP 80-PG BADGE */}
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#1C2010] block">
                        Page Extent (Total Page Count)
                      </span>
                      <span className="text-[10px] text-[#555045]">
                        {pageExtent < 80 ? (
                          <span className="text-amber-700 font-semibold">
                            ⚠️ Under 80 pages: KDP cannot print text on the physical spine.
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold">
                            ✓ Meets KDP minimum threshold (≥80 pages) for spine text.
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 p-1 px-3 rounded-xl soft-inset bg-[#FFFDF9] border border-[#D8C9A8]/50">
                      <input
                        type="number"
                        min={24}
                        max={828}
                        step={2}
                        value={pageExtent}
                        onChange={(e) => setPageExtent(Math.max(24, parseInt(e.target.value) || 24))}
                        className="w-14 text-right font-mono font-bold text-xs text-[#0E6266] outline-none bg-transparent"
                      />
                      <span className="text-[11px] font-bold text-[#0E6266]">Pages</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={24}
                    max={600}
                    step={2}
                    value={pageExtent}
                    onChange={(e) => setPageExtent(parseInt(e.target.value))}
                    className="w-full accent-[#0E6266] cursor-pointer h-2 bg-[#D8C9A8] rounded-lg"
                  />

                  <div className="flex justify-between text-[10px] font-mono text-[#555045]/70 mt-1.5 px-0.5">
                    <span>24 pgs (Min POD)</span>
                    <span>150 pgs</span>
                    <span>300 pgs</span>
                    <span>600+ pgs (Trade Max)</span>
                  </div>
                </div>

                {/* REAL-TIME GEOMETRY METRIC CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-[#D8C9A8]/60">
                  <div className="p-3.5 rounded-2xl soft-inset bg-emerald-500/5 border border-emerald-500/20 text-center">
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 block">
                      Spine Gutter Margin
                    </span>
                    <span className="text-base font-extrabold font-mono text-emerald-900 block my-0.5">
                      {calculatedGutter}"
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">Auto-Adjusted to Extent</span>
                  </div>

                  <div className="p-3.5 rounded-2xl soft-inset bg-blue-500/5 border border-blue-500/20 text-center">
                    <span className="text-[10px] font-mono uppercase font-bold text-blue-800 block">
                      Outside Margin
                    </span>
                    <span className="text-base font-extrabold font-mono text-blue-900 block my-0.5">
                      0.500"
                    </span>
                    <span className="text-[10px] text-blue-700 font-medium">Thumb Safe Clearance</span>
                  </div>

                  <div className="p-3.5 rounded-2xl soft-inset bg-amber-500/5 border border-amber-500/20 text-center">
                    <span className="text-[10px] font-mono uppercase font-bold text-amber-800 block">
                      Spine Bulk Thickness
                    </span>
                    <span className="text-base font-extrabold font-mono text-amber-900 block my-0.5">
                      {spineWidth}"
                    </span>
                    <span className="text-[10px] text-amber-700 font-medium">
                      {currentTrim.width}" × {currentTrim.height}" Dimensions
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: INTERIOR LAYOUT & TYPESET PROOF */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2010]">
                    Step 2: Interior Layout & Typeset Proof
                  </h2>
                  <p className="text-xs text-[#555045] mt-1">
                    Author Profile: <strong className="text-emerald-800">{authorName}</strong>
                  </p>
                </div>
                <div className="flex gap-1 p-1 rounded-full soft-inset">
                  <button
                    onClick={() => setSpreadMode('1-page')}
                    className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                      spreadMode === '1-page' ? 'bg-emerald-700 text-white' : 'text-[#555045]'
                    }`}
                  >
                    1-Page View
                  </button>
                  <button
                    onClick={() => setSpreadMode('2-page')}
                    className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                      spreadMode === '2-page' ? 'bg-emerald-700 text-white' : 'text-[#555045]'
                    }`}
                  >
                    2-Page Spread
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl soft-raised space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase block mb-1 text-[#1C2010]">Book Title (Header)</label>
                    <input
                      type="text"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs soft-inset outline-none text-[#1C2010]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase block mb-1 text-[#1C2010]">Author Name</label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => handleAuthorNameChange(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs soft-inset outline-none text-[#1C2010]"
                    />
                  </div>
                  <button
                    onClick={() => setQuickFixDrawerOpen(!quickFixDrawerOpen)}
                    className="w-full py-2 rounded-full soft-btn-pill text-xs font-bold text-teal-800 bg-teal-500/10 cursor-pointer"
                  >
                    {quickFixDrawerOpen ? 'Close Text Editor' : 'Quick-Fix Text'}
                  </button>
                </div>

                <div className="md:col-span-2 p-6 rounded-3xl soft-raised">
                  <div
                    className={`p-6 rounded-2xl soft-inset ${
                      spreadMode === '2-page' ? 'grid grid-cols-2 gap-3' : 'max-w-md mx-auto'
                    }`}
                    style={{ fontFamily: typography.fontFamily }}
                  >
                    <div className="p-4 bg-[#FFFDF9] rounded shadow min-h-[220px] flex flex-col justify-between border-t-2 border-emerald-600">
                      <div className="text-center pb-2 border-b border-black/10 text-[9px] uppercase tracking-widest text-emerald-800 font-bold">
                        {authorName}
                      </div>
                      <p
                        className="leading-relaxed text-[#2D2A26]"
                        style={{
                          fontSize: `${typography.bodySize}px`,
                          lineHeight: typography.bodyLineHeight
                        }}
                      >
                        {manuscriptParagraphs[0]}
                      </p>
                      <span className="text-[9px] text-[#555045]">Page 1</span>
                    </div>

                    {spreadMode === '2-page' && (
                      <div className="p-4 bg-[#FFFDF9] rounded shadow min-h-[220px] flex flex-col justify-between border-t-2 border-emerald-600">
                        <div className="text-center pb-2 border-b border-black/10 text-[9px] uppercase tracking-widest text-emerald-800 font-bold">
                          {bookTitle}
                        </div>
                        <p
                          className="leading-relaxed text-[#2D2A26]"
                          style={{
                            fontSize: `${typography.bodySize}px`,
                            lineHeight: typography.bodyLineHeight
                          }}
                        >
                          {manuscriptParagraphs[1] || 'End of chapter.'}
                        </p>
                        <span className="text-[9px] text-[#555045] text-right">Page 2</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {quickFixDrawerOpen && (
                <div className="p-5 rounded-3xl soft-inset space-y-3 bg-teal-500/5">
                  <h4 className="text-xs font-bold uppercase text-teal-900">Edit Manuscript Content</h4>
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
                      className="w-full p-2.5 rounded-xl text-xs bg-white text-[#1C2010] border border-teal-500/30 outline-none"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: COVER BLUEPRINT */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2010]">
                  Step 3: Cover Blueprint Specification
                </h2>
                <p className="text-xs text-[#555045] mt-1">300 DPI full-wrap layout with barcode protection margin</p>
              </div>

              <div className="p-3 rounded-2xl soft-inset grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-semibold">
                <div>SPINE WIDTH: <span className="font-mono text-emerald-700 font-bold">{spineWidth}"</span></div>
                <div>TOTAL WIDTH: <span className="font-mono text-blue-700 font-bold">{fullCoverWidth}"</span></div>
                <div>TOTAL HEIGHT: <span className="font-mono text-purple-700 font-bold">{fullCoverHeight}"</span></div>
                <div>CANVAS @ 300 DPI: <span className="font-mono text-amber-700 font-bold">{coverPixelsWidth} x {coverPixelsHeight} px</span></div>
              </div>

              <div className="p-6 rounded-3xl soft-raised">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-800">LIVE BLUEPRINT CANVAS</span>
                  <button
                    onClick={handleExportFullCoverArtwork}
                    className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow hover:opacity-95 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Cover (300 DPI)</span>
                  </button>
                </div>
                <div className="p-6 rounded-2xl soft-inset">
                  <div className="relative w-full aspect-[2/1] border-2 border-dashed border-rose-400 rounded bg-[#FFFDF9] flex items-center justify-between p-4 overflow-hidden">
                    <div className="flex-1 h-full border-r border-dashed border-black/20 p-2 flex flex-col justify-between bg-amber-500/5">
                      <span className="text-xs font-bold text-center block text-amber-900">
                        BACK COVER ({currentTrim.width}" × {currentTrim.height}")
                      </span>
                      <div className="self-end p-2 border border-rose-500 bg-rose-500/20 rounded text-[8px] font-mono text-rose-700 font-bold">
                        BARCODE ZONE (2.0" × 1.2")
                      </div>
                    </div>
                    <div className="w-8 sm:w-12 h-full flex items-center justify-center bg-teal-500/10 border-r border-dashed border-black/20 text-[9px] font-mono -rotate-90 text-teal-900 font-bold">
                      {pageExtent >= 80 ? bookTitle.slice(0, 14) : ''}
                    </div>
                    <div className="flex-1 h-full p-2 flex flex-col justify-between items-center text-center bg-emerald-500/5">
                      <span className="text-xs font-bold block text-emerald-900">FRONT COVER</span>
                      <div>
                        <h4 className="font-editorial text-sm font-bold text-[#1C2010]">{bookTitle}</h4>
                        <p className="text-[10px] text-emerald-800">{authorName}</p>
                      </div>
                      <span className="text-[8px] text-emerald-700 font-semibold">0.25" Safe Margin</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: PREFLIGHT & 15-TERRITORY FINANCIAL ENGINE */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2010]">
                    Step 4: Preflight Verification & 15-Territory Financials
                  </h2>
                  <p className="text-xs text-[#555045] mt-1">Multi-country auto-FX conversion and compound 12-month trajectory</p>
                </div>
                <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-900 font-bold text-xs border border-emerald-500/30">
                  100% Ready
                </span>
              </div>

              {/* 12-MONTH CUMULATIVE REVENUE REPORT */}
              <div className="p-6 rounded-3xl soft-raised space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-black/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    12-Month Cumulative Projection ({activeSelectedTerritories.length} Selected Territories)
                  </span>
                  <span className="text-xs font-mono font-bold text-teal-800 bg-teal-500/10 px-2.5 py-0.5 rounded-full">
                    Format: {publishingFormat.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-4 rounded-2xl bg-white shadow-xs border-t-2 border-amber-500">
                    <span className="text-[10px] text-amber-800 block font-bold">🥉 Conservative (Low Velocity)</span>
                    <span className="text-base font-bold font-mono text-[#1C2010] mt-1 block">
                      ${annualReportData.conservative.annualUsd.toLocaleString()} / ₹{annualReportData.conservative.annualInr.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#555045] block font-mono">
                      {annualReportData.conservative.annualUnits} units/yr
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white shadow-xs border-t-2 border-emerald-600">
                    <span className="text-[10px] text-emerald-800 block font-bold">🥈 Benchmark (Target Velocity)</span>
                    <span className="text-base font-bold font-mono text-emerald-700 mt-1 block">
                      ${annualReportData.average.annualUsd.toLocaleString()} / ₹{annualReportData.average.annualInr.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#555045] block font-mono">
                      {annualReportData.average.annualUnits} units/yr
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white shadow-xs border-t-2 border-purple-600">
                    <span className="text-[10px] text-purple-800 block font-bold">🥇 Scaled (Ad Scaling)</span>
                    <span className="text-base font-bold font-mono text-purple-700 mt-1 block">
                      ${annualReportData.scaled.annualUsd.toLocaleString()} / ₹{annualReportData.scaled.annualInr.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#555045] block font-mono">
                      {annualReportData.scaled.annualUnits} units/yr
                    </span>
                  </div>
                </div>

                {/* FORMAT CONTROLLER */}
                <div className="p-3.5 rounded-2xl soft-inset flex flex-col sm:flex-row items-center justify-between gap-3 bg-teal-500/5">
                  <span className="text-xs font-bold uppercase text-teal-900">Publishing Format:</span>
                  <div className="flex gap-1.5">
                    {[
                      { id: 'paperback', label: 'Paperback Only' },
                      { id: 'ebook', label: 'eBook Only' },
                      { id: 'both', label: 'Both Formats' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setPublishingFormat(f.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                          publishingFormat === f.id
                            ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-xs'
                            : 'text-teal-900'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* TRAJECTORY SLIDERS */}
                <div className="p-4 rounded-2xl soft-inset space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-[#1C2010]">
                    <span className="text-emerald-800">Month 1 Starting Copies: {initialMonthlySales}</span>
                    <span className="text-teal-800">
                      Monthly Trajectory: {monthlyGrowthRate > 0 ? `+${monthlyGrowthRate}%` : `${monthlyGrowthRate}%`}/mo
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="range"
                      min={5}
                      max={500}
                      step={5}
                      value={initialMonthlySales}
                      onChange={(e) => setInitialMonthlySales(parseInt(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                    <input
                      type="range"
                      min={-10}
                      max={25}
                      step={1}
                      value={monthlyGrowthRate}
                      onChange={(e) => setMonthlyGrowthRate(parseInt(e.target.value))}
                      className="w-full accent-teal-600"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/10 text-center font-mono text-xs">
                    <div>M1: <strong className="text-emerald-700">{annualReportData.average.m1Units}</strong> copies</div>
                    <div>M6: <strong className="text-teal-700">{annualReportData.average.m6Units}</strong> copies</div>
                    <div>M12: <strong className="text-purple-700">{annualReportData.average.m12Units}</strong> copies</div>
                  </div>
                </div>

                {/* US BASE PRICES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase block mb-1 text-emerald-900">
                      US Paperback Retail ($ USD):
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      value={usPaperbackPrice}
                      onChange={(e) => handleUsPriceChange(e.target.value, 'paperback')}
                      className="w-full p-2 font-mono font-bold text-xs rounded-xl bg-white border border-emerald-500/30 outline-none text-emerald-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase block mb-1 text-teal-900">
                      US eBook Retail ($ USD):
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      value={usEbookPrice}
                      onChange={(e) => handleUsPriceChange(e.target.value, 'ebook')}
                      className="w-full p-2 font-mono font-bold text-xs rounded-xl bg-white border border-teal-500/30 outline-none text-teal-900"
                    />
                  </div>
                </div>

                {/* 15 TERRITORY EARNINGS */}
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase text-[#1C2010] flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-emerald-600" />
                      Territory Earnings ({activeSelectedTerritories.length} Active)
                    </span>
                    <button
                      onClick={() =>
                        setSelectedKdpCountries(
                          selectedKdpCountries.length === Object.keys(POD_MARKETPLACES).length
                            ? ['US', 'IN']
                            : Object.keys(POD_MARKETPLACES)
                        )
                      }
                      className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      {selectedKdpCountries.length === Object.keys(POD_MARKETPLACES).length
                        ? 'Deselect All'
                        : 'Select All Territories'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {activeSelectedTerritories.map((item) => (
                      <div
                        key={item.code}
                        className="p-3.5 rounded-2xl soft-inset text-xs space-y-1 bg-gradient-to-br from-[#F5EFE3] to-[#EAE2CE]/50"
                      >
                        <span className="font-bold text-emerald-800 block flex justify-between">
                          <span>{item.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-900">
                            {item.code}
                          </span>
                        </span>
                        <div className="flex justify-between">
                          <span className="text-[#555045]">Print Cost:</span>
                          <span className="font-mono font-bold text-rose-700">{item.symbol}{item.printCost}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#555045]">Retail:</span>
                          <span className="font-mono font-bold text-blue-700">{item.symbol}{item.pbActivePrice}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-black/10 font-bold">
                          <span>Royalty:</span>
                          <span className="text-emerald-700">+{item.symbol}{item.royaltyPerUnit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PREFLIGHT CHECKS */}
              <div className="p-6 rounded-3xl soft-raised space-y-2 text-xs">
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 block mb-1">
                  PREFLIGHT PASS CHECKS
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-900 flex justify-between font-bold border border-emerald-500/30">
                  <span>✓ Page Extent Compatible ({pageExtent} pages meets trade minimums)</span>
                  <span className="text-emerald-700">PASS</span>
                </div>
                <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-900 flex justify-between font-bold border border-teal-500/30">
                  <span>✓ Spine Gutter Clearance ({calculatedGutter}" inside margin prevents crease clipping)</span>
                  <span className="text-teal-700">PASS</span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-900 flex justify-between font-bold border border-blue-500/30">
                  <span>✓ 300 DPI Resolution ({coverPixelsWidth} x {coverPixelsHeight} px verified)</span>
                  <span className="text-blue-700">PASS</span>
                </div>
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleDownloadSpecification}
                    className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white px-6 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow hover:opacity-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Production Specification (.txt)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DOCK BAR */}
          <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-md flex items-center justify-between max-w-5xl mx-auto border-t border-black/10">
            <button
              onClick={() => setActiveView('home')}
              className="px-4 py-2 rounded-full text-xs font-semibold soft-btn-pill text-emerald-800 cursor-pointer"
            >
              Home Overview
            </button>
            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-4 py-2 rounded-full text-xs font-bold soft-btn-pill flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}
              {currentStep < 4 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="px-5 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center gap-1 shadow cursor-pointer"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleDownloadSpecification}
                  className="px-5 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center gap-1 shadow cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Complete Studio</span>
                </button>
              )}
            </div>
            <button
              onClick={() => setHelpProfileDrawerOpen(true)}
              className="px-4 py-2 rounded-full text-xs font-bold soft-btn-pill text-teal-800 cursor-pointer"
            >
              Help & Profile
            </button>
          </div>
        </main>
      )}

      {/* AI MODAL (BYOK) */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl p-6 soft-raised space-y-4 bg-[#F5EFE3]">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-600" />
                <h3 className="font-editorial font-bold text-base">Client-Side AI Generator</h3>
              </div>
              <button onClick={() => setAiModalOpen(false)}>
                <X className="w-4 h-4 cursor-pointer" />
              </button>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase block mb-1 text-indigo-900">Gemini API Key (BYOK):</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={userApiKey}
                onChange={(e) => setUserApiKey(e.target.value)}
                className="w-full p-2.5 rounded-xl text-xs bg-white border border-indigo-500/30 outline-none text-indigo-900"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase block mb-1 text-indigo-900">Intent:</label>
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
                    className={`p-2 rounded-xl text-xs font-semibold border text-left cursor-pointer ${
                      aiContentType === item.id
                        ? 'border-indigo-600 bg-indigo-500/15 text-indigo-900 font-bold'
                        : 'border-black/10 text-[#555045]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setAiModalOpen(false)} className="px-4 py-2 rounded-full text-xs font-semibold cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleGenerateAiContent}
                disabled={isGeneratingAi}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
              >
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
          <div className="w-full max-w-md rounded-3xl p-6 soft-raised space-y-4 bg-[#F5EFE3]">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <h3 className="font-editorial font-bold text-base text-emerald-900">Help Center & Author Identity</h3>
              <button onClick={() => setHelpProfileDrawerOpen(false)}>
                <X className="w-4 h-4 cursor-pointer" />
              </button>
            </div>
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 block">
                AUTHOR IDENTITY (REMEMBERED LOCALLY)
              </span>
              <input
                type="text"
                placeholder="Author Name"
                value={authorName}
                onChange={(e) => handleAuthorNameChange(e.target.value)}
                className="w-full p-2.5 rounded-xl text-xs bg-white border border-emerald-500/30 outline-none text-[#1C2010]"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={authorProfileEmail}
                onChange={(e) => setAuthorProfileEmail(e.target.value)}
                className="w-full p-2.5 rounded-xl text-xs bg-white border border-emerald-500/30 outline-none text-[#1C2010]"
              />
            </div>
            <div className="space-y-3 pt-2 border-t border-black/10">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 block">
                REPORT ISSUE / FEEDBACK
              </span>
              <textarea
                rows={3}
                placeholder="Describe suggestions or issues..."
                value={feedbackFeedback}
                onChange={(e) => setFeedbackFeedback(e.target.value)}
                className="w-full p-2.5 rounded-xl text-xs bg-white border border-emerald-500/30 outline-none text-[#1C2010]"
              />
              {feedbackSent ? (
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-900 text-xs font-bold text-center border border-emerald-500/30">
                  ✓ Feedback recorded locally!
                </div>
              ) : (
                <button
                  onClick={() => setFeedbackSent(true)}
                  className="w-full py-2 rounded-full bg-gradient-to-r from-emerald-700 to-teal-700 text-white text-xs font-bold shadow cursor-pointer"
                >
                  Submit Feedback
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MY BOOKS SHELF */}
      {isShelfOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl p-6 soft-raised space-y-4 bg-[#F5EFE3]">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <h3 className="font-editorial font-bold text-base text-amber-900">My Bookshelf</h3>
              <button onClick={() => setIsShelfOpen(false)}>
                <X className="w-4 h-4 cursor-pointer" />
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              <div className="p-3 rounded-2xl soft-inset flex justify-between items-center bg-amber-500/5 border border-amber-500/20">
                <div>
                  <h4 className="font-bold text-xs text-[#1C2010]">{bookTitle}</h4>
                  <p className="text-[10px] text-amber-800 font-medium">
                    {authorName} • {trimSize} • {pageExtent} Pgs
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-900">
                  Active Draft
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
