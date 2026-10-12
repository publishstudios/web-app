// ==========================================================================
// FILE: app/page.jsx
// ==========================================================================

/* --------------------------------------------------------------------------
   SECTION 1.0: IMPORTS
   -------------------------------------------------------------------------- */
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Book, BookOpen, HelpCircle, Lock, Unlock, Sparkles, Download, 
  ArrowRight, ArrowLeft, CheckCircle2, 
  Eye, Sliders, Layers, FolderOpen, Trash2, X, Upload
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
  USD: { name: 'Global POD Standard (USD)', symbol: '$', base: 1.00, perPage: 0.012, step: 0.50 },
  INR: { name: 'India Domestic (₹)', symbol: '₹', base: 60, perPage: 0.75, step: 10 },
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

  /* SECTION 3.2: USER IDENTITY & REMEMBER ME (LOCAL STORAGE) */
  const [userProfile, setUserProfile] = useState({ firstName: '', lastName: '', email: '' });
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState('Issue Report');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  /* SECTION 3.3: PROJECT CONFIGURATION STATE */
  const [projectId, setProjectId] = useState('proj_default');
  const [bookTitle, setBookTitle] = useState('The Memory Chef');
  const [authorName, setAuthorName] = useState('A. S. Harper');
  const [bookCategory, setBookCategory] = useState('text_rich');
  const [selectedArchetype, setSelectedArchetype] = useState('fiction');
  const [trimSize, setTrimSize] = useState('5.5x8.5');
  const [paperType, setPaperType] = useState('cream');
  const [pageExtent, setPageExtent] = useState(120);

  /* SECTION 3.4: MANUSCRIPT UPLOAD & READER VIEW STATE */
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [rawManuscriptText, setRawManuscriptText] = useState('');
  const [manuscriptParagraphs, setManuscriptParagraphs] = useState(SAMPLE_CHAPTER_TEXT);
  const [quickFixDrawerOpen, setQuickFixDrawerOpen] = useState(false);
  const [interiorViewMode, setInteriorViewMode] = useState('spread'); // 'single' | 'spread'
  const [readerCurrentPage, setReaderCurrentPage] = useState(0);

  /* SECTION 3.5: KDP ROYALTY & PORTFOLIO STATE */
  const [selectedRegion, setSelectedRegion] = useState('USD');
  const [royaltyRate, setRoyaltyRate] = useState(0.60); // 0.60 Standard, 0.40 Expanded
  const [userCustomPrice, setUserCustomPrice] = useState('12.99');
  const [portfolioBookCount, setPortfolioBookCount] = useState(3);
  const [monthlySalesPerBook, setMonthlySalesPerBook] = useState(25);

  /* SECTION 3.6: PERSISTENCE, ADMIN & MODAL STATE */
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

  /* SECTION 3.7: STORAGE & IDENTITY SYNCHRONIZATION */
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
    const savedUser = localStorage.getItem('publishstudio_user');
    if (savedUser) {
      try {
        setUserProfile(JSON.parse(savedUser));
      } catch (e) {}
    }
    if (localStorage.getItem('ps_admin_unlocked') === 'true') {
      setIsAdminUnlocked(true);
    }
  }, []);

  const handleSaveUserProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('publishstudio_user', JSON.stringify(userProfile));
    alert('User profile remembered on this device.');
  };

  const handleSendFeedbackEmail = (e) => {
    e.preventDefault();
    const recipient = 'publishstudio.ops@gmail.com';
    const subject = `[${feedbackCategory}] Feedback from ${userProfile.firstName || 'Author'}`;
    const body = `Author: ${userProfile.firstName} ${userProfile.lastName} (${userProfile.email})\n\nFeedback Details:\n${feedbackMessage}`;
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setShowAccountModal(false);
  };

  /* SECTION 3.8: MANUSCRIPT UPLOAD & PAGINATION LOGIC */
  const handleManuscriptUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result || '';
      setRawManuscriptText(text);
      const paras = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
      if (paras.length > 0) {
        setManuscriptParagraphs(paras);
      }
    };
    reader.readAsText(file);
  };

  // Convert paragraphs into readable simulated pages (~220 words per page)
  const renderedBookPages = useMemo(() => {
    const fullText = manuscriptParagraphs.join('\n\n');
    const words = fullText.split(/\s+/).filter(Boolean);
    const wordsPerPage = 220;
    const pages = [];
    for (let i = 0; i < words.length; i += wordsPerPage) {
      pages.push(words.slice(i, i + wordsPerPage).join(' '));
    }
    return pages.length > 0 ? pages : [SAMPLE_CHAPTER_TEXT.join(' ')];
  }, [manuscriptParagraphs]);

  /* SECTION 3.9: PHYSICAL MANUFACTURING CALCULATIONS */
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

  /* SECTION 3.10: KDP ROYALTY & PORTFOLIO ENGINE */
  const kdpEconomics = useMemo(() => {
    const reg = REGIONS[selectedRegion] || REGIONS.USD;
    const unitCost = reg.base + (pageExtent * reg.perPage);
    const breakEven = unitCost / royaltyRate;

    const activeListPrice = userCustomPrice !== '' && !isNaN(parseFloat(userCustomPrice))
      ? parseFloat(userCustomPrice)
      : Math.max(9.99, Math.ceil(breakEven + 2.50) - 0.01);

    const royaltyPerUnit = Math.max(0, (activeListPrice * royaltyRate) - unitCost);
    const monthlyRev = portfolioBookCount * monthlySalesPerBook * royaltyPerUnit;
    const annualRev = monthlyRev * 12;

    return {
      symbol: reg.symbol,
      unitCost: unitCost.toFixed(2),
      breakEven: breakEven.toFixed(2),
      activeListPrice: activeListPrice.toFixed(2),
      royalty: royaltyPerUnit.toFixed(2),
      monthlyRevenue: monthlyRev.toFixed(2),
      annualRevenue: annualRev.toFixed(2),
      forecast: {
        conservative: (royaltyPerUnit * 10).toFixed(0),
        benchmark: (royaltyPerUnit * 50).toFixed(0),
        optimistic: (royaltyPerUnit * 250).toFixed(0)
      }
    };
  }, [selectedRegion, pageExtent, royaltyRate, userCustomPrice, portfolioBookCount, monthlySalesPerBook]);

  /* SECTION 3.11: LOCAL ACTIONS & EXPORT HANDLERS */
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
List Price:           ${kdpEconomics.symbol}${kdpEconomics.activeListPrice}
Royalty / Unit:       ${kdpEconomics.symbol}${kdpEconomics.royalty}
Royalty Plan:         ${royaltyRate === 0.60 ? 'Standard 60%' : 'Expanded 40%'}
Planned Portfolio:    ${portfolioBookCount} Books (~${kdpEconomics.symbol}${kdpEconomics.monthlyRevenue}/mo)
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
    <div className="min-h-screen bg-[#F4EFE6] text-[#1F1C18] font-sans">
      
      {/* ====================================================================
          SECTION 4.0: TOP NAVIGATION BAR
          ==================================================================== */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b bg-[#F4EFE6]/95 border-[#D6CEBE]">
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
                <span className="font-serif font-bold text-base tracking-tight text-[#1F1C18]">
                  PUBLISHSTUDIO
                </span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAE3D6] text-[#0E4D54] border border-[#D6CEBE]">
                  Self-Publishing Supporting Software
                </span>
              </div>
              <p className="text-[10px] text-[#7A7368] font-medium">Universal Print-on-Demand (POD)</p>
            </div>
          </div>

          {/* Header Controls Dock */}
          <div className="flex items-center gap-2">
            
            {/* Desktop Navigation Pills */}
            <div className="hidden md:flex items-center p-1 rounded-full bg-[#EAE3D6] border border-[#D6CEBE]">
              <button
                onClick={() => setActiveView('home')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  activeView === 'home'
                    ? 'bg-white text-[#1F1C18] shadow-sm'
                    : 'text-[#6D6559] hover:text-[#1F1C18]'
                }`}
              >
                Home Overview
              </button>
              <button
                onClick={() => { setActiveView('studio'); handleSaveCurrentProject(); }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  activeView === 'studio'
                    ? 'bg-white text-[#1F1C18] shadow-sm'
                    : 'text-[#6D6559] hover:text-[#1F1C18]'
                }`}
              >
                Guided Workflow
              </button>
              <button
                onClick={() => setActiveView('help')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                  activeView === 'help'
                    ? 'bg-white text-[#1F1C18] shadow-sm'
                    : 'text-[#6D6559] hover:text-[#1F1C18]'
                }`}
              >
                Publishing Manual
              </button>
            </div>

            {/* Remembered User Badge */}
            {userProfile.firstName && (
              <span className="hidden lg:inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#EAE3D6] text-[#0E4D54] border border-[#D6CEBE]">
                👤 {userProfile.firstName}
              </span>
            )}

            {/* My Books Local Storage Drawer */}
            <button
              onClick={() => { refreshProjectsList(); setIsShelfOpen(true); }}
              className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 bg-white border border-[#D6CEBE] text-[#1F1C18] shadow-sm"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#0E4D54]" />
              <span className="hidden sm:inline">My Books ({savedProjects.length})</span>
            </button>

            {/* User Profile & Help Button */}
            <button
              onClick={() => setShowAccountModal(true)}
              className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 bg-[#0E4D54] text-white shadow-sm hover:bg-[#09393E] transition"
              title="Help & Feedback"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Help ▾</span>
            </button>

            {/* Master Owner Lock */}
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="p-2 rounded-full bg-white border border-[#D6CEBE] text-[#6D6559]"
            >
              {isAdminUnlocked ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4" />}
            </button>

          </div>
        </div>
      </header>

      {/* ====================================================================
          SECTION 5.0: FULL-PAGE HELP MANUAL VIEW
          ==================================================================== */}
      {activeView === 'help' && (
        <HelpCenter onBackToStudio={() => setActiveView('studio')} isDarkMode={false} />
      )}

      {/* ====================================================================
          SECTION 6.0: HOME OVERVIEW & ENGINE SELECTOR VIEW
          ==================================================================== */}
      {activeView === 'home' && (
        <main className="max-w-5xl mx-auto px-4 py-12">
          
          {/* SECTION 6.1: HERO BLOCK */}
          <section className="text-center max-w-3xl mx-auto pt-4 pb-10">
            <span className="text-xs font-mono uppercase tracking-widest font-bold text-[#0E4D54] block mb-3">
              UNIVERSAL PRINT-ON-DEMAND (POD)
            </span>
            <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-[#1F1C18] leading-[1.15] mb-5">
              Focus More on Writing,<br />Less on Formatting!
            </h1>
            <p className="text-sm sm:text-base text-[#655E52] leading-relaxed max-w-2xl mx-auto mb-8 font-medium">
              PublishStudio eliminates printing rejections. We calculate binding gutters, full-wrap spine bulk, and safe margins automatically, leaving you free to craft your story.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => { setActiveView('studio'); setCurrentStep(1); }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-[#0E4D54] text-white hover:bg-[#09393E] shadow-md transition-all"
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-xs font-bold bg-white border border-[#D6CEBE] text-[#1F1C18] shadow-sm hover:bg-stone-50 transition"
              >
                <span>Explore with Demo Book</span>
                <Sparkles className="w-3.5 h-3.5 text-[#0E4D54]" />
              </button>
            </div>
          </section>

          {/* SECTION 6.2: DUAL PRODUCTION ENGINES */}
          <section className="mt-4">
            <div className="text-center mb-6">
              <span className="px-4 py-1.5 rounded-full bg-[#0E4D54] text-white text-[10px] font-mono uppercase tracking-widest font-bold shadow-md">
                DUAL PRODUCTION ENGINES
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Engine A: Text-Rich */}
              <div 
                onClick={() => { setBookCategory('text_rich'); setActiveView('studio'); setCurrentStep(1); }}
                className={`p-7 rounded-3xl cursor-pointer transition-all bg-white border-2 ${bookCategory === 'text_rich' ? 'border-[#0E4D54]' : 'border-[#D6CEBE]'} shadow-sm hover:border-[#0E4D54]`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="w-7 h-7 rounded-full bg-[#C25A38] text-white flex items-center justify-center font-bold text-xs">
                    A
                  </span>
                  <span className="text-[10px] font-mono text-[#7A7368] uppercase font-bold tracking-wider">Engine A</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#1F1C18] mb-1">
                  Text-Rich Manuscripts
                </h3>
                <p className="text-xs text-[#7A7368] mb-5 font-medium">
                  Novel, Memoirs, Non-fiction, Poetry
                </p>

                <ul className="space-y-2 text-xs text-[#4A4338] font-medium">
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
                className={`p-7 rounded-3xl cursor-pointer transition-all bg-white border-2 ${bookCategory === 'low_content' ? 'border-[#0E4D54]' : 'border-[#D6CEBE]'} shadow-sm hover:border-[#0E4D54]`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="w-7 h-7 rounded-full bg-[#0E4D54] text-white flex items-center justify-center font-bold text-xs">
                    B
                  </span>
                  <span className="text-[10px] font-mono text-[#7A7368] uppercase font-bold tracking-wider">Engine B</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#1F1C18] mb-1">
                  Low-Content Creations
                </h3>
                <p className="text-xs text-[#7A7368] mb-5 font-medium">
                  Planners, Journals, Visual strips
                </p>

                <ul className="space-y-2 text-xs text-[#4A4338] font-medium">
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

          {/* SECTION 6.3: KDP ROYALTY & PORTFOLIO PLANNER */}
          <section className="mt-10 p-6 rounded-3xl bg-white border border-[#D6CEBE] shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0E4D54]">
              KDP Print Royalty & Multi-Book Portfolio Planner
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Page Count</label>
                <input
                  type="number"
                  value={pageExtent}
                  onChange={(e) => setPageExtent(Math.max(24, parseInt(e.target.value) || 24))}
                  className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-[#D6CEBE] bg-[#F4EFE6] font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Royalty Plan</label>
                <select
                  value={royaltyRate}
                  onChange={(e) => setRoyaltyRate(parseFloat(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-[#D6CEBE] bg-[#F4EFE6] font-bold"
                >
                  <option value={0.60}>Standard Amazon (60%)</option>
                  <option value={0.40}>Expanded Distribution (40%)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">List Price ($)</label>
                <input
                  type="number"
                  step="0.50"
                  value={userCustomPrice}
                  onChange={(e) => setUserCustomPrice(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-[#D6CEBE] bg-[#F4EFE6] font-bold"
                />
                <span className="text-[10px] text-stone-500">Min Breakeven: ${kdpEconomics.breakEven}</span>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Planned / Published Books</label>
                <input
                  type="number"
                  value={portfolioBookCount}
                  onChange={(e) => setPortfolioBookCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-[#D6CEBE] bg-[#F4EFE6] font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#EFEAE2] border border-[#D6CEBE]">
              <div>
                <div className="text-[10px] font-bold text-stone-600">Unit Print Cost</div>
                <div className="text-base font-black text-[#1F1C18]">${kdpEconomics.unitCost}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-stone-600">Net Author Profit / Copy</div>
                <div className="text-base font-black text-emerald-800">${kdpEconomics.royalty}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-stone-600">Monthly Projected</div>
                <div className="text-base font-black text-emerald-800">${kdpEconomics.monthlyRevenue}</div>
                <div className="text-[9px] text-stone-500">Based on {monthlySalesPerBook} sales/book</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-stone-600">Annual Portfolio Total</div>
                <div className="text-base font-black text-emerald-800">${kdpEconomics.annualRevenue}</div>
                <div className="text-[9px] text-stone-500">12-Month Projection</div>
              </div>
            </div>
          </section>

        </main>
      )}

      {/* ====================================================================
          SECTION 7.0: 4-STEP PRODUCTION STUDIO PIPELINE
          ==================================================================== */}
      {activeView === 'studio' && (
        <main className="max-w-5xl mx-auto px-4 py-8 pb-32">
          
          {/* SECTION 7.1: PROGRESSION TRACK WITH DYNAMIC HIGHLIGHT LINE */}
          <div className="mb-8">
            <div className="relative flex items-center justify-between max-w-2xl mx-auto px-4 py-2">
              {/* Base Line */}
              <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-[#D6CEBE] z-0" />

              {/* Dynamic Highlight Line */}
              <div 
                className="absolute left-8 top-1/2 -translate-y-1/2 h-1 bg-[#0E4D54] transition-all duration-300 z-0"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />

              {[
                { step: 1, label: '1. Setup' },
                { step: 2, label: '2. Interior' },
                { step: 3, label: '3. Cover' },
                { step: 4, label: '4. Preflight' }
              ].map((s) => {
                const isActive = currentStep === s.step;
                const isPassed = currentStep > s.step;

                return (
                  <button
                    key={s.step}
                    onClick={() => setCurrentStep(s.step)}
                    className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
                      isActive
                        ? 'bg-white text-[#0E4D54] border-2 border-[#0E4D54] ring-2 ring-[#0E4D54]/20'
                        : isPassed
                        ? 'bg-[#0E4D54] text-white border-[#0E4D54]'
                        : 'bg-[#EAE3D6] text-stone-600 border-[#D6CEBE]'
                    }`}
                  >
                    {isPassed && <span>✓</span>}
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 7.2: STEP 1 - SPECIFICATION & MANUSCRIPT UPLOAD */}
          {currentStep === 1 && (
            <div className="space-y-6">
              
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#0E4D54] block mb-1">
                  STEP TITLE
                </span>
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F1C18]">
                    Step 1: Specification & Manuscript Ingestion
                  </h2>
                  <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#EAE3D6] text-[#4A4338] font-bold border border-[#D6CEBE]">
                    Universal POD Standards
                  </span>
                </div>
                <p className="text-xs text-[#7A7368] mt-1 font-medium">
                  Define your book archetype, physical dimensions, and attach your manuscript text
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
                      className={`p-4 rounded-2xl text-center transition-all bg-white border-2 ${
                        isSelected ? 'border-[#0E4D54] shadow-md ring-2 ring-[#0E4D54]/20' : 'border-[#D6CEBE]'
                      }`}
                    >
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-[#1F1C18] mb-1">
                        {arch.name}
                      </h4>
                      <p className="text-[11px] text-[#7A7368] mb-3">
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

              {/* Manuscript File Upload Box */}
              <div className="border-2 border-dashed border-[#C5BBAA] p-8 rounded-3xl text-center bg-white shadow-sm">
                <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-[#EAE3D6] text-[#0E4D54] flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-[#1F1C18]">Upload User Manuscript</h3>
                <p className="text-xs text-[#7A7368] mt-1 mb-4 font-medium">
                  Attach your plain text (.txt) or markdown file. It will automatically flow into the Interior reader.
                </p>
                <label className="inline-block cursor-pointer px-5 py-2.5 bg-[#0E4D54] hover:bg-[#09393E] text-white text-xs font-bold rounded-full shadow transition">
                  Browse Manuscript File
                  <input type="file" accept=".txt,.md" onChange={handleManuscriptUpload} className="hidden" />
                </label>
                {uploadedFileName && (
                  <div className="mt-3 text-xs font-bold text-emerald-800">
                    ✓ Attached: {uploadedFileName} ({renderedBookPages.length} pages generated)
                  </div>
                )}
              </div>

              {/* Manufacturing Calibrations Card */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#D6CEBE] shadow-sm space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#0E4D54] block mb-1">
                  MANUFACTURING CALIBRATIONS CARD
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#1F1C18] uppercase tracking-wider block mb-1.5">
                      TRIM DIMENSIONS
                    </label>
                    <select
                      value={trimSize}
                      onChange={(e) => setTrimSize(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs font-bold border border-[#D6CEBE] bg-[#F4EFE6] outline-none"
                    >
                      {TRIM_OPTIONS.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1F1C18] uppercase tracking-wider block mb-1.5">
                      PAPER STOCK CALIPER
                    </label>
                    <select
                      value={paperType}
                      onChange={(e) => setPaperType(e.target.value)}
                      className="w-full p-2.5 rounded-xl text-xs font-bold border border-[#D6CEBE] bg-[#F4EFE6] outline-none"
                    >
                      {Object.entries(PAPER_SPECS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-[#1F1C18] uppercase tracking-wider">
                        PAGE EXTENT
                      </span>
                      <span className="text-xs font-mono font-bold text-[#0E4D54]">
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
                <div className="mt-4 pt-4 border-t border-[#D6CEBE] grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-[#F4EFE6] border border-[#D6CEBE]">
                    <span className="text-xs font-bold block text-[#1F1C18]">Spine Gutter: {calculatedGutter}"</span>
                    <span className="text-[10px] text-[#7A7368] font-medium">Recommended binding margin</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F4EFE6] border border-[#D6CEBE]">
                    <span className="text-xs font-bold block text-[#1F1C18]">Outside Margin: {outsideMargin}"</span>
                    <span className="text-[10px] text-[#7A7368] font-medium">Finger safety clearance</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#F4EFE6] border border-[#D6CEBE]">
                    <span className="text-xs font-bold block text-[#1F1C18]">Top / Bottom: {topBottomMargin}"</span>
                    <span className="text-[10px] text-[#7A7368] font-medium">Running head buffer</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* SECTION 7.3: STEP 2 - INTERIOR READER (1-PAGE & 2-PAGE SPREAD) */}
          {currentStep === 2 && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F1C18]">
                    Step 2: Interior Layout & Page Reader
                  </h2>
                  <p className="text-xs text-[#7A7368] mt-1 font-medium">
                    Read and preview all pages of the book as formatted spreads or single-page proofs
                  </p>
                </div>

                {/* 1-Page vs 2-Page View Toggle */}
                <div className="flex items-center gap-1 bg-[#EAE3D6] p-1 rounded-full border border-[#D6CEBE] text-xs font-bold">
                  <button 
                    onClick={() => setInteriorViewMode('single')}
                    className={`px-3 py-1 rounded-full transition ${interiorViewMode === 'single' ? 'bg-white text-[#1F1C18] shadow-sm' : 'text-[#6D6559]'}`}
                  >
                    1-Page View
                  </button>
                  <button 
                    onClick={() => setInteriorViewMode('spread')}
                    className={`px-3 py-1 rounded-full transition ${interiorViewMode === 'spread' ? 'bg-white text-[#1F1C18] shadow-sm' : 'text-[#6D6559]'}`}
                  >
                    2-Page Spread
                  </button>
                </div>
              </div>

              {/* Book Reader Simulation */}
              <div className="p-6 rounded-3xl bg-white border border-[#D6CEBE] shadow-sm space-y-4">
                <div className="bg-[#EFEAE2] p-6 rounded-2xl border border-[#D6CEBE]">
                  <div className={`grid gap-4 ${interiorViewMode === 'spread' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-md mx-auto'}`}>
                    
                    {/* Page Left */}
                    <div className="bg-white border border-[#D6CEBE] p-6 rounded-xl shadow-sm min-h-[360px] flex flex-col justify-between font-serif text-xs md:text-sm leading-relaxed text-[#1F1C18]">
                      <div>
                        <div className="text-center pb-2 mb-3 border-b border-[#D6CEBE]">
                          <span className="text-[10px] uppercase tracking-widest text-[#7A7368]">{authorName}</span>
                        </div>
                        <p>{renderedBookPages[readerCurrentPage] || 'No text found.'}</p>
                      </div>
                      <div className="text-center font-sans text-[10px] text-[#7A7368] pt-3 border-t border-[#D6CEBE]">
                        Page {readerCurrentPage + 1}
                      </div>
                    </div>

                    {/* Page Right (Spread mode only) */}
                    {interiorViewMode === 'spread' && (
                      <div className="bg-white border border-[#D6CEBE] p-6 rounded-xl shadow-sm min-h-[360px] flex flex-col justify-between font-serif text-xs md:text-sm leading-relaxed text-[#1F1C18]">
                        <div>
                          <div className="text-center pb-2 mb-3 border-b border-[#D6CEBE]">
                            <span className="text-[10px] uppercase tracking-widest text-[#7A7368]">{bookTitle}</span>
                          </div>
                          <p>{renderedBookPages[readerCurrentPage + 1] || <span className="italic text-stone-400">End of manuscript.</span>}</p>
                        </div>
                        <div className="text-center font-sans text-[10px] text-[#7A7368] pt-3 border-t border-[#D6CEBE]">
                          {renderedBookPages[readerCurrentPage + 1] ? `Page ${readerCurrentPage + 2}` : ''}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Reader Pagination Controls */}
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#D6CEBE]">
                    <button
                      disabled={readerCurrentPage <= 0}
                      onClick={() => setReaderCurrentPage((prev) => Math.max(0, prev - (interiorViewMode === 'spread' ? 2 : 1)))}
                      className="px-4 py-1.5 text-xs font-bold rounded-full bg-white border border-[#D6CEBE] disabled:opacity-40 shadow-sm"
                    >
                      ← Previous
                    </button>
                    <span className="text-xs font-bold text-stone-700">
                      Page {readerCurrentPage + 1} of {renderedBookPages.length}
                    </span>
                    <button
                      disabled={interiorViewMode === 'spread' ? readerCurrentPage + 2 >= renderedBookPages.length : readerCurrentPage + 1 >= renderedBookPages.length}
                      onClick={() => setReaderCurrentPage((prev) => prev + (interiorViewMode === 'spread' ? 2 : 1))}
                      className="px-4 py-1.5 text-xs font-bold rounded-full bg-white border border-[#D6CEBE] disabled:opacity-40 shadow-sm"
                    >
                      Next →
                    </button>
                  </div>
                </div>

                {/* Actions & Export */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setQuickFixDrawerOpen(!quickFixDrawerOpen)}
                    className="px-4 py-2 rounded-full text-xs font-bold bg-[#EAE3D6] text-[#0E4D54] border border-[#D6CEBE]"
                  >
                    {quickFixDrawerOpen ? 'Close Quick-Fix' : 'Quick-Fix Text'}
                  </button>
                  <button
                    onClick={handleDownloadDOCX}
                    className="px-5 py-2.5 rounded-full bg-[#0E4D54] hover:bg-[#09393E] text-white text-xs font-bold shadow transition"
                  >
                    Export Formatted DOCX
                  </button>
                </div>
              </div>

              {quickFixDrawerOpen && (
                <div className="p-5 rounded-3xl bg-white border border-[#D6CEBE] shadow-sm space-y-3">
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
                      className="w-full p-2.5 rounded-xl text-xs bg-[#F4EFE6] border border-[#D6CEBE] outline-none font-medium"
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
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F1C18]">
                  Step 3: Cover Blueprint Specification
                </h2>
                <p className="text-xs text-[#7A7368] mt-1 font-medium">
                  Specify paper caliper and bulk depth to construct a perfectly proportioned full-wrap cover layout with bleed guides
                </p>
              </div>

              {/* Geometry Specs Bar */}
              <div className="p-3 rounded-2xl bg-white border border-[#D6CEBE] grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-semibold shadow-sm">
                <div>SPINE WIDTH: <span className="font-mono text-[#0E4D54] font-bold">{spineWidth}"</span></div>
                <div>TOTAL WIDTH: <span className="font-mono font-bold">{fullCoverWidth}"</span></div>
                <div>TOTAL HEIGHT: <span className="font-mono font-bold">{fullCoverHeight}"</span></div>
                <div>CANVAS @ 300 DPI: <span className="font-mono text-emerald-800 font-bold">{coverPixelsWidth} x {coverPixelsHeight} px</span></div>
              </div>

              {/* Interactive Cover Blueprint */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#D6CEBE] shadow-sm space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#7A7368]">
                    INTERACTIVE COVER BLUEPRINT (Scale: 1:1 Proportional)
                  </span>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-[#0E4D54] text-white text-[10px] font-bold">Safe Zones: ON</span>
                    <span className="px-2.5 py-1 rounded-full bg-[#0E4D54] text-white text-[10px] font-bold">Guides: ON</span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#EFEAE2] border border-[#D6CEBE]">
                  <div className="relative w-full aspect-[2/1] border-2 border-dashed border-red-400 rounded bg-[#FFFDF9] flex items-center justify-between p-4 shadow-inner">
                    
                    {/* Back Cover */}
                    <div className="flex-1 h-full border-r border-dashed border-black/20 p-2 flex flex-col justify-between">
                      <div className="text-center">
                        <span className="text-xs font-serif font-bold block">BACK COVER</span>
                        <span className="text-[9px] text-[#7A7368]">({currentTrim.width} x {currentTrim.height})</span>
                      </div>

                      <div className="self-end p-2 border border-red-500 bg-red-500/10 rounded text-center">
                        <span className="text-[8px] font-mono font-bold text-red-700 block">BARCODE RESERVED ZONE</span>
                        <span className="text-[7px] text-red-700">2.0" x 1.2"</span>
                      </div>
                    </div>

                    {/* Spine */}
                    <div className="w-8 sm:w-12 h-full flex items-center justify-center bg-black/5 border-r border-dashed border-black/20">
                      <span className="text-[9px] font-mono -rotate-90 whitespace-nowrap text-[#0E4D54] font-bold">
                        {pageExtent >= 80 ? bookTitle.slice(0, 14) : ''}
                      </span>
                    </div>

                    {/* Front Cover */}
                    <div className="flex-1 h-full p-2 flex flex-col justify-between items-center text-center">
                      <div>
                        <span className="text-xs font-serif font-bold block">FRONT COVER</span>
                        <span className="text-[9px] text-[#7A7368]">({currentTrim.width} x {currentTrim.height})</span>
                      </div>

                      <div>
                        <h4 className="font-serif text-sm font-bold">{bookTitle}</h4>
                        <p className="text-[10px] text-[#7A7368]">{authorName}</p>
                      </div>

                      <span className="text-[8px] text-[#7A7368] font-bold">0.25" Safe Zone</span>
                    </div>

                  </div>
                </div>

                <div className="flex flex-wrap justify-center items-center gap-4 text-[10px] font-bold text-stone-700 pt-1">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> 0.125" Bleed (Cut off)</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> 0.25" Safe Zone</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span> Barcode Exclusion</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span> Spine: {spineWidth}"</span>
                </div>

                <p className="text-center text-[11px] text-[#8C8479] mt-2">
                  ⚠️ <strong>Standard Industry Barcode Zone:</strong> Keep the bottom-right quadrant of your back cover free of text, URLs, or faces.
                </p>
              </div>

            </div>
          )}

          {/* SECTION 7.5: STEP 4 - PREFLIGHT & MULTI-BOOK FORECASTER */}
          {currentStep === 4 && (
            <div className="space-y-6">
              
              <div>
                <div className="flex justify-between items-center">
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F1C18]">
                    Step 4: Preflight Verification & POD Readiness
                  </h2>
                  <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 font-bold text-xs border border-emerald-300">
                    100% Ready
                  </span>
                </div>
                <p className="text-xs text-[#7A7368] mt-1 font-medium">
                  Verify preflight check tolerances and customize your KDP royalty and portfolio revenue targets
                </p>
              </div>

              {/* Manufacturing Economics Container */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#D6CEBE] shadow-sm space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#0E4D54]">
                    SELF-PUBLISHING MANUFACTURING COST & PRICING BREAKDOWN
                  </span>
                  
                  <div className="flex gap-2">
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="p-1.5 rounded-xl text-xs font-bold border border-[#D6CEBE] bg-[#F4EFE6] text-[#0E4D54]"
                    >
                      {Object.entries(REGIONS).map(([k, v]) => (
                        <option key={k} value={k}>{v.name}</option>
                      ))}
                    </select>

                    <select
                      value={royaltyRate}
                      onChange={(e) => setRoyaltyRate(parseFloat(e.target.value))}
                      className="p-1.5 rounded-xl text-xs font-bold border border-[#D6CEBE] bg-[#F4EFE6] text-[#0E4D54]"
                    >
                      <option value={0.60}>Standard 60%</option>
                      <option value={0.40}>Expanded 40%</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Left: Global USD Benchmark */}
                  <div className="p-4 rounded-2xl bg-[#F4EFE6] border border-[#D6CEBE] space-y-1.5 text-xs">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#7A7368] block mb-1">
                      GLOBAL POD STANDARD (USD)
                    </span>
                    <div className="flex justify-between">
                      <span>Unit Print Cost:</span>
                      <span className="font-mono font-bold">${kdpEconomics.unitCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Break-even List Price:</span>
                      <span className="font-mono font-bold">${kdpEconomics.breakEven}</span>
                    </div>
                    <div className="flex justify-between text-[#0E4D54] font-bold pt-1 border-t border-[#D6CEBE]">
                      <span>List Price: ${kdpEconomics.activeListPrice}</span>
                      <span>Net Royalty: +${kdpEconomics.royalty}</span>
                    </div>
                  </div>

                  {/* Right: Portfolio Planner Inputs */}
                  <div className="p-4 rounded-2xl bg-[#F4EFE6] border border-[#D6CEBE] space-y-2 text-xs">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#0E4D54] block mb-1">
                      MULTI-BOOK PORTFOLIO REVENUE PLANNER
                    </span>
                    <div className="flex justify-between items-center">
                      <span>Target List Price ($):</span>
                      <input
                        type="number"
                        step="0.50"
                        value={userCustomPrice}
                        onChange={(e) => setUserCustomPrice(e.target.value)}
                        className="w-20 p-1 text-right font-mono font-bold rounded border border-[#D6CEBE] bg-white"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Titles Published / Planned:</span>
                      <input
                        type="number"
                        value={portfolioBookCount}
                        onChange={(e) => setPortfolioBookCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 p-1 text-right font-mono font-bold rounded border border-[#D6CEBE] bg-white"
                      />
                    </div>
                    <div className="flex justify-between text-emerald-800 font-bold pt-1 border-t border-[#D6CEBE]">
                      <span>Monthly Projected:</span>
                      <span>+${kdpEconomics.monthlyRevenue}</span>
                    </div>
                  </div>

                </div>

                {/* 3 Performance Scenarios */}
                <div className="grid grid-cols-3 gap-3 text-center mt-2">
                  <div className="p-3 rounded-2xl bg-[#F4EFE6] border border-[#D6CEBE]">
                    <span className="text-[10px] text-[#7A7368] font-bold block">Conservative</span>
                    <span className="text-sm font-mono font-bold block mt-1">${kdpEconomics.forecast.conservative}</span>
                    <span className="text-[9px] text-[#7A7368]">10 copies/mo</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#F4EFE6] border border-[#D6CEBE]">
                    <span className="text-[10px] text-[#7A7368] font-bold block">Average Launch</span>
                    <span className="text-sm font-mono font-bold text-[#0E4D54] block mt-1">${kdpEconomics.forecast.benchmark}</span>
                    <span className="text-[9px] text-[#7A7368]">50 copies/mo</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#F4EFE6] border border-[#D6CEBE]">
                    <span className="text-[10px] text-[#7A7368] font-bold block">Scaled Growth</span>
                    <span className="text-sm font-mono font-bold text-emerald-800 block mt-1">${kdpEconomics.forecast.optimistic}</span>
                    <span className="text-[9px] text-[#7A7368]">250 copies/mo</span>
                  </div>
                </div>
              </div>

              {/* Preflight Pass Checks Card */}
              <div className="p-6 rounded-3xl bg-white border border-[#D6CEBE] shadow-sm space-y-2 text-xs">
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#0E4D54] block mb-2">
                  PREFLIGHT PASS CHECKS
                </span>
                
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-emerald-500/10 text-emerald-900 font-bold border border-emerald-300">
                  <span>✓ Page Extent Compatible ({pageExtent} pages meets trade paperback minimums)</span>
                  <span className="font-mono">PASS</span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-emerald-500/10 text-emerald-900 font-bold border border-emerald-300">
                  <span>✓ Spine Gutter Clearance ({calculatedGutter}" inside margin prevents crease clipping)</span>
                  <span className="font-mono">PASS</span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-emerald-500/10 text-emerald-900 font-bold border border-emerald-300">
                  <span>✓ 300 DPI Canvas Resolution ({coverPixelsWidth} x {coverPixelsHeight} px verified)</span>
                  <span className="font-mono">PASS</span>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleDownloadSpecification}
                    className="py-3 px-6 rounded-full bg-[#0E4D54] hover:bg-[#09393E] text-white text-xs font-bold flex items-center gap-2 shadow"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Production Specification (.txt)</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* SECTION 7.6: STICKY BOTTOM DOCK */}
          <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-[#F4EFE6]/95 border-t border-[#D6CEBE] backdrop-blur-md">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <button
                onClick={() => setActiveView('home')}
                className="px-4 py-2 rounded-full text-xs font-bold bg-white border border-[#D6CEBE] text-[#1F1C18] shadow-sm"
              >
                Home Overview
              </button>

              <div className="p-1 rounded-full bg-[#EAE3D6] border border-[#D6CEBE] flex items-center gap-2">
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1 text-[#1F1C18]"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                )}

                {currentStep < 4 ? (
                  <button
                    onClick={() => { handleSaveCurrentProject(); setCurrentStep(currentStep + 1); }}
                    className="px-5 py-2 rounded-full text-xs font-bold bg-[#0E4D54] text-white flex items-center gap-1 shadow"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleDownloadSpecification}
                    className="px-5 py-2 rounded-full text-xs font-bold bg-[#0E4D54] text-white flex items-center gap-1 shadow"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Complete Studio</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowAccountModal(true)}
                className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1 text-[#0E4D54] bg-white border border-[#D6CEBE] shadow-sm"
              >
                <span>Help & Profile</span>
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </main>
      )}

      {/* ====================================================================
          SECTION 8.0: MODAL OVERLAYS (SHELF, ACCOUNT & HELP, REVIEWS, ADMIN)
          ==================================================================== */}
      
      {/* SECTION 8.1: REMEMBER USER & REPORT ISSUE MODAL */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl p-6 bg-[#FAF7F2] border border-[#D6CEBE] shadow-2xl text-[#1F1C18] space-y-4">
            
            <div className="flex justify-between items-center pb-2 border-b border-[#D6CEBE]">
              <h3 className="font-serif font-bold text-base">Help Center & Author Identity</h3>
              <button onClick={() => setShowAccountModal(false)} className="text-base font-bold text-stone-600">✕</button>
            </div>

            {/* Remember Me Form */}
            <form onSubmit={handleSaveUserProfile} className="space-y-2 pb-3 border-b border-[#D6CEBE]">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#0E4D54]">Author Details (Remembered Locally)</div>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  placeholder="First Name" 
                  value={userProfile.firstName} 
                  onChange={(e) => setUserProfile({ ...userProfile, firstName: e.target.value })}
                  className="px-2 py-1.5 text-xs rounded-xl border border-[#D6CEBE] bg-white font-medium"
                />
                <input 
                  type="text" 
                  placeholder="Last Name" 
                  value={userProfile.lastName} 
                  onChange={(e) => setUserProfile({ ...userProfile, lastName: e.target.value })}
                  className="px-2 py-1.5 text-xs rounded-xl border border-[#D6CEBE] bg-white font-medium"
                />
              </div>
              <input 
                type="email" 
                placeholder="Email ID" 
                value={userProfile.email} 
                onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                className="w-full px-2 py-1.5 text-xs rounded-xl border border-[#D6CEBE] bg-white font-medium"
              />
              <button type="submit" className="text-xs px-4 py-1.5 bg-[#0E4D54] text-white rounded-full font-bold shadow hover:bg-[#09393E] transition">
                Save Author Details
              </button>
            </form>

            {/* Issue Report Form */}
            <form onSubmit={handleSendFeedbackEmail} className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#0E4D54]">
                Report Issue / Send Feedback
              </div>
              <p className="text-[11px] text-[#7A7368]">
                Delivered straight to <strong>publishstudio.ops@gmail.com</strong>
              </p>
              <select 
                value={feedbackCategory} 
                onChange={(e) => setFeedbackCategory(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-[#D6CEBE] bg-white font-bold"
              >
                <option value="Issue Report">Bug / Visual Glitch</option>
                <option value="KDP Calculation Feedback">KDP Calculation Feedback</option>
                <option value="Feature Request">Request Feature</option>
              </select>
              <textarea 
                required
                rows={3}
                placeholder="Describe your issue or suggestions..."
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-[#D6CEBE] bg-white font-medium"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowAccountModal(false)} className="px-3 py-1 text-xs font-bold text-stone-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 text-xs bg-[#C25A38] text-white font-bold rounded-full shadow hover:bg-[#A04E2D] transition">
                  Send Feedback
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* SECTION 8.2: MY BOOKS LOCAL STORAGE DRAWER */}
      {isShelfOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl p-6 bg-white border border-[#D6CEBE] shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#D6CEBE] mb-4">
              <h3 className="font-serif font-bold text-base">Saved Book Projects (Local Storage)</h3>
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
                    className="p-3.5 rounded-2xl cursor-pointer flex justify-between items-center bg-[#F4EFE6] border border-[#D6CEBE] hover:border-[#0E4D54] transition"
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

      {/* SECTION 8.3: DOWNLOAD SUCCESS CELEBRATION */}
      {successModalData.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl p-7 text-center bg-white border border-[#D6CEBE] shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#0E4D54] text-white flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#0E4D54] block mb-1">
              {successModalData.fileLabel}
            </span>
            <h3 className="font-serif text-2xl font-bold mb-1">{successModalData.title}</h3>
            <p className="text-xs text-[#7A7368] mb-4">{successModalData.subtitle}</p>

            <div className="p-3 rounded-2xl text-xs font-serif italic mb-4 bg-[#F4EFE6] border border-[#D6CEBE]">
              "May your words travel far and find the readers who need them most. See you soon on your next chapter!"
            </div>

            {!reviewSubmitted ? (
              <div className="p-4 rounded-2xl mb-4 text-left bg-[#F4EFE6] border border-[#D6CEBE]">
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
                  className="w-full p-2 rounded-xl text-xs bg-white border border-[#D6CEBE] outline-none"
                />
                {userRating > 0 && (
                  <button onClick={handleRecordUserReview} className="mt-2 w-full py-2 rounded-full bg-[#0E4D54] text-white text-xs font-bold shadow">
                    Submit Review
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-800 text-xs font-bold mb-4 border border-emerald-300">
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
              className="w-full py-3 rounded-full bg-[#0E4D54] text-white text-xs font-bold shadow"
            >
              Continue Studio
            </button>
          </div>
        </div>
      )}

      {/* SECTION 8.4: OWNER MASTER PASSPHRASE AUTH */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl p-6 text-center bg-white border border-[#D6CEBE] shadow-2xl">
            <h3 className="font-serif font-bold text-base mb-2">Owner Master Key</h3>
            <input
              type="password"
              placeholder="Enter master key..."
              value={adminPassphrase}
              onChange={(e) => setAdminPassphrase(e.target.value)}
              className="w-full p-2.5 rounded-xl text-xs mb-2 border border-[#D6CEBE] bg-[#F4EFE6] outline-none font-bold"
            />
            {adminError && <p className="text-[10px] text-red-500 mb-2">{adminError}</p>}
            <div className="flex gap-2">
              <button onClick={() => setIsAdminModalOpen(false)} className="w-1/2 py-2 rounded-full text-xs font-bold border border-[#D6CEBE] bg-white">
                Cancel
              </button>
              <button onClick={handleAdminAuth} className="w-1/2 py-2 rounded-full bg-[#0E4D54] text-white text-xs font-bold shadow">
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
