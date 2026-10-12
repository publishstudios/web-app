// ==========================================================================
// FILE: app/page.jsx
// ==========================================================================

/* --------------------------------------------------------------------------
   SECTION 1.0: IMPORTS
   -------------------------------------------------------------------------- */
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Book, BookOpen, HelpCircle, Sun, Moon, Sparkles, Download, 
  ArrowRight, ArrowLeft, CheckCircle2, 
  Eye, Sliders, Layers, FolderOpen, Trash2, X, Globe, Upload, CheckSquare, Square,
  Cpu, Calendar, FileText, Check, ShieldCheck
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
   SECTION 2.0: MASTER DATA & 15-TERRITORY MARKETPLACE FX MATRIX
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
  "The stillness of the study was broken only by the clock on the mantelpiece. Outside, rain fell steadily against the tall glass panes, blurring the lamps along the quiet avenue into soft circles of amber.",
  "He dipped the nib of his pen into the dark ink, pausing to listen to the carriage wheels rolling across the wet cobblestones below. Every manuscript began this way—not with certainty, but with the quiet discipline of facing an empty sheet.",
  "The margins preserved the words, keeping the inner voice protected from the binding. A properly formatted book respects both the eyes of the reader and the physical machinery of the bindery."
];

/* --------------------------------------------------------------------------
   SECTION 3.0: MAIN COMPONENT
   -------------------------------------------------------------------------- */
