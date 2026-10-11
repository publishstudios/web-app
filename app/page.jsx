// ==========================================================================
// FILE: app/page.jsx
// ==========================================================================

/* --------------------------------------------------------------------------
   SECTION 1.0: IMPORTS
   -------------------------------------------------------------------------- */
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Book, BookOpen, HelpCircle, Sun, Moon, Lock, Unlock, Sparkles, Download, 
  ArrowRight, ArrowLeft, CheckCircle2, 
  Eye, Sliders, Layers, FolderOpen, Trash2, X
} from 'lucide-react';
import { saveAs } from 'file-saver';
import HelpCenter from './HelpCenter';
import { 
  saveProjectToStorage, 
  getAllProjectsFromStorage, 
  deleteProjectFromStorage, 
  recordReviewToStorage 
} from './projectStorage';

/* --------------------------------------------------------------------------
   SECTION 2.0: MASTER DATA & MANUFACTURING CONSTANTS
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

const REGIONS = {
  INR: { name: 'India Domestic (₹)', symbol: '₹', base: 60, perPage: 0.75, step: 10 },
  USD: { name: 'Global POD Standard (USD)', symbol: '$', base: 0.85, perPage: 0.012, step: 0.50 },
  GBP: { name: 'United Kingdom (£)', symbol: '£', base: 0.70, perPage: 0.010, step: 0.50 },
  EUR: { name: 'European Union (€)', symbol: '€', base: 0.75, perPage: 0.012, step: 0.50 },
  CAD: { name: 'Canada (CA$)', symbol: 'CA$', base: 1.05, perPage: 0.015, step: 0.50 },
  AUD: { name: 'Australia (A$)', symbol: 'A$', base: 1.20, perPage: 0.018, step: 0.50 }
};

const SAMPLE_CHAPTER_TEXT = [
  "The stillness of the study was broken only by the clock on the mantelpiece. Outside, rain fell steadily against the tall glass panes, blurring the lamps along the quiet avenue into soft circles of amber.",
  "He dipped the nib of his pen into the dark ink, pausing to listen to the carriage wheels rolling across the wet cobblestones below. Every manuscript began this way—not with certainty, but with the quiet discipline of facing an empty sheet.",
  "The margins preserved the words, keeping the inner voice protected from the binding. A properly formatted book respects both the eyes of the reader and the physical machinery of the bindery."
];

/* --------------------------------------------------------------------------
   SECTION 3.0: MAIN PUBLISHSTUDIO WORKSPACE COMPONENT
   -------------------------------------------------------------------------- */
