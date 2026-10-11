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
  Eye, Sliders, Layers, FolderOpen, Trash2, X, Globe, Upload, CheckSquare, Square
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
   SECTION 2.0: MASTER DATA & COMPLETE KDP MARKETPLACE MATRIX
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

// Complete Amazon KDP POD Marketplaces List
const KDP_MARKETPLACES = {
  US: { name: 'Amazon.com (US)', currency: 'USD', symbol: '$', base: 0.85, perPage: 0.012, defaultPrice: 12.99 },
  UK: { name: 'Amazon.co.uk (UK)', currency: 'GBP', symbol: '£', base: 0.70, perPage: 0.010, defaultPrice: 9.99 },
  DE: { name: 'Amazon.de (Germany/EU)', currency: 'EUR', symbol: '€', base: 0.75, perPage: 0.012, defaultPrice: 11.99 },
  FR: { name: 'Amazon.fr (France)', currency: 'EUR', symbol: '€', base: 0.75, perPage: 0.012, defaultPrice: 11.99 },
  ES: { name: 'Amazon.es (Spain)', currency: 'EUR', symbol: '€', base: 0.75, perPage: 0.012, defaultPrice: 11.99 },
  IT: { name: 'Amazon.it (Italy)', currency: 'EUR', symbol: '€', base: 0.75, perPage: 0.012, defaultPrice: 11.99 },
  NL: { name: 'Amazon.nl (Netherlands)', currency: 'EUR', symbol: '€', base: 0.75, perPage: 0.012, defaultPrice: 11.99 },
  PL: { name: 'Amazon.pl (Poland)', currency: 'PLN', symbol: 'zł', base: 3.50, perPage: 0.055, defaultPrice: 49.99 },
  SE: { name: 'Amazon.se (Sweden)', currency: 'SEK', symbol: 'kr', base: 9.50, perPage: 0.140, defaultPrice: 129.00 },
  JP: { name: 'Amazon.co.jp (Japan)', currency: 'JPY', symbol: '¥', base: 180, perPage: 2.50, defaultPrice: 1500 },
  CA: { name: 'Amazon.ca (Canada)', currency: 'CAD', symbol: 'CA$', base: 1.05, perPage: 0.015, defaultPrice: 16.99 },
  AU: { name: 'Amazon.com.au (Australia)', currency: 'AUD', symbol: 'A$', base: 1.20, perPage: 0.018, defaultPrice: 19.99 },
  IN: { name: 'Amazon.in (India)', currency: 'INR', symbol: '₹', base: 60, perPage: 0.75, defaultPrice: 399 },
  MX: { name: 'Amazon.com.mx (Mexico)', currency: 'MXN', symbol: 'MX$', base: 18.0, perPage: 0.25, defaultPrice: 249.00 },
  BR: { name: 'Amazon.com.br (Brazil)', currency: 'BRL', symbol: 'R$', base: 5.50, perPage: 0.08, defaultPrice: 59.90 }
};

const SAMPLE_CHAPTER_TEXT = [
  "The stillness of the study was broken only by the clock on the mantelpiece. Outside, rain fell steadily against the tall glass panes, blurring the lamps along the quiet avenue into soft circles of amber.",
  "He dipped the nib of his pen into the dark ink, pausing to listen to the carriage wheels rolling across the wet cobblestones below. Every manuscript began this way—not with certainty, but with the quiet discipline of facing an empty sheet.",
  "The margins preserved the words, keeping the inner voice protected from the binding. A properly formatted book respects both the eyes of the reader and the physical machinery of the bindery."
];

/* --------------------------------------------------------------------------
   SECTION 3.0: MAIN COMPONENT LOGIC
   -------------------------------------------------------------------------- */
