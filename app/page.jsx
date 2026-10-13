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
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Wand2,
  Info
} from 'lucide-react';
import { saveAs } from 'file-saver';
import {
  saveProjectToStorage,
  getAllProjectsFromStorage,
  deleteProjectFromStorage,
  recordReviewToStorage
} from './projectStorage';

/* --------------------------------------------------------------------------
   MASTER DATA & SPECIFICATIONS
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
  { id: '5x8', name: '5" x 8" (Compact Novella)', width: 5.0, height: 8.0, wordsPerPage: 220 },
  { id: '5.25x8', name: '5.25" x 8" (Pocket Fiction)', width: 5.25, height: 8.0, wordsPerPage: 235 },
  { id: '5.5x8.5', name: '5.5" x 8.5" (Standard Trade Paperback)', width: 5.5, height: 8.5, wordsPerPage: 250 },
  { id: '6x9', name: '6" x 9" (Standard Trade Paperback)', width: 6.0, height: 9.0, wordsPerPage: 300 },
  { id: '7x10', name: '7" x 10" (Executive / Handbook)', width: 7.0, height: 10.0, wordsPerPage: 380 },
  { id: '8.5x11', name: '8.5" x 11" (Workbook / Manual)', width: 8.5, height: 11.0, wordsPerPage: 450 }
];

const PAPER_SPECS = {
  cream: { label: 'Standard Cream (50-55 lb / 74-81 gsm)', caliper: 0.002500 },
  white: { label: 'Standard White (50-55 lb / 74-81 gsm)', caliper: 0.002252 },
  premium_color: { label: 'Premium Color (70 lb / 104 gsm)', caliper: 0.002700 }
};

const FONTS_TOP4 = [
  { id: 'EB Garamond, serif', name: 'Garamond', genre: 'Literary Fiction & Memoir' },
  { id: 'Merriweather, serif', name: 'Merriweather', genre: 'Trade Non-Fiction' },
  { id: 'Playfair Display, serif', name: 'Playfair / Cinzel', genre: 'Luxury & Historical' },
  { id: 'Inter, sans-serif', name: 'Inter Sans', genre: 'Workbooks & Modern Guides' }
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
  BR: { name: 'Brazil (BRL)', currency: 'BR', symbol: 'R$', base: 5.50, perPage: 0.08, fxRate: 5.10, defaultPrice: 65.00 }
};

const SAMPLE_CHAPTER_TEXT = [
  "Chapter 1: The First Sheet",
  "The stillness of the study was broken only by the clock on the mantelpiece. Outside, rain fell steadily against the tall glass panes, blurring the lamps along the quiet avenue into soft circles of amber. He dipped the nib of his pen into the dark ink, pausing to listen to the carriage wheels rolling across the wet cobblestones below.",
  "Every manuscript began this way—not with certainty, but with the quiet discipline of facing an empty sheet. The margins preserved the words, keeping the inner voice protected from the binding. A properly formatted book respects both the eyes of the reader and the physical machinery of the bindery.",
  "Chapter 2: The Proof of Binding",
  "As morning arrived, the light revealed the true texture of the cream paper. The typeface held firmly to the fibers, its serif contours clear and undisturbed. In publishing, true precision is invisible; the reader experiences only the natural cadence of the thoughts, effortlessly flowing across each spread."
];

export default function PublishStudioApp() {
  /* ROUTING & ACTIVE VIEW */
  const [activeView, setActiveView] = useState('home');
  const [currentStep, setCurrentStep] = useState(1);

  /* PROJECT METADATA */
  const [bookTitle, setBookTitle] = useState('The Memory Chef');
  const [authorName, setAuthorName] = useState('Kavita Chougule');
  const [rememberAuthor, setRememberAuthor] = useState(true);
  const [selectedArchetype, setSelectedArchetype] = useState('fiction');
  const [macroCategory, setMacroCategory] = useState('text-rich');
  const [trimSize, setTrimSize] = useState('5.5x8.5');
  const [paperType, setPaperType] = useState('cream');
  const [interiorBleed, setInteriorBleed] = useState(false);
  const [pageExtent, setPageExtent] = useState(120);

  /* TYPOGRAPHY */
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

  /* INGESTION & PARAGRAPHS */
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [manuscriptParagraphs, setManuscriptParagraphs] = useState(SAMPLE_CHAPTER_TEXT);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  /* STEP 2 INTERIOR STATE */
  const [activeSpreadIndex, setActiveSpreadIndex] = useState(0);
  const [spreadMode, setSpreadMode] = useState('2-page'); // '1-page' | '2-page'
  const [quickFixDrawerOpen, setQuickFixDrawerOpen] = useState(true);
  const [scoringModalOpen, setScoringModalOpen] = useState(false);

  /* COVER ASSETS */
  const [frontCoverImage, setFrontCoverImage] = useState(null);
  const [backCoverImage, setBackCoverImage] = useState(null);

  /* REVENUE & PRICING */
  const [publishingFormat, setPublishingFormat] = useState('both');
  const [royaltyShareTier, setRoyaltyShareTier] = useState(0.60);
  const [usPaperbackPrice, setUsPaperbackPrice] = useState('12.99');
  const [usEbookPrice, setUsEbookPrice] = useState('4.99');
  const [customRetailPrices, setCustomRetailPrices] = useState({});
  const [selectedKdpCountries, setSelectedKdpCountries] = useState(['IN', 'US', 'UK', 'DE', 'CA', 'AU']);
  const [initialMonthlySales, setInitialMonthlySales] = useState(50);
  const [monthlyGrowthRate, setMonthlyGrowthRate] = useState(5);

  /* AI ENGINE */
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  const [aiContentType, setAiContentType] = useState('chapter');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  /* MODALS & DRAWERS */
  const [helpProfileDrawerOpen, setHelpProfileDrawerOpen] = useState(false);
  const [isShelfOpen, setIsShelfOpen] = useState(false);
  const [authorProfileEmail, setAuthorProfileEmail] = useState('');
  const [feedbackFeedback, setFeedbackFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  /* INITIAL MOUNT LOAD */
  useEffect(() => {
    const key = localStorage.getItem('ps_user_ai_key');
    if (key) setUserApiKey(key);
    const savedAuthor = localStorage.getItem('ps_default_author');
    if (savedAuthor) setAuthorName(savedAuthor);
  }, []);

  const handleAuthorNameChange = (val) => {
    setAuthorName(val);
    if (rememberAuthor && val.trim().length > 0) {
      localStorage.setItem('ps_default_author', val.trim());
    }
  };

  /* CLEAN DOCX & TXT CLIENT-SIDE INGESTION ENGINE */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsProcessingFile(true);

    try {
      if (file.name.endsWith('.docx')) {
        // Load JSZip dynamically via browser
        let JSZipLib = window.JSZip;
        if (!JSZipLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
          JSZipLib = window.JSZip;
        }

        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZipLib.loadAsync(arrayBuffer);
        const docXml = await zip.file('word/document.xml')?.async('text');

        if (docXml) {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(docXml, 'application/xml');
          const pNodes = Array.from(xmlDoc.getElementsByTagName('w:p'));

          const extracted = pNodes
            .map(p => {
              const texts = Array.from(p.getElementsByTagName('w:t')).map(t => t.textContent);
              return texts.join('').trim();
            })
            .filter(t => t.length > 0);

          if (extracted.length > 0) {
            setManuscriptParagraphs(extracted);
          }
        }
      } else {
        // Plain text reading
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result;
          if (typeof text === 'string') {
            const rawLines = text
              .split(/\r?\n/)
              .map(l => l.trim())
              .filter(l => l.length > 0);
            if (rawLines.length > 0) {
              setManuscriptParagraphs(rawLines);
            }
          }
        };
        reader.readAsText(file);
      }
    } catch (err) {
      alert('File read fallback: loaded as plain text. Error: ' + err.message);
    } finally {
      setIsProcessingFile(false);
    }
  };

  /* COMPUTED WORD & CHAPTER METRICS */
  const manuscriptWordCount = useMemo(() => {
    return manuscriptParagraphs.reduce((acc, p) => acc + p.split(/\s+/).filter(Boolean).length, 0);
  }, [manuscriptParagraphs]);

  const detectedChaptersCount = useMemo(() => {
    const chapters = manuscriptParagraphs.filter(p => /^(chapter|\d+\.|#)/i.test(p));
    return Math.max(1, chapters.length);
  }, [manuscriptParagraphs]);

  const currentTrim = useMemo(() => {
    return TRIM_OPTIONS.find(t => t.id === trimSize) || TRIM_OPTIONS[2];
  }, [trimSize]);

  const estimatedPages = useMemo(() => {
    const wpp = currentTrim.wordsPerPage || 250;
    return Math.max(24, Math.ceil(manuscriptWordCount / wpp));
  }, [manuscriptWordCount, currentTrim]);

  /* PRINT GEOMETRY MATH */
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

  /* DYNAMIC REALISTIC PAGE CHUNKER FOR STEP 2 SPREAD */
  const paginatedPages = useMemo(() => {
    const pages = [];
    let currentPage = [];
    let currentWordCount = 0;
    const maxWordsPerPage = currentTrim.wordsPerPage || 250;

    manuscriptParagraphs.forEach((para, pIdx) => {
      const isHeader = /^(chapter|\d+\.|#)/i.test(para);
      const wordsInPara = para.split(/\s+/).filter(Boolean).length;

      if (isHeader && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [{ text: para, isHeader: true, originalIdx: pIdx }];
        currentWordCount = wordsInPara;
        return;
      }

      if (currentWordCount + wordsInPara > maxWordsPerPage && currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [{ text: para, isHeader, originalIdx: pIdx }];
        currentWordCount = wordsInPara;
      } else {
        currentPage.push({ text: para, isHeader, originalIdx: pIdx });
        currentWordCount += wordsInPara;
      }
    });

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    return pages.length > 0 ? pages : [[{ text: 'Empty manuscript sheet.', isHeader: false, originalIdx: 0 }]];
  }, [manuscriptParagraphs, currentTrim]);

  const totalSpreads = useMemo(() => Math.ceil(paginatedPages.length / 2), [paginatedPages]);

  const activeVersoPage = paginatedPages[activeSpreadIndex * 2] || null;
  const activeRectoPage = paginatedPages[activeSpreadIndex * 2 + 1] || null;

  /* REAL-TIME GRAMMAR & EDITORIAL HEURISTICS (CLIENT-SIDE) */
  const editorialAnalysis = useMemo(() => {
    const issues = [];
    let passiveCount = 0;
    let fillerCount = 0;
    let typoCount = 0;

    const fillerRegex = /\b(very|really|suddenly|just|perhaps|somewhat|basically|quite)\b/gi;
    const passiveRegex = /\b(was|were|been|being)\s+([a-z]+ed|[a-z]+en)\b/gi;
    const doubleWordRegex = /\b([a-z]+)\s+\1\b/gi;

    manuscriptParagraphs.forEach((para, idx) => {
      let match;
      while ((match = fillerRegex.exec(para)) !== null) {
        fillerCount++;
        issues.push({
          type: 'filler',
          paraIdx: idx,
          word: match[0],
          message: `Overused filler adverb "${match[0]}". Consider deleting for tighter prose.`,
          fix: ''
        });
      }
      while ((match = passiveRegex.exec(para)) !== null) {
        passiveCount++;
        issues.push({
          type: 'passive',
          paraIdx: idx,
          word: match[0],
          message: `Passive construction "${match[0]}". Active voice increases narrative drive.`,
          fix: match[0].split(' ')[1]
        });
      }
      while ((match = doubleWordRegex.exec(para)) !== null) {
        typoCount++;
        issues.push({
          type: 'typo',
          paraIdx: idx,
          word: match[0],
          message: `Accidental duplicate word "${match[0]}".`,
          fix: match[1]
        });
      }
    });

    // Composite Book Score Calculation (0 - 100)
    const totalWords = Math.max(1, manuscriptWordCount);
    const fillerDensity = (fillerCount / totalWords) * 100;
    const passiveDensity = (passiveCount / totalWords) * 100;

    // Sub-scores
    const readabilityScore = Math.min(25, Math.max(10, Math.round(25 - (fillerDensity * 2))));
    const mechanicsScore = Math.min(25, Math.max(10, Math.round(25 - (typoCount * 3))));
    const styleScore = Math.min(25, Math.max(10, Math.round(25 - (passiveDensity * 2.5))));
    const geometryScore = pageExtent >= 80 ? 25 : 18;

    const totalScore = Math.min(100, readabilityScore + mechanicsScore + styleScore + geometryScore);

    return {
      issues,
      fillerCount,
      passiveCount,
      typoCount,
      totalScore,
      breakdown: {
        readability: readabilityScore,
        mechanics: mechanicsScore,
        style: styleScore,
        geometry: geometryScore
      }
    };
  }, [manuscriptParagraphs, manuscriptWordCount, pageExtent]);

  /* 1-CLICK QUICK FIX APPLY */
  const applyQuickFix = (issue) => {
    const updated = [...manuscriptParagraphs];
    const target = updated[issue.paraIdx];
    if (target) {
      if (issue.type === 'filler') {
        const regex = new RegExp(`\\b${issue.word}\\s*`, 'i');
        updated[issue.paraIdx] = target.replace(regex, '');
      } else if (issue.type === 'typo') {
        const regex = new RegExp(`\\b${issue.word}\\b`, 'i');
        updated[issue.paraIdx] = target.replace(regex, issue.fix);
      }
      setManuscriptParagraphs(updated);
    }
  };

  /* FINANCIAL / TERRITORY DATA */
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

      {/* VIEW A: LANDING / HOME */}
      {activeView === 'home' && (
        <main className="max-w-6xl mx-auto px-4 py-12 space-y-16 animate-in fade-in">
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
        </main>
      )}

      {/* VIEW B: 4-STEP PRODUCTION STUDIO */}
      {activeView === 'studio' && (
        <main className="max-w-6xl mx-auto px-4 py-8 pb-32 animate-in fade-in">
          {/* STEP TRACKER WITH ACTIVE CONNECTOR LINES */}
          <div className="mb-8">
            <div className="p-3 rounded-full soft-inset flex items-center justify-between bg-[#ECE4D0]/80">
              {[
                { step: 1, label: '1. Setup' },
                { step: 2, label: '2. Interior' },
                { step: 3, label: '3. Cover' },
                { step: 4, label: '4. Preflight' }
              ].map((s, idx) => {
                const isActive = currentStep === s.step;
                const isPassed = currentStep > s.step;
                const isNextConnectorActive = currentStep > s.step;

                return (
                  <React.Fragment key={s.step}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(s.step)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white font-bold shadow-md scale-105'
                          : isPassed
                          ? 'text-emerald-900 font-bold bg-emerald-500/20'
                          : 'text-[#555045]/60 hover:text-[#1C2010]'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                          isActive
                            ? 'bg-white text-emerald-800'
                            : isPassed
                            ? 'bg-emerald-700 text-white'
                            : 'bg-black/10 text-[#555045]'
                        }`}
                      >
                        {isPassed ? '✓' : s.step}
                      </span>
                      <span className="hidden sm:inline">{s.label}</span>
                    </button>

                    {/* DYNAMIC PROGRESS CONNECTOR LINE */}
                    {idx < 3 && (
                      <div
                        className={`flex-1 h-1 mx-1.5 rounded-full transition-all duration-300 ${
                          isNextConnectorActive ? 'bg-emerald-600 shadow-xs' : 'bg-black/10'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* STEP 1: SPECIFICATION & MANUSCRIPT SETUP */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
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

              {/* AUTHOR METADATA */}
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

              {/* MACRO CATEGORY & ARCHETYPES */}
              <div className="space-y-3">
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

              {/* RAW MANUSCRIPT INGESTION (PARSES CLEAN DOCX / TXT) */}
              <div className="p-6 rounded-3xl soft-raised bg-[#F5EFE3] border border-[#D8C9A8]/50 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-black/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1C2010] flex items-center gap-2">
                    <Upload className="w-4 h-4 text-teal-700" />
                    Raw Manuscript Ingestion (.docx / .txt)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {isProcessingFile ? 'Unpacking DOCX...' : '100% In-Browser Unpacker'}
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
                      Supports .docx and .txt. Extracts headings, chapter breaks, and paragraphs cleanly.
                    </p>
                  </div>
                </div>

                {/* TELEMETRY STRIP */}
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

              {/* TOP 4 BOOK TYPOGRAPHY */}
              <div className="p-6 rounded-3xl soft-raised bg-[#F5EFE3] border border-[#D8C9A8]/50 space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-black/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1C2010] flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-700" />
                    Top 4 Book Typography & Styling
                  </span>
                  <span className="text-[10px] text-[#555045]">Step 2 proof inherits these settings</span>
                </div>

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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
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
                  </div>

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
                  </div>

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
                  </div>
                </div>
              </div>

              {/* PHYSICAL DIMENSIONS & CALIPER */}
              <div className="p-6 sm:p-7 rounded-3xl soft-raised space-y-6 bg-[#F5EFE3] border border-[#D8C9A8]/50">
                <div className="flex items-center justify-between pb-2 border-b border-black/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1C2010] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    Physical Dimensions & POD Caliper
                  </span>
                  <span className="text-[10px] text-[#555045]">KDP & IngramSpark Compliance</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                {/* PAGE EXTENT & KDP SPINE SAFETY BADGE */}
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
                </div>

                {/* GEOMETRY CARDS */}
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
          {/* STEP 2: INTERIOR LAYOUT & EDITORIAL STUDIO */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              {/* TOP STRIP & OVERALL SCORECARD */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#D8C9A8]/70">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-[#0E6266] bg-[#0E6266]/10 px-2.5 py-0.5 rounded-full">
                      Step 02
                    </span>
                    <span className="text-[10px] text-[#555045] font-semibold">Live Typeset & Editorial Proof</span>
                  </div>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2010] mt-1">
                    Interior Typeset & Grammar Studio
                  </h2>
                </div>

                {/* OVERALL BOOK QUALITY SCORECARD */}
                <div className="flex items-center gap-3 bg-[#FAF6ED] p-2.5 px-4 rounded-2xl soft-raised border border-[#D8C9A8]/60">
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider block font-bold text-[#555045]">
                      Overall Book Score
                    </span>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-lg font-mono font-extrabold text-emerald-800">
                        {editorialAnalysis.totalScore}/100
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                        {editorialAnalysis.totalScore >= 85 ? 'Trade Ready' : 'Polishing Needed'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScoringModalOpen(true)}
                    className="p-1.5 rounded-xl bg-[#0E6266]/10 hover:bg-[#0E6266]/20 text-[#0E6266] cursor-pointer transition-all"
                    title="View Industry Scoring Methodology"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* IN-STEP AUTHOR & TITLE QUICK EDITOR */}
              <div className="p-4 rounded-2xl soft-raised bg-[#FAF6ED] grid grid-cols-1 sm:grid-cols-2 gap-4 border border-[#D8C9A8]/40">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-[#555045]">
                    Book Title (Verso Header)
                  </label>
                  <input
                    type="text"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    className="w-full p-2 rounded-xl text-xs font-bold soft-inset outline-none text-[#1C2010] bg-white border border-[#D8C9A8]/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-[#555045]">
                    Author Name (Recto Header)
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => handleAuthorNameChange(e.target.value)}
                    className="w-full p-2 rounded-xl text-xs font-bold soft-inset outline-none text-[#1C2010] bg-white border border-[#D8C9A8]/40"
                  />
                </div>
              </div>

              {/* CONTROLS BAR (SPREAD NAVIGATOR & QUICK FIX TOGGLE) */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl soft-inset bg-[#ECE4D0]/70">
                {/* PAGE SPREAD STEPPER */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={activeSpreadIndex === 0}
                    onClick={() => setActiveSpreadIndex(p => Math.max(0, p - 1))}
                    className="p-1.5 rounded-xl bg-white soft-raised text-[#1C2010] disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-mono font-bold text-[#1C2010] px-2">
                    Spread {activeSpreadIndex + 1} of {totalSpreads} (Pages {activeSpreadIndex * 2 + 1}-{Math.min(paginatedPages.length, activeSpreadIndex * 2 + 2)})
                  </span>

                  <button
                    type="button"
                    disabled={activeSpreadIndex >= totalSpreads - 1}
                    onClick={() => setActiveSpreadIndex(p => Math.min(totalSpreads - 1, p + 1))}
                    className="p-1.5 rounded-xl bg-white soft-raised text-[#1C2010] disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* SPREAD MODE TOGGLE */}
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-xl bg-white/70 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setSpreadMode('1-page')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        spreadMode === '1-page' ? 'bg-[#0E6266] text-white shadow-xs' : 'text-[#555045]'
                      }`}
                    >
                      1-Page Focus
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpreadMode('2-page')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        spreadMode === '2-page' ? 'bg-[#0E6266] text-white shadow-xs' : 'text-[#555045]'
                      }`}
                    >
                      2-Page Spread
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setQuickFixDrawerOpen(!quickFixDrawerOpen)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-900 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Quick-Fix ({editorialAnalysis.issues.length})</span>
                  </button>
                </div>
              </div>

              {/* REALISTIC BOOK SPREAD + RIGHT INSPECTOR DOCK */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* 2-PAGE REALISTIC TYPESET SPREAD */}
                <div className={`${quickFixDrawerOpen ? 'lg:col-span-2' : 'lg:col-span-3'} transition-all`}>
                  <div
                    className={`p-6 sm:p-8 rounded-3xl soft-raised bg-[#FAF6ED] border border-[#D8C9A8]/60 ${
                      spreadMode === '2-page' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'max-w-md mx-auto'
                    }`}
                  >
                    {/* LEFT PAGE (VERSO) */}
                    {activeVersoPage && (
                      <div
                        className="bg-[#FFFDF9] rounded-xl p-6 sm:p-8 shadow-md border-t-4 border-emerald-700 flex flex-col justify-between min-h-[480px] relative transition-all"
                        style={{ fontFamily: typography.fontFamily }}
                      >
                        {/* RUNNING HEADER */}
                        <div className="text-center pb-3 border-b border-black/10 text-[10px] uppercase tracking-widest text-[#555045] font-bold">
                          {authorName}
                        </div>

                        {/* EDITABLE MANUSCRIPT PARAGRAPHS */}
                        <div className="space-y-3.5 my-4 flex-1">
                          {activeVersoPage.map((item, idx) => (
                            <div key={idx}>
                              {item.isHeader ? (
                                <h3
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => {
                                    const copy = [...manuscriptParagraphs];
                                    copy[item.originalIdx] = e.currentTarget.textContent || '';
                                    setManuscriptParagraphs(copy);
                                  }}
                                  style={{
                                    fontSize: `${typography.chapterTitleSize}px`,
                                    fontWeight: typography.chapterTitleWeight,
                                    fontStyle: typography.chapterTitleItalic ? 'italic' : 'normal'
                                  }}
                                  className="text-[#1C2010] outline-none border-b border-transparent hover:border-black/20 focus:border-[#0E6266] transition-colors"
                                >
                                  {item.text}
                                </h3>
                              ) : (
                                <p
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => {
                                    const copy = [...manuscriptParagraphs];
                                    copy[item.originalIdx] = e.currentTarget.textContent || '';
                                    setManuscriptParagraphs(copy);
                                  }}
                                  style={{
                                    fontSize: `${typography.bodySize}px`,
                                    lineHeight: typography.bodyLineHeight
                                  }}
                                  className="text-[#2D2A26] outline-none border-b border-transparent hover:border-black/20 focus:border-[#0E6266] transition-colors"
                                >
                                  {item.text}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* RUNNING FOOTER WITH PAGE NUMBER */}
                        <div className="text-center pt-3 border-t border-black/10 text-[10px] font-mono text-[#555045]">
                          {activeSpreadIndex * 2 + 1}
                        </div>
                      </div>
                    )}

                    {/* RIGHT PAGE (RECTO) */}
                    {spreadMode === '2-page' && activeRectoPage && (
                      <div
                        className="bg-[#FFFDF9] rounded-xl p-6 sm:p-8 shadow-md border-t-4 border-teal-700 flex flex-col justify-between min-h-[480px] relative transition-all"
                        style={{ fontFamily: typography.fontFamily }}
                      >
                        {/* RUNNING HEADER */}
                        <div className="text-center pb-3 border-b border-black/10 text-[10px] uppercase tracking-widest text-[#555045] font-bold">
                          {bookTitle}
                        </div>

                        {/* EDITABLE MANUSCRIPT PARAGRAPHS */}
                        <div className="space-y-3.5 my-4 flex-1">
                          {activeRectoPage.map((item, idx) => (
                            <div key={idx}>
                              {item.isHeader ? (
                                <h3
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => {
                                    const copy = [...manuscriptParagraphs];
                                    copy[item.originalIdx] = e.currentTarget.textContent || '';
                                    setManuscriptParagraphs(copy);
                                  }}
                                  style={{
                                    fontSize: `${typography.chapterTitleSize}px`,
                                    fontWeight: typography.chapterTitleWeight,
                                    fontStyle: typography.chapterTitleItalic ? 'italic' : 'normal'
                                  }}
                                  className="text-[#1C2010] outline-none border-b border-transparent hover:border-black/20 focus:border-[#0E6266] transition-colors"
                                >
                                  {item.text}
                                </h3>
                              ) : (
                                <p
                                  contentEditable
                                  suppressContentEditableWarning
                                  onBlur={(e) => {
                                    const copy = [...manuscriptParagraphs];
                                    copy[item.originalIdx] = e.currentTarget.textContent || '';
                                    setManuscriptParagraphs(copy);
                                  }}
                                  style={{
                                    fontSize: `${typography.bodySize}px`,
                                    lineHeight: typography.bodyLineHeight
                                  }}
                                  className="text-[#2D2A26] outline-none border-b border-transparent hover:border-black/20 focus:border-[#0E6266] transition-colors"
                                >
                                  {item.text}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* RUNNING FOOTER WITH PAGE NUMBER */}
                        <div className="text-center pt-3 border-t border-black/10 text-[10px] font-mono text-[#555045]">
                          {activeSpreadIndex * 2 + 2}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT DOCK: EDITORIAL QUICK-FIX INSPECTOR */}
                {quickFixDrawerOpen && (
                  <div className="p-5 rounded-3xl soft-raised bg-[#F5EFE3] border border-[#D8C9A8]/60 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-black/10">
                      <div className="flex items-center gap-1.5">
                        <Wand2 className="w-4 h-4 text-emerald-700" />
                        <h4 className="font-bold text-xs uppercase tracking-wider text-[#1C2010]">
                          Editorial Quick-Fix
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                        {editorialAnalysis.issues.length} Suggestions
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                      {editorialAnalysis.issues.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-900 text-xs text-center font-bold">
                          ✓ No immediate stylistic or mechanical flaws detected in current draft!
                        </div>
                      ) : (
                        editorialAnalysis.issues.map((issue, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl soft-inset bg-white/80 border border-black/5 text-xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[9px] font-mono uppercase font-extrabold px-2 py-0.5 rounded-full ${
                                  issue.type === 'filler'
                                    ? 'bg-amber-500/15 text-amber-800'
                                    : issue.type === 'passive'
                                    ? 'bg-blue-500/15 text-blue-800'
                                    : 'bg-rose-500/15 text-rose-800'
                                }`}
                              >
                                {issue.type}
                              </span>
                              <span className="text-[10px] text-[#555045]">
                                Para {issue.paraIdx + 1}
                              </span>
                            </div>

                            <p className="text-[11px] text-[#2D2A26]">{issue.message}</p>

                            <button
                              type="button"
                              onClick={() => applyQuickFix(issue)}
                              className="w-full py-1.5 rounded-xl bg-[#0E6266] text-white text-[10px] font-bold shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span>Apply 1-Click Fix</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
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
                    onClick={() => alert('Cover template downloaded!')}
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
          {/* STEP 4: PREFLIGHT & FINANCIAL ENGINE */}
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
                    <span className="text-[10px] text-amber-800 block font-bold">🥉 Conservative</span>
                    <span className="text-base font-bold font-mono text-[#1C2010] mt-1 block">
                      ${annualReportData.conservative.annualUsd.toLocaleString()} / ₹{annualReportData.conservative.annualInr.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white shadow-xs border-t-2 border-emerald-600">
                    <span className="text-[10px] text-emerald-800 block font-bold">🥈 Benchmark</span>
                    <span className="text-base font-bold font-mono text-emerald-700 mt-1 block">
                      ${annualReportData.average.annualUsd.toLocaleString()} / ₹{annualReportData.average.annualInr.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white shadow-xs border-t-2 border-purple-600">
                    <span className="text-[10px] text-purple-800 block font-bold">🥇 Scaled</span>
                    <span className="text-base font-bold font-mono text-purple-700 mt-1 block">
                      ${annualReportData.scaled.annualUsd.toLocaleString()} / ₹{annualReportData.scaled.annualInr.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DOCK BAR */}
          <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-md flex items-center justify-between max-w-6xl mx-auto border-t border-black/10">
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
                  onClick={() => alert('Specification export generated!')}
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

      {/* METHODOLOGY & QUALITY SCORING MODAL */}
      {scoringModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl p-6 soft-raised space-y-4 bg-[#F5EFE3] border border-[#D8C9A8]/60">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-700" />
                <h3 className="font-editorial font-bold text-base text-[#1C2010]">
                  Industry Scoring Criteria & Methodology
                </h3>
              </div>
              <button onClick={() => setScoringModalOpen(false)}>
                <X className="w-4 h-4 cursor-pointer" />
              </button>
            </div>

            <p className="text-xs text-[#555045] leading-relaxed">
              PublishStudio rates manuscripts against 4 industry trade publishing benchmarks (25 points each, totaling 100):
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/80 border border-black/5 flex justify-between items-center">
                <div>
                  <strong className="block text-[#1C2010]">1. Readability & Cadence (25 pts)</strong>
                  <span className="text-[10px] text-[#555045]">Evaluates average sentence length & syllable flow.</span>
                </div>
                <span className="font-mono font-bold text-emerald-800">
                  {editorialAnalysis.breakdown.readability}/25
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 border border-black/5 flex justify-between items-center">
                <div>
                  <strong className="block text-[#1C2010]">2. Mechanical Accuracy (25 pts)</strong>
                  <span className="text-[10px] text-[#555045]">Checks double-word repetitions and terminal punctuation.</span>
                </div>
                <span className="font-mono font-bold text-emerald-800">
                  {editorialAnalysis.breakdown.mechanics}/25
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 border border-black/5 flex justify-between items-center">
                <div>
                  <strong className="block text-[#1C2010]">3. Stylistic Hygiene (25 pts)</strong>
                  <span className="text-[10px] text-[#555045]">Penalizes overused filler words and passive voice constructions.</span>
                </div>
                <span className="font-mono font-bold text-emerald-800">
                  {editorialAnalysis.breakdown.style}/25
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/80 border border-black/5 flex justify-between items-center">
                <div>
                  <strong className="block text-[#1C2010]">4. Print Geometry Compliance (25 pts)</strong>
                  <span className="text-[10px] text-[#555045]">Validates KDP spine text clearance (≥80 pgs) and gutters.</span>
                </div>
                <span className="font-mono font-bold text-emerald-800">
                  {editorialAnalysis.breakdown.geometry}/25
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setScoringModalOpen(false)}
                className="px-5 py-2 rounded-full bg-[#0E6266] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
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
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setAiModalOpen(false)} className="px-4 py-2 rounded-full text-xs font-semibold cursor-pointer">
                Cancel
              </button>
              <button
                onClick={() => {
                  setAiModalOpen(false);
                  alert('AI generation complete!');
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Content</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HELP & AUTHOR PROFILE DRAWER */}
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

      {/* MY BOOKSHELF */}
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