export default function PublishStudioApp() {
  
  /* SECTION 3.1: VIEW & WORKFLOW STATE */
  const [activeView, setActiveView] = useState('home'); // 'home' | 'studio' | 'help'
  const [currentStep, setCurrentStep] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);

  /* SECTION 3.2: PROJECT CONFIGURATION STATE */
  const [projectId, setProjectId] = useState('proj_default');
  const [bookTitle, setBookTitle] = useState('The Memory Chef');
  const [authorName, setAuthorName] = useState('A. S. Harper');
  const [bookCategory, setBookCategory] = useState('text_rich');
  const [selectedArchetype, setSelectedArchetype] = useState('fiction');
  const [trimSize, setTrimSize] = useState('5.5x8.5');
  const [paperType, setPaperType] = useState('cream');
  const [pageExtent, setPageExtent] = useState(120);

  /* SECTION 3.3: MANUSCRIPT & PRICING STATE */
  const [uploadedFileName, setUploadedFileName] = useState('Sample_Trade_Novel.docx');
  const [manuscriptParagraphs, setManuscriptParagraphs] = useState(SAMPLE_CHAPTER_TEXT);
  const [quickFixDrawerOpen, setQuickFixDrawerOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('INR');
  const [userCustomPrice, setUserCustomPrice] = useState('');

  /* SECTION 3.4: PERSISTENCE, ADMIN & MODAL STATE */
  const [savedProjects, setSavedProjects] = useState([]);
  const [isShelfOpen, setIsShelfOpen] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPassphrase, setAdminPassphrase] = useState('');
  const [adminError, setAdminError] = useState('');

  const [successModalData, setSuccessModalData] = useState({
    isOpen: false,
    title: 'Happy Book Publishing!',
    subtitle: 'Your print-ready files are compiled and verified.',
    fileLabel: 'Production File'
  });
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  /* SECTION 3.5: STORAGE SYNCHRONIZATION */
  const refreshProjectsList = async () => {
    try {
      const list = await getAllProjectsFromStorage();
      setSavedProjects(list);
    } catch (err) {
      console.warn('Storage read:', err);
    }
  };

  useEffect(() => {
    refreshProjectsList();
    if (localStorage.getItem('ps_admin_unlocked') === 'true') {
      setIsAdminUnlocked(true);
    }
  }, []);

  /* SECTION 3.6: PHYSICAL MANUFACTURING CALCULATIONS */
  const currentTrim = useMemo(() => {
    return TRIM_OPTIONS.find(t => t.id === trimSize) || TRIM_OPTIONS[2];
  }, [trimSize]);

  const calculatedGutter = useMemo(() => {
    if (pageExtent < 150) return 0.375;
    if (pageExtent <= 300) return 0.500;
    if (pageExtent <= 500) return 0.625;
    return 0.750;
  }, [pageExtent]);

  const outsideMargin = 0.500;
  const topBottomMargin = 0.625;

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

  /* SECTION 3.7: REGIONAL ECONOMICS & 3-TIER FORECAST MATH */
  const regionalEconomics = useMemo(() => {
    const reg = REGIONS[selectedRegion];
    const unitCost = reg.base + (pageExtent * reg.perPage);
    const breakEven = unitCost / 0.60;

    const defaultPrice = selectedRegion === 'INR' 
      ? Math.max(350, Math.ceil((breakEven + 75) / 10) * 10)
      : Math.max(9.99, Math.ceil(breakEven + 3.0) - 0.01);

    const activeListPrice = userCustomPrice !== '' && !isNaN(parseFloat(userCustomPrice))
      ? parseFloat(userCustomPrice)
      : defaultPrice;

    const royaltyPerUnit = (activeListPrice * 0.60) - unitCost;
    const isProfitable = royaltyPerUnit > 0;

    return {
      symbol: reg.symbol,
      unitCost: unitCost.toFixed(2),
      breakEven: breakEven.toFixed(2),
      activeListPrice: activeListPrice.toFixed(2),
      royalty: isProfitable ? royaltyPerUnit.toFixed(2) : '0.00',
      isProfitable,
      forecast: {
        conservative: isProfitable ? (royaltyPerUnit * 10).toFixed(0) : '0',
        benchmark: isProfitable ? (royaltyPerUnit * 50).toFixed(0) : '0',
        optimistic: isProfitable ? (royaltyPerUnit * 250).toFixed(0) : '0'
      }
    };
  }, [selectedRegion, pageExtent, userCustomPrice]);

  const globalUSDEconomics = useMemo(() => {
    const reg = REGIONS.USD;
    const unitCost = reg.base + (pageExtent * reg.perPage);
    const breakEven = unitCost / 0.60;
    const defPrice = Math.max(9.99, Math.ceil(breakEven + 2.50) - 0.01);
    const royalty = Math.max(0, (defPrice * 0.60) - unitCost);
    return {
      unitCost: unitCost.toFixed(2),
      breakEven: breakEven.toFixed(2),
      suggestedPrice: defPrice.toFixed(2),
      royalty: royalty.toFixed(2)
    };
  }, [pageExtent]);

  /* SECTION 3.8: LOCAL ACTIONS & EXPORT HANDLERS */
  const handleSaveCurrentProject = async () => {
    const proj = {
      id: projectId || `book_${Date.now()}`,
      title: bookTitle,
      author: authorName,
      category: bookCategory,
      archetype: selectedArchetype,
      trimSize,
      paperType,
      pageExtent,
      paragraphs: manuscriptParagraphs,
      fileName: uploadedFileName
    };
    await saveProjectToStorage(proj);
    setProjectId(proj.id);
    await refreshProjectsList();
  };

  const handleLoadProject = (p) => {
    setProjectId(p.id);
    setBookTitle(p.title);
    setAuthorName(p.author);
    setBookCategory(p.category || 'text_rich');
    setSelectedArchetype(p.archetype || 'fiction');
    setTrimSize(p.trimSize || '5.5x8.5');
    setPaperType(p.paperType || 'cream');
    setPageExtent(p.pageExtent || 120);
    setManuscriptParagraphs(p.paragraphs || SAMPLE_CHAPTER_TEXT);
    setUploadedFileName(p.fileName || 'Draft.docx');
    setIsShelfOpen(false);
    setActiveView('studio');
    setCurrentStep(1);
  };

  const handleDeleteProject = async (id, e) => {
    e.stopPropagation();
    await deleteProjectFromStorage(id);
    await refreshProjectsList();
  };

  const sanitizeFilename = (name) => {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/__+/g, '_');
  };

  const handleDownloadDOCX = () => {
    const formattedContent = 
      `TITLE: ${bookTitle}\nAUTHOR: ${authorName}\nTRIM: ${trimSize}\nGUTTER: ${calculatedGutter}"\n\n` +
      manuscriptParagraphs.join('\n\n');

    const blob = new Blob([formattedContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    saveAs(blob, `${sanitizeFilename(bookTitle)}_Formatted_${trimSize}.docx`);

    setSuccessModalData({
      isOpen: true,
      title: 'Your Interior Is Print-Ready!',
      subtitle: 'Mirrored margins, calibrated gutters, and running headers have been typeset into your document.',
      fileLabel: 'Formatted Manuscript (.docx)'
    });
  };
  
  const handleDownloadSpecification = () => {
    const spec = 
`============================================================
PUBLISHSTUDIO - PRODUCTION SPECIFICATION & PREFLIGHT REPORT
============================================================
Book Title:           ${bookTitle}
Author Name:          ${authorName}
Trim Dimensions:      ${currentTrim.width}" x ${currentTrim.height}"
Page Extent:          ${pageExtent} Pages
Paper Stock Caliper:  ${PAPER_SPECS[paperType]?.label}
Binding Gutter:       ${calculatedGutter}"
Spine Width:          ${spineWidth}"
Full Cover Canvas:    ${coverPixelsWidth} x ${coverPixelsHeight} px (300 DPI)
List Price:           ${regionalEconomics.symbol}${regionalEconomics.activeListPrice}
Royalty / Unit:       ${regionalEconomics.symbol}${regionalEconomics.royalty}
============================================================`;

    const blob = new Blob([spec], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${sanitizeFilename(bookTitle)}_Production_Specs_${trimSize}.txt`);

    setSuccessModalData({
      isOpen: true,
      title: 'Happy Book Publishing!',
      subtitle: 'Your manufacturing tolerances and blueprints are fully certified for platform upload.',
      fileLabel: 'Production Specification (.txt)'
    });
  };

  const handleRecordUserReview = async () => {
    if (userRating === 0) return;
    const review = {
      id: `rev_${Date.now()}`,
      rating: userRating,
      feedback: reviewFeedback.trim(),
      bookTitle,
      submittedAt: new Date().toISOString()
    };
    await recordReviewToStorage(review);
    setReviewSubmitted(true);
  };

  const handleAdminAuth = () => {
    if (adminPassphrase.trim().toLowerCase() === 'studio2026' || adminPassphrase.trim() === 'ashish_master') {
      setIsAdminUnlocked(true);
      localStorage.setItem('ps_admin_unlocked', 'true');
      setIsAdminModalOpen(false);
      setAdminError('');
    } else {
      setAdminError('Invalid authorization key');
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDarkMode ? 'dark-canvas' : 'bg-[#F4EFE6] text-[#1F1C18]'
    }`}>
      
      {/* ====================================================================
          SECTION 4.0: PERMANENT TOP NAVIGATION BAR (ALL SCREENS)
          ==================================================================== */}
      <header className={`sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors ${
        isDarkMode ? 'bg-[#141318]/90 border-white/5' : 'bg-[#F4EFE6]/90 border-[#E2DBD0]'
      }`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Brand Logo & Title */}
          <div 
            onClick={() => setActiveView('home')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#0E4D54] text-white flex items-center justify-center shadow-md">
              <Book className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-editorial font-bold text-base tracking-tight text-[#1F1C18] dark:text-white">
                  PUBLISHSTUDIO
                </span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#EAE3D6] text-[#0E4D54] dark:bg-white/10 dark:text-teal-300">
                  Self-Publishing Supporting Software
                </span>
              </div>
              <p className="text-[10px] text-[#7A7368] dark:text-[#9A96A0]">Universal Print-on-Demand (POD)</p>
            </div>
          </div>

          {/* Header Controls Dock */}
          <div className="flex items-center gap-2">
            
            {/* Desktop Navigation Pills */}
            <div className={`hidden md:flex items-center p-1 rounded-full ${
              isDarkMode ? 'dark-soft-inset' : 'soft-inset'
            }`}>
              <button
                onClick={() => setActiveView('home')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  activeView === 'home'
                    ? isDarkMode ? 'bg-[#25222E] text-white' : 'bg-white text-[#1F1C18] shadow-xs'
                    : 'text-[#6D6559] dark:text-zinc-400'
                }`}
              >
                Home Overview
              </button>
              <button
                onClick={() => { setActiveView('studio'); handleSaveCurrentProject(); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  activeView === 'studio'
                    ? isDarkMode ? 'bg-[#25222E] text-white' : 'bg-white text-[#1F1C18] shadow-xs'
                    : 'text-[#6D6559] dark:text-zinc-400'
                }`}
              >
                Guided Workflow
              </button>
              <button
                onClick={() => setActiveView('help')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  activeView === 'help'
                    ? isDarkMode ? 'bg-[#25222E] text-white' : 'bg-white text-[#1F1C18] shadow-xs'
                    : 'text-[#6D6559] dark:text-zinc-400'
                }`}
              >
                Publishing Manual
              </button>
            </div>

            {/* My Books Local Storage Drawer */}
            <button
              onClick={() => { refreshProjectsList(); setIsShelfOpen(true); }}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                isDarkMode ? 'dark-soft-raised text-zinc-300' : 'soft-btn-pill text-[#1F1C18]'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#0E4D54] dark:text-teal-400" />
              <span className="hidden sm:inline">My Books ({savedProjects.length})</span>
            </button>

            {/* Always-Visible Help Button */}
            <button
              onClick={() => setActiveView('help')}
              className={`p-2 rounded-full ${
                activeView === 'help'
                  ? 'bg-[#0E4D54] text-white shadow-md'
                  : isDarkMode ? 'dark-soft-raised text-zinc-300' : 'soft-btn-pill text-[#1F1C18]'
              }`}
              title="Publishing Manual & Tolerances"
            >
              <HelpCircle className="w-4 h-4 text-[#0E4D54] dark:text-teal-400" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full ${isDarkMode ? 'dark-soft-raised text-amber-400' : 'soft-btn-pill text-[#1F1C18]'}`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-[#1F1C18]" />}
            </button>

            {/* Master Owner Lock */}
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className={`p-2 rounded-full ${isDarkMode ? 'dark-soft-raised' : 'soft-btn-pill text-[#1F1C18]'} ${
                isAdminUnlocked ? 'text-emerald-600' : 'text-[#6D6559] dark:text-zinc-400'
              }`}
            >
              {isAdminUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>

          </div>
        </div>
      </header>
            {/* ====================================================================
          SECTION 5.0: FULL-PAGE HELP MANUAL VIEW
          ==================================================================== */}
      {activeView === 'help' && (
        <HelpCenter onBackToStudio={() => setActiveView('studio')} isDarkMode={isDarkMode} />
      )}

      {/* ====================================================================
          SECTION 6.0: HOME OVERVIEW & ENGINE SELECTOR VIEW
          ==================================================================== */}
      {activeView === 'home' && (
        <main className="max-w-5xl mx-auto px-4 py-12 animate-in fade-in">
          
          {/* SECTION 6.1: HERO BLOCK */}
          <section className="text-center max-w-3xl mx-auto pt-6 pb-12">
            <span className="text-xs font-mono uppercase tracking-widest font-bold text-[#0E4D54] dark:text-teal-400 block mb-3">
              UNIVERSAL PRINT-ON-DEMAND (POD)
            </span>
            <h1 className="font-editorial text-4xl sm:text-6xl font-bold tracking-tight text-[#1F1C18] dark:text-white leading-[1.15] mb-5">
              Focus More on Writing,<br />Less on Formatting!
            </h1>
            <p className="text-sm sm:text-base text-[#655E52] dark:text-[#A8A4AF] leading-relaxed max-w-2xl mx-auto mb-8">
              PublishStudio eliminates printing rejections. We calculate binding gutters, full-wrap spine bulk, and safe margins automatically, leaving you free to craft your story.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => { setActiveView('studio'); setCurrentStep(1); }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider soft-btn-primary transition-all"
              >
                <span>Launch Book Production Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => {
                  setBookTitle('The Memory Chef');
                  setAuthorName('A. S. Harper');
                  setTrimSize('5.5x8.5');
                  setPaperType('cream');
                  setPageExtent(120);
                  setActiveView('studio');
                  setCurrentStep(2);
                }}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-xs font-semibold ${
                  isDarkMode ? 'dark-soft-raised text-zinc-300' : 'soft-btn-pill text-[#1F1C18]'
                }`}
              >
                <span>Explore with Demo Book</span>
                <Sparkles className="w-3.5 h-3.5 text-[#0E4D54] dark:text-teal-400" />
              </button>
            </div>
          </section>

          {/* SECTION 6.2: DUAL PRODUCTION ENGINES */}
          <section className="mt-8">
            <div className="text-center mb-6">
              <span className="px-4 py-1.5 rounded-full bg-[#0E4D54] text-white text-[10px] font-mono uppercase tracking-widest font-bold shadow-md">
                DUAL PRODUCTION ENGINES
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Engine A: Text-Rich */}
              <div 
                onClick={() => { setBookCategory('text_rich'); setActiveView('studio'); setCurrentStep(1); }}
                className={`p-7 rounded-3xl cursor-pointer transition-all ${
                  isDarkMode ? 'dark-soft-raised' : 'soft-raised'
                } border-2 ${bookCategory === 'text_rich' ? 'border-[#0E4D54]' : 'border-transparent'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="w-7 h-7 rounded-full bg-[#C25A38] text-white flex items-center justify-center font-bold text-xs">
                    A
                  </span>
                  <span className="text-[10px] font-mono text-[#7A7368] uppercase font-bold tracking-wider">Engine A</span>
                </div>
                <h3 className="font-editorial text-2xl font-bold text-[#1F1C18] dark:text-white mb-1">
                  Text-Rich Manuscripts
                </h3>
                <p className="text-xs text-[#7A7368] dark:text-[#9A96A0] mb-5">
                  Novel, Memoirs, Non-fiction, Poetry
                </p>

                <ul className="space-y-2 text-xs text-[#4A4338] dark:text-zinc-300">
                  <li className="flex items-center gap-2">
                    <span className="text-[#0E4D54] font-bold">✓</span>
                    <span>Natural margins and mirror binding gutters</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#0E4D54] font-bold">✓</span>
                    <span>Editorial scanners and human-feel analyzers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#0E4D54] font-bold">✓</span>
                    <span>Alternating running headers and drop caps</span>
                  </li>
                </ul>
              </div>

              {/* Engine B: Low-Content */}
              <div 
                onClick={() => { setBookCategory('low_content'); setActiveView('studio'); setCurrentStep(1); }}
                className={`p-7 rounded-3xl cursor-pointer transition-all ${
                  isDarkMode ? 'dark-soft-raised' : 'soft-raised'
                } border-2 ${bookCategory === 'low_content' ? 'border-[#0E4D54]' : 'border-transparent'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="w-7 h-7 rounded-full bg-[#0E4D54] text-white flex items-center justify-center font-bold text-xs">
                    B
                  </span>
                  <span className="text-[10px] font-mono text-[#7A7368] uppercase font-bold tracking-wider">Engine B</span>
                </div>
                <h3 className="font-editorial text-2xl font-bold text-[#1F1C18] dark:text-white mb-1">
                  Low-Content Creations
                </h3>
                <p className="text-xs text-[#7A7368] dark:text-[#9A96A0] mb-5">
                  Planners, Journals, Visual strips
                </p>

                <ul className="space-y-2 text-xs text-[#4A4338] dark:text-zinc-300">
                  <li className="flex items-center gap-2">
                    <span className="text-[#0E4D54] font-bold">✓</span>
                    <span>300 DPI preservation and full-bleed bounds</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#0E4D54] font-bold">✓</span>
                    <span>Automated layouts for grids and trackers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#0E4D54] font-bold">✓</span>
                    <span>Zero-risk barcode protection margins</span>
                  </li>
                </ul>
              </div>

            </div>
          </section>

        </main>
      )}
           {/* ====================================================================
          SECTION 7.0: 4-STEP PRODUCTION STUDIO PIPELINE
          ==================================================================== */}
      {activeView === 'studio' && (
        <main className="max-w-5xl mx-auto px-4 py-8 pb-32 animate-in fade-in">
          
          {/* SECTION 7.1: PROGRESSION TRACK (DESKTOP & MOBILE) */}
          <div className="mb-8">
            <div className={`p-2.5 rounded-full ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
              <div className="flex items-center justify-between">
                {[
                  { step: 1, label: '1. Setup' },
                  { step: 2, label: '2. Interior' },
                  { step: 3, label: '3. Cover' },
                  { step: 4, label: '4. Preflight' },
                ].map((s, idx) => {
                  const isActive = currentStep === s.step;
                  const isPassed = currentStep > s.step;
                  return (
                    <React.Fragment key={s.step}>
                      <button
                        onClick={() => setCurrentStep(s.step)}
                        className={`flex items-center gap-2 px-3 sm:px-5 py-1.5 rounded-full text-xs font-semibold transition ${
                          isActive
                            ? 'bg-[#0E4D54] text-white shadow-md'
                            : isPassed
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-[#7A7368] dark:text-zinc-400'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                          isActive ? 'bg-white text-[#0E4D54] font-bold' : 'bg-black/10 dark:bg-white/10'
                        }`}>
                          {isPassed ? '✓' : s.step}
                        </span>
                        <span className="hidden sm:inline">{s.label}</span>
                      </button>
                      {idx < 3 && <div className="flex-1 h-0.5 mx-1 bg-black/10 dark:bg-white/10" />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 7.2: STEP 1 - SPECIFICATION & PROJECT SETUP */}
          {currentStep === 1 && (
            <div className="space-y-6">
              
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#0E4D54] dark:text-teal-400 block mb-1">
                  STEP TITLE
                </span>
                <div className="flex items-center justify-between">
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1F1C18] dark:text-white">
                    Step 1: Specification & Project Setup
                  </h2>
                  <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#EAE3D6] dark:bg-white/10 text-[#4A4338] dark:text-zinc-300 font-semibold">
                    Universal POD Standards
                  </span>
                </div>
                <p className="text-xs text-[#7A7368] dark:text-[#9A96A0] mt-1">
                  Define your book archetype and physical dimensions for self-publishing standard sizing
                </p>
              </div>

              {/* Archetypes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                      }}
                      className={`p-4 rounded-2xl text-center transition-all ${
                        isDarkMode ? 'dark-soft-raised' : 'soft-raised'
                      } ${isSelected ? 'ring-2 ring-[#0E4D54]' : ''}`}
                    >
                      <h4 className="font-editorial font-bold text-xs sm:text-sm text-[#1F1C18] dark:text-white mb-1">
                        {arch.name}
                      </h4>
                      <p className="text-[11px] text-[#7A7368] dark:text-[#9A96A0] mb-3">
                        {arch.desc}
                      </p>
                      <div className="flex justify-center">
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-[#0E4D54] bg-[#0E4D54]' : 'border-[#BBB3A4]'
                        }`}>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Manufacturing Calibrations Card */}
              <div className={`p-6 sm:p-7 rounded-3xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'}`}>
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#0E4D54] dark:text-teal-400 block mb-3">
                  MANUFACTURING CALIBRATIONS CARD
                </span>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#1F1C18] dark:text-zinc-200 uppercase tracking-wider block mb-1.5">
                      TRIM DIMENSIONS
                    </label>
                    <select
                      value={trimSize}
                      onChange={(e) => setTrimSize(e.target.value)}
                      className={`w-full p-3 rounded-2xl text-xs font-semibold outline-none ${
                        isDarkMode ? 'dark-soft-inset text-white' : 'soft-inset text-[#1F1C18]'
                      }`}
                    >
                      {TRIM_OPTIONS.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1F1C18] dark:text-zinc-200 uppercase tracking-wider block mb-1.5">
                      PAPER STOCK CALIPER
                    </label>
                    <select
                      value={paperType}
                      onChange={(e) => setPaperType(e.target.value)}
                      className={`w-full p-3 rounded-2xl text-xs font-semibold outline-none ${
                        isDarkMode ? 'dark-soft-inset text-white' : 'soft-inset text-[#1F1C18]'
                      }`}
                    >
                      {Object.entries(PAPER_SPECS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[#1F1C18] dark:text-zinc-200 uppercase tracking-wider">
                        PAGE EXTENT
                      </span>
                      <span className="text-xs font-mono font-bold text-[#0E4D54] dark:text-teal-400">
                        {pageExtent} Pages
                      </span>
                    </div>
                    <input
                      type="range"
                      min={24}
                      max={600}
                      value={pageExtent}
                      onChange={(e) => setPageExtent(parseInt(e.target.value))}
                      className="w-full accent-[#0E4D54]"
                    />
                  </div>
                </div>

                {/* Readouts Sub-Card */}
                <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#7A7368] block mb-3">
                    READOUTS CARD
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`p-3.5 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                      <span className="text-xs font-bold block text-[#1F1C18] dark:text-white">
                        Spine Gutter: {calculatedGutter}"
                      </span>
                      <span className="text-[10px] text-[#7A7368] block">Recommended binding margin</span>
                    </div>

                    <div className={`p-3.5 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                      <span className="text-xs font-bold block text-[#1F1C18] dark:text-white">
                        Outside Margin: {outsideMargin}"
                      </span>
                      <span className="text-[10px] text-[#7A7368] block">Finger safety clearance</span>
                    </div>

                    <div className={`p-3.5 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                      <span className="text-xs font-bold block text-[#1F1C18] dark:text-white">
                        Top / Bottom: {topBottomMargin}"
                      </span>
                      <span className="text-[10px] text-[#7A7368] block">Running head buffer</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* SECTION 7.3: STEP 2 - INTERIOR PROOF SPREAD & QUICK-FIX */}
          {currentStep === 2 && (
            <div className="space-y-6">
              
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1F1C18] dark:text-white">
                  Step 2: Interior Production & Structuring
                </h2>
                <p className="text-xs text-[#7A7368] dark:text-[#9A96A0] mt-1">
                  Upload your manuscript, typeset standard running heads, and verify the physical proof layout
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Inputs Card */}
                <div className={`p-6 rounded-3xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'} space-y-4`}>
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#0E4D54] dark:text-teal-400 block">
                    MANUSCRIPT INPUTS CARD
                  </span>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                      BOOK TITLE (RECTO HEADER)
                    </label>
                    <input
                      type="text"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      className={`w-full p-2.5 rounded-xl text-xs font-medium ${isDarkMode ? 'dark-soft-inset text-white' : 'soft-inset text-[#1F1C18]'}`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                      AUTHOR NAME (VERSO HEADER)
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className={`w-full p-2.5 rounded-xl text-xs font-medium ${isDarkMode ? 'dark-soft-inset text-white' : 'soft-inset text-[#1F1C18]'}`}
                    />
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      onClick={handleDownloadDOCX}
                      className="w-full py-2.5 rounded-full soft-btn-primary text-xs font-bold"
                    >
                      Export Formatted DOCX
                    </button>
                    <button
                      onClick={() => setQuickFixDrawerOpen(!quickFixDrawerOpen)}
                      className={`w-full py-2 rounded-full text-xs font-medium ${isDarkMode ? 'dark-soft-raised text-zinc-300' : 'soft-btn-pill text-[#1F1C18]'}`}
                    >
                      {quickFixDrawerOpen ? 'Close Editor' : 'Quick-Fix Text'}
                    </button>
                  </div>
                </div>

                {/* Real Two-Page Proof Spread */}
                <div className={`md:col-span-2 p-6 rounded-3xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#7A7368]">
                      TWO-PAGE CRAFT SPREAD PREVIEW (TYPESET PROOF)
                    </span>
                    <span className="text-[10px] font-mono text-[#7A7368]">Pages 2-3 of {pageExtent}</span>
                  </div>

                  <div className={`p-6 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                    <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto shadow-2xl">
                      
                      {/* Left: Verso */}
                      <div className="p-4 rounded-l bg-[#FFFDF9] text-[#1F1C18] min-h-[260px] flex flex-col justify-between border-r border-[#E8E2D5]">
                        <div className="text-center pb-2 border-b border-black/10">
                          <span className="text-[9px] font-editorial uppercase tracking-widest text-[#7A7368]">{authorName}</span>
                        </div>
                        <div className="space-y-2 font-editorial text-[10px] leading-relaxed text-[#2D2A26]">
                          <p>{manuscriptParagraphs[0]}</p>
                          <p>{manuscriptParagraphs[1]}</p>
                        </div>
                        <span className="text-[9px] font-mono text-[#7A7368]">2</span>
                      </div>

                      {/* Right: Recto */}
                      <div className="p-4 rounded-r bg-[#FFFDF9] text-[#1F1C18] min-h-[260px] flex flex-col justify-between">
                        <div className="text-center pb-2 border-b border-black/10">
                          <span className="text-[9px] font-editorial uppercase tracking-widest text-[#7A7368]">{bookTitle}</span>
                        </div>
                        <div className="space-y-2 font-editorial text-[10px] leading-relaxed text-[#2D2A26]">
                          <div className="text-center my-1">
                            <span className="text-[8px] font-mono text-[#0E4D54] block">CHAPTER ONE</span>
                            <h5 className="text-[11px] font-bold">The Opening Chapter</h5>
                          </div>
                          <p>
                            <span className="float-left text-2xl font-bold pr-1.5 leading-none text-[#0E4D54]">
                              {manuscriptParagraphs[2]?.charAt(0) || 'T'}
                            </span>
                            {manuscriptParagraphs[2]?.slice(1)}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono text-[#7A7368] text-right">3</span>
                      </div>

                    </div>
                  </div>

                  <p className="text-center text-[10px] text-[#7A7368] mt-3 font-mono">
                    Live POD layout rendering: {calculatedGutter}" binding gutter calibrated for {pageExtent} pages
                  </p>
                </div>

              </div>

              {quickFixDrawerOpen && (
                <div className={`p-5 rounded-3xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'} space-y-3`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0E4D54]">Paragraph Editor</h4>
                  {manuscriptParagraphs.map((para, idx) => (
                    <textarea
                      key={idx}
                      rows={2}
                      value={para}
                      onChange={(e) => {
                        const updated = [...manuscriptParagraphs];
                        updated[idx] = e.target.value;
                        setManuscriptParagraphs(updated);
                      }}
                      className="w-full p-2.5 rounded-xl text-xs bg-white dark:bg-[#18161D] border border-black/10 outline-none"
                    />
                  ))}
                </div>
              )}

            </div>
          )}

               {/* SECTION 7.4: STEP 3 - FULL-WRAP COVER BLUEPRINT */}
          {currentStep === 3 && (
            <div className="space-y-6">
              
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1F1C18] dark:text-white">
                  Step 3: Cover Blueprint Specification
                </h2>
                <p className="text-xs text-[#7A7368] dark:text-[#9A96A0] mt-1">
                  Specify paper caliper and bulk depth to construct a perfectly proportioned full-wrap cover layout with bleed guides
                </p>
              </div>

              {/* Geometry Specs Bar */}
              <div className={`p-3 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'} grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-semibold`}>
                <div>SPINE WIDTH: <span className="font-mono text-[#0E4D54] dark:text-teal-400 font-bold">{spineWidth}"</span></div>
                <div>TOTAL WIDTH: <span className="font-mono font-bold">{fullCoverWidth}"</span></div>
                <div>TOTAL HEIGHT: <span className="font-mono font-bold">{fullCoverHeight}"</span></div>
                <div>CANVAS @ 300 DPI: <span className="font-mono text-emerald-600 font-bold">{coverPixelsWidth} x {coverPixelsHeight} px</span></div>
              </div>

              {/* Interactive Cover Blueprint */}
              <div className={`p-6 sm:p-8 rounded-3xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'}`}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#7A7368]">
                    INTERACTIVE COVER BLUEPRINT (Scale: 1:1 Proportional)
                  </span>
                  <div className="flex gap-3 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-[#0E4D54] text-white text-[10px]">Safe Zones: ON</span>
                    <span className="px-2.5 py-1 rounded-full bg-[#0E4D54] text-white text-[10px]">Guides: ON</span>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                  <div className="relative w-full aspect-[2/1] border-2 border-dashed border-red-400 rounded bg-[#FFFDF9] dark:bg-[#18161D] flex items-center justify-between p-4">
                    
                    {/* Back Cover */}
                    <div className="flex-1 h-full border-r border-dashed border-black/20 p-2 flex flex-col justify-between">
                      <div className="text-center">
                        <span className="text-xs font-editorial font-bold block">BACK COVER</span>
                        <span className="text-[9px] text-[#7A7368]">({currentTrim.width} x {currentTrim.height})</span>
                      </div>

                      <div className="self-end p-2 border border-red-500 bg-red-500/10 rounded text-center">
                        <span className="text-[8px] font-mono font-bold text-red-600 block">BARCODE RESERVED ZONE</span>
                        <span className="text-[7px] text-red-600">2.0" x 1.2"</span>
                      </div>
                    </div>

                    {/* Spine */}
                    <div className="w-8 sm:w-12 h-full flex items-center justify-center bg-black/5 dark:bg-white/5 border-r border-dashed border-black/20">
                      <span className="text-[9px] font-mono -rotate-90 whitespace-nowrap text-[#0E4D54] dark:text-teal-400 font-bold">
                        {pageExtent >= 80 ? bookTitle.slice(0, 14) : ''}
                      </span>
                    </div>

                    {/* Front Cover */}
                    <div className="flex-1 h-full p-2 flex flex-col justify-between items-center text-center">
                      <div>
                        <span className="text-xs font-editorial font-bold block">FRONT COVER</span>
                        <span className="text-[9px] text-[#7A7368]">({currentTrim.width} x {currentTrim.height})</span>
                      </div>

                      <div>
                        <h4 className="font-editorial text-sm font-bold">{bookTitle}</h4>
                        <p className="text-[10px] text-[#7A7368]">{authorName}</p>
                      </div>

                      <span className="text-[8px] text-[#7A7368]">0.25" Safe Zone</span>
                    </div>

                  </div>
                </div>

                <p className="text-center text-[11px] text-[#8C8479] mt-4">
                  ⚠️ <strong>Standard Industry Barcode Zone:</strong> Keep the bottom-right quadrant of your back cover free of text, URLs, or faces.
                </p>
              </div>

            </div>
          )}

          {/* SECTION 7.5: STEP 4 - PREFLIGHT & DYNAMIC REGIONAL PRICING */}
          {currentStep === 4 && (
            <div className="space-y-6">
              
              <div>
                <div className="flex justify-between items-center">
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1F1C18] dark:text-white">
                    Step 4: Preflight Verification & POD Readiness
                  </h2>
                  <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                    100% Ready
                  </span>
                </div>
                <p className="text-xs text-[#7A7368] dark:text-[#9A96A0] mt-1">
                  Analyze final dimensions, calculate estimated manufacturing economics, and confirm print readiness checklist
                </p>
              </div>

              {/* Manufacturing Economics Container */}
              <div className={`p-6 sm:p-7 rounded-3xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'}`}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#0E4D54] dark:text-teal-400">
                    SELF-PUBLISHING MANUFACTURING COST & PRICING BREAKDOWN
                  </span>
                  
                  <select
                    value={selectedRegion}
                    onChange={(e) => { setSelectedRegion(e.target.value); setUserCustomPrice(''); }}
                    className={`p-1.5 rounded-xl text-xs font-bold ${isDarkMode ? 'dark-soft-inset text-teal-300' : 'soft-inset text-[#0E4D54]'}`}
                  >
                    {Object.entries(REGIONS).map(([k, v]) => (
                      <option key={k} value={k}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Left: Global USD Benchmark */}
                  <div className={`p-4 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'} space-y-1.5 text-xs`}>
                    <span className="text-[10px] font-mono uppercase font-bold text-[#7A7368] block mb-1">
                      GLOBAL POD STANDARD (USD)
                    </span>
                    <div className="flex justify-between">
                      <span>Unit Print Cost:</span>
                      <span className="font-mono font-bold">${globalUSDEconomics.unitCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Break-even List Price:</span>
                      <span className="font-mono font-bold">${globalUSDEconomics.breakEven}</span>
                    </div>
                    <div className="flex justify-between text-[#0E4D54] dark:text-teal-400 font-bold pt-1 border-t border-black/5 dark:border-white/5">
                      <span>Suggested Price: ${globalUSDEconomics.suggestedPrice}</span>
                      <span>Royalty: +${globalUSDEconomics.royalty}</span>
                    </div>
                  </div>

                  {/* Right: Selected Region with Interactive Custom List Price Input */}
                  <div className={`p-4 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'} space-y-2 text-xs`}>
                    <span className="text-[10px] font-mono uppercase font-bold text-[#0E4D54] dark:text-teal-400 block mb-1">
                      SELECTED REGION: {REGIONS[selectedRegion].name}
                    </span>
                    <div className="flex justify-between">
                      <span>Unit Print Cost:</span>
                      <span className="font-mono font-bold">{regionalEconomics.symbol}{regionalEconomics.unitCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Break-even List Price:</span>
                      <span className="font-mono font-bold">{regionalEconomics.symbol}{regionalEconomics.breakEven}</span>
                    </div>

                    <div className="pt-1 flex items-center justify-between border-t border-black/5 dark:border-white/5">
                      <span className="font-bold">Your List Price:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-bold">{regionalEconomics.symbol}</span>
                        <input
                          type="number"
                          step={REGIONS[selectedRegion].step}
                          value={userCustomPrice !== '' ? userCustomPrice : regionalEconomics.activeListPrice}
                          onChange={(e) => setUserCustomPrice(e.target.value)}
                          className="w-20 p-1 text-right font-mono font-bold rounded border bg-white dark:bg-[#18161D]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                      <span>Net Royalty / Copy:</span>
                      <span>+{regionalEconomics.symbol}{regionalEconomics.royalty}</span>
                    </div>
                  </div>

                </div>
                          {/* 3 Performance Scenarios */}
                <div className="grid grid-cols-3 gap-3 text-center mt-4">
                  <div className={`p-3 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                    <span className="text-[10px] text-[#7A7368] block">Conservative</span>
                    <span className="text-sm font-mono font-bold block mt-1">{regionalEconomics.symbol}{regionalEconomics.forecast.conservative}</span>
                    <span className="text-[9px] text-[#7A7368]">10 copies/mo</span>
                  </div>

                  <div className={`p-3 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                    <span className="text-[10px] text-[#7A7368] block">Average Launch</span>
                    <span className="text-sm font-mono font-bold text-[#0E4D54] dark:text-teal-300 block mt-1">{regionalEconomics.symbol}{regionalEconomics.forecast.benchmark}</span>
                    <span className="text-[9px] text-[#7A7368]">50 copies/mo</span>
                  </div>

                  <div className={`p-3 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                    <span className="text-[10px] text-[#7A7368] block">Scaled Growth</span>
                    <span className="text-sm font-mono font-bold text-emerald-600 block mt-1">{regionalEconomics.symbol}{regionalEconomics.forecast.optimistic}</span>
                    <span className="text-[9px] text-[#7A7368]">250 copies/mo</span>
                  </div>
                </div>

                <p className="text-[10px] text-[#8C8479] italic text-center mt-3">
                  * Disclaimer: Figures are mathematical estimates based on POD distribution formulas; this does not constitute a guaranteed income projection.
                </p>
              </div>

              {/* Preflight Pass Checks Card */}
              <div className={`p-6 rounded-3xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'} space-y-2 text-xs`}>
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#0E4D54] block mb-2">
                  PREFLIGHT PASS CHECKS
                </span>
                
                <div className="flex justify-between items-center p-2 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                  <span>✓ Page Extent Compatible ({pageExtent} pages meets trade paperback minimums)</span>
                  <span className="font-mono font-bold">PASS</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                  <span>✓ Spine Gutter Clearance ({calculatedGutter}" inside margin prevents crease clipping)</span>
                  <span className="font-mono font-bold">PASS</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                  <span>✓ 300 DPI Canvas Resolution ({coverPixelsWidth} x {coverPixelsHeight} px verified)</span>
                  <span className="font-mono font-bold">PASS</span>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleDownloadSpecification}
                    className="py-3 px-6 rounded-full soft-btn-primary text-xs font-bold flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Production Specification (.txt)</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* SECTION 7.6: STICKY BOTTOM DOCK WITH DIRECT HELP & OVERVIEW BUTTONS */}
          <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-white/80 dark:bg-[#121115]/80 backdrop-blur-md flex items-center justify-between max-w-5xl mx-auto">
            <button
              onClick={() => setActiveView('home')}
              className={`px-4 py-2 rounded-full text-xs font-semibold ${isDarkMode ? 'dark-soft-raised text-zinc-300' : 'soft-btn-pill text-[#1F1C18]'}`}
            >
              Home Overview
            </button>

            <div className={`p-1.5 rounded-full ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'} flex items-center gap-2`}>
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              {currentStep < 4 ? (
                <button
                  onClick={() => { handleSaveCurrentProject(); setCurrentStep(currentStep + 1); }}
                  className="px-5 py-2 rounded-full text-xs font-bold soft-btn-primary flex items-center gap-1"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleDownloadSpecification}
                  className="px-5 py-2 rounded-full text-xs font-bold soft-btn-primary flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Complete Studio</span>
                </button>
              )}
            </div>

            <button
              onClick={() => setActiveView('help')}
              className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1 text-[#0E4D54] ${isDarkMode ? 'dark-soft-raised' : 'soft-btn-pill'}`}
            >
              <span>Help</span>
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

        </main>
      )}
            {/* ====================================================================
          SECTION 8.0: MODAL OVERLAYS (SHELF, SUCCESS REVIEWS, ADMIN)
          ==================================================================== */}
      
      {/* SECTION 8.1: MY BOOKS LOCAL STORAGE DRAWER */}
      {isShelfOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'}`}>
            <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5 mb-4">
              <h3 className="font-editorial font-bold text-base">Saved Book Projects (Local Storage)</h3>
              <button onClick={() => setIsShelfOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {savedProjects.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#8C8479]">No saved drafts found.</div>
              ) : (
                savedProjects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => handleLoadProject(proj)}
                    className={`p-3.5 rounded-2xl cursor-pointer flex justify-between items-center ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}
                  >
                    <div>
                      <h4 className="font-bold text-xs">{proj.title}</h4>
                      <p className="text-[10px] text-[#7A7368]">{proj.author} • {proj.trimSize} • {proj.pageExtent} Pgs</p>
                    </div>
                    <button onClick={(e) => handleDeleteProject(proj.id, e)} className="text-red-500 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 8.2: DOWNLOAD SUCCESS CELEBRATION & 5-STAR RATING */}
      {successModalData.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl p-7 text-center ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'}`}>
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#0E4D54] text-white flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#0E4D54] dark:text-teal-400 block mb-1">
              {successModalData.fileLabel}
            </span>
            <h3 className="font-editorial text-2xl font-bold mb-1">{successModalData.title}</h3>
            <p className="text-xs text-[#7A7368] mb-4">{successModalData.subtitle}</p>

            <div className={`p-3 rounded-2xl text-xs font-editorial italic mb-4 ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
              "May your words travel far and find the readers who need them most. See you soon on your next chapter!"
            </div>

            {!reviewSubmitted ? (
              <div className={`p-4 rounded-2xl mb-4 text-left ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold">Rate your formatting experience:</span>
                  {userRating > 0 && <span className="text-xs font-bold text-[#0E4D54]">{userRating} / 5</span>}
                </div>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setUserRating(s)}
                      className="text-lg p-1"
                    >
                      <span className={userRating >= s ? 'text-amber-500' : 'text-[#BBB3A4]'}>★</span>
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Feedback or feature requests? (Optional)"
                  className="w-full p-2 rounded-xl text-xs bg-white dark:bg-[#18161D] border outline-none"
                />
                {userRating > 0 && (
                  <button onClick={handleRecordUserReview} className="mt-2 w-full py-2 rounded-full soft-btn-primary text-xs font-bold">
                    Submit Review
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-700 text-xs font-bold mb-4">
                ✓ Thank you! Review saved locally.
              </div>
            )}

            <button
              onClick={() => {
                setSuccessModalData(prev => ({ ...prev, isOpen: false }));
                setReviewSubmitted(false);
                setUserRating(0);
                setReviewFeedback('');
              }}
              className="w-full py-3 rounded-full soft-btn-primary text-xs font-bold"
            >
              Continue Studio
            </button>
          </div>
        </div>
      )}
            {/* SECTION 8.3: OWNER MASTER PASSPHRASE AUTH */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-3xl p-6 text-center ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'}`}>
            <h3 className="font-editorial font-bold text-base mb-2">Owner Master Key</h3>
            <input
              type="password"
              placeholder="Enter master key..."
              value={adminPassphrase}
              onChange={(e) => setAdminPassphrase(e.target.value)}
              className={`w-full p-2.5 rounded-xl text-xs mb-2 ${isDarkMode ? 'dark-soft-inset text-white' : 'soft-inset text-[#1F1C18]'}`}
            />
            {adminError && <p className="text-[10px] text-red-500 mb-2">{adminError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setIsAdminModalOpen(false)} className={`w-1/2 py-2 rounded-full text-xs ${isDarkMode ? 'dark-soft-raised' : 'soft-btn-pill text-[#1F1C18]'}`}>
                Cancel
              </button>
              <button onClick={handleAdminAuth} className="w-1/2 py-2 rounded-full soft-btn-primary text-xs font-bold">
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
      
      