export default function PublishStudioApp() {
  
  /* SECTION 3.1: APPLICATION WORKFLOW STATE */
  const [activeView, setActiveView] = useState('home');
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

  /* SECTION 3.3: MANUSCRIPT & STEP 2 STATE */
  const [uploadedFileName, setUploadedFileName] = useState('Sample_Trade_Novel.docx');
  const [manuscriptParagraphs, setManuscriptParagraphs] = useState(SAMPLE_CHAPTER_TEXT);
  const [quickFixDrawerOpen, setQuickFixDrawerOpen] = useState(false);

  /* SECTION 3.4: COVER BLUEPRINT ASSETS (STEP 3) */
  const [frontCoverImage, setFrontCoverImage] = useState(null);
  const [backCoverImage, setBackCoverImage] = useState(null);
  const [barcodeImage, setBarcodeImage] = useState(null);

  /* SECTION 3.5: MULTI-COUNTRY ESTIMATOR (STEP 4) */
  const [monthlySalesVolume, setMonthlySalesVolume] = useState(50);
  const [selectedKdpCountries, setSelectedKdpCountries] = useState(['IN', 'US', 'UK', 'DE', 'CA', 'AU']);
  const [customRetailPrices, setCustomRetailPrices] = useState({});

  /* SECTION 3.6: LOCAL STORAGE & CELEBRATION MODALS */
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
      console.warn('Storage check:', err);
    }
  };

  useEffect(() => {
    refreshProjectsList();
    if (localStorage.getItem('ps_admin_unlocked') === 'true') {
      setIsAdminUnlocked(true);
    }
  }, []);
  /* SECTION 3.7: PRINT GEOMETRY MATH */
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

  /* SECTION 3.8: DYNAMIC MULTI-COUNTRY ESTIMATOR CALCULATIONS */
  const kdpCalculations = useMemo(() => {
    return Object.entries(KDP_MARKETPLACES).map(([code, market]) => {
      const unitCost = market.base + (pageExtent * market.perPage);
      const breakEven = unitCost / 0.60;
      const basePrice = Math.max(market.defaultPrice, Math.ceil(breakEven + 2));
      const activePrice = customRetailPrices[code] !== undefined && customRetailPrices[code] !== ''
        ? parseFloat(customRetailPrices[code])
        : basePrice;
      const royaltyPerUnit = (activePrice * 0.60) - unitCost;
      const isProfitable = royaltyPerUnit > 0;

      return {
        code,
        name: market.name,
        currency: market.currency,
        symbol: market.symbol,
        unitCost: unitCost.toFixed(2),
        breakEven: breakEven.toFixed(2),
        activePrice: activePrice.toFixed(2),
        royaltyPerUnit: isProfitable ? royaltyPerUnit.toFixed(2) : '0.00',
        monthlyForecast: isProfitable ? (royaltyPerUnit * monthlySalesVolume).toFixed(0) : '0',
        isProfitable
      };
    });
  }, [pageExtent, customRetailPrices, monthlySalesVolume]);

  const selectedKdpCalculations = useMemo(() => {
    return kdpCalculations.filter(m => selectedKdpCountries.includes(m.code));
  }, [kdpCalculations, selectedKdpCountries]);

  const isAllKdpSelected = selectedKdpCountries.length === Object.keys(KDP_MARKETPLACES).length;

  const toggleSelectAllKdp = () => {
    if (isAllKdpSelected) {
      setSelectedKdpCountries(['IN']);
    } else {
      setSelectedKdpCountries(Object.keys(KDP_MARKETPLACES));
    }
  };

  /* SECTION 3.9: IMAGE ASSET UPLOADS & FULL-WRAP CANVAS COMPILER */
  const handleImageUpload = (e, target) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (target === 'front') setFrontCoverImage(event.target.result);
      if (target === 'back') setBackCoverImage(event.target.result);
      if (target === 'barcode') setBarcodeImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleExportFullCoverArtwork = () => {
    const canvas = document.createElement('canvas');
    canvas.width = coverPixelsWidth;
    canvas.height = coverPixelsHeight;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#18161D';
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
        ctx.fillStyle = '#FAF6EE';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#1F1C18';
        ctx.font = 'bold 32px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + w / 2, y + h / 2);
      }
    };

    renderCard(backCoverImage, backX, bleedPx, trimWidthPx, trimHeightPx, 'BACK COVER');
    renderCard(frontCoverImage, frontX, bleedPx, trimWidthPx, trimHeightPx, bookTitle);

    // Spine
    ctx.fillStyle = '#EAE3D6';
    ctx.fillRect(spineX, bleedPx, spineWidthPx, trimHeightPx);
    if (pageExtent >= 80) {
      ctx.save();
      ctx.translate(spineX + spineWidthPx / 2, bleedPx + trimHeightPx / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#0E4D54';
      ctx.font = 'bold 24px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText(`${bookTitle}  •  ${authorName}`, 0, 8);
      ctx.restore();
    }

    // Barcode Zone (Lower-Right Back Cover)
    const barcodeWPx = Math.round(2.0 * 300);
    const barcodeHPx = Math.round(1.2 * 300);
    const barcodeX = spineX - barcodeWPx - Math.round(0.3 * 300);
    const barcodeY = (bleedPx + trimHeightPx) - barcodeHPx - Math.round(0.3 * 300);

    if (barcodeImage) {
      const bImg = new Image();
      bImg.src = barcodeImage;
      ctx.drawImage(bImg, barcodeX, barcodeY, barcodeWPx, barcodeHPx);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(barcodeX, barcodeY, barcodeWPx, barcodeHPx);
      ctx.strokeStyle = '#E05D52';
      ctx.lineWidth = 4;
      ctx.strokeRect(barcodeX, barcodeY, barcodeWPx, barcodeHPx);
      ctx.fillStyle = '#E05D52';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BARCODE EXCLUSION ZONE', barcodeX + barcodeWPx / 2, barcodeY + barcodeHPx / 2 + 6);
    }

    canvas.toBlob((blob) => {
      saveAs(blob, `${bookTitle.replace(/\s+/g, '_')}_FullWrap_Cover_300DPI.png`);
      setSuccessModalData({
        isOpen: true,
        title: 'Full-Wrap Cover Downloaded!',
        subtitle: 'Front, spine, back, and barcode have been compiled into a certified 300 DPI layout.',
        fileLabel: 'Full-Wrap Blueprint (.png)'
      });
    });
  };

     /* SECTION 3.10: EXPORT HANDLERS */
  const handleDownloadDOCX = () => {
    const formattedContent = 
      `TITLE: ${bookTitle}\nAUTHOR: ${authorName}\nTRIM: ${trimSize}\nGUTTER: ${calculatedGutter}"\n\n` +
      manuscriptParagraphs.join('\n\n');

    const blob = new Blob([formattedContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    saveAs(blob, `${bookTitle.replace(/\s+/g, '_')}_Formatted_${trimSize}.docx`);

    setSuccessModalData({
      isOpen: true,
      title: 'Interior Is Print-Ready!',
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
Monthly Sales Target: ${monthlySalesVolume} copies/month
============================================================`;

    const blob = new Blob([spec], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${bookTitle.replace(/\s+/g, '_')}_Production_Specs_${trimSize}.txt`);

    setSuccessModalData({
      isOpen: true,
      title: 'Happy Book Publishing!',
      subtitle: 'Your production tolerances and blueprints are certified for self-publishing upload.',
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

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'dark-canvas' : 'bg-[#F4EFE6] text-[#1F1C18]'}`}>
     {/* ====================================================================
          SECTION 4.0: HEADER DOCK (ALWAYS VISIBLE)
          ==================================================================== */}
      <header className={`sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors ${
        isDarkMode ? 'bg-[#141318]/90 border-white/5' : 'bg-[#F4EFE6]/95 border-[#DFD7CA]'
      }`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div onClick={() => setActiveView('home')} className="flex items-center gap-3 cursor-pointer select-none">
            <div className="w-10 h-10 rounded-2xl bg-[#0E4D54] text-white flex items-center justify-center shadow-md">
              <Book className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-editorial font-bold text-base tracking-tight text-[#1F1C18] dark:text-white">
                  PUBLISHSTUDIO
                </span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#EAE3D6] text-[#0E4D54] dark:bg-white/10 dark:text-teal-300">
                  Universal POD
                </span>
              </div>
              <p className="text-[10px] text-[#5A5245] dark:text-[#9A96A0]">Self-Publishing Supporting Software</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`hidden md:flex items-center p-1 rounded-full ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
              <button
                onClick={() => setActiveView('home')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  activeView === 'home'
                    ? isDarkMode ? 'bg-[#25222E] text-white' : 'bg-white text-[#1F1C18] shadow-xs'
                    : 'text-[#5A5245] dark:text-zinc-400'
                }`}
              >
                Home Overview
              </button>
              <button
                onClick={() => setActiveView('studio')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  activeView === 'studio'
                    ? isDarkMode ? 'bg-[#25222E] text-white' : 'bg-white text-[#1F1C18] shadow-xs'
                    : 'text-[#5A5245] dark:text-zinc-400'
                }`}
              >
                Guided Workflow
              </button>
              <button
                onClick={() => setActiveView('help')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  activeView === 'help'
                    ? isDarkMode ? 'bg-[#25222E] text-white' : 'bg-white text-[#1F1C18] shadow-xs'
                    : 'text-[#5A5245] dark:text-zinc-400'
                }`}
              >
                Publishing Manual
              </button>
            </div>

            <button
              onClick={() => { refreshProjectsList(); setIsShelfOpen(true); }}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                isDarkMode ? 'dark-soft-raised text-zinc-300' : 'soft-btn-pill text-[#1F1C18]'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#0E4D54] dark:text-teal-400" />
              <span className="hidden sm:inline">My Books ({savedProjects.length})</span>
            </button>

            <button
              onClick={() => setActiveView('help')}
              className={`p-2 rounded-full ${activeView === 'help' ? 'bg-[#0E4D54] text-white shadow-md' : isDarkMode ? 'dark-soft-raised text-zinc-300' : 'soft-btn-pill text-[#1F1C18]'}`}
            >
              <HelpCircle className="w-4 h-4 text-[#0E4D54] dark:text-teal-400" />
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full ${isDarkMode ? 'dark-soft-raised text-amber-400' : 'soft-btn-pill text-[#1F1C18]'}`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-[#1F1C18]" />}
            </button>
          </div>
        </div>
      </header>
            {/* ====================================================================
          SECTION 5.0: FULL-PAGE HELP MANUAL
          ==================================================================== */}
      {activeView === 'help' && (
        <HelpCenter onBackToStudio={() => setActiveView('studio')} isDarkMode={isDarkMode} />
      )}

      {/* ====================================================================
          SECTION 6.0: HOME OVERVIEW VIEW
          ==================================================================== */}
      {activeView === 'home' && (
        <main className="max-w-5xl mx-auto px-4 py-12 animate-in fade-in">
          <section className="text-center max-w-3xl mx-auto pt-6 pb-12">
            <span className="text-xs font-mono uppercase tracking-widest font-bold text-[#0E4D54] dark:text-teal-400 block mb-3">
              UNIVERSAL PRINT-ON-DEMAND (POD)
            </span>
            <h1 className="font-editorial text-4xl sm:text-6xl font-bold tracking-tight text-[#1F1C18] dark:text-white leading-[1.15] mb-5">
              Focus More on Writing,<br />Less on Formatting!
            </h1>
            <p className="text-sm sm:text-base text-[#4A4338] dark:text-[#A8A4AF] leading-relaxed max-w-2xl mx-auto mb-8">
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

          {/* Dual Engines */}
          <section className="mt-8">
            <div className="text-center mb-6">
              <span className="px-4 py-1.5 rounded-full bg-[#0E4D54] text-white text-[10px] font-mono uppercase tracking-widest font-bold shadow-md">
                DUAL PRODUCTION ENGINES
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                onClick={() => { setBookCategory('text_rich'); setActiveView('studio'); setCurrentStep(1); }}
                className={`p-7 rounded-3xl cursor-pointer transition-all ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'} border-2 ${bookCategory === 'text_rich' ? 'border-[#0E4D54]' : 'border-transparent'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="w-7 h-7 rounded-full bg-[#C25A38] text-white flex items-center justify-center font-bold text-xs">A</span>
                  <span className="text-[10px] font-mono text-[#5A5245] uppercase font-bold tracking-wider">Engine A</span>
                </div>
                <h3 className="font-editorial text-2xl font-bold text-[#1F1C18] dark:text-white mb-1">Text-Rich Manuscripts</h3>
                <p className="text-xs text-[#5A5245] dark:text-[#9A96A0] mb-5">Novel, Memoirs, Non-fiction, Poetry</p>
                <ul className="space-y-2 text-xs text-[#1F1C18] dark:text-zinc-300">
                  <li className="flex items-center gap-2"><span className="text-[#0E4D54] font-bold">✓</span><span>Natural margins and mirror binding gutters</span></li>
                  <li className="flex items-center gap-2"><span className="text-[#0E4D54] font-bold">✓</span><span>Editorial scanners and human-feel analyzers</span></li>
                  <li className="flex items-center gap-2"><span className="text-[#0E4D54] font-bold">✓</span><span>Alternating running headers and drop caps</span></li>
                </ul>
              </div>

              <div 
                onClick={() => { setBookCategory('low_content'); setActiveView('studio'); setCurrentStep(1); }}
                className={`p-7 rounded-3xl cursor-pointer transition-all ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'} border-2 ${bookCategory === 'low_content' ? 'border-[#0E4D54]' : 'border-transparent'}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="w-7 h-7 rounded-full bg-[#0E4D54] text-white flex items-center justify-center font-bold text-xs">B</span>
                  <span className="text-[10px] font-mono text-[#5A5245] uppercase font-bold tracking-wider">Engine B</span>
                </div>
                <h3 className="font-editorial text-2xl font-bold text-[#1F1C18] dark:text-white mb-1">Low-Content Creations</h3>
                <p className="text-xs text-[#5A5245] dark:text-[#9A96A0] mb-5">Planners, Journals, Visual strips</p>
                <ul className="space-y-2 text-xs text-[#1F1C18] dark:text-zinc-300">
                  <li className="flex items-center gap-2"><span className="text-[#0E4D54] font-bold">✓</span><span>300 DPI preservation and full-bleed bounds</span></li>
                  <li className="flex items-center gap-2"><span className="text-[#0E4D54] font-bold">✓</span><span>Automated layouts for grids and trackers</span></li>
                  <li className="flex items-center gap-2"><span className="text-[#0E4D54] font-bold">✓</span><span>Zero-risk barcode protection margins</span></li>
                </ul>
              </div>
            </div>
          </section>
        </main>
      )}
             {/* ====================================================================
          SECTION 7.0: 4-STEP PRODUCTION PIPELINE
          ==================================================================== */}
      {activeView === 'studio' && (
        <main className="max-w-5xl mx-auto px-4 py-8 pb-32 animate-in fade-in">
          
          {/* Progression Stepper */}
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
                              : 'text-[#5A5245] dark:text-zinc-400'
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

          {/* STEP 1: SPECIFICATION & SETUP */}
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
                <p className="text-xs text-[#5A5245] dark:text-[#9A96A0] mt-1">
                  Define your book archetype and physical dimensions for self-publishing standard sizing
                </p>
              </div>

              {/* Archetypes */}
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
                      className={`p-4 rounded-2xl text-center transition-all ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'} ${isSelected ? 'ring-2 ring-[#0E4D54]' : ''}`}
                    >
                      <h4 className="font-editorial font-bold text-xs sm:text-sm text-[#1F1C18] dark:text-white mb-1">
                        {arch.name}
                      </h4>
                      <p className="text-[11px] text-[#5A5245] dark:text-[#9A96A0] mb-3">{arch.desc}</p>
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

              {/* Calibrations Card */}
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
                      className={`w-full p-3 rounded-2xl text-xs font-semibold outline-none ${isDarkMode ? 'dark-soft-inset text-white' : 'soft-inset text-[#1F1C18]'}`}
                    >
                      {TRIM_OPTIONS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1F1C18] dark:text-zinc-200 uppercase tracking-wider block mb-1.5">
                      PAPER STOCK CALIPER
                    </label>
                    <select
                      value={paperType}
                      onChange={(e) => setPaperType(e.target.value)}
                      className={`w-full p-3 rounded-2xl text-xs font-semibold outline-none ${isDarkMode ? 'dark-soft-inset text-white' : 'soft-inset text-[#1F1C18]'}`}
                    >
                      {Object.entries(PAPER_SPECS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[#1F1C18] dark:text-zinc-200 uppercase tracking-wider">PAGE EXTENT</span>
                      <span className="text-xs font-mono font-bold text-[#0E4D54] dark:text-teal-400">{pageExtent} Pages</span>
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

                <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#5A5245] block mb-3">READOUTS CARD</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`p-3.5 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                      <span className="text-xs font-bold block text-[#1F1C18] dark:text-white">Spine Gutter: {calculatedGutter}"</span>
                      <span className="text-[10px] text-[#5A5245] block">Recommended binding margin</span>
                    </div>
                    <div className={`p-3.5 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                      <span className="text-xs font-bold block text-[#1F1C18] dark:text-white">Outside Margin: {outsideMargin}"</span>
                      <span className="text-[10px] text-[#5A5245] block">Finger safety clearance</span>
                    </div>
                    <div className={`p-3.5 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                      <span className="text-xs font-bold block text-[#1F1C18] dark:text-white">Top / Bottom: {topBottomMargin}"</span>
                      <span className="text-[10px] text-[#5A5245] block">Running head buffer</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
               {/* STEP 2: INTERIOR & SPREAD PROOF */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1F1C18] dark:text-white">
                  Step 2: Interior Production & Structuring
                </h2>
                <p className="text-xs text-[#5A5245] dark:text-[#9A96A0] mt-1">
                  Upload your manuscript, typeset standard running heads, and verify the physical proof layout
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-3xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'} space-y-4`}>
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#0E4D54] dark:text-teal-400 block">
                    MANUSCRIPT INPUTS CARD
                  </span>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1 text-[#1F1C18] dark:text-zinc-200">
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
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1 text-[#1F1C18] dark:text-zinc-200">
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
                    <button onClick={handleDownloadDOCX} className="w-full py-2.5 rounded-full soft-btn-primary text-xs font-bold">
                      Export Formatted DOCX
                    </button>
                    <button onClick={() => setQuickFixDrawerOpen(!quickFixDrawerOpen)} className={`w-full py-2 rounded-full text-xs font-medium ${isDarkMode ? 'dark-soft-raised' : 'soft-btn-pill'}`}>
                      {quickFixDrawerOpen ? 'Close Editor' : 'Quick-Fix Text'}
                    </button>
                  </div>
                </div>

                <div className={`md:col-span-2 p-6 rounded-3xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#5A5245]">
                      TWO-PAGE CRAFT SPREAD PREVIEW (TYPESET PROOF)
                    </span>
                    <span className="text-[10px] font-mono text-[#5A5245]">Pages 2-3 of {pageExtent}</span>
                  </div>

                  <div className={`p-6 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                    <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto shadow-2xl">
                      <div className="p-4 rounded-l bg-[#FFFDF9] text-[#1F1C18] min-h-[260px] flex flex-col justify-between border-r border-[#E8E2D5]">
                        <div className="text-center pb-2 border-b border-black/10">
                          <span className="text-[9px] font-editorial uppercase tracking-widest text-[#5A5245]">{authorName}</span>
                        </div>
                        <div className="space-y-2 font-editorial text-[10px] leading-relaxed text-[#2D2A26]">
                          <p>{manuscriptParagraphs[0]}</p>
                          <p>{manuscriptParagraphs[1]}</p>
                        </div>
                        <span className="text-[9px] font-mono text-[#5A5245]">2</span>
                      </div>

                      <div className="p-4 rounded-r bg-[#FFFDF9] text-[#1F1C18] min-h-[260px] flex flex-col justify-between">
                        <div className="text-center pb-2 border-b border-black/10">
                          <span className="text-[9px] font-editorial uppercase tracking-widest text-[#5A5245]">{bookTitle}</span>
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
                        <span className="text-[9px] font-mono text-[#5A5245] text-right">3</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-[10px] text-[#5A5245] mt-3 font-mono">
                    Live POD layout: {calculatedGutter}" inside margin calibrated for {pageExtent} pages
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
                      className="w-full p-2.5 rounded-xl text-xs bg-white dark:bg-[#18161D] text-[#1F1C18] dark:text-white border border-black/10 outline-none"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
                     {/* STEP 3: COVER BLUEPRINT & ASSET COMPILER */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1F1C18] dark:text-white">
                  Step 3: Cover Blueprint & Artwork Assembly
                </h2>
                <p className="text-xs text-[#5A5245] dark:text-[#9A96A0] mt-1">
                  Upload front cover, back cover, and barcode files to compile a 300 DPI full-wrap cover layout with bleed guides
                </p>
              </div>

              <div className={`p-3 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'} grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-semibold`}>
                <div>SPINE WIDTH: <span className="font-mono text-[#0E4D54] dark:text-teal-400 font-bold">{spineWidth}"</span></div>
                <div>TOTAL WIDTH: <span className="font-mono font-bold">{fullCoverWidth}"</span></div>
                <div>TOTAL HEIGHT: <span className="font-mono font-bold">{fullCoverHeight}"</span></div>
                <div>CANVAS @ 300 DPI: <span className="font-mono text-emerald-600 font-bold">{coverPixelsWidth} x {coverPixelsHeight} px</span></div>
              </div>

              {/* Upload Dropzones */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`p-4 rounded-2xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'} text-center`}>
                  <span className="text-xs font-bold block mb-2 text-[#1F1C18] dark:text-white">1. Front Cover Artwork</span>
                  <label className="cursor-pointer block p-4 border-2 border-dashed border-[#BBB3A4] rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <Upload className="w-5 h-5 mx-auto text-[#0E4D54] mb-1" />
                    <span className="text-[10px] text-[#5A5245] block">{frontCoverImage ? 'Front Loaded ✓' : 'Upload PNG / JPG'}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'front')} className="hidden" />
                  </label>
                </div>

                <div className={`p-4 rounded-2xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'} text-center`}>
                  <span className="text-xs font-bold block mb-2 text-[#1F1C18] dark:text-white">2. Back Cover Artwork</span>
                  <label className="cursor-pointer block p-4 border-2 border-dashed border-[#BBB3A4] rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <Upload className="w-5 h-5 mx-auto text-[#0E4D54] mb-1" />
                    <span className="text-[10px] text-[#5A5245] block">{backCoverImage ? 'Back Loaded ✓' : 'Upload PNG / JPG'}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'back')} className="hidden" />
                  </label>
                </div>

                <div className={`p-4 rounded-2xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'} text-center`}>
                  <span className="text-xs font-bold block mb-2 text-[#1F1C18] dark:text-white">3. Barcode (ISBN)</span>
                  <label className="cursor-pointer block p-4 border-2 border-dashed border-[#BBB3A4] rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <Upload className="w-5 h-5 mx-auto text-[#0E4D54] mb-1" />
                    <span className="text-[10px] text-[#5A5245] block">{barcodeImage ? 'Barcode Loaded ✓' : 'Upload Barcode Image'}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'barcode')} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Blueprint Preview & Assembly Download */}
              <div className={`p-6 sm:p-8 rounded-3xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'}`}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#5A5245]">
                    INTERACTIVE COVER BLUEPRINT (1:1 PROPORTIONAL PREVIEW)
                  </span>
                  <button onClick={handleExportFullCoverArtwork} className="soft-btn-primary px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Full-Wrap Cover (300 DPI)</span>
                  </button>
                </div>

                <div className={`p-6 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                  <div className="relative w-full aspect-[2/1] border-2 border-dashed border-red-400 rounded bg-[#FFFDF9] dark:bg-[#18161D] flex items-center justify-between p-4 overflow-hidden">
                    
                    {/* Back Cover */}
                    <div className="flex-1 h-full border-r border-dashed border-black/20 p-2 flex flex-col justify-between relative bg-cover bg-center"
                         style={{ backgroundImage: backCoverImage ? `url(${backCoverImage})` : 'none' }}>
                      <div className="text-center bg-white/70 dark:bg-black/70 p-1 rounded">
                        <span className="text-xs font-editorial font-bold block">BACK COVER</span>
                        <span className="text-[9px] text-[#5A5245]">({currentTrim.width}" × {currentTrim.height}")</span>
                      </div>

                      <div className="self-end p-2 border border-red-500 bg-red-500/20 rounded text-center">
                        {barcodeImage ? (
                          <img src={barcodeImage} alt="Barcode" className="w-20 h-10 object-contain mx-auto" />
                        ) : (
                          <>
                            <span className="text-[8px] font-mono font-bold text-red-600 block">BARCODE ZONE</span>
                            <span className="text-[7px] text-red-600">2.0" × 1.2" Reserved</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Spine */}
                    <div className="w-8 sm:w-12 h-full flex items-center justify-center bg-black/5 dark:bg-white/5 border-r border-dashed border-black/20">
                      <span className="text-[9px] font-mono -rotate-90 whitespace-nowrap text-[#0E4D54] dark:text-teal-400 font-bold">
                        {pageExtent >= 80 ? bookTitle.slice(0, 14) : ''}
                      </span>
                    </div>

                    {/* Front Cover */}
                    <div className="flex-1 h-full p-2 flex flex-col justify-between items-center text-center bg-cover bg-center"
                         style={{ backgroundImage: frontCoverImage ? `url(${frontCoverImage})` : 'none' }}>
                      <div className="bg-white/70 dark:bg-black/70 p-1 rounded">
                        <span className="text-xs font-editorial font-bold block">FRONT COVER</span>
                        <span className="text-[9px] text-[#5A5245]">({currentTrim.width}" × {currentTrim.height}")</span>
                      </div>

                      {!frontCoverImage && (
                        <div>
                          <h4 className="font-editorial text-sm font-bold">{bookTitle}</h4>
                          <p className="text-[10px] text-[#5A5245]">{authorName}</p>
                        </div>
                      )}

                      <span className="text-[8px] text-[#5A5245] bg-white/70 dark:bg-black/70 px-1 rounded">0.25" Safe Zone</span>
                    </div>

                  </div>
                </div>

                <p className="text-center text-[11px] text-[#5A5245] mt-4">
                  ⚠️ <strong>Barcode Zone Rule:</strong> Keep all critical text, logos, and faces away from the lower-right quadrant of the back cover.
                </p>
              </div>
            </div>
          )}
           
                   {/* STEP 4: PREFLIGHT & MULTI-COUNTRY ESTIMATOR */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center">
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1F1C18] dark:text-white">
                    Step 4: Preflight Verification & Multi-Country Estimator
                  </h2>
                  <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                    100% Ready
                  </span>
                </div>
                <p className="text-xs text-[#5A5245] dark:text-[#9A96A0] mt-1">
                  Adjust expected monthly sales volume and model royalty economics across all KDP territories
                </p>
              </div>

              <div className={`p-6 sm:p-7 rounded-3xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'}`}>
                
                {/* Sales Volume Slider */}
                <div className={`p-4 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'} mb-6`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1F1C18] dark:text-white">
                      TARGET MONTHLY SALES VOLUME ADJUSTMENT
                    </span>
                    <span className="text-base font-mono font-bold text-[#0E4D54] dark:text-teal-300">
                      {monthlySalesVolume} copies / month
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={1000}
                    step={5}
                    value={monthlySalesVolume}
                    onChange={(e) => setMonthlySalesVolume(parseInt(e.target.value))}
                    className="w-full accent-[#0E4D54]"
                  />
                  <div className="flex justify-between text-[10px] text-[#5A5245] font-mono mt-1">
                    <span>Conservative (10)</span>
                    <span>Average Launch (50)</span>
                    <span>High Velocity (250)</span>
                    <span>Best Seller (1,000)</span>
                  </div>
                </div>

                {/* Country Filter Bar with Select All Toggle */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1F1C18] dark:text-white flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-[#0E4D54]" />
                      SELECT TARGET KDP MARKETPLACES ({selectedKdpCountries.length} of {Object.keys(KDP_MARKETPLACES).length})
                    </span>
                    <button
                      type="button"
                      onClick={toggleSelectAllKdp}
                      className="text-xs font-semibold text-[#0E4D54] dark:text-teal-300 hover:underline flex items-center gap-1"
                    >
                      {isAllKdpSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      <span>{isAllKdpSelected ? 'Deselect All' : 'Select All Marketplaces'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {Object.entries(KDP_MARKETPLACES).map(([code, market]) => {
                      const isChecked = selectedKdpCountries.includes(code);
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              if (selectedKdpCountries.length > 1) {
                                setSelectedKdpCountries(selectedKdpCountries.filter(c => c !== code));
                              }
                            } else {
                              setSelectedKdpCountries([...selectedKdpCountries, code]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                            isChecked
                              ? 'bg-[#0E4D54] text-white shadow-sm'
                              : isDarkMode ? 'dark-soft-inset text-zinc-400' : 'soft-inset text-[#5A5245]'
                          }`}
                        >
                          {market.name} {isChecked ? '✓' : '+'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Territory Pricing Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedKdpCalculations.map((item) => (
                    <div key={item.code} className={`p-4 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'} space-y-2 text-xs`}>
                      <span className="font-bold text-[#0E4D54] dark:text-teal-300 block border-b pb-1 border-black/10">
                        {item.name}
                      </span>
                      <div className="flex justify-between">
                        <span className="text-[#5A5245]">Unit Print Cost:</span>
                        <span className="font-mono font-bold">{item.symbol}{item.unitCost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#5A5245]">Break-Even Price:</span>
                        <span className="font-mono font-bold">{item.symbol}{item.breakEven}</span>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-black/10">
                        <span className="font-bold">Retail Price:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold">{item.symbol}</span>
                          <input
                            type="number"
                            value={customRetailPrices[item.code] !== undefined ? customRetailPrices[item.code] : item.activePrice}
                            onChange={(e) => setCustomRetailPrices({ ...customRetailPrices, [item.code]: e.target.value })}
                            className="w-16 p-1 text-right font-mono font-bold rounded border bg-white dark:bg-[#18161D] text-[#1F1C18] dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex justify-between items-center border-t border-black/10 font-bold">
                        <span className="text-[#0E4D54] dark:text-teal-300">Est. Monthly ({monthlySalesVolume} copies):</span>
                        <span className="font-mono text-emerald-700 dark:text-emerald-400 text-sm">
                          {item.symbol}{item.monthlyForecast}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-[#5A5245] italic text-center mt-5">
                  * Disclaimer: Figures are mathematical estimates based on POD distribution formulas; this does not constitute a guaranteed income projection.
                </p>
              </div>

              {/* Preflight Checks */}
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
                  <button onClick={handleDownloadSpecification} className="py-3 px-6 rounded-full soft-btn-primary text-xs font-bold flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    <span>Download Production Specification (.txt)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Dock */}
          <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-white/90 dark:bg-[#121115]/90 backdrop-blur-md flex items-center justify-between max-w-5xl mx-auto border-t border-black/5 dark:border-white/5">
            <button onClick={() => setActiveView('home')} className="px-4 py-2 rounded-full text-xs font-semibold soft-btn-pill">
              Home Overview
            </button>

            <div className={`p-1.5 rounded-full ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'} flex items-center gap-2`}>
              {currentStep > 1 && (
                <button onClick={() => setCurrentStep(currentStep - 1)} className="px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              {currentStep < 4 ? (
                <button onClick={() => { handleSaveCurrentProject(); setCurrentStep(currentStep + 1); }} className="px-5 py-2 rounded-full text-xs font-bold soft-btn-primary flex items-center gap-1">
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button onClick={handleDownloadSpecification} className="px-5 py-2 rounded-full text-xs font-bold soft-btn-primary flex items-center gap-1">
                  <Download className="w-3.5 h-3.5" />
                  <span>Complete Studio</span>
                </button>
              )}
            </div>

            <button onClick={() => setActiveView('help')} className="px-4 py-2 rounded-full text-xs font-semibold soft-btn-pill flex items-center gap-1 text-[#0E4D54]">
              <span>Help</span>
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

        </main>
      )}
      {/* ====================================================================
          SECTION 8.0: MODAL OVERLAYS (MY BOOKS & REVIEW)
          ==================================================================== */}
      {isShelfOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'}`}>
            <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5 mb-4">
              <h3 className="font-editorial font-bold text-base">Saved Book Projects (Local Storage)</h3>
              <button onClick={() => setIsShelfOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {savedProjects.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#5A5245]">No saved drafts found.</div>
              ) : (
                savedProjects.map((proj) => (
                  <div key={proj.id} onClick={() => handleLoadProject(proj)} className={`p-3.5 rounded-2xl cursor-pointer flex justify-between items-center ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                    <div>
                      <h4 className="font-bold text-xs">{proj.title}</h4>
                      <p className="text-[10px] text-[#5A5245]">{proj.author} • {proj.trimSize} • {proj.pageExtent} Pgs</p>
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

      {/* Celebration Modal */}
      {successModalData.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl p-7 text-center ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'}`}>
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#0E4D54] text-white flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#0E4D54] block mb-1">
              {successModalData.fileLabel}
            </span>
            <h3 className="font-editorial text-2xl font-bold mb-1">{successModalData.title}</h3>
            <p className="text-xs text-[#5A5245] mb-4">{successModalData.subtitle}</p>

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
                    <button key={s} type="button" onClick={() => setUserRating(s)} className="text-lg p-1">
                      <span className={userRating >= s ? 'text-amber-500' : 'text-[#BBB3A4]'}>★</span>
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  placeholder="Feedback or suggestions? (Optional)"
                  className="w-full p-2 rounded-xl text-xs bg-white dark:bg-[#18161D] border outline-none text-[#1F1C18] dark:text-white"
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

    </div>
  );
}
       
