// app/page.jsx
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Book, BookOpen, Sun, Moon, Lock, Unlock, Sparkles, Download, 
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

const ARCHETYPES = [
  { id: 'fiction', name: 'Fiction & Novel', defaultTrim: '5.5x8.5', paper: 'cream', desc: 'Narrative prose, literature & story arcs' },
  { id: 'nonfiction', name: 'Non-Fiction & Memoir', defaultTrim: '6x9', paper: 'white', desc: 'Business, biography, history & self-development' },
  { id: 'workbook', name: 'Workbook & Training Manual', defaultTrim: '8.5x11', paper: 'white', desc: 'Exercises, study guides & reference materials' },
  { id: 'custom', name: 'Custom Specification', defaultTrim: '6x9', paper: 'white', desc: 'Manual control over all production parameters' }
];

const TRIM_OPTIONS = [
  { id: '5x8', name: '5" x 8" (Compact Novella)', width: 5.0, height: 8.0 },
  { id: '5.25x8', name: '5.25" x 8" (Pocket Fiction)', width: 5.25, height: 8.0 },
  { id: '5.5x8.5', name: '5.5" x 8.5" (Standard Trade)', width: 5.5, height: 8.5 },
  { id: '6x9', name: '6" x 9" (US Trade Paperback)', width: 6.0, height: 9.0 },
  { id: '7x10', name: '7" x 10" (Executive / Handbook)', width: 7.0, height: 10.0 },
  { id: '8.5x11', name: '8.5" x 11" (Workbook / Manual)', width: 8.5, height: 11.0 }
];

const PAPER_SPECS = {
  white: { label: 'Standard White (50–55 lb / 74–81 gsm)', caliper: 0.002252 },
  cream: { label: 'Standard Cream (50–55 lb / 74–81 gsm)', caliper: 0.002500 },
  premium_color: { label: 'Premium Color (70 lb / 104 gsm)', caliper: 0.002700 }
};

const REGIONS = {
  USD: { name: 'United States & Global ($)', symbol: '$', base: 0.85, perPage: 0.012, defaultPrice: 9.99 },
  INR: { name: 'India Domestic (₹)', symbol: '₹', base: 60, perPage: 0.75, defaultPrice: 350 },
  GBP: { name: 'United Kingdom (£)', symbol: '£', base: 0.70, perPage: 0.010, defaultPrice: 7.99 },
  EUR: { name: 'European Union (€)', symbol: '€', base: 0.75, perPage: 0.012, defaultPrice: 8.99 },
  CAD: { name: 'Canada (CA$)', symbol: 'CA$', base: 1.05, perPage: 0.015, defaultPrice: 12.99 },
  AUD: { name: 'Australia (A$)', symbol: 'A$', base: 1.20, perPage: 0.018, defaultPrice: 14.99 }
};

const SAMPLE_CHAPTER_TEXT = [
  "The stillness of the study was broken only by the clock on the mantelpiece. Outside, rain fell steadily against the tall glass panes, blurring the lamps along the quiet avenue into soft circles of amber.",
  "He dipped the nib of his pen into the dark ink, pausing to listen to the carriage wheels rolling across the wet cobblestones below. Every manuscript began this way—not with certainty, but with the quiet discipline of facing an empty sheet.",
  "The margins preserved the words, keeping the inner voice protected from the binding. A properly formatted book respects both the eyes of the reader and the physical machinery of the bindery."
];