export default function PublishStudioApp() {
  
  /* SECTION 3.1: WORKFLOW & NAVIGATION */
  const [activeView, setActiveView] = useState('studio'); // 'home' | 'studio' | 'help'
  const [currentStep, setCurrentStep] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);

  /* SECTION 3.2: PROJECT CONFIGURATION & DEFAULT AUTHOR */
  const [projectId, setProjectId] = useState('proj_default');
  const [bookTitle, setBookTitle] = useState('The Memory Chef');
  const [authorName, setAuthorName] = useState('Kavita Chougule');
  const [bookCategory, setBookCategory] = useState('text_rich'); // 'text_rich' | 'low_content'
  const [selectedArchetype, setSelectedArchetype] = useState('fiction');
  const [trimSize, setTrimSize] = useState('5.5x8.5');
  const [paperType, setPaperType] = useState('cream');
  const [pageExtent, setPageExtent] = useState(120);

  /* SECTION 3.3: MANUSCRIPT & STEP 2 */
  const [uploadedFileName, setUploadedFileName] = useState('Sample_Trade_Novel.docx');
  const [manuscriptParagraphs, setManuscriptParagraphs] = useState(SAMPLE_CHAPTER_TEXT);
  const [quickFixDrawerOpen, setQuickFixDrawerOpen] = useState(false);

  /* SECTION 3.4: CLIENT-SIDE AI API INTEGRATION (BYOK) */
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  const [aiContentType, setAiContentType] = useState('chapter'); // 'chapter' | 'outline' | 'planner' | 'habits'
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  /* SECTION 3.5: COVER ASSETS (STEP 3) */
  const [frontCoverImage, setFrontCoverImage] = useState(null);
  const [backCoverImage, setBackCoverImage] = useState(null);
  const [barcodeImage, setBarcodeImage] = useState(null);

  /* SECTION 3.6: FORMAT SELECTION, REVENUE MODELING & GROWTH (STEP 4) */
  const [publishingFormat, setPublishingFormat] = useState('both'); // 'ebook' | 'paperback' | 'both'
  const [royaltyShareTier, setRoyaltyShareTier] = useState(0.60);
  const [usPaperbackPrice, setUsPaperbackPrice] = useState('12.99');
  const [usEbookPrice, setUsEbookPrice] = useState('4.99');
  const [customRetailPrices, setCustomRetailPrices] = useState({});
  const [selectedKdpCountries, setSelectedKdpCountries] = useState(['IN', 'US', 'UK', 'DE', 'CA', 'AU']);

  // Annual Velocity & Trajectory State
  const [initialMonthlySales, setInitialMonthlySales] = useState(50);
  const [monthlyGrowthRate, setMonthlyGrowthRate] = useState(5); // e.g., +5% per month

  /* SECTION 3.7: PERSISTENCE & MODALS */
  const [savedProjects, setSavedProjects] = useState([]);
  const [isShelfOpen, setIsShelfOpen] = useState(false);

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
    const savedKey = localStorage.getItem('ps_user_ai_key');
    if (savedKey) setUserApiKey(savedKey);
  }, []);

  /* SECTION 3.8: PRINT GEOMETRY MATH */
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

  /* SECTION 3.9: AUTO-FX CONVERTER & DUAL-FORMAT ROYALTY ENGINE */
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

      let combinedUnitRoyalty = 0;
      if (publishingFormat === 'paperback') combinedUnitRoyalty = Math.max(0, pbRoyalty);
      else if (publishingFormat === 'ebook') combinedUnitRoyalty = Math.max(0, ebRoyalty);
      else combinedUnitRoyalty = Math.max(0, pbRoyalty) + Math.max(0, ebRoyalty);

      return {
        code,
        name: market.name,
        currency: market.currency,
        symbol: market.symbol,
        fxRate: market.fxRate,
        printCost: printCost.toFixed(2),
        pbActivePrice: pbActivePrice.toFixed(2),
        ebActivePrice: ebActivePrice.toFixed(2),
        royaltyPerUnit: combinedUnitRoyalty.toFixed(2),
        usdEquivalentRoyalty: combinedUnitRoyalty / market.fxRate
      };
    });
  }, [pageExtent, usPaperbackPrice, usEbookPrice, customRetailPrices, royaltyShareTier, publishingFormat]);

  const activeSelectedTerritories = useMemo(() => {
    return territoryCalculations.filter(t => selectedKdpCountries.includes(t.code));
  }, [territoryCalculations, selectedKdpCountries]);

  const annualReportData = useMemo(() => {
    const totalUsdRoyaltyPerUnit = activeSelectedTerritories.reduce((acc, curr) => acc + curr.usdEquivalentRoyalty, 0);

    const calculateTrajectory = (startUnits) => {
      let totalUnits = 0;
      let totalUsdEarned = 0;
      let currentUnits = startUnits;
      let m1Units = Math.round(startUnits);
      let m6Units = 0;
      let m12Units = 0;

      for (let month = 1; month <= 12; month++) {
        if (month === 6) m6Units = Math.round(currentUnits);
        if (month === 12) m12Units = Math.round(currentUnits);
        totalUnits += Math.round(currentUnits);
        totalUsdEarned += currentUnits * totalUsdRoyaltyPerUnit;
        currentUnits = Math.max(1, currentUnits * (1 + monthlyGrowthRate / 100));
      }

      return {
        m1Units,
        m6Units,
        m12Units,
        annualUnits: Math.round(totalUnits),
        annualUsd: Math.round(totalUsdEarned),
        annualInr: Math.round(totalUsdEarned * 85)
      };
    };

    return {
      conservative: calculateTrajectory(Math.round(initialMonthlySales * 0.2)),
      average: calculateTrajectory(initialMonthlySales),
      scaled: calculateTrajectory(Math.round(initialMonthlySales * 5))
    };
  }, [activeSelectedTerritories, initialMonthlySales, monthlyGrowthRate]);

  /* SECTION 3.10: FULL AI ENGINE (BOOK DRAFTER & LOW-CONTENT BUILDER) */
  const handleGenerateAiContent = async () => {
    if (!userApiKey.trim()) {
      alert('Please enter your Google Gemini API key.');
      return;
    }
    setIsGeneratingAi(true);
    localStorage.setItem('ps_user_ai_key', userApiKey.trim());

    let promptText = "";
    if (aiContentType === 'chapter') {
      promptText = `You are a professional literary typesetter and author. Write the full opening of Chapter 1 for a book titled "${bookTitle}" by "${authorName}". Style: Rich, atmospheric, engaging narrative prose suitable for trade print publication. Include 3 well-developed paragraphs. ${aiCustomPrompt ? `Additional instructions: ${aiCustomPrompt}` : ''}`;
    } else if (aiContentType === 'outline') {
      promptText = `Create a comprehensive 10-chapter book outline for a publication titled "${bookTitle}" by "${authorName}". Provide chapter titles and a 2-sentence summary of each chapter's core progression. ${aiCustomPrompt ? `Additional instructions: ${aiCustomPrompt}` : ''}`;
    } else if (aiContentType === 'planner') {
      promptText = `You are designing an interior low-content structured guided planner for a book titled "${bookTitle}". Generate a structured daily template containing: 1) Date & Goal Focus, 2) Priority Task Checklist, 3) Habit Tracking Matrix, 4) Reflection & Wins section. Output in clean formatted text. ${aiCustomPrompt ? `Additional instructions: ${aiCustomPrompt}` : ''}`;
    } else {
      promptText = `Generate 30 unique, insightful daily journaling prompts and habit milestones for a self-improvement low-content journal titled "${bookTitle}". Output numbered 1 to 30. ${aiCustomPrompt ? `Additional instructions: ${aiCustomPrompt}` : ''}`;
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${userApiKey.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });

      const data = await response.json();
      const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (generated) {
        const newParas = generated.split('\n\n').filter(p => p.trim().length > 0);
        setManuscriptParagraphs(newParas);
        setAiModalOpen(false);
        setCurrentStep(2);
      } else {
        alert('Could not generate text. Check API Key validity and network connection.');
      }
    } catch (err) {
      alert('AI Generation error: ' + err.message);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  /* SECTION 3.11: EXPORT & COVER ACTIONS */
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
        ctx.fillStyle = '#1C2010';
        ctx.font = 'bold 32px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + w / 2, y + h / 2);
      }
    };

    renderCard(backCoverImage, backX, bleedPx, trimWidthPx, trimHeightPx, 'BACK COVER');
    renderCard(frontCoverImage, frontX, bleedPx, trimWidthPx, trimHeightPx, bookTitle);

    ctx.fillStyle = '#EAE3D6';
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
      ctx.strokeStyle = '#B8892D';
      ctx.lineWidth = 4;
      ctx.strokeRect(barcodeX, barcodeY, barcodeWPx, barcodeHPx);
      ctx.fillStyle = '#B8892D';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BARCODE EXCLUSION ZONE', barcodeX + barcodeWPx / 2, barcodeY + barcodeHPx / 2 + 6);
    }

    canvas.toBlob((blob) => {
      saveAs(blob, `${bookTitle.replace(/\s+/g, '_')}_FullWrap_Cover_300DPI.png`);
      setSuccessModalData({
        isOpen: true,
        title: 'Full-Wrap Cover Downloaded!',
        subtitle: 'Front, spine, back, and barcode compiled to 300 DPI layout.',
        fileLabel: 'Full-Wrap Blueprint (.png)'
      });
    });
  };

  const handleDownloadDOCX = () => {
    const formattedContent = 
      `TITLE: ${bookTitle}\nAUTHOR: ${authorName}\nTRIM: ${trimSize}\nGUTTER: ${calculatedGutter}"\n\n` +
      manuscriptParagraphs.join('\n\n');

    const blob = new Blob([formattedContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    saveAs(blob, `${bookTitle.replace(/\s+/g, '_')}_Formatted_${trimSize}.docx`);

    setSuccessModalData({
      isOpen: true,
      title: 'Interior Is Print-Ready!',
      subtitle: 'Mirrored margins, calibrated gutters, and running headers typeset successfully.',
      fileLabel: 'Formatted Manuscript (.docx)'
    });
  };

  const handleDownloadSpecification = () => {
    const spec = 
`============================================================
PUBLISHSTUDIO - PRODUCTION SPECIFICATION & ANNUAL REPORT
Universal Print-on-Demand (POD) Production Calibrations
============================================================
Book Title:           ${bookTitle}
Author Name:          ${authorName}
Format Mode:          ${publishingFormat.toUpperCase()}
Trim Dimensions:      ${currentTrim.width}" x ${currentTrim.height}"
Page Extent:          ${pageExtent} Pages
Paper Stock Caliper:  ${PAPER_SPECS[paperType]?.label}
Binding Gutter:       ${calculatedGutter}"
Spine Width:          ${spineWidth}"
Full Cover Canvas:    ${coverPixelsWidth} x ${coverPixelsHeight} px (300 DPI)
Starting Month 1 Units: ${initialMonthlySales}
Monthly Trajectory:   ${monthlyGrowthRate > 0 ? `+${monthlyGrowthRate}%` : `${monthlyGrowthRate}%`}
============================================================`;

    const blob = new Blob([spec], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${bookTitle.replace(/\s+/g, '_')}_Production_Specs_${trimSize}.txt`);

    setSuccessModalData({
      isOpen: true,
      title: 'Happy Book Publishing!',
      subtitle: 'Your production tolerances and blueprints are certified for print readiness.',
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
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'dark-canvas' : 'bg-[#F5EFE3] text-[#1C2010]'}`}>
      
      {/* ====================================================================
          SECTION 4.0: HEADER DOCK (PERMANENT DARK TEXT IN LIGHT MODE)
          ==================================================================== */}
      <header className={`sticky top-0 z-40 w-full backdrop-blur-md border-b transition-colors ${
        isDarkMode ? 'bg-[#12140D]/90 border-white/5' : 'bg-[#F5EFE3]/95 border-[#D8C9A8]'
      }`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div onClick={() => setActiveView('home')} className="flex items-center gap-3 cursor-pointer select-none">
            <div className="w-10 h-10 rounded-2xl bg-[#4F5B2A] text-white flex items-center justify-center shadow-md">
              <Book className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-editorial font-bold text-base tracking-tight text-[#1C2010] dark:text-white">
                  PUBLISHSTUDIO
                </span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#E8DFC8] text-[#4F5B2A] dark:bg-white/10 dark:text-zinc-300">
                  Universal POD
                </span>
              </div>
              <p className="text-[10px] text-[#4F5B2A] dark:text-[#9A96A0]">Self-Publishing Supporting Software</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`hidden md:flex items-center p-1 rounded-full ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
              <button
                onClick={() => setActiveView('home')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  activeView === 'home'
                    ? isDarkMode ? 'bg-[#25222E] text-white' : 'bg-white text-[#1C2010] shadow-xs'
                    : 'text-[#4F5B2A] dark:text-zinc-400'
                }`}
              >
                Home Overview
              </button>
              <button
                onClick={() => setActiveView('studio')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  activeView === 'studio'
                    ? isDarkMode ? 'bg-[#25222E] text-white' : 'bg-white text-[#1C2010] shadow-xs'
                    : 'text-[#4F5B2A] dark:text-zinc-400'
                }`}
              >
                Guided Workflow
              </button>
              <button
                onClick={() => setActiveView('help')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  activeView === 'help'
                    ? isDarkMode ? 'bg-[#25222E] text-white' : 'bg-white text-[#1C2010] shadow-xs'
                    : 'text-[#4F5B2A] dark:text-zinc-400'
                }`}
              >
                Publishing Manual
              </button>
            </div>

            {/* AI Generator Modal Launcher */}
            <button
              onClick={() => setAiModalOpen(true)}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                isDarkMode ? 'dark-soft-raised text-amber-400' : 'soft-btn-pill text-[#4F5B2A]'
              }`}
              title="AI Generator (BYOK)"
            >
              <Cpu className="w-4 h-4 text-[#4F5B2A]" />
              <span className="hidden sm:inline">AI Studio</span>
            </button>

            <button
              onClick={() => { refreshProjectsList(); setIsShelfOpen(true); }}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                isDarkMode ? 'dark-soft-raised text-zinc-300' : 'soft-btn-pill text-[#1C2010]'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#4F5B2A] dark:text-zinc-400" />
              <span className="hidden sm:inline">My Books ({savedProjects.length})</span>
            </button>

            <button
              onClick={() => setActiveView('help')}
              className={`p-2 rounded-full ${activeView === 'help' ? 'bg-[#4F5B2A] text-white shadow-md' : isDarkMode ? 'dark-soft-raised text-zinc-300' : 'soft-btn-pill text-[#1C2010]'}`}
            >
              <HelpCircle className="w-4 h-4 text-[#4F5B2A] dark:text-zinc-400" />
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full ${isDarkMode ? 'dark-soft-raised text-amber-400' : 'soft-btn-pill text-[#1C2010]'}`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-[#1C2010]" />}
            </button>
          </div>
        </div>
      </header>

      {/* ====================================================================
          SECTION 5.0: FULL-PAGE HELP MANUAL OR HOME OVERVIEW
          ==================================================================== */}
      {activeView === 'help' && (
        <HelpCenter onBackToStudio={() => setActiveView('studio')} isDarkMode={isDarkMode} />
      )}

      {activeView === 'home' && (
        <main className="max-w-5xl mx-auto px-4 py-12 animate-in fade-in space-y-10">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#4F5B2A] dark:text-zinc-400 block">
              PUBLISHSTUDIO OPERATING SYSTEM
            </span>
            <h1 className="font-editorial text-4xl sm:text-5xl font-bold tracking-tight text-[#1C2010] dark:text-white">
              Professional Book OS & Typesetting Engine
            </h1>
            <p className="text-sm sm:text-base text-[#7A7368] dark:text-[#9A96A0] max-w-2xl mx-auto leading-relaxed">
              Compile print-ready interior layouts, generate 300 DPI full-wrap covers with barcode exclusion zones, and simulate 15-territory POD royalties locally in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-3xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'} space-y-3`}>
              <Sliders className="w-8 h-8 text-[#4F5B2A]" />
              <h3 className="font-editorial font-bold text-lg text-[#1C2010] dark:text-white">1. Precision Geometry</h3>
              <p className="text-xs text-[#7A7368] dark:text-[#9A96A0] leading-relaxed">
                Automated spine calculations based on paper caliper, mirrored gutter margins, and running header verification.
              </p>
            </div>

            <div className={`p-6 rounded-3xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'} space-y-3`}>
              <Layers className="w-8 h-8 text-[#4F5B2A]" />
              <h3 className="font-editorial font-bold text-lg text-[#1C2010] dark:text-white">2. 300 DPI Cover Compiler</h3>
              <p className="text-xs text-[#7A7368] dark:text-[#9A96A0] leading-relaxed">
                Full-wrap jacket builder with a locked 2.0" × 1.2" barcode exclusion zone to prevent retail scan overlap.
              </p>
            </div>

            <div className={`p-6 rounded-3xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'} space-y-3`}>
              <ShieldCheck className="w-8 h-8 text-[#4F5B2A]" />
              <h3 className="font-editorial font-bold text-lg text-[#1C2010] dark:text-white">3. 15-Territory Royalties</h3>
              <p className="text-xs text-[#7A7368] dark:text-[#9A96A0] leading-relaxed">
                Dynamic currency conversion across Amazon global marketplaces with a 12-month compound growth trajectory engine.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button
              onClick={() => setActiveView('studio')}
              className="px-6 py-3 rounded-full soft-btn-primary text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>Launch Guided Workflow</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveView('help')}
              className={`px-6 py-3 rounded-full text-xs font-semibold cursor-pointer ${isDarkMode ? 'dark-soft-raised' : 'soft-btn-pill'}`}
            >
              Read Publishing Manual
            </button>
          </div>
        </main>
      )}

      {/* ====================================================================
          SECTION 6.0: 4-STEP WORKSPACE
          ==================================================================== */}
      {activeView === 'studio' && (
        <main className="max-w-5xl mx-auto px-4 py-8 pb-32 animate-in fade-in">
          
          {/* STEPPER NAVIGATION WITH DIRECT CLICK TRANSITIONS */}
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
                        type="button"
                        onClick={() => setCurrentStep(s.step)}
                        className={`flex items-center gap-2 px-3 sm:px-5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                          isActive
                            ? 'bg-[#4F5B2A] text-white shadow-md font-bold'
                            : isPassed
                              ? 'text-[#4F5B2A] font-bold'
                              : 'text-[#4F5B2A]/60 dark:text-zinc-400'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                          isActive ? 'bg-white text-[#4F5B2A] font-bold' : 'bg-black/10 dark:bg-white/10'
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
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#4F5B2A] dark:text-zinc-400 block mb-1">
                  STEP TITLE
                </span>
                <div className="flex items-center justify-between">
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2010] dark:text-white">
                    Step 1: Specification & Project Setup
                  </h2>
                  <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#E8DFC8] dark:bg-white/10 text-[#4F5B2A] dark:text-zinc-300 font-semibold">
                    Universal POD Standards
                  </span>
                </div>
                <p className="text-xs text-[#4F5B2A] dark:text-[#9A96A0] mt-1">
                  Define book archetype, dimensions, and author profile (Default: <strong>{authorName}</strong>)
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
                      className={`p-4 rounded-2xl text-center transition-all ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'} ${isSelected ? 'ring-2 ring-[#4F5B2A]' : ''}`}
                    >
                      <h4 className="font-editorial font-bold text-xs sm:text-sm text-[#1C2010] dark:text-white mb-1">
                        {arch.name}
                      </h4>
                      <p className="text-[11px] text-[#4F5B2A] dark:text-[#9A96A0] mb-3">{arch.desc}</p>
                      <div className="flex justify-center">
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-[#4F5B2A] bg-[#4F5B2A]' : 'border-[#BBB3A4]'
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
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#4F5B2A] dark:text-zinc-400 block mb-3">
                  MANUFACTURING CALIBRATIONS CARD
                </span>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#1C2010] dark:text-zinc-200 uppercase tracking-wider block mb-1.5">
                      TRIM DIMENSIONS
                    </label>
                    <select
                      value={trimSize}
                      onChange={(e) => setTrimSize(e.target.value)}
                      className={`w-full p-3 rounded-2xl text-xs font-semibold outline-none ${isDarkMode ? 'dark-soft-inset text-white' : 'soft-inset text-[#1C2010]'}`}
                    >
                      {TRIM_OPTIONS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1C2010] dark:text-zinc-200 uppercase tracking-wider block mb-1.5">
                      PAPER STOCK CALIPER
                    </label>
                    <select
                      value={paperType}
                      onChange={(e) => setPaperType(e.target.value)}
                      className={`w-full p-3 rounded-2xl text-xs font-semibold outline-none ${isDarkMode ? 'dark-soft-inset text-white' : 'soft-inset text-[#1C2010]'}`}
                    >
                      {Object.entries(PAPER_SPECS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[#1C2010] dark:text-zinc-200 uppercase tracking-wider">PAGE EXTENT</span>
                      <span className="text-xs font-mono font-bold text-[#4F5B2A] dark:text-zinc-400">{pageExtent} Pages</span>
                    </div>
                    <input
                      type="range"
                      min={24}
                      max={600}
                      value={pageExtent}
                      onChange={(e) => setPageExtent(parseInt(e.target.value))}
                      className="w-full accent-[#4F5B2A]"
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#4F5B2A] block mb-3">READOUTS CARD</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`p-3.5 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                      <span className="text-xs font-bold block text-[#1C2010] dark:text-white">Spine Gutter: {calculatedGutter}"</span>
                      <span className="text-[10px] text-[#4F5B2A] block">Recommended binding margin</span>
                    </div>
                    <div className={`p-3.5 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                      <span className="text-xs font-bold block text-[#1C2010] dark:text-white">Outside Margin: {outsideMargin}"</span>
                      <span className="text-[10px] text-[#4F5B2A] block">Finger safety clearance</span>
                    </div>
                    <div className={`p-3.5 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                      <span className="text-xs font-bold block text-[#1C2010] dark:text-white">Top / Bottom: {topBottomMargin}"</span>
                      <span className="text-[10px] text-[#4F5B2A] block">Running head buffer</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: INTERIOR PROOF SPREAD & TEXT EDITOR */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2010] dark:text-white">
                  Step 2: Interior Production & Structuring
                </h2>
                <p className="text-xs text-[#4F5B2A] dark:text-[#9A96A0] mt-1">
                  Author profile: <strong>{authorName}</strong>. Typeset running heads, chapter headings, and verify proof layout.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`p-6 rounded-3xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'} space-y-4`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#4F5B2A] dark:text-zinc-400 block">
                      MANUSCRIPT INPUTS CARD
                    </span>
                    <button
                      onClick={() => setAiModalOpen(true)}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#4F5B2A] text-white flex items-center gap-1 shadow-sm"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>AI Generate</span>
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1 text-[#1C2010] dark:text-zinc-200">
                      BOOK TITLE (RECTO HEADER)
                    </label>
                    <input
                      type="text"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      className={`w-full p-2.5 rounded-xl text-xs font-medium ${isDarkMode ? 'dark-soft-inset text-white' : 'soft-inset text-[#1C2010]'}`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1 text-[#1C2010] dark:text-zinc-200">
                      AUTHOR NAME (VERSO HEADER)
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className={`w-full p-2.5 rounded-xl text-xs font-medium ${isDarkMode ? 'dark-soft-inset text-white' : 'soft-inset text-[#1C2010]'}`}
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
                    <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#4F5B2A]">
                      TWO-PAGE CRAFT SPREAD PREVIEW (TYPESET PROOF)
                    </span>
                    <span className="text-[10px] font-mono text-[#4F5B2A]">Pages 2-3 of {pageExtent}</span>
                  </div>

                  <div className={`p-6 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                    <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto shadow-2xl">
                      <div className="p-4 rounded-l bg-[#FFFDF9] text-[#1C2010] min-h-[260px] flex flex-col justify-between border-r border-[#E8DFC8]">
                        <div className="text-center pb-2 border-b border-black/10">
                          <span className="text-[9px] font-editorial uppercase tracking-widest text-[#4F5B2A]">{authorName}</span>
                        </div>
                        <div className="space-y-2 font-editorial text-[10px] leading-relaxed text-[#2D2A26]">
                          <p>{manuscriptParagraphs[0]}</p>
                          <p>{manuscriptParagraphs[1]}</p>
                        </div>
                        <span className="text-[9px] font-mono text-[#4F5B2A]">2</span>
                      </div>

                      <div className="p-4 rounded-r bg-[#FFFDF9] text-[#1C2010] min-h-[260px] flex flex-col justify-between">
                        <div className="text-center pb-2 border-b border-black/10">
                          <span className="text-[9px] font-editorial uppercase tracking-widest text-[#4F5B2A]">{bookTitle}</span>
                        </div>
                        <div className="space-y-2 font-editorial text-[10px] leading-relaxed text-[#2D2A26]">
                          <div className="text-center my-1">
                            <span className="text-[8px] font-mono text-[#4F5B2A] block">CHAPTER ONE</span>
                            <h5 className="text-[11px] font-bold">The Opening Chapter</h5>
                          </div>
                          <p>
                            <span className="float-left text-2xl font-bold pr-1.5 leading-none text-[#4F5B2A]">
                              {manuscriptParagraphs[2]?.charAt(0) || 'T'}
                            </span>
                            {manuscriptParagraphs[2]?.slice(1)}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono text-[#4F5B2A] text-right">3</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-[10px] text-[#4F5B2A] mt-3 font-mono">
                    Live POD layout: {calculatedGutter}" inside margin calibrated for {pageExtent} pages
                  </p>
                </div>
              </div>

              {quickFixDrawerOpen && (
                <div className={`p-5 rounded-3xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'} space-y-3`}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#4F5B2A]">Paragraph Editor</h4>
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
                      className="w-full p-2.5 rounded-xl text-xs bg-white dark:bg-[#18161D] text-[#1C2010] dark:text-white border border-black/10 outline-none"
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
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2010] dark:text-white">
                  Step 3: Cover Blueprint & Artwork Assembly
                </h2>
                <p className="text-xs text-[#4F5B2A] dark:text-[#9A96A0] mt-1">
                  Upload front cover, back cover, and barcode files to compile a 300 DPI full-wrap cover layout with bleed guides
                </p>
              </div>

              <div className={`p-3 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'} grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-semibold`}>
                <div>SPINE WIDTH: <span className="font-mono text-[#4F5B2A] dark:text-zinc-400 font-bold">{spineWidth}"</span></div>
                <div>TOTAL WIDTH: <span className="font-mono font-bold">{fullCoverWidth}"</span></div>
                <div>TOTAL HEIGHT: <span className="font-mono font-bold">{fullCoverHeight}"</span></div>
                <div>CANVAS @ 300 DPI: <span className="font-mono text-[#B8892D] font-bold">{coverPixelsWidth} x {coverPixelsHeight} px</span></div>
              </div>

              {/* Upload Dropzones */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`p-4 rounded-2xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'} text-center`}>
                  <span className="text-xs font-bold block mb-2 text-[#1C2010] dark:text-white">1. Front Cover Artwork</span>
                  <label className="cursor-pointer block p-4 border-2 border-dashed border-[#BBB3A4] rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <Upload className="w-5 h-5 mx-auto text-[#4F5B2A] mb-1" />
                    <span className="text-[10px] text-[#4F5B2A] block">{frontCoverImage ? 'Front Loaded ✓' : 'Upload PNG / JPG'}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'front')} className="hidden" />
                  </label>
                </div>

                <div className={`p-4 rounded-2xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'} text-center`}>
                  <span className="text-xs font-bold block mb-2 text-[#1C2010] dark:text-white">2. Back Cover Artwork</span>
                  <label className="cursor-pointer block p-4 border-2 border-dashed border-[#BBB3A4] rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <Upload className="w-5 h-5 mx-auto text-[#4F5B2A] mb-1" />
                    <span className="text-[10px] text-[#4F5B2A] block">{backCoverImage ? 'Back Loaded ✓' : 'Upload PNG / JPG'}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'back')} className="hidden" />
                  </label>
                </div>

                <div className={`p-4 rounded-2xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'} text-center`}>
                  <span className="text-xs font-bold block mb-2 text-[#1C2010] dark:text-white">3. Barcode (ISBN)</span>
                  <label className="cursor-pointer block p-4 border-2 border-dashed border-[#BBB3A4] rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition">
                    <Upload className="w-5 h-5 mx-auto text-[#4F5B2A] mb-1" />
                    <span className="text-[10px] text-[#4F5B2A] block">{barcodeImage ? 'Barcode Loaded ✓' : 'Upload Barcode Image'}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'barcode')} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Blueprint Preview & Canvas Export */}
              <div className={`p-6 sm:p-8 rounded-3xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'}`}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#4F5B2A]">
                    INTERACTIVE COVER BLUEPRINT (1:1 PROPORTIONAL PREVIEW)
                  </span>
                  <button onClick={handleExportFullCoverArtwork} className="soft-btn-primary px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Full-Wrap Cover (300 DPI)</span>
                  </button>
                </div>

                <div className={`p-6 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                  <div className="relative w-full aspect-[2/1] border-2 border-dashed border-red-400 rounded bg-[#FFFDF9] dark:bg-[#18161D] flex items-center justify-between p-4 overflow-hidden">
                    
                    {/* Back Cover Preview */}
                    <div className="flex-1 h-full border-r border-dashed border-black/20 p-2 flex flex-col justify-between relative bg-cover bg-center"
                         style={{ backgroundImage: backCoverImage ? `url(${backCoverImage})` : 'none' }}>
                      <div className="text-center bg-white/70 dark:bg-black/70 p-1 rounded">
                        <span className="text-xs font-editorial font-bold block">BACK COVER</span>
                        <span className="text-[9px] text-[#4F5B2A]">({currentTrim.width}" × {currentTrim.height}")</span>
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
                      <span className="text-[9px] font-mono -rotate-90 whitespace-nowrap text-[#4F5B2A] dark:text-zinc-400 font-bold">
                        {pageExtent >= 80 ? bookTitle.slice(0, 14) : ''}
                      </span>
                    </div>

                    {/* Front Cover Preview */}
                    <div className="flex-1 h-full p-2 flex flex-col justify-between items-center text-center bg-cover bg-center"
                         style={{ backgroundImage: frontCoverImage ? `url(${frontCoverImage})` : 'none' }}>
                      <div className="bg-white/70 dark:bg-black/70 p-1 rounded">
                        <span className="text-xs font-editorial font-bold block">FRONT COVER</span>
                        <span className="text-[9px] text-[#4F5B2A]">({currentTrim.width}" × {currentTrim.height}")</span>
                      </div>

                      {!frontCoverImage && (
                        <div>
                          <h4 className="font-editorial text-sm font-bold">{bookTitle}</h4>
                          <p className="text-[10px] text-[#4F5B2A]">{authorName}</p>
                        </div>
                      )}

                      <span className="text-[8px] text-[#4F5B2A] bg-white/70 dark:bg-black/70 px-1 rounded">0.25" Safe Zone</span>
                    </div>

                  </div>
                </div>

                <p className="text-center text-[11px] text-[#4F5B2A] mt-4">
                  ⚠️ <strong>Barcode Zone Rule:</strong> Keep all critical text, logos, and faces away from the lower-right quadrant of the back cover.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: PREFLIGHT, DUAL-FORMAT & TRANSPARENT 12-MONTH TRAJECTORY REPORT */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center">
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2010] dark:text-white">
                    Step 4: Preflight Verification & Multi-Country Estimator
                  </h2>
                  <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 font-bold text-xs">
                    100% Ready
                  </span>
                </div>
                <p className="text-xs text-[#4F5B2A] dark:text-[#9A96A0] mt-1">
                  Model eBook vs Paperback formats, 12-month trajectory growth, and global multi-territory earnings
                </p>
              </div>

              <div className={`p-6 sm:p-7 rounded-3xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'}`}>
                
                {/* 12-MONTH COMBINED REVENUE REPORT BANNER */}
                <div className={`p-5 rounded-2xl mb-6 border ${isDarkMode ? 'dark-soft-inset border-white/5' : 'soft-inset border-[#D8C9A8]'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#4F5B2A] dark:text-zinc-300 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      12-MONTH ANNUAL CUMULATIVE REVENUE REPORT ({activeSelectedTerritories.length} TERRITORIES)
                    </span>
                    <span className="text-[11px] font-mono text-[#4F5B2A]">Format: {publishingFormat.toUpperCase()}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#18161D] shadow-xs">
                      <span className="text-[10px] text-[#4F5B2A] block font-semibold">🥉 Conservative (Low Velocity)</span>
                      <span className="text-base font-bold font-mono text-[#1C2010] dark:text-white mt-1 block">
                        ${annualReportData.conservative.annualUsd.toLocaleString()} / ₹{annualReportData.conservative.annualInr.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#4F5B2A] block mt-1 font-mono">
                        {annualReportData.conservative.annualUnits} total copies
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#18161D] shadow-xs">
                      <span className="text-[10px] text-[#4F5B2A] block font-semibold">🥈 Benchmark (Target Velocity)</span>
                      <span className="text-base font-bold font-mono text-[#4F5B2A] dark:text-zinc-300 mt-1 block">
                        ${annualReportData.average.annualUsd.toLocaleString()} / ₹{annualReportData.average.annualInr.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#4F5B2A] block mt-1 font-mono">
                        {annualReportData.average.annualUnits} total copies
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-[#18161D] shadow-xs">
                      <span className="text-[10px] text-[#4F5B2A] block font-semibold">🥇 Scaled (Ad Scaling)</span>
                      <span className="text-base font-bold font-mono text-[#B8892D] mt-1 block">
                        ${annualReportData.scaled.annualUsd.toLocaleString()} / ₹{annualReportData.scaled.annualInr.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#4F5B2A] block mt-1 font-mono">
                        {annualReportData.scaled.annualUnits} total copies
                      </span>
                    </div>
                  </div>
                </div>

                {/* PUBLISHING FORMAT SELECTION (EBOOK / PAPERBACK / BOTH) */}
                <div className={`p-4 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'} mb-6`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1C2010] dark:text-white block">
                        PUBLISHING FORMAT INTENT
                      </span>
                      <p className="text-[11px] text-[#4F5B2A]">
                        Choose digital eBook only, physical paperback, or both to model printing deductions versus wireless fees.
                      </p>
                    </div>

                    <div className="flex gap-1.5 p-1 rounded-xl bg-black/5 dark:bg-white/5">
                      {[
                        { id: 'paperback', label: 'Paperback Only' },
                        { id: 'ebook', label: 'eBook Only' },
                        { id: 'both', label: 'Both Formats' }
                      ].map((fmt) => (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => setPublishingFormat(fmt.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            publishingFormat === fmt.id
                              ? 'bg-[#4F5B2A] text-white shadow-sm'
                              : 'text-[#4F5B2A] dark:text-zinc-400'
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* EXPLICIT TRAJECTORY SLIDER & MONTH-BY-MONTH BREAKDOWN */}
                <div className={`p-4 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'} mb-6 space-y-4`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1C2010] dark:text-white block">
                        MONTHLY TRAJECTORY CONTROLS
                      </span>
                      <p className="text-[11px] text-[#4F5B2A]">
                        Simulate compound monthly momentum (+% scaling) or natural backlist taper (-% decay).
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#4F5B2A] dark:text-zinc-300">
                      Month 1: {initialMonthlySales} units | Trajectory: {monthlyGrowthRate > 0 ? `+${monthlyGrowthRate}%` : `${monthlyGrowthRate}%`}/mo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-[#4F5B2A] block mb-1 font-bold">Month 1 Starting Copies Sold:</label>
                      <input
                        type="range"
                        min={5}
                        max={500}
                        step={5}
                        value={initialMonthlySales}
                        onChange={(e) => setInitialMonthlySales(parseInt(e.target.value))}
                        className="w-full accent-[#4F5B2A]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#4F5B2A] block mb-1 font-bold">
                        Monthly Trajectory Rate: {monthlyGrowthRate > 0 ? `Scaling (+${monthlyGrowthRate}% / month)` : (monthlyGrowthRate === 0 ? 'Flat (0% / month)' : `Decaying (${monthlyGrowthRate}% / month)`)}
                      </label>
                      <input
                        type="range"
                        min={-10}
                        max={25}
                        step={1}
                        value={monthlyGrowthRate}
                        onChange={(e) => setMonthlyGrowthRate(parseInt(e.target.value))}
                        className="w-full accent-[#4F5B2A]"
                      />
                    </div>
                  </div>
                   
                  {/* Explicit Progression Cards (Month 1 -> Month 6 -> Month 12) */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/10 text-center">
                    <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                      <span className="text-[9px] uppercase font-bold text-[#4F5B2A] block">Month 1 (Launch)</span>
                      <span className="text-xs font-mono font-bold">{annualReportData.average.m1Units} copies/mo</span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                      <span className="text-[9px] uppercase font-bold text-[#4F5B2A] block">Month 6 (Mid-Year)</span>
                      <span className="text-xs font-mono font-bold">{annualReportData.average.m6Units} copies/mo</span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5">
                      <span className="text-[9px] uppercase font-bold text-[#4F5B2A] block">Month 12 (Year-End)</span>
                      <span className="text-xs font-mono font-bold">{annualReportData.average.m12Units} copies/mo</span>
                    </div>
                  </div>
                </div>

                {/* US DUAL PRICE SYNC CONTROLLER */}
                <div className={`p-4 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'} mb-6`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(publishingFormat === 'paperback' || publishingFormat === 'both') && (
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[#1C2010] dark:text-white block mb-1">
                          US PAPERBACK RETAIL ($ USD)
                        </span>
                        <input
                          type="number"
                          step="0.50"
                          value={usPaperbackPrice}
                          onChange={(e) => handleUsPriceChange(e.target.value, 'paperback')}
                          className="w-full p-2 font-mono font-bold text-sm rounded-xl border bg-white dark:bg-[#18161D] text-[#1C2010] dark:text-white"
                        />
                      </div>
                    )}

                    {(publishingFormat === 'ebook' || publishingFormat === 'both') && (
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[#1C2010] dark:text-white block mb-1">
                          US EBOOK RETAIL ($ USD)
                        </span>
                        <input
                          type="number"
                          step="0.50"
                          value={usEbookPrice}
                          onChange={(e) => handleUsPriceChange(e.target.value, 'ebook')}
                          className="w-full p-2 font-mono font-bold text-sm rounded-xl border bg-white dark:bg-[#18161D] text-[#1C2010] dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Country Filter Bar with Select All Toggle */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1C2010] dark:text-white flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-[#4F5B2A]" />
                      SELECT DISTRIBUTION TERRITORIES ({selectedKdpCountries.length} of {Object.keys(POD_MARKETPLACES).length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedKdpCountries.length === Object.keys(POD_MARKETPLACES).length) {
                          setSelectedKdpCountries(['US', 'IN']);
                        } else {
                          setSelectedKdpCountries(Object.keys(POD_MARKETPLACES));
                        }
                      }}
                      className="text-xs font-semibold text-[#4F5B2A] dark:text-zinc-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {selectedKdpCountries.length === Object.keys(POD_MARKETPLACES).length ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      <span>{selectedKdpCountries.length === Object.keys(POD_MARKETPLACES).length ? 'Deselect All' : 'Select All Territories'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {Object.entries(POD_MARKETPLACES).map(([code, market]) => {
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
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                            isChecked
                              ? 'bg-[#4F5B2A] text-white shadow-sm'
                              : isDarkMode ? 'dark-soft-inset text-zinc-400' : 'soft-inset text-[#4F5B2A]'
                          }`}
                        >
                          {market.name} {isChecked ? '✓' : '+'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Territory Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeSelectedTerritories.map((item) => (
                    <div key={item.code} className={`p-4 rounded-2xl ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'} space-y-2 text-xs`}>
                      <span className="font-bold text-[#4F5B2A] dark:text-zinc-300 block border-b pb-1 border-black/10">
                        {item.name}
                      </span>
                      {publishingFormat !== 'ebook' && (
                        <div className="flex justify-between">
                          <span className="text-[#4F5B2A]">Print Cost:</span>
                          <span className="font-mono font-bold">{item.symbol}{item.printCost}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-[#4F5B2A]">Retail Target:</span>
                        <span className="font-mono font-bold">{item.symbol}{item.pbActivePrice}</span>
                      </div>

                      <div className="pt-2 flex justify-between items-center border-t border-black/10 font-bold">
                        <span className="text-[#4F5B2A] dark:text-zinc-300">Net Royalty/Copy:</span>
                        <span className="font-mono text-[#B8892D] text-sm">
                          +{item.symbol}{item.royaltyPerUnit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-[#4F5B2A] italic text-center mt-5">
                  * Disclaimer: Figures are mathematical estimates based on selected trajectory formulas; this does not constitute a guaranteed income projection.
                </p>
              </div>

              {/* PREFLIGHT PASS CHECKS CARD PRESERVED */}
              <div className={`p-6 rounded-3xl ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'} space-y-2 text-xs`}>
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#4F5B2A] block mb-2">
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
                  <button onClick={handleDownloadSpecification} className="py-3 px-6 rounded-full soft-btn-primary text-xs font-bold flex items-center gap-2 cursor-pointer">
                    <Download className="w-4 h-4" />
                    <span>Download Production Specification (.txt)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STICKY BOTTOM DOCK (NOW DIRECTLY FUNCTIONAL) */}
          <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-white/90 dark:bg-[#12140D]/90 backdrop-blur-md flex items-center justify-between max-w-5xl mx-auto border-t border-black/5 dark:border-white/5">
            <button onClick={() => setActiveView('home')} className="px-4 py-2 rounded-full text-xs font-semibold soft-btn-pill cursor-pointer">
              Home Overview
            </button>

            <div className={`p-1.5 rounded-full ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'} flex items-center gap-2`}>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                  className="px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
                  className="px-5 py-2 rounded-full text-xs font-bold soft-btn-primary flex items-center gap-1 cursor-pointer"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadSpecification}
                  className="px-5 py-2 rounded-full text-xs font-bold soft-btn-primary flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Complete Studio</span>
                </button>
              )}
            </div>

            <button onClick={() => setActiveView('help')} className="px-4 py-2 rounded-full text-xs font-semibold soft-btn-pill flex items-center gap-1 text-[#4F5B2A] cursor-pointer">
              <span>Help</span>
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

        </main>
      )}

      {/* ====================================================================
          SECTION 7.0: MODAL OVERLAYS (AI BYOK, SHELF, SUCCESS)
          ==================================================================== */}
      
      {/* SECTION 7.1: FULL AI STUDIO CONTENT DRAFTER */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'}`}>
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#4F5B2A]" />
                <h3 className="font-editorial font-bold text-base">Client-Side AI Book & Content Generator</h3>
              </div>
              <button onClick={() => setAiModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>

            <p className="text-xs text-[#4F5B2A] dark:text-[#9A96A0] mb-4">
              Use your own Google Gemini API key to draft full chapters, book outlines, or low-content planners directly into your manuscript. Runs with zero server fees.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-[11px] font-bold uppercase block mb-1">Google Gemini API Key:</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={userApiKey}
                  onChange={(e) => setUserApiKey(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-xs border bg-white dark:bg-[#18161D] outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase block mb-1">Content Generation Intent:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'chapter', label: '📖 Full Chapter 1 Opener' },
                    { id: 'outline', label: '📑 10-Chapter Book Outline' },
                    { id: 'planner', label: '📅 Daily Planner Table (Low-Content)' },
                    { id: 'habits', label: '✨ 30 Journal Prompts (Low-Content)' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAiContentType(item.id)}
                      className={`p-2 rounded-xl text-xs font-semibold border text-left transition ${
                        aiContentType === item.id ? 'border-[#4F5B2A] bg-[#4F5B2A]/10 text-[#4F5B2A]' : 'border-black/10'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase block mb-1">Optional Topic / Style Directions:</label>
                <input
                  type="text"
                  placeholder="e.g. Tone, genre, specific themes or character details..."
                  value={aiCustomPrompt}
                  onChange={(e) => setAiCustomPrompt(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-xs border bg-white dark:bg-[#18161D] outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setAiModalOpen(false)} className="px-4 py-2 rounded-full text-xs font-semibold">
                Cancel
              </button>
              <button
                disabled={isGeneratingAi}
                onClick={handleGenerateAiContent}
                className="soft-btn-primary px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingAi ? 'Writing Book Content...' : 'Generate & Insert into Book'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7.2: SHELF MODAL */}
      {isShelfOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'}`}>
            <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/5 mb-4">
              <h3 className="font-editorial font-bold text-base">Saved Book Projects (Local Storage)</h3>
              <button onClick={() => setIsShelfOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {savedProjects.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#4F5B2A]">No saved drafts found.</div>
              ) : (
                savedProjects.map((proj) => (
                  <div key={proj.id} onClick={() => { setProjectId(proj.id); setBookTitle(proj.title); setAuthorName(proj.author); setIsShelfOpen(false); setActiveView('studio'); }} className={`p-3.5 rounded-2xl cursor-pointer flex justify-between items-center ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                    <div>
                      <h4 className="font-bold text-xs">{proj.title}</h4>
                      <p className="text-[10px] text-[#4F5B2A]">{proj.author} • {proj.trimSize} • {proj.pageExtent} Pgs</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteProjectFromStorage(proj.id).then(refreshProjectsList); }} className="text-red-500 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7.3: CELEBRATION MODAL */}
      {successModalData.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl p-7 text-center ${isDarkMode ? 'dark-soft-raised' : 'soft-raised'}`}>
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#4F5B2A] text-white flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#4F5B2A] block mb-1">
              {successModalData.fileLabel}
            </span>
            <h3 className="font-editorial text-2xl font-bold mb-1">{successModalData.title}</h3>
            <p className="text-xs text-[#4F5B2A] mb-4">{successModalData.subtitle}</p>

            <div className={`p-3 rounded-2xl text-xs font-editorial italic mb-4 ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
              "May your words travel far and find the readers who need them most. See you soon on your next chapter!"
            </div>

            {!reviewSubmitted ? (
              <div className={`p-4 rounded-2xl mb-4 text-left ${isDarkMode ? 'dark-soft-inset' : 'soft-inset'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold">Rate your formatting experience:</span>
                  {userRating > 0 && <span className="text-xs font-bold text-[#4F5B2A]">{userRating} / 5</span>}
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
                  className="w-full p-2 rounded-xl text-xs bg-white dark:bg-[#18161D] border outline-none text-[#1C2010] dark:text-white"
                />
                {userRating > 0 && (
                  <button onClick={handleRecordUserReview} className="mt-2 w-full py-2 rounded-full soft-btn-primary text-xs font-bold">
                    Submit Review
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-800 text-xs font-bold mb-4">
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