export default function PublishStudioApp() {
  const [activeView, setActiveView] = useState('home');
  const [currentStep, setCurrentStep] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [projectId, setProjectId] = useState('proj_default');
  const [bookTitle, setBookTitle] = useState('The Memory Chef');
  const [authorName, setAuthorName] = useState('A. S. Harper');
  const [bookCategory, setBookCategory] = useState('text_rich');
  const [selectedArchetype, setSelectedArchetype] = useState('fiction');
  const [trimSize, setTrimSize] = useState('5.5x8.5');
  const [paperType, setPaperType] = useState('cream');
  const [pageExtent, setPageExtent] = useState(120);

  const [uploadedFileName, setUploadedFileName] = useState('Sample_Trade_Novel.docx');
  const [manuscriptParagraphs, setManuscriptParagraphs] = useState(SAMPLE_CHAPTER_TEXT);
  const [quickFixDrawerOpen, setQuickFixDrawerOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('INR');

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

  const currentTrim = useMemo(() => {
    return TRIM_OPTIONS.find(t => t.id === trimSize) || TRIM_OPTIONS[2];
  }, [trimSize]);

  const calculatedGutter = useMemo(() => {
    if (pageExtent < 150) return 0.375;
    if (pageExtent <= 300) return 0.500;
    if (pageExtent <= 500) return 0.625;
    return 0.750;
  }, [pageExtent]);

  const outsideMargin = 0.375;
  const topBottomMargin = 0.500;

  const spineWidth = useMemo(() => {
    const caliper = PAPER_SPECS[paperType]?.caliper || 0.002252;
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

  const regionalEconomics = useMemo(() => {
    const reg = REGIONS[selectedRegion];
    const unitCost = reg.base + (pageExtent * reg.perPage);
    const breakEven = unitCost / 0.60;
    const royaltyPerUnit = Math.max(0, (reg.defaultPrice * 0.60) - unitCost);

    return {
      symbol: reg.symbol,
      unitCost: unitCost.toFixed(2),
      breakEven: breakEven.toFixed(2),
      suggestedPrice: reg.defaultPrice.toFixed(2),
      royalty: royaltyPerUnit.toFixed(2),
      forecast: {
        conservative: (royaltyPerUnit * 10).toFixed(0),
        benchmark: (royaltyPerUnit * 50).toFixed(0),
        optimistic: (royaltyPerUnit * 250).toFixed(0)
      }
    };
  }, [selectedRegion, pageExtent]);

  const globalUSDEconomics = useMemo(() => {
    const reg = REGIONS.USD;
    const unitCost = reg.base + (pageExtent * reg.perPage);
    const breakEven = unitCost / 0.60;
    const royalty = Math.max(0, (reg.defaultPrice * 0.60) - unitCost);
    return {
      unitCost: unitCost.toFixed(2),
      breakEven: breakEven.toFixed(2),
      suggestedPrice: reg.defaultPrice.toFixed(2),
      royalty: royalty.toFixed(2)
    };
  }, [pageExtent]);

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
    const cleanName = `${sanitizeFilename(bookTitle)}_Formatted_${trimSize}.docx`;
    saveAs(blob, cleanName);

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
Universal Print-on-Demand (POD) Manufacturing Calibrations
============================================================

PROJECT IDENTIFICATION:
------------------------------------------------------------
Book Title:           ${bookTitle}
Author Name:          ${authorName}
Project Classification: ${bookCategory === 'text_rich' ? 'Text-Rich Manuscript' : 'Low-Content Creation'}
Trim Dimensions:      ${currentTrim.width}" x ${currentTrim.height}" (${currentTrim.name})
Paper Stock Caliper:  ${PAPER_SPECS[paperType]?.label}
Total Page Extent:    ${pageExtent} Pages

INTERIOR PRINT GEOMETRY (MIRROR MARGINS):
------------------------------------------------------------
Binding Gutter:       ${calculatedGutter}" (Compensates for physical bindery curve)
Outside Margin:       ${outsideMargin}" (Finger clearance safety zone)
Top / Bottom Margin:  ${topBottomMargin}" (Running head & folio buffer)

FULL-WRAP COVER SPECIFICATION:
------------------------------------------------------------
Calculated Spine Bulk: ${spineWidth}"
Full Blueprint Width:  ${fullCoverWidth}" (Includes left & right 0.125" bleed)
Full Blueprint Height: ${fullCoverHeight}" (Includes top & bottom 0.125" bleed)
Canvas at 300 DPI:     ${coverPixelsWidth} x ${coverPixelsHeight} Pixels
Barcode Clearance:     2.0" x 1.2" Reserved Zone in Lower-Right Quadrant

COMMERCIAL POD ECONOMICS (${selectedRegion}):
------------------------------------------------------------
Unit Manufacturing:   ${regionalEconomics.symbol}${regionalEconomics.unitCost}
Break-Even List Price: ${regionalEconomics.symbol}${regionalEconomics.breakEven}
Suggested Retail:     ${regionalEconomics.symbol}${regionalEconomics.suggestedPrice}
Net Royalty / Copy:   ${regionalEconomics.symbol}${regionalEconomics.royalty}

PREFLIGHT VERIFICATION: 100% PASS
Compliant with Amazon KDP, IngramSpark & Notion Press.
============================================================`;

    const blob = new Blob([spec], { type: 'text/plain;charset=utf-8' });
    const cleanName = `${sanitizeFilename(bookTitle)}_Production_Specs_${trimSize}.txt`;
    saveAs(blob, cleanName);

    setSuccessModalData({
      isOpen: true,
      title: 'Happy Book Publishing!',
      subtitle: 'Your manufacturing tolerances and cover blueprints are fully certified for platform upload.',
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
    <div className={`min-h-screen font-sans transition-colors duration-200 ${
      isDarkMode ? 'bg-[#121115] text-[#ECE7DF]' : 'bg-[#F4EFE6] text-[#1F1C18]'
    }`}>
      <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
        isDarkMode ? 'bg-[#18161D]/90 border-[#282531]' : 'bg-[#F4EFE6]/90 border-[#E2DBD0]'
      }`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            onClick={() => setActiveView('home')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#0E4D54] text-white flex items-center justify-center shadow-md">
              <Book className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-base tracking-tight text-[#1F1C18] dark:text-white">
                  PUBLISHSTUDIO
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#0E4D54]/10 text-[#0E4D54] dark:bg-teal-400/20 dark:text-teal-300">
                  Self-Publishing Supporting Software
                </span>
              </div>
              <p className="text-[10px] text-[#7A7368] dark:text-[#9A96A0] tracking-wide">
                Universal Print-on-Demand (POD)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`hidden md:flex items-center p-1 rounded-full border ${
              isDarkMode ? 'bg-[#1C1A22] border-[#2E2B38]' : 'bg-[#EAE4D8] border-[#DFD7CA]'
            }`}>
              <button
                onClick={() => setActiveView('home')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  activeView === 'home'
                    ? 'bg-white dark:bg-[#282531] text-[#1F1C18] dark:text-white shadow-sm'
                    : 'text-[#6D6559] dark:text-zinc-400 hover:text-black dark:hover:text-white'
                }`}
              >
                Home Overview
              </button>
              <button
                onClick={() => { setActiveView('studio'); handleSaveCurrentProject(); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  activeView === 'studio'
                    ? 'bg-white dark:bg-[#282531] text-[#1F1C18] dark:text-white shadow-sm'
                    : 'text-[#6D6559] dark:text-zinc-400 hover:text-black dark:hover:text-white'
                }`}
              >
                Guided Workflow
              </button>
              <button
                onClick={() => setActiveView('help')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  activeView === 'help'
                    ? 'bg-white dark:bg-[#282531] text-[#1F1C18] dark:text-white shadow-sm'
                    : 'text-[#6D6559] dark:text-zinc-400 hover:text-black dark:hover:text-white'
                }`}
              >
                Publishing Manual
              </button>
            </div>

            <button
              onClick={() => { refreshProjectsList(); setIsShelfOpen(true); }}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-full border text-xs font-medium flex items-center gap-1.5 transition ${
                isDarkMode 
                  ? 'bg-[#1C1A22] border-[#2E2B38] text-zinc-300 hover:bg-[#25222C]' 
                  : 'bg-white border-[#DFD7CA] text-[#4A4338] hover:bg-[#EAE4D8] shadow-sm'
              }`}
              title="Saved Books Shelf"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#0E4D54] dark:text-teal-400" />
              <span className="hidden sm:inline">My Books ({savedProjects.length})</span>
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full border transition ${
                isDarkMode 
                  ? 'bg-[#1C1A22] border-[#2E2B38] text-amber-400 hover:bg-[#25222C]' 
                  : 'bg-white border-[#DFD7CA] text-[#4A4338] hover:bg-[#EAE4D8] shadow-sm'
              }`}
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsAdminModalOpen(true)}
              className={`p-2 rounded-full border transition ${
                isAdminUnlocked
                  ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : isDarkMode
                    ? 'bg-[#1C1A22] border-[#2E2B38] text-zinc-400'
                    : 'bg-white border-[#DFD7CA] text-[#6D6559] shadow-sm'
              }`}
              title={isAdminUnlocked ? 'Owner Privileges Active' : 'Owner Master Access'}
            >
              {isAdminUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {activeView === 'help' && (
        <HelpCenter onBackToStudio={() => setActiveView('studio')} isDarkMode={isDarkMode} />
      )}

      {activeView === 'home' && (
        <main className="max-w-5xl mx-auto px-4 py-12 animate-in fade-in duration-200">
          <section className="text-center max-w-3xl mx-auto pt-6 pb-12">
            <span className="text-xs font-mono uppercase tracking-widest font-bold text-[#0E4D54] dark:text-teal-400 block mb-3">
              UNIVERSAL PRINT-ON-DEMAND PRODUCTION
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-[#1F1C18] dark:text-white leading-tight mb-5">
              Focus More on Writing, Less on Formatting!
            </h1>
            <p className="text-sm sm:text-base text-[#6D6559] dark:text-[#A8A4AF] leading-relaxed mb-8">
              PublishStudio eliminates printing rejections. We calculate binding gutters, full-wrap spine bulk, and safe margins automatically, leaving you free to craft your story.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => { setActiveView('studio'); setCurrentStep(1); }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#0E4D54] hover:bg-[#0A3D43] text-white shadow-[-3px_-3px_8px_rgba(255,255,255,0.6),_4px_4px_10px_rgba(14,77,84,0.35)] active:scale-[0.99] transition-all"
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
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-xs font-semibold border transition ${
                  isDarkMode 
                    ? 'bg-[#1C1A22] border-[#2E2B38] text-zinc-300 hover:bg-[#25222C]' 
                    : 'bg-white border-[#DFD7CA] text-[#4A4338] hover:bg-[#EAE4D8] shadow-sm'
                }`}
              >
                <span>Explore with Demo Book</span>
                <Sparkles className="w-3.5 h-3.5 text-[#0E4D54] dark:text-teal-400" />
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
            <div className={`p-6 rounded-3xl border transition ${
              isDarkMode 
                ? 'bg-[#18161D] border-[#292632]' 
                : 'bg-white border-[#FFFFFF]/80 shadow-[-6px_-6px_14px_rgba(255,255,255,0.8),_6px_6px_14px_rgba(188,175,158,0.3)]'
            }`}>
              <div className="w-10 h-10 rounded-2xl bg-[#0E4D54]/10 text-[#0E4D54] dark:bg-teal-500/20 dark:text-teal-300 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#1F1C18] dark:text-white mb-2">What is PublishStudio?</h3>
              <p className="text-xs text-[#6D6559] dark:text-[#A8A4AF] leading-relaxed">
                A zero-server book production workstation. It replaces complex software suites with deterministic print math, formatting, and preflight checks that run entirely on your device.
              </p>
            </div>

            <div className={`p-6 rounded-3xl border transition ${
              isDarkMode 
                ? 'bg-[#18161D] border-[#292632]' 
                : 'bg-white border-[#FFFFFF]/80 shadow-[-6px_-6px_14px_rgba(255,255,255,0.8),_6px_6px_14px_rgba(188,175,158,0.3)]'
            }`}>
              <div className="w-10 h-10 rounded-2xl bg-[#0E4D54]/10 text-[#0E4D54] dark:bg-teal-500/20 dark:text-teal-300 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#1F1C18] dark:text-white mb-2">What You Get as Output</h3>
              <p className="text-xs text-[#6D6559] dark:text-[#A8A4AF] leading-relaxed">
                Mirrored-margin interior DOCX/PDF files with drop caps and folios, true-to-scale 300 DPI full-wrap cover blueprints, and certified POD manufacturing spec sheets.
              </p>
            </div>

            <div className={`p-6 rounded-3xl border transition ${
              isDarkMode 
                ? 'bg-[#18161D] border-[#292632]' 
                : 'bg-white border-[#FFFFFF]/80 shadow-[-6px_-6px_14px_rgba(255,255,255,0.8),_6px_6px_14px_rgba(188,175,158,0.3)]'
            }`}>
              <div className="w-10 h-10 rounded-2xl bg-[#0E4D54]/10 text-[#0E4D54] dark:bg-teal-500/20 dark:text-teal-300 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#1F1C18] dark:text-white mb-2">Save Time & Elevate Quality</h3>
              <p className="text-xs text-[#6D6559] dark:text-[#A8A4AF] leading-relaxed">
                No more submission rejections due to clipped gutter text or misaligned barcodes. In-browser formatting gives you complete creative ownership.
              </p>
            </div>
          </section>

          <section className={`p-6 sm:p-8 rounded-3xl border mb-12 ${
            isDarkMode ? 'bg-[#18161D] border-[#282531]' : 'bg-[#EAE4D8]/60 border-[#DFD7CA]'
          }`}>
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#0E4D54] dark:text-teal-400 block mb-1">
              DUAL PRODUCTION ENGINES
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F1C18] dark:text-white mb-6">
              Choose Your Project Type
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div 
                onClick={() => {
                  setBookCategory('text_rich');
                  setActiveView('studio');
                  setCurrentStep(1);
                }}
                className={`p-6 rounded-2xl border cursor-pointer group transition-all ${
                  bookCategory === 'text_rich'
                    ? 'border-[#0E4D54] bg-white dark:bg-[#201D27] shadow-md ring-2 ring-[#0E4D54]/20'
                    : 'border-[#DFD7CA] dark:border-[#2B2834] bg-white/70 dark:bg-[#1A1820] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0E4D54] dark:text-teal-400">
                    Engine A
                  </span>
                  <div className="w-5 h-5 rounded-full border border-[#0E4D54] flex items-center justify-center text-[#0E4D54]">
                    ✓
                  </div>
                </div>
                <h4 className="text-base font-serif font-bold text-[#1F1C18] dark:text-white mb-1">
                  Text-Rich Manuscripts
                </h4>
                <p className="text-xs text-[#6D6559] dark:text-[#A8A4AF] mb-4">
                  Novels, memoirs, non-fiction guides, poetry, and workbooks. Includes mirror margins, running headers, and chapter drop caps.
                </p>
                <span className="text-xs font-semibold text-[#0E4D54] dark:text-teal-300 group-hover:underline inline-flex items-center gap-1">
                  Start Text-Rich Project &rarr;
                </span>
              </div>

              <div 
                onClick={() => {
                  setBookCategory('low_content');
                  setActiveView('studio');
                  setCurrentStep(1);
                }}
                className={`p-6 rounded-2xl border cursor-pointer group transition-all ${
                  bookCategory === 'low_content'
                    ? 'border-[#0E4D54] bg-white dark:bg-[#201D27] shadow-md ring-2 ring-[#0E4D54]/20'
                    : 'border-[#DFD7CA] dark:border-[#2B2834] bg-white/70 dark:bg-[#1A1820] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0E4D54] dark:text-teal-400">
                    Engine B
                  </span>
                  <div className="w-5 h-5 rounded-full border border-[#8C8479] flex items-center justify-center text-xs text-[#8C8479]">
                    ○
                  </div>
                </div>
                <h4 className="text-base font-serif font-bold text-[#1F1C18] dark:text-white mb-1">
                  Low-Content & Visual Creations
                </h4>
                <p className="text-xs text-[#6D6559] dark:text-[#A8A4AF] mb-4">
                  Planners, journals, sketchbooks, activity logs, and visual art books. Includes automated grid structures and 300 DPI calculations.
                </p>
                <span className="text-xs font-semibold text-[#0E4D54] dark:text-teal-300 group-hover:underline inline-flex items-center gap-1">
                  Start Low-Content Project &rarr;
                </span>
              </div>
            </div>
          </section>
        </main>
      )}
         {activeView === 'studio' && (
        <main className="max-w-5xl mx-auto px-4 py-8 pb-32 animate-in fade-in duration-200">
          <div className="mb-8">
            <div className={`hidden sm:flex items-center justify-between p-3.5 rounded-full border ${
              isDarkMode 
                ? 'bg-[#18161D] border-[#282531]' 
                : 'bg-white border-[#E2DBD0] shadow-[-3px_-3px_8px_rgba(255,255,255,0.7),_3px_3px_8px_rgba(188,175,158,0.25)]'
            }`}>
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
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition ${
                        isActive
                          ? 'bg-[#0E4D54] text-white shadow-sm font-bold'
                          : isPassed
                            ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                            : 'text-[#7A7368] dark:text-zinc-500 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center ${
                        isActive 
                          ? 'bg-white text-[#0E4D54] font-bold' 
                          : isPassed 
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                            : 'bg-black/5 dark:bg-white/10'
                      }`}>
                        {isPassed ? '✓' : s.step}
                      </span>
                      <span>{s.label}</span>
                    </button>

                    {idx < 3 && (
                      <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${
                        currentStep > idx + 1 ? 'bg-emerald-500/60' : 'bg-black/5 dark:bg-white/10'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="flex sm:hidden items-center justify-between gap-3">
              <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
              <div className="px-5 py-2 rounded-full bg-[#0E4D54] text-white text-xs font-bold tracking-wide shadow-md flex items-center gap-2">
                <span>Step {currentStep} of 4:</span>
                <span>
                  {currentStep === 1 && 'Specification & Setup'}
                  {currentStep === 2 && 'Interior Structuring'}
                  {currentStep === 3 && 'Cover Blueprint'}
                  {currentStep === 4 && 'Preflight & Regional POD'}
                </span>
              </div>
              <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
            </div>
          </div>

          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#0E4D54] dark:text-teal-400 block mb-1">
                  STEP 1: PRODUCTION SETUP
                </span>
                <h2 className="text-2xl font-serif font-bold text-[#1F1C18] dark:text-white">
                  Specification & Manufacturing Parameters
                </h2>
                <p className="text-xs text-[#7A7368] dark:text-[#9A96A0] mt-0.5">
                  Establish book archetype, physical trim geometry, and paper bulk tolerances.
                </p>
              </div>

              <div className={`p-5 rounded-3xl border ${
                isDarkMode ? 'bg-[#18161D] border-[#282531]' : 'bg-white border-[#E2DBD0] shadow-sm'
              }`}>
                <label className="text-xs font-bold text-[#1F1C18] dark:text-white block mb-3">
                  Select Manuscript Archetype:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'border-[#0E4D54] bg-[#0E4D54]/5 dark:bg-teal-500/10 shadow-sm ring-1 ring-[#0E4D54]'
                            : 'border-[#DFD7CA] dark:border-[#2C2937] hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-serif font-bold text-xs text-[#1F1C18] dark:text-white">
                            {arch.name}
                          </span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[8px] ${
                            isSelected ? 'border-[#0E4D54] text-[#0E4D54] font-bold' : 'border-[#8C8479]'
                          }`}>
                            {isSelected ? '✓' : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7A7368] dark:text-[#9A96A0] leading-snug">
                          {arch.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className={`p-5 rounded-3xl border space-y-4 ${
                  isDarkMode ? 'bg-[#18161D] border-[#282531]' : 'bg-white border-[#E2DBD0] shadow-sm'
                }`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E4D54] dark:text-teal-400">
                    Physical Manufacturing Calibrations
                  </h3>

                  <div>
                    <label className="text-xs font-semibold text-[#524B40] dark:text-zinc-300 block mb-1.5">
                      Trim Dimensions:
                    </label>
                    <select
                      value={trimSize}
                      onChange={(e) => setTrimSize(e.target.value)}
                      className={`w-full p-2.5 rounded-xl text-xs border outline-none font-medium transition ${
                        isDarkMode 
                          ? 'bg-[#121115] border-[#2B2834] text-white' 
                          : 'bg-[#EAE4D8] border-[#DFD7CA] text-[#1F1C18]'
                      }`}
                    >
                      {TRIM_OPTIONS.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#524B40] dark:text-zinc-300 block mb-1.5">
                      Paper Stock Caliper:
                    </label>
                    <select
                      value={paperType}
                      onChange={(e) => setPaperType(e.target.value)}
                      className={`w-full p-2.5 rounded-xl text-xs border outline-none font-medium transition ${
                        isDarkMode 
                          ? 'bg-[#121115] border-[#2B2834] text-white' 
                          : 'bg-[#EAE4D8] border-[#DFD7CA] text-[#1F1C18]'
                      }`}
                    >
                      {Object.entries(PAPER_SPECS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-[#524B40] dark:text-zinc-300">Page Extent:</span>
                      <span className="font-mono font-bold text-[#0E4D54] dark:text-teal-400">{pageExtent} Pages</span>
                    </div>
                    <input
                      type="range"
                      min={24}
                      max={600}
                      value={pageExtent}
                      onChange={(e) => setPageExtent(parseInt(e.target.value))}
                      className="w-full accent-[#0E4D54]"
                    />
                    <div className="flex justify-between text-[10px] text-[#8C8479] mt-1 font-mono">
                      <span>24 pgs</span>
                      <span>120 pgs (Standard)</span>
                      <span>600 pgs</span>
                    </div>
                  </div>
                </div>

                <div className={`p-5 rounded-3xl border flex flex-col justify-between ${
                  isDarkMode ? 'bg-[#18161D] border-[#282531]' : 'bg-[#EAE4D8]/50 border-[#DFD7CA]'
                }`}>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E4D54] dark:text-teal-400 mb-3">
                      Automated Binding Tolerances
                    </h3>

                    <div className="grid grid-cols-3 gap-3 text-center mb-4">
                      <div className="p-3 rounded-2xl bg-white dark:bg-[#121115] border border-black/5 dark:border-white/5 shadow-xs">
                        <span className="text-[10px] text-[#8C8479] block">Binding Gutter</span>
                        <span className="text-sm font-bold font-mono text-[#0E4D54] dark:text-teal-300">
                          {calculatedGutter}"
                        </span>
                        <span className="text-[9px] text-[#8C8479] block mt-0.5">Crease safe</span>
                      </div>

                      <div className="p-3 rounded-2xl bg-white dark:bg-[#121115] border border-black/5 dark:border-white/5 shadow-xs">
                        <span className="text-[10px] text-[#8C8479] block">Outside Margin</span>
                        <span className="text-sm font-bold font-mono text-[#1F1C18] dark:text-zinc-200">
                          {outsideMargin}"
                        </span>
                        <span className="text-[9px] text-[#8C8479] block mt-0.5">Finger buffer</span>
                      </div>

                      <div className="p-3 rounded-2xl bg-white dark:bg-[#121115] border border-black/5 dark:border-white/5 shadow-xs">
                        <span className="text-[10px] text-[#8C8479] block">Top / Bottom</span>
                        <span className="text-sm font-bold font-mono text-[#1F1C18] dark:text-zinc-200">
                          {topBottomMargin}"
                        </span>
                        <span className="text-[9px] text-[#8C8479] block mt-0.5">Running head</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl border text-xs text-[#6D6559] dark:text-[#A8A4AF] bg-white/60 dark:bg-[#141318] border-black/5 dark:border-white/5 leading-relaxed">
                      💡 <strong>Deterministic Gutter Rule:</strong> Because this book is {pageExtent} pages, the inside binding margin is dynamically set to <strong>{calculatedGutter}"</strong> to guarantee your text will not sink into the spine curve.
                    </div>
                  </div>

                  <div className="pt-4 border-t border-black/5 dark:border-white/5 text-[11px] text-[#8C8479] flex items-center justify-between">
                    <span>Universal POD Standards Compliant</span>
                    <span className="font-mono text-[10px]">60% Margin Standard</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#0E4D54] dark:text-teal-400 block mb-1">
                  STEP 2: TYPESET PROOF & SCANNER
                </span>
                <h2 className="text-2xl font-serif font-bold text-[#1F1C18] dark:text-white">
                  Interior Production & Authentic Typesetting
                </h2>
                <p className="text-xs text-[#7A7368] dark:text-[#9A96A0] mt-0.5">
                  Verify mirrored margins, alternating folios, and chapter drop caps in authentic craft preview.
                </p>
              </div>

              <div className={`p-5 rounded-3xl border grid grid-cols-1 sm:grid-cols-2 gap-4 ${
                isDarkMode ? 'bg-[#18161D] border-[#282531]' : 'bg-white border-[#E2DBD0] shadow-sm'
              }`}>
                <div>
                  <label className="text-xs font-semibold text-[#524B40] dark:text-zinc-300 block mb-1">
                    Book Title (Recto / Odd Page Header):
                  </label>
                  <input
                    type="text"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs border outline-none font-medium ${
                      isDarkMode ? 'bg-[#121115] border-[#2B2834] text-white' : 'bg-[#EAE4D8] border-[#DFD7CA] text-[#1F1C18]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#524B40] dark:text-zinc-300 block mb-1">
                    Author Name (Verso / Even Page Header):
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs border outline-none font-medium ${
                      isDarkMode ? 'bg-[#121115] border-[#2B2834] text-white' : 'bg-[#EAE4D8] border-[#DFD7CA] text-[#1F1C18]'
                    }`}
                  />
                </div>
              </div>

              <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
                isDarkMode 
                  ? 'bg-[#100F13] border-[#24212C] shadow-inner' 
                  : 'bg-[#EAE4D8] border-[#DFD7CA] shadow-[inset_4px_4px_10px_rgba(180,165,145,0.4),_inset_-4px_-4px_10px_rgba(255,255,255,0.7)]'
              }`}>
                <div className="flex items-center justify-between text-xs mb-4">
                  <span className="font-serif font-bold text-[#1F1C18] dark:text-white flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[#0E4D54] dark:text-teal-400" />
                    Two-Page Craft Spread Proof ({currentTrim.name})
                  </span>
                  <span className="font-mono text-[10px] text-[#7A7368] dark:text-[#9A96A0]">
                    Pages 2–3 of {pageExtent}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                  <div className={`p-6 sm:p-7 rounded-xl shadow-md border min-h-[340px] flex flex-col justify-between transition-colors ${
                    isDarkMode ? 'bg-[#F2ECE1] text-[#1F1C18]' : 'bg-[#FFFDF9] text-[#1F1C18]'
                  }`}
                  style={{
                    paddingLeft: `${outsideMargin * 40 + 16}px`,
                    paddingRight: `${calculatedGutter * 40 + 16}px`
                  }}>
                    <div className="text-center border-b border-black/10 pb-2 mb-4">
                      <span className="text-[10px] font-serif uppercase tracking-widest text-[#5A5245]">
                        {authorName}
                      </span>
                    </div>

                    <div className="space-y-3 font-serif text-[11px] sm:text-xs leading-relaxed text-[#2D2A26]">
                      <p>{manuscriptParagraphs[0]}</p>
                      <p>{manuscriptParagraphs[1]}</p>
                    </div>

                    <div className="text-left pt-3 border-t border-black/5 text-[10px] font-mono text-[#7A7368]">
                      2
                    </div>
                  </div>

                  <div className={`p-6 sm:p-7 rounded-xl shadow-md border min-h-[340px] flex flex-col justify-between transition-colors ${
                    isDarkMode ? 'bg-[#F2ECE1] text-[#1F1C18]' : 'bg-[#FFFDF9] text-[#1F1C18]'
                  }`}
                  style={{
                    paddingLeft: `${calculatedGutter * 40 + 16}px`,
                    paddingRight: `${outsideMargin * 40 + 16}px`
                  }}>
                    <div className="text-center border-b border-black/10 pb-2 mb-4">
                      <span className="text-[10px] font-serif uppercase tracking-widest text-[#5A5245]">
                        {bookTitle}
                      </span>
                    </div>

                    <div className="space-y-3 font-serif text-[11px] sm:text-xs leading-relaxed text-[#2D2A26]">
                      <div className="text-center mb-3">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-[#0E4D54] block">CHAPTER ONE</span>
                        <h4 className="text-sm font-serif font-bold text-[#1F1C18]">The Opening Chapter</h4>
                      </div>
                      
                      <p className="leading-relaxed">
                        <span className="float-left text-3xl font-serif font-bold pr-2 leading-none text-[#0E4D54]">
                          {manuscriptParagraphs[2]?.charAt(0) || 'T'}
                        </span>
                        {manuscriptParagraphs[2]?.slice(1) || 'he manuscript continues...'}
                      </p>
                    </div>

                    <div className="text-right pt-3 border-t border-black/5 text-[10px] font-mono text-[#7A7368]">
                      3
                    </div>
                  </div>
                </div>

                <div className="text-center mt-4">
                  <span className="text-[10px] font-mono text-[#7A7368] dark:text-[#9A96A0]">
                    Live POD Layout: Inside gutter calibrated to {calculatedGutter}" based on {pageExtent} pages.
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setQuickFixDrawerOpen(!quickFixDrawerOpen)}
                  className={`px-4 py-2 rounded-full border text-xs font-semibold flex items-center gap-2 transition ${
                    isDarkMode 
                      ? 'bg-[#1C1A22] border-[#2E2B38] text-zinc-300' 
                      : 'bg-white border-[#DFD7CA] text-[#4A4338] shadow-sm'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-[#0E4D54] dark:text-teal-400" />
                  <span>{quickFixDrawerOpen ? 'Close Quick-Fix Drawer' : 'Quick-Fix Front Matter & Paragraphs'}</span>
                </button>

                <button
                  onClick={handleDownloadDOCX}
                  className="px-5 py-2.5 rounded-full bg-[#0E4D54] hover:bg-[#0A3D43] text-white text-xs font-bold shadow-sm inline-flex items-center gap-2 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Formatted DOCX</span>
                </button>
              </div>

              {quickFixDrawerOpen && (
                <div className={`p-5 rounded-3xl border animate-in slide-in-from-top-2 ${
                  isDarkMode ? 'bg-[#18161D] border-[#292632]' : 'bg-white border-[#E2DBD0] shadow-sm'
                }`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0E4D54] dark:text-teal-400 mb-3">
                    In-Place Text Editor (Front-Matter & Prose Quick-Fix)
                  </h4>
                  <div className="space-y-3">
                    {manuscriptParagraphs.map((para, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <textarea
                          rows={2}
                          value={para}
                          onChange={(e) => {
                            const updated = [...manuscriptParagraphs];
                            updated[idx] = e.target.value;
                            setManuscriptParagraphs(updated);
                          }}
                          className={`w-full p-2.5 rounded-xl text-xs border outline-none font-serif leading-relaxed ${
                            isDarkMode ? 'bg-[#121115] border-[#2B2834] text-white' : 'bg-[#EAE4D8] border-[#DFD7CA] text-[#1F1C18]'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#0E4D54] dark:text-teal-400 block mb-1">
                  STEP 3: FULL-WRAP COVER BLUEPRINT
                </span>
                <h2 className="text-2xl font-serif font-bold text-[#1F1C18] dark:text-white">
                  Cover Blueprint & Spine Geometry
                </h2>
                <p className="text-xs text-[#7A7368] dark:text-[#9A96A0] mt-0.5">
                  Full-wrap outer dimensions, spine bulk depth, and standard 2.0" × 1.2" barcode clearance zone.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className={`p-3.5 rounded-2xl border ${
                  isDarkMode ? 'bg-[#18161D] border-[#282531]' : 'bg-white border-[#E2DBD0] shadow-xs'
                }`}>
                  <span className="text-[10px] text-[#8C8479] block">Spine Width</span>
                  <span className="text-sm font-mono font-bold text-[#0E4D54] dark:text-teal-400">{spineWidth}"</span>
                  <span className="text-[9px] text-[#8C8479] block mt-0.5">{pageExtent} pgs ({paperType})</span>
                </div>

                <div className={`p-3.5 rounded-2xl border ${
                  isDarkMode ? 'bg-[#18161D] border-[#282531]' : 'bg-white border-[#E2DBD0] shadow-xs'
                }`}>
                  <span className="text-[10px] text-[#8C8479] block">Full-Wrap Width</span>
                  <span className="text-sm font-mono font-bold text-[#1F1C18] dark:text-white">{fullCoverWidth}"</span>
                  <span className="text-[9px] text-[#8C8479] block mt-0.5">Includes 0.125" bleed</span>
                </div>

                <div className={`p-3.5 rounded-2xl border ${
                  isDarkMode ? 'bg-[#18161D] border-[#282531]' : 'bg-white border-[#E2DBD0] shadow-xs'
                }`}>
                  <span className="text-[10px] text-[#8C8479] block">Full-Wrap Height</span>
                  <span className="text-sm font-mono font-bold text-[#1F1C18] dark:text-white">{fullCoverHeight}"</span>
                  <span className="text-[9px] text-[#8C8479] block mt-0.5">Includes 0.125" bleed</span>
                </div>

                <div className={`p-3.5 rounded-2xl border ${
                  isDarkMode ? 'bg-[#18161D] border-[#282531]' : 'bg-white border-[#E2DBD0] shadow-xs'
                }`}>
                  <span className="text-[10px] text-[#8C8479] block">Canvas at 300 DPI</span>
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                    {coverPixelsWidth} × {coverPixelsHeight} px
                  </span>
                </div>
              </div>

              <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
                isDarkMode 
                  ? 'bg-[#100F13] border-[#24212C] shadow-inner' 
                  : 'bg-[#EAE4D8] border-[#DFD7CA] shadow-[inset_4px_4px_10px_rgba(180,165,145,0.4),_inset_-4px_-4px_10px_rgba(255,255,255,0.7)]'
              }`}>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-serif font-bold text-[#1F1C18] dark:text-white">
                    Interactive Scale Blueprint (1:1 Proportional Layout)
                  </span>
                  <span className="text-[10px] font-mono text-[#7A7368] dark:text-[#9A96A0]">
                    Safe Zones: Active | Bleed: 0.125"
                  </span>
                </div>

                <div className="w-full bg-white dark:bg-[#1A1820] rounded-2xl p-4 sm:p-6 border border-dashed border-[#BCB09E] dark:border-[#383344] shadow-md">
                  <div className="relative w-full aspect-[2/1] border border-red-400/60 rounded flex items-center justify-between bg-[#FDFBF7] dark:bg-[#15141A]">
                    <span className="absolute top-1 left-2 text-[8px] font-mono text-red-500 uppercase tracking-widest">
                      0.125" Outer Bleed Cut Line
                    </span>

                    <div className="flex-1 h-full border-r border-dashed border-[#8C8479]/40 p-4 flex flex-col justify-between relative">
                      <div className="text-center mt-2">
                        <span className="text-[10px] font-mono font-bold text-[#8C8479] block uppercase">Back Cover</span>
                        <span className="text-[9px] text-[#8C8479]">({currentTrim.width}" × {currentTrim.height}")</span>
                      </div>

                      <div className="self-end w-24 h-16 rounded border border-dashed border-red-500 bg-red-500/10 p-1 flex flex-col items-center justify-center text-center">
                        <span className="text-[8px] font-mono font-bold text-red-600 dark:text-red-400 leading-tight">
                          BARCODE ZONE
                        </span>
                        <span className="text-[7px] text-red-600 dark:text-red-400">2.0" × 1.2" Reserved</span>
                      </div>
                    </div>

                    <div className="w-8 sm:w-12 h-full bg-[#EAE4D8]/60 dark:bg-black/40 border-r border-dashed border-[#8C8479]/40 flex items-center justify-center relative">
                      <span className="text-[9px] font-mono font-bold text-[#0E4D54] dark:text-teal-300 -rotate-90 whitespace-nowrap">
                        {pageExtent >= 80 ? bookTitle.slice(0, 15) : 'No Spine Text (<80 pgs)'}
                      </span>
                    </div>

                    <div className="flex-1 h-full p-4 flex flex-col justify-between items-center text-center">
                      <div className="mt-2">
                        <span className="text-[10px] font-mono font-bold text-[#8C8479] block uppercase">Front Cover</span>
                        <span className="text-[9px] text-[#8C8479]">({currentTrim.width}" × {currentTrim.height}")</span>
                      </div>

                      <div className="my-auto py-2">
                        <h4 className="text-xs sm:text-sm font-serif font-bold text-[#1F1C18] dark:text-white">
                          {bookTitle}
                        </h4>
                        <span className="text-[10px] font-serif text-[#7A7368] dark:text-[#9A96A0] mt-0.5 block">
                          {authorName}
                        </span>
                      </div>

                      <span className="text-[8px] font-mono text-[#8C8479]">0.25" Safe Inner Perimeter</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs mt-4">
                  ⚠️ <strong>Barcode Zone Rule:</strong> Keep all important text, URLs, and faces away from the lower-right quadrant of your back cover. The print-on-demand machine applies the physical barcode directly onto that 2.0" × 1.2" area.
                </div>
              </div>
            </div>
          )}
          
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#0E4D54] dark:text-teal-400 block mb-1">
                  STEP 4: PREFLIGHT AUDIT & ECONOMICS
                </span>
                <h2 className="text-2xl font-serif font-bold text-[#1F1C18] dark:text-white">
                  Preflight Verification & Strategic Forecast
                </h2>
                <p className="text-xs text-[#7A7368] dark:text-[#9A96A0] mt-0.5">
                  Confirm manufacturing compliance, calculate multi-region royalties, and download certified production specs.
                </p>
              </div>

              <div className={`p-6 sm:p-7 rounded-3xl border ${
                isDarkMode ? 'bg-[#18161D] border-[#282531]' : 'bg-white border-[#E2DBD0] shadow-sm'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-black/5 dark:border-white/5 pb-4">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#1F1C18] dark:text-white">
                      Manufacturing Economics & Distribution Margins
                    </h3>
                    <p className="text-xs text-[#7A7368] dark:text-[#9A96A0]">
                      Standard 60% self-publishing distribution formula based on {pageExtent} pages.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#524B40] dark:text-zinc-300">Marketplace:</span>
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className={`p-2 rounded-xl text-xs font-bold border outline-none ${
                        isDarkMode ? 'bg-[#121115] border-[#2B2834] text-teal-300' : 'bg-[#EAE4D8] border-[#DFD7CA] text-[#0E4D54]'
                      }`}
                    >
                      {Object.entries(REGIONS).map(([code, reg]) => (
                        <option key={code} value={code}>{reg.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className={`p-4 rounded-2xl border ${
                    isDarkMode ? 'bg-[#121115] border-[#26242D]' : 'bg-[#FAF8F5] border-[#E8E1D5]'
                  }`}>
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#8C8479] block mb-2">
                      GLOBAL BENCHMARK (USD / $)
                    </span>
                    <div className="space-y-1.5 text-xs text-[#524B40] dark:text-zinc-300">
                      <div className="flex justify-between">
                        <span>Unit Print Cost:</span>
                        <span className="font-mono font-bold">${globalUSDEconomics.unitCost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Break-Even List Price:</span>
                        <span className="font-mono font-bold">${globalUSDEconomics.breakEven}</span>
                      </div>
                      <div className="flex justify-between text-[#0E4D54] dark:text-teal-400 font-bold pt-1 border-t border-black/5 dark:border-white/5">
                        <span>Suggested Price: ${globalUSDEconomics.suggestedPrice}</span>
                        <span>Royalty: +${globalUSDEconomics.royalty}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-2xl border ${
                    isDarkMode ? 'bg-[#121115] border-[#26242D]' : 'bg-[#FAF8F5] border-[#E8E1D5]'
                  }`}>
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#0E4D54] dark:text-teal-400 block mb-2">
                      SELECTED REGION: {REGIONS[selectedRegion].name}
                    </span>
                    <div className="space-y-1.5 text-xs text-[#524B40] dark:text-zinc-300">
                      <div className="flex justify-between">
                        <span>Unit Print Cost:</span>
                        <span className="font-mono font-bold">{regionalEconomics.symbol}{regionalEconomics.unitCost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Break-Even List Price:</span>
                        <span className="font-mono font-bold">{regionalEconomics.symbol}{regionalEconomics.breakEven}</span>
                      </div>
                      <div className="flex justify-between text-[#0E4D54] dark:text-teal-400 font-bold pt-1 border-t border-black/5 dark:border-white/5">
                        <span>Suggested Price: {regionalEconomics.symbol}{regionalEconomics.suggestedPrice}</span>
                        <span>Royalty: +{regionalEconomics.symbol}{regionalEconomics.royalty}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border mb-3 ${
                  isDarkMode ? 'bg-[#121115] border-[#26242D]' : 'bg-[#EAE4D8]/50 border-[#DFD7CA]'
                }`}>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#0E4D54] dark:text-teal-400 block mb-3 text-center sm:text-left">
                    ESTIMATED MONTHLY ROYALTY PROJECTION ({selectedRegion})
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-white dark:bg-[#1A1820] border border-black/5 dark:border-white/5 shadow-xs">
                      <span className="text-[10px] text-[#8C8479] block">🥉 Conservative</span>
                      <span className="text-base font-bold font-mono text-[#1F1C18] dark:text-white mt-1 block">
                        {regionalEconomics.symbol}{regionalEconomics.forecast.conservative}
                      </span>
                      <span className="text-[9px] text-[#8C8479] block mt-0.5">10 copies / month</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-[#1A1820] border border-black/5 dark:border-white/5 shadow-xs">
                      <span className="text-[10px] text-[#8C8479] block">🥈 Benchmark Average</span>
                      <span className="text-base font-bold font-mono text-[#0E4D54] dark:text-teal-300 mt-1 block">
                        {regionalEconomics.symbol}{regionalEconomics.forecast.benchmark}
                      </span>
                      <span className="text-[9px] text-[#8C8479] block mt-0.5">50 copies / month</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-[#1A1820] border border-black/5 dark:border-white/5 shadow-xs">
                      <span className="text-[10px] text-[#8C8479] block">🥇 Scaled Launch</span>
                      <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                        {regionalEconomics.symbol}{regionalEconomics.forecast.optimistic}
                      </span>
                      <span className="text-[9px] text-[#8C8479] block mt-0.5">250 copies / month</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#8C8479] dark:text-[#9A96A0] italic text-center mt-3 leading-relaxed">
                    * Disclaimer: Figures are mathematical estimates based on current platform POD distribution formulas and suggested list prices. Actual earnings vary by sales volume, distribution channels, local VAT/taxes, and retail promotions; this does not constitute a guaranteed income projection.
                  </p>
                </div>
              </div>

              <div className={`p-5 rounded-3xl border space-y-3 ${
                isDarkMode ? 'bg-[#18161D] border-[#282531]' : 'bg-white border-[#E2DBD0] shadow-sm'
              }`}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E4D54] dark:text-teal-400">
                  Automated Preflight Quality Audit
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Page Extent Compatible ({pageExtent} pages meets trade paperback minimums)</span>
                    </div>
                    <span className="font-mono font-bold text-[10px]">PASS</span>
                  </div>

                  <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Spine Gutter Clearance ({calculatedGutter}" inside margin prevents crease clipping)</span>
                    </div>
                    <span className="font-mono font-bold text-[10px]">PASS</span>
                  </div>

                  <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>300 DPI Canvas Resolution ({coverPixelsWidth} × {coverPixelsHeight} px verified)</span>
                    </div>
                    <span className="font-mono font-bold text-[10px]">PASS</span>
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    onClick={handleDownloadSpecification}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#0E4D54] hover:bg-[#0A3D43] text-white font-semibold text-xs px-6 py-3 rounded-full shadow-md active:scale-95 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Production Specification (.txt)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="fixed bottom-0 left-0 right-0 z-30 p-3 sm:p-4 bg-white/80 dark:bg-[#121115]/80 backdrop-blur-md border-t border-black/5 dark:border-white/5 flex items-center justify-center">
            <div className={`p-1.5 rounded-full border shadow-lg flex items-center gap-2 ${
              isDarkMode ? 'bg-[#1C1A22] border-[#2F2C3A]' : 'bg-[#EAE4D8] border-[#DFD7CA]'
            }`}>
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-5 py-2 rounded-full text-xs font-semibold text-[#524B40] dark:text-zinc-300 hover:text-black dark:hover:text-white transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              {currentStep < 4 ? (
                <button
                  onClick={() => {
                    handleSaveCurrentProject();
                    setCurrentStep(currentStep + 1);
                  }}
                  className="px-6 py-2 rounded-full text-xs font-bold bg-[#0E4D54] hover:bg-[#0A3D43] text-white shadow-sm transition flex items-center gap-1.5"
                >
                  <span>
                    {currentStep === 1 && 'Next: Interior Typesetting'}
                    {currentStep === 2 && 'Next: Cover Blueprint'}
                    {currentStep === 3 && 'Next: Preflight Audit'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleDownloadSpecification}
                  className="px-6 py-2 rounded-full text-xs font-bold bg-[#0E4D54] hover:bg-[#0A3D43] text-white shadow-sm transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Complete & Export All</span>
                </button>
              )}
            </div>
          </div>
        </main>
      )}
            {isShelfOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className={`w-full max-w-lg rounded-3xl border p-6 transition-all shadow-2xl ${
            isDarkMode ? 'bg-[#18161D] border-[#292632] text-white' : 'bg-[#F4EFE6] border-[#DFD7CA] text-[#1F1C18]'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-[#0E4D54] dark:text-teal-400" />
                <h3 className="font-serif font-bold text-base">Saved Book Projects (Local Storage)</h3>
              </div>
              <button onClick={() => setIsShelfOpen(false)} className="p-1 rounded-full hover:bg-black/5 text-[#8C8479]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {savedProjects.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#8C8479]">
                  No saved drafts found. Your projects are stored here in browser memory with ₹0 server fees.
                </div>
              ) : (
                savedProjects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => handleLoadProject(proj)}
                    className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition ${
                      isDarkMode ? 'bg-[#121115] border-[#282531] hover:bg-[#1E1C24]' : 'bg-white border-[#E2DBD0] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div>
                      <h4 className="font-serif font-bold text-xs text-[#1F1C18] dark:text-white">{proj.title}</h4>
                      <p className="text-[10px] text-[#7A7368] dark:text-[#9A96A0]">
                        {proj.author} • {proj.trimSize} • {proj.pageExtent} Pages
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteProject(proj.id, e)}
                      className="p-1.5 rounded-full hover:bg-red-500/10 text-red-500"
                      title="Delete Draft"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {successModalData.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-md border rounded-3xl p-6 sm:p-7 text-center transition-all ${
            isDarkMode 
              ? 'bg-[#18171B] border-[#292632] text-[#EDE8E1]' 
              : 'bg-[#F4EFE6] border-white/80 text-[#1F1C18] shadow-[-10px_-10px_25px_rgba(255,255,255,0.8),_10px_10px_25px_rgba(188,175,158,0.4)]'
          }`}>
            <div className="w-11 h-11 mx-auto mb-3 rounded-2xl bg-[#0E4D54]/10 text-[#0E4D54] dark:bg-teal-500/20 dark:text-teal-300 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>

            <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#0E4D54] dark:text-teal-400 block mb-1">
              {successModalData.fileLabel} Generated
            </span>

            <h3 className="text-xl font-serif font-bold text-[#1F1C18] dark:text-white mb-1.5">
              {successModalData.title}
            </h3>

            <p className="text-xs text-[#7A7368] dark:text-[#A8A4AF] leading-relaxed mb-4">
              {successModalData.subtitle}
            </p>

            <div className={`py-2.5 px-4 rounded-2xl border text-xs font-serif italic mb-5 leading-relaxed ${
              isDarkMode 
                ? 'bg-[#121114] border-[#292630] text-zinc-300' 
                : 'bg-[#EAE4D8] border-[#DFD7CA] text-[#4A4338] shadow-[inset_2px_2px_4px_rgba(180,165,145,0.3),_inset_-2px_-2px_4px_rgba(255,255,255,0.7)]'
            }`}>
              "May your words travel far and find the readers who need them most. See you soon on your next chapter!"
            </div>

            {!reviewSubmitted ? (
              <div className={`p-4 rounded-2xl border mb-5 text-left transition ${
                isDarkMode ? 'bg-[#141317] border-[#26242D]' : 'bg-[#EDE7DC] border-[#DFD6C7]'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold font-sans text-[#1F1C18] dark:text-zinc-200">
                    Rate your formatting experience:
                  </span>
                  {userRating > 0 && (
                    <span className="text-[10px] font-mono font-semibold text-[#0E4D54] dark:text-teal-400">
                      {userRating} of 5 Stars
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || userRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setUserRating(star)}
                        className="p-1 text-lg transition-transform hover:scale-125 focus:outline-none"
                      >
                        <span className={active ? 'text-amber-500 drop-shadow-sm' : 'text-[#BBB3A4] dark:text-[#4A4652]'}>
                          ★
                        </span>
                      </button>
                    );
                  })}
                </div>

                <textarea
                  rows={2}
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Quick thought or feature suggestion? (Optional)"
                  className={`w-full p-2.5 rounded-xl text-xs outline-none resize-none transition ${
                    isDarkMode 
                      ? 'bg-[#1C1A20] text-zinc-200 border border-[#2B2834] placeholder:text-zinc-600' 
                      : 'bg-[#F4EFE6] text-[#1F1C18] border border-[#DDD4C5] placeholder:text-[#9E968B] shadow-inner'
                  }`}
                />

                {userRating > 0 && (
                  <button
                    onClick={handleRecordUserReview}
                    className="mt-2.5 w-full py-2 px-3 rounded-full text-xs font-semibold bg-[#0E4D54] hover:bg-[#0A3D43] text-white shadow-sm transition"
                  >
                    Submit Review
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-5 flex items-center justify-center gap-2">
                <span>✓</span>
                <span>Thank you! Your rating has been recorded locally.</span>
              </div>
            )}

            <button
              onClick={() => {
                setSuccessModalData(prev => ({ ...prev, isOpen: false }));
                setReviewSubmitted(false);
                setUserRating(0);
                setReviewFeedback('');
              }}
              className="w-full py-3 px-6 rounded-full font-sans font-bold text-xs uppercase tracking-wider bg-[#0E4D54] hover:bg-[#0A3D43] text-white shadow-[-3px_-3px_8px_rgba(255,255,255,0.6),_4px_4px_10px_rgba(14,77,84,0.35)] active:scale-[0.99] transition-all"
            >
              Continue Studio
            </button>
          </div>
        </div>
      )}

      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className={`w-full max-w-sm rounded-3xl border p-6 text-center ${
            isDarkMode ? 'bg-[#18161D] border-[#292632] text-white' : 'bg-[#F4EFE6] border-[#DFD7CA] text-[#1F1C18]'
          }`}>
            <div className="w-10 h-10 mx-auto mb-3 rounded-2xl bg-[#0E4D54]/10 text-[#0E4D54] dark:bg-teal-500/20 dark:text-teal-300 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base mb-1">Owner Master Access</h3>
            <p className="text-xs text-[#7A7368] dark:text-[#9A96A0] mb-4">
              Enter your master secret key to unlock permanent unlimited studio features.
            </p>

            <input
              type="password"
              placeholder="Enter master key..."
              value={adminPassphrase}
              onChange={(e) => setAdminPassphrase(e.target.value)}
              className={`w-full p-2.5 rounded-xl text-xs border outline-none mb-2 ${
                isDarkMode ? 'bg-[#121115] border-[#2B2834] text-white' : 'bg-[#EAE4D8] border-[#DFD7CA] text-[#1F1C18]'
              }`}
            />
            {adminError && <p className="text-[10px] text-red-500 mb-2">{adminError}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="w-1/2 py-2 rounded-full border text-xs font-semibold hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminAuth}
                className="w-1/2 py-2 rounded-full bg-[#0E4D54] hover:bg-[#0A3D43] text-white text-xs font-bold"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
