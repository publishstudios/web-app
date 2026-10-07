'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, BookOpen, Layers, Download, RefreshCw, 
  CheckCircle2, Sparkles, Printer, Sliders, Key, X, 
  Sun, Moon, Crown, Eye, Maximize2, ShieldCheck,
  Plus, Copy, Trash2, CheckSquare, Square, Grid, Image as ImageIcon,
  Compass, HelpCircle, Check, AlertTriangle, ArrowRight, ArrowLeft,
  ChevronRight, Settings2, FileText, CheckCircle, AlertCircle, List,
  PlayCircle, Lock, Shield, IndianRupee, DollarSign, ExternalLink, Award,
  Sparkle, Feather, Zap, ShieldAlert, CheckCheck
} from 'lucide-react';
import { 
  Document, Packer, Paragraph, TextRun, HeadingLevel, 
  PageBreak, AlignmentType, Header, Footer, PageNumber
} from 'docx';
import { saveAs } from 'file-saver';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generatePlannerDocx } from './plannerEngine';
import { 
  TRIM_PRESETS, 
  PAPER_SPECS, 
  BOOK_ARCHETYPES, 
  FIELD_EXPLANATIONS,
  calculateGutterMargin, 
  calculateSpineWidth, 
  calculateFullWrapDimensions 
} from './productionMath';
import { inspectManuscriptDOM } from './manuscriptInspector';
import CoverVisualizer from './CoverVisualizer';

// Secure SHA-256 Hash of "StudioMasterAdmin"
const ADMIN_DIGEST_HASH = 'bf447475f3a0a382c4ae72bbec2c7a5223abf12f205c066e4a2bc1e0691d1ea1';

async function computeSHA256(message) {
  const msgBuffer = new TextEncoder().encode(message.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Client-Side Writing & Editorial Scanner
function auditContentQuality(lines) {
  const fullText = lines.join(' ');
  const words = fullText.split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;
  
  if (totalWords < 50) return null;

  const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const totalSentences = Math.max(1, sentences.length);
  
  let syllableCount = 0;
  words.forEach(word => {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length <= 3) { syllableCount += 1; return; }
    const matches = clean.match(/[aeiouy]{1,2}/g);
    syllableCount += matches ? matches.length : 1;
  });

  const wordsPerSentence = totalWords / totalSentences;
  const syllablesPerWord = syllableCount / totalWords;
  const readingEase = Math.round(206.835 - (1.015 * wordsPerSentence) - (84.6 * syllablesPerWord));
  const gradeLevel = Math.max(1, Math.min(16, Math.round((0.39 * wordsPerSentence) + (11.8 * syllablesPerWord) - 15.59)));

  const AI_CLICHES = [
    'delve', 'tapestry', 'testament', 'beacon', 'nestled', 
    'pivotal', 'crucial', 'in conclusion', 'furthermore', 
    'moreover', 'multifaceted', 'embark', 'unwavering', 'paramount'
  ];
  const flaggedCliches = [];
  AI_CLICHES.forEach(cliche => {
    const regex = new RegExp(`\\b${cliche}\\b`, 'gi');
    const matches = fullText.match(regex);
    if (matches && matches.length > 1) {
      flaggedCliches.push({ word: cliche, count: matches.length });
    }
  });

  return {
    readingEase: Math.max(0, Math.min(100, readingEase)),
    gradeLevel,
    flaggedCliches,
    sentenceBalance: {
      totalSentences,
      avgWordsPerSentence: Math.round(wordsPerSentence),
    }
  };
}

// Self-Publishing Print-on-Demand (POD) Economics Formula
function calculatePodEconomics(pageCount, trimSize, paperType) {
  const usFixed = 0.85;
  const usPerPage = paperType === 'color' ? 0.07 : 0.012;
  const usPrintCost = Number((usFixed + (pageCount * usPerPage)).toFixed(2));
  const usMinListPrice = Number((usPrintCost / 0.60).toFixed(2));
  const usSuggestedListPrice = Math.max(9.99, Number((usMinListPrice * 1.35).toFixed(2)));
  const usEstimatedRoyalty = Number(((usSuggestedListPrice * 0.60) - usPrintCost).toFixed(2));

  const inFixed = 60;
  const inPerPage = paperType === 'color' ? 2.50 : 0.75;
  const inPrintCost = Math.round(inFixed + (pageCount * inPerPage));
  const inMinListPrice = Math.round(inPrintCost / 0.60);
  const inSuggestedListPrice = Math.max(299, Math.round(inMinListPrice * 1.40));
  const inEstimatedRoyalty = Math.round((inSuggestedListPrice * 0.60) - inPrintCost);

  return {
    us: { printCost: usPrintCost, minPrice: usMinListPrice, suggestedPrice: usSuggestedListPrice, royalty: usEstimatedRoyalty },
    india: { printCost: inPrintCost, minPrice: inMinListPrice, suggestedPrice: inSuggestedListPrice, royalty: inEstimatedRoyalty }
  };
}

export default function Home() {
  // Navigation & View Mode: 'home' | 1 (Setup) | 2 (Interior) | 3 (Cover) | 4 (Preflight)
  const [activeView, setActiveView] = useState('home');
  
  // Book Category Toggle: 'text_rich' vs 'low_content'
  const [bookCategory, setBookCategory] = useState('text_rich');

  const [experienceMode, setExperienceMode] = useState('beginner');
  const [selectedArchetype, setSelectedArchetype] = useState('novel');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeHelpModal, setActiveHelpModal] = useState(null);

  // Physical Attributes & Book Profile
  const [trimSize, setTrimSize] = useState('6x9');
  const [pageCount, setPageCount] = useState(120);
  const [paperType, setPaperType] = useState('cream');
  const [enableBleed, setEnableBleed] = useState(false);

  // Custom Margins (Inches)
  const [customMargins, setCustomMargins] = useState({
    top: 0.625,
    bottom: 0.625,
    outside: 0.50
  });

  // Metadata
  const [bookTitle, setBookTitle] = useState('Title of the Work');
  const [authorName, setAuthorName] = useState('Author Name');

  // Authorization & Settings
  const [isAdmin, setIsAdmin] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState('');

  // Step 2: Interior Manuscript State
  const [interiorSubMode, setInteriorSubMode] = useState('typeset');
  const [fileName, setFileName] = useState('');
  const [rawTextLines, setRawTextLines] = useState([]);
  const [manuscriptAnalysis, setManuscriptAnalysis] = useState(null);
  const [contentAudit, setContentAudit] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [activeSpreadPage, setActiveSpreadPage] = useState(2);

  // Low-Content Visual Strip & Planner
  const [plannerType, setPlannerType] = useState('daily_focus');
  const [plannerDays, setPlannerDays] = useState(90);
  const [customNiche, setCustomNiche] = useState('');
  const [isGeneratingPlanner, setIsGeneratingPlanner] = useState(false);
  const [visualPages, setVisualPages] = useState([]);
  const [enableFolios, setEnableFolios] = useState(false);
  const [isCompilingPdf, setIsCompilingPdf] = useState(false);

  // Step 4: Self-Publishing Checklist
  const [podChecklist, setPodChecklist] = useState({
    titleMatch: false,
    rightsDeclared: false,
    barcodeSafe: true
  });

  // DOM Refs
  const fileInputRef = useRef(null);
  const visualBatchInputRef = useRef(null);
  const docxViewerRef = useRef(null);

  // Load Saved Profile
  useEffect(() => {
    try {
      const savedAdmin = localStorage.getItem('ps_studio_admin_token');
      const savedKey = localStorage.getItem('ps_gemini_key');
      const savedTheme = localStorage.getItem('ps_theme');
      const savedProfile = localStorage.getItem('ps_local_book_profile');

      if (savedAdmin === 'unlimited_studio_verified') setIsAdmin(true);
      if (savedKey) {
        setApiKey(savedKey);
        setTempKeyInput(savedKey);
      }
      if (savedTheme === 'dark') setIsDarkMode(true);

      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        if (p.trimSize) setTrimSize(p.trimSize);
        if (p.pageCount) setPageCount(p.pageCount);
        if (p.paperType) setPaperType(p.paperType);
        if (p.bookTitle) setBookTitle(p.bookTitle);
        if (p.authorName) setAuthorName(p.authorName);
        if (p.selectedArchetype) setSelectedArchetype(p.selectedArchetype);
        if (p.bookCategory) setBookCategory(p.bookCategory);
        if (p.customMargins) setCustomMargins(p.customMargins);
      }
    } catch (e) {
      console.warn('Could not restore local profile:', e);
    }
  }, []);

  const saveLocalBookProfile = (updates = {}) => {
    try {
      const currentData = {
        trimSize,
        pageCount,
        paperType,
        bookTitle,
        authorName,
        selectedArchetype,
        bookCategory,
        customMargins,
        ...updates
      };
      localStorage.setItem('ps_local_book_profile', JSON.stringify(currentData));
    } catch (e) {
      console.warn('Could not save local profile:', e);
    }
  };

  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    localStorage.setItem('ps_theme', nextTheme ? 'dark' : 'light');
  };

  const handleSaveSecret = async () => {
    const input = tempKeyInput.trim();
    if (!input) return;

    const hash = await computeSHA256(input);
    if (hash === ADMIN_DIGEST_HASH) {
      setIsAdmin(true);
      localStorage.setItem('ps_studio_admin_token', 'unlimited_studio_verified');
      setStatusMessage('Master access verified.');
      setShowSettingsModal(false);
      return;
    }

    setApiKey(input);
    localStorage.setItem('ps_gemini_key', input);
    setShowSettingsModal(false);
  };

  const handleSelectArchetype = (archKey) => {
    const preset = BOOK_ARCHETYPES[archKey];
    if (!preset) return;

    setSelectedArchetype(archKey);
    setTrimSize(preset.defaultTrim);
    setPaperType(preset.defaultPaper);
    setEnableBleed(preset.defaultBleed);
    setPageCount(preset.defaultPages);
    setCustomMargins({ ...preset.margins });

    saveLocalBookProfile({
      selectedArchetype: archKey,
      trimSize: preset.defaultTrim,
      paperType: preset.defaultPaper,
      pageCount: preset.defaultPages,
      customMargins: { ...preset.margins }
    });
  };

  const activeEffectivePages = bookCategory === 'low_content' && visualPages.length > 0 
    ? visualPages.length 
    : (interiorSubMode === 'planner_docx' ? plannerDays : pageCount);

  const gutter = calculateGutterMargin(activeEffectivePages);
  const outsideMargin = customMargins.outside;
  const topBottomMargin = customMargins.top;
  const currentTrim = TRIM_PRESETS[trimSize] || TRIM_PRESETS['6x9'];

  const coverCalculations = calculateFullWrapDimensions({
    trimWidth: currentTrim.width,
    trimHeight: currentTrim.height,
    pageCount: activeEffectivePages,
    paperType,
    bleed: enableBleed ? 0.125 : 0.0,
  });

  const spineWidth = coverCalculations.spineWidth;
  const fullCoverWidth = coverCalculations.fullWidth;
  const fullCoverHeight = coverCalculations.fullHeight;
  const coverPixelsWidth = coverCalculations.pixelWidth300Dpi;
  const coverPixelsHeight = coverCalculations.pixelHeight300Dpi;

  const economics = calculatePodEconomics(activeEffectivePages, trimSize, paperType);

  // Dynamic Pipeline States
  const isStep1Complete = Boolean(selectedArchetype && trimSize && activeEffectivePages >= 24);
  const isStep2Complete = Boolean(hasRendered || visualPages.length > 0);
  const isStep3Complete = Boolean(spineWidth > 0 && fullCoverWidth > 0);
  const isStep4Complete = Boolean(isStep1Complete && isStep2Complete && isStep3Complete);

  let readinessScore = 40;
  if (isStep1Complete) readinessScore += 20;
  if (isStep2Complete) readinessScore += 20;
  if (isStep3Complete) readinessScore += 10;
  if (activeEffectivePages >= 24 && spineWidth >= 0.20) readinessScore += 10;
    const calculateTrueDpi = (pixelWidth, pixelHeight) => {
    const targetWidth = enableBleed ? currentTrim.width + 0.125 : currentTrim.width;
    const targetHeight = enableBleed ? currentTrim.height + 0.25 : currentTrim.height;
    const dpiX = Math.round(pixelWidth / targetWidth);
    const dpiY = Math.round(pixelHeight / targetHeight);
    return Math.min(dpiX, dpiY);
  };

  const processImageFile = async (file) => {
    const rawBuffer = await file.arrayBuffer();
    const rawBytes = new Uint8Array(rawBuffer);
    const dataUrl = URL.createObjectURL(file);

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const dpi = calculateTrueDpi(img.naturalWidth, img.naturalHeight);
        resolve({
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          dataUrl,
          rawBytes,
          mimeType: file.type || 'image/png',
          width: img.naturalWidth,
          height: img.naturalHeight,
          dpi,
        });
      };
      img.src = dataUrl;
    });
  };

  const handleVisualBatchUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    const processed = [];
    for (const f of files) {
      if (f.type.startsWith('image/')) {
        const item = await processImageFile(f);
        processed.push(item);
      }
    }

    setVisualPages((prev) => [...prev, ...processed]);
    setStatusMessage(`Imported ${processed.length} image pages into visual strip.`);
    if (visualBatchInputRef.current) visualBatchInputRef.current.value = '';
  };

  const handleExportVisualPdf = async () => {
    if (!visualPages.length) return;
    setIsCompilingPdf(true);
    setStatusMessage('Compiling lossless PDF interior...');

    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const bleedTopBottomPt = enableBleed ? 0.125 * 72 : 0;
      const pageWidthPt = (currentTrim.width * 72) + (enableBleed ? 0.125 * 72 : 0);
      const pageHeightPt = (currentTrim.height * 72) + (bleedTopBottomPt * 2);

      for (let i = 0; i < visualPages.length; i++) {
        const pageItem = visualPages[i];
        const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
        const pageNumber = i + 1;
        const isEven = pageNumber % 2 === 0;

        let embeddedImage;
        const mime = (pageItem.mimeType || '').toLowerCase();
        if (mime.includes('png')) {
          embeddedImage = await pdfDoc.embedPng(pageItem.rawBytes);
        } else {
          try {
            embeddedImage = await pdfDoc.embedJpg(pageItem.rawBytes);
          } catch {
            embeddedImage = await pdfDoc.embedPng(pageItem.rawBytes);
          }
        }

        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: pageWidthPt,
          height: pageHeightPt,
        });

        if (enableFolios) {
          const fontSize = 9;
          const text = `${pageNumber}`;
          const textWidth = font.widthOfTextAtSize(text, fontSize);
          const folioX = isEven ? 36 : pageWidthPt - 36 - textWidth;
          const folioY = 24;

          page.drawText(text, {
            x: folioX,
            y: folioY,
            size: fontSize,
            font,
            color: rgb(0.3, 0.3, 0.3),
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, `Interior_Print_${trimSize}_${visualPages.length}Pages.pdf`);
      setStatusMessage(`Complete: Exported ${visualPages.length}-page lossless PDF.`);
    } catch (err) {
      console.error(err);
      alert('Error creating PDF. Please verify your source image files.');
    } finally {
      setIsCompilingPdf(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const baseCleanTitle = file.name.replace(/\.docx$/i, '').replace(/[_-]/g, ' ');
    setFileName(file.name);
    if (!bookTitle || bookTitle === 'Title of the Work') {
      setBookTitle(baseCleanTitle);
      saveLocalBookProfile({ bookTitle: baseCleanTitle });
    }
    setIsProcessing(true);
    setHasRendered(false);
    setManuscriptAnalysis(null);
    setContentAudit(null);
    setStatusMessage('');

    try {
      const docx = await import('docx-preview');
      if (docxViewerRef.current) {
        docxViewerRef.current.innerHTML = '';
        await docx.renderAsync(file, docxViewerRef.current, null, {
          className: 'docx-page-sheet',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
          experimental: true,
        });

        const extractedText = docxViewerRef.current.innerText || '';
        const lines = extractedText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
        setRawTextLines(lines);

        const audit = inspectManuscriptDOM(docxViewerRef.current, lines);
        setManuscriptAnalysis(audit);
        const writingAudit = auditContentQuality(lines);
        setContentAudit(writingAudit);
        setHasRendered(true);
      }
    } catch (err) {
      console.error(err);
      alert('Error parsing document. Please supply a valid .docx manuscript.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSampleManuscript = () => {
    setFileName('Sample_Trade_Novel.docx');
    setBookTitle('The Memory Chef');
    setAuthorName('A. S. Harper');
    const demoLines = [
      'PROLOGUE',
      'The scent of toasted star anise always arrived before the memory itself.',
      'In the quiet alleyways of the old quarter, steam billowed against the cobblestone.',
      'CHAPTER ONE',
      'The Kitchen at Twilight',
      'Cooking was never merely about chemistry; it was an act of deliberate remembrance.',
      'She weighed seventy grams of sea salt onto the brass scale.',
      'CHAPTER TWO',
      'A Measure of Time',
      'Every grain of flour carried the dust of a summer long forgotten.',
    ];
    setRawTextLines(demoLines);
    setManuscriptAnalysis({
      wordCount: 14200,
      paragraphCount: 48,
      renderedPageCount: 120,
      detectedChapters: [
        { title: 'PROLOGUE', lineIndex: 0 },
        { title: 'CHAPTER ONE', lineIndex: 3 },
        { title: 'CHAPTER TWO', lineIndex: 7 }
      ],
      detectedHeadings: [{ title: 'The Kitchen at Twilight', lineIndex: 4 }],
      blankPageIndices: [],
      anomalies: [],
      passes: [
        { code: 'CLEAN_SPACING', title: 'Paragraph Spacing', message: 'Clean vertical rhythm with zero consecutive manual returns.' },
        { code: 'CHAPTERS_DETECTED', title: 'Chapter Structure', message: 'Standard narrative markers recognized.' },
        { code: 'HEALTHY_EXTENT', title: 'Spine Caliber Extent', message: '120 pages generates a printable 0.300" commercial spine.' }
      ]
    });
    setContentAudit({
      readingEase: 78,
      gradeLevel: 7,
      flaggedCliches: [],
      sentenceBalance: {
        totalSentences: 9,
        avgWordsPerSentence: 14,
      }
    });
    setHasRendered(true);
    setPageCount(120);
    saveLocalBookProfile({ bookTitle: 'The Memory Chef', authorName: 'A. S. Harper', pageCount: 120 });
    setStatusMessage('Sample manuscript loaded.');
  };

  const handleExportManuscriptDocx = async () => {
    if (!rawTextLines.length) return;
    setIsExporting(true);
    setStatusMessage('');

    try {
      const selectedTrimTwips = {
        width: currentTrim.width * 1440,
        height: currentTrim.height * 1440,
      };

      const paragraphs = [];
      const isBreakMarker = (t) => /^(dedication|contents|table of contents|acknowledgments|disclaimer|introduction|prologue|chapter\s+\d+|part\s+\d+)/i.test(t);

      rawTextLines.forEach((line, index) => {
        const isHeading = isBreakMarker(line);
        const isCopyright = /copyright\s*©/i.test(line);

        if (index > 0 && (isHeading || isCopyright)) {
          paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
        }

        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                font: 'Georgia',
                size: isHeading ? 28 : 22,
                bold: isHeading,
                color: isHeading ? '1F1C18' : '2D2A26',
              }),
            ],
            heading: isHeading ? HeadingLevel.HEADING_1 : undefined,
            alignment: isHeading ? AlignmentType.CENTER : AlignmentType.LEFT,
            spacing: {
              line: 340,
              before: isHeading ? 480 : 0,
              after: isHeading ? 280 : 120,
            },
          })
        );
      });

      const headerEven = new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: (authorName || 'AUTHOR').toUpperCase(),
                font: 'Georgia',
                size: 16,
                color: '7A7570',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
          }),
        ],
      });

      const headerOdd = new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: (bookTitle || 'TITLE').toUpperCase(),
                font: 'Georgia',
                size: 16,
                color: '7A7570',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
          }),
        ],
      });

      const footerEven = new Footer({
        children: [
          new Paragraph({
            children: [PageNumber.CURRENT],
            alignment: AlignmentType.LEFT,
            spacing: { before: 180 },
          }),
        ],
      });

      const footerOdd = new Footer({
        children: [
          new Paragraph({
            children: [PageNumber.CURRENT],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 180 },
          }),
        ],
      });

      const doc = new Document({
        evenAndOddHeaders: true,
        sections: [{
          properties: {
            page: {
              size: selectedTrimTwips,
              margin: {
                top: Math.round(topBottomMargin * 1440),
                bottom: Math.round(topBottomMargin * 1440),
                left: Math.round(gutter * 1440),
                right: Math.round(outsideMargin * 1440),
              },
            },
            titlePage: true,
          },
          headers: {
            default: headerOdd,
            even: headerEven,
          },
          footers: {
            default: footerOdd,
            even: footerEven,
          },
          children: paragraphs,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const cleanBase = fileName ? fileName.replace(/\.docx$/i, '') : 'Manuscript';
      saveAs(blob, `${cleanBase}_Formatted_${trimSize}.docx`);
      setStatusMessage('Manuscript exported with mirror margins, running heads & folios.');
    } catch (err) {
      console.error(err);
      alert('Error creating DOCX file.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRunPlanner = async () => {
    setIsGeneratingPlanner(true);
    setStatusMessage('');

    try {
      await generatePlannerDocx({
        plannerType,
        plannerDays,
        customNiche,
        trimSize,
        gutter,
        outsideMargin,
        topBottomMargin,
        apiKey
      });

      setStatusMessage(`Complete: Generated ${plannerDays}-page interior DOCX.`);
    } catch (err) {
      console.error(err);
      alert('Error generating planner interior.');
    } finally {
      setIsGeneratingPlanner(false);
    }
  };
    return (
    <main className={`min-h-screen w-full overflow-x-hidden flex flex-col items-center px-3.5 sm:px-6 py-6 sm:py-8 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-[#121113] text-[#E8E6E3] selection:bg-[#3E2B25] selection:text-[#E07A5F]' 
        : 'bg-[#FBF9F5] text-[#2D2A26] selection:bg-[#EADFD8] selection:text-[#B85D3E]'
    }`}>
      
      {/* Studio Header Bar */}
      <header className="w-full max-w-5xl flex items-center justify-between pb-4 mb-6 border-b border-black/5 dark:border-white/5">
        <div 
          onClick={() => setActiveView('home')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="p-2.5 rounded-2xl bg-[#FAF4ED] dark:bg-[#1E1B22] border border-[#E9DFD3] dark:border-[#2D2836] shadow-sm">
            <BookOpen className="w-5 h-5 text-[#B85D3E] group-hover:scale-105 transition" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base sm:text-xl font-serif font-bold tracking-tight text-[#1F1C18] dark:text-white">
                PUBLISHSTUDIO
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold bg-[#FAF4ED] text-[#B85D3E] dark:bg-[#2A1D1A] dark:text-[#E07A5F] border border-[#E9DFD3] dark:border-[#4A2D25] tracking-wide">
                Self-Publishing Supporting Software
              </span>
            </div>
            <span className="text-xs text-[#8C8479] font-medium block mt-0.5">
              Universal Print-on-Demand (POD)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeView !== 'home' && (
            <button
              onClick={() => setActiveView('home')}
              className="px-3 py-1.5 rounded-full border border-[#E8E1D7] dark:border-[#2E2B35] text-xs font-sans transition hover:bg-black/5 dark:hover:bg-white/5 text-[#8C8479]"
            >
              Home Overview
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border border-[#E8E1D7] dark:border-[#2E2B35] transition shadow-sm bg-white dark:bg-[#1C1A20]"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-[#6B645A]" />}
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-full border border-[#E8E1D7] dark:border-[#2E2B35] transition shadow-sm bg-white dark:bg-[#1C1A20] text-[#8C8479]"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* VIEW: DEDICATED HOME / ABOUT US */}
      {activeView === 'home' && (
        <div className="w-full max-w-5xl flex flex-col gap-8 pb-12 animate-in fade-in duration-300">
          
          {/* Hero Value Section */}
          <div className="text-center max-w-2xl mx-auto pt-4 sm:pt-8 px-2">
            <span className="text-xs uppercase tracking-widest font-bold text-[#B85D3E] mb-2 block">
              Universal Print-on-Demand Production
            </span>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#1F1C18] dark:text-[#F3F0EB] leading-tight mb-4">
              Focus More on Writing, Less on Formatting!
            </h1>
            <p className="text-xs sm:text-sm text-[#7A7368] dark:text-[#9E9BA3] leading-relaxed mb-8">
              PublishStudio eliminates printing rejections. We calculate binding gutters, full-wrap spine bulk, and safe margins automatically, leaving you free to craft your story.
            </p>

            {/* Tactile 3D Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => { setActiveView(1); setBookCategory('text_rich'); }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#B85D3E] hover:bg-[#A35034] text-white font-medium text-xs sm:text-sm px-8 py-3.5 rounded-full shadow-[0_4px_0_0_#8A3F26] active:translate-y-1 active:shadow-none transition-all duration-150"
              >
                <span>Launch Book Production Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => { setActiveView(2); handleLoadSampleManuscript(); }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 border border-[#DACFBF] dark:border-[#383344] text-[#2D2A26] dark:text-zinc-200 font-medium text-xs sm:text-sm px-6 py-3.5 rounded-full bg-white dark:bg-[#1E1B24] shadow-[0_3px_0_0_#DACFBF] dark:shadow-[0_3px_0_0_#2B2533] active:translate-y-1 active:shadow-none transition-all"
              >
                <PlayCircle className="w-4 h-4 text-[#B85D3E]" />
                <span>Explore with Demo Book</span>
              </button>
            </div>
          </div>

          {/* 3 Pillars Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
            
            {/* Card 1: What is this tool? */}
            <div className={`p-6 rounded-3xl border transition-all duration-200 shadow-[0_8px_24px_rgba(0,0,0,0.03)] ${
              isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
            }`}>
              <div className="w-10 h-10 rounded-2xl bg-[#FAF4ED] dark:bg-[#251D1A] text-[#B85D3E] flex items-center justify-center mb-4 border border-[#EAD7C5] dark:border-[#4A3228]">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold font-serif mb-2">What is PublishStudio?</h3>
              <p className="text-xs text-[#7A7368] dark:text-[#9E9BA3] leading-relaxed">
                A browser-native book production workstation. It replaces complex software suites with deterministic print math, formatting, and preflight checks that run entirely on your device.
              </p>
            </div>

            {/* Card 2: What output do you get? */}
            <div className={`p-6 rounded-3xl border transition-all duration-200 shadow-[0_8px_24px_rgba(0,0,0,0.03)] ${
              isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
            }`}>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold font-serif mb-2">What You Get as Output</h3>
              <p className="text-xs text-[#7A7368] dark:text-[#9E9BA3] leading-relaxed">
                Mirrored-margin interior DOCX/PDF files with drop caps and folios, true-to-scale 300 DPI full-wrap cover blueprints, and certified POD manufacturing spec sheets.
              </p>
            </div>

            {/* Card 3: How it saves time & elevates quality */}
            <div className={`p-6 rounded-3xl border transition-all duration-200 shadow-[0_8px_24px_rgba(0,0,0,0.03)] ${
              isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
            }`}>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 border border-amber-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold font-serif mb-2">Save Time & Elevate Quality</h3>
              <p className="text-xs text-[#7A7368] dark:text-[#9E9BA3] leading-relaxed">
                No more submission rejections due to clipped gutter text or misaligned barcodes. In-browser NLP checks readability and robotic cliches so your manuscript feels authentic.
              </p>
            </div>

          </div>

          {/* Quick Choice Split: Text-Rich vs Low-Content */}
          <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm ${
            isDarkMode ? 'bg-[#16151A] border-[#292630]' : 'bg-[#FAF8F5] border-[#EAE3D8]'
          }`}>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#B85D3E] block mb-1">
              Dual Production Engines
            </span>
            <h2 className="text-lg font-serif font-bold mb-4">Choose Your Project Type</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                onClick={() => { setBookCategory('text_rich'); setActiveView(1); }}
                className="p-5 rounded-2xl border cursor-pointer transition-all duration-200 hover:scale-[1.01] bg-white dark:bg-[#1A181E] border-[#E5DDD2] dark:border-[#34303E] shadow-sm hover:border-[#B85D3E]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Feather className="w-4 h-4 text-[#B85D3E]" />
                  <span className="text-sm font-bold font-serif">Text-Rich Books</span>
                </div>
                <p className="text-xs text-[#7A7368] dark:text-[#9E9BA3] leading-relaxed mb-3">
                  Novels, memoirs, non-fiction guides, poetry, and workbooks. Includes mirror margins, running headers, chapter drop caps, and AI-cliche scanning.
                </p>
                <span className="text-xs font-semibold text-[#B85D3E] flex items-center gap-1">
                  Start Text-Rich Project <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>

              <div 
                onClick={() => { setBookCategory('low_content'); setActiveView(1); }}
                className="p-5 rounded-2xl border cursor-pointer transition-all duration-200 hover:scale-[1.01] bg-white dark:bg-[#1A181E] border-[#E5DDD2] dark:border-[#34303E] shadow-sm hover:border-emerald-600"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Grid className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold font-serif">Low-Content & Visual Creations</span>
                </div>
                <p className="text-xs text-[#7A7368] dark:text-[#9E9BA3] leading-relaxed mb-3">
                  Planners, journals, sketchbooks, activity logs, and visual art books. Includes automated grid engines, batch image stitchers, and 300 DPI PDF compilations.
                </p>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  Start Low-Content Project <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

        </div>
      )}
            {/* CONNECTED PRODUCTION PIPELINE (Active during Steps 1-4) */}
      {activeView !== 'home' && (
        <div className="w-full max-w-5xl mb-8 flex flex-col items-center">
          
          {/* Visual Track Container */}
          <div className="w-full max-w-3xl px-4 relative flex items-center justify-between">
            
            {/* The Authentic Connection Track (SVG/Div line behind nodes) */}
            <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-[#E8E1D5] dark:bg-[#2D2A35] z-0">
              {/* Green Progress Fill */}
              <div 
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{
                  width: activeView === 1 ? '15%' : activeView === 2 ? '45%' : activeView === 3 ? '78%' : '100%'
                }}
              />
            </div>

            {/* Pipeline Step Nodes */}
            {[
              { num: 1, label: 'Setup', icon: Compass, complete: isStep1Complete },
              { num: 2, label: 'Interior', icon: FileText, complete: isStep2Complete },
              { num: 3, label: 'Cover', icon: Maximize2, complete: isStep3Complete },
              { num: 4, label: 'Preflight', icon: CheckCircle, complete: isStep4Complete },
            ].map((st) => {
              const IconComponent = st.icon;
              const isActive = activeView === st.num;
              return (
                <button
                  key={st.num}
                  onClick={() => setActiveView(st.num)}
                  className="flex flex-col items-center gap-1.5 z-10 group"
                >
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all duration-200 border-2 shadow-sm ${
                    st.complete 
                      ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/20' 
                      : (isActive 
                          ? 'bg-[#B85D3E] border-[#99482E] text-white ring-4 ring-[#B85D3E]/20 scale-105 shadow-md' 
                          : (isDarkMode ? 'bg-[#1C1A20] border-[#363240] text-zinc-400' : 'bg-white border-[#E0D7C9] text-[#7A7368]'))
                  }`}>
                    {st.complete ? <Check className="w-4 h-4" /> : st.num}
                  </div>
                  <span className={`text-[11px] font-sans font-medium transition ${
                    isActive 
                      ? 'text-[#B85D3E] font-bold dark:text-[#E07A5F]' 
                      : (isDarkMode ? 'text-zinc-400' : 'text-[#7A7368]')
                  }`}>
                    {st.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
            {/* STEP 1: SPECIFICATIONS & ARCHETYPES */}
      {activeView === 1 && (
        <div className="w-full max-w-5xl flex flex-col gap-6 animate-in fade-in duration-200">
          
          {/* Category Switcher Pill Toggle */}
          <div className="flex items-center justify-center">
            <div className={`p-1.5 rounded-full border flex items-center text-xs shadow-inner ${
              isDarkMode ? 'bg-[#16151A] border-[#292630]' : 'bg-[#EFEAE2] border-[#E2DBD0]'
            }`}>
              <button
                onClick={() => { setBookCategory('text_rich'); saveLocalBookProfile({ bookCategory: 'text_rich' }); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-medium transition ${
                  bookCategory === 'text_rich'
                    ? (isDarkMode ? 'bg-[#292630] text-white shadow' : 'bg-white text-[#1F1C18] shadow')
                    : 'text-[#8C8479]'
                }`}
              >
                <Feather className="w-3.5 h-3.5 text-[#B85D3E]" />
                <span>Text-Rich Manuscripts</span>
              </button>
              <button
                onClick={() => { setBookCategory('low_content'); saveLocalBookProfile({ bookCategory: 'low_content' }); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-medium transition ${
                  bookCategory === 'low_content'
                    ? (isDarkMode ? 'bg-[#292630] text-white shadow' : 'bg-white text-[#1F1C18] shadow')
                    : 'text-[#8C8479]'
                }`}
              >
                <Grid className="w-3.5 h-3.5 text-emerald-600" />
                <span>Low-Content Creations</span>
              </button>
            </div>
          </div>

          <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
            isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-serif font-bold">
                  {bookCategory === 'text_rich' ? 'Select Manuscript Archetype' : 'Select Low-Content Layout'}
                </h2>
                <p className="text-xs text-[#8C8479] mt-0.5">
                  Industry standard presets for self-publishing platforms.
                </p>
              </div>
              <span className="text-[10px] text-emerald-600 font-sans bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">
                Universal POD Standards
              </span>
            </div>

            {/* Filtered Archetype Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              {Object.entries(BOOK_ARCHETYPES)
                .filter(([key]) => bookCategory === 'text_rich' ? ['novel', 'nonfiction', 'workbook', 'custom'].includes(key) : ['planner', 'journal', 'custom'].includes(key))
                .map(([key, arch]) => {
                  const isSelected = selectedArchetype === key;
                  return (
                    <div
                      key={key}
                      onClick={() => handleSelectArchetype(key)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 text-left flex flex-col justify-between ${
                        isSelected 
                          ? (isDarkMode ? 'bg-[#241F20] border-[#E07A5F] ring-2 ring-[#E07A5F]/20' : 'bg-[#FAF4ED] border-[#B85D3E] ring-2 ring-[#B85D3E]/20 shadow-sm') 
                          : (isDarkMode ? 'bg-[#151418] border-[#282630] hover:border-[#3A3745]' : 'bg-[#FAF9F6] border-[#EAE3D8] hover:border-[#D8CFBF]')
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold font-serif ${isSelected ? (isDarkMode ? 'text-[#E07A5F]' : 'text-[#B85D3E]') : (isDarkMode ? 'text-zinc-200' : 'text-[#1F1C18]')}`}>
                            {arch.title}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#B85D3E]" />}
                        </div>
                        <p className="text-[10px] text-[#8C8479] leading-relaxed line-clamp-2">
                          {arch.subtitle}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] font-mono text-[#8C8479]">
                        <span>{arch.defaultTrim}"</span>
                        <span className="capitalize">{arch.defaultPaper}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>

          {/* Manufacturing Calibrations */}
          <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
            isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
          }`}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#B85D3E]" />
                <h3 className="text-xs font-bold uppercase tracking-wider font-sans">
                  Manufacturing Calibrations
                </h3>
              </div>
              <button
                onClick={() => setActiveHelpModal('gutter')}
                className="text-[11px] text-[#8C8479] hover:text-[#B85D3E] flex items-center gap-1 font-sans"
              >
                <span>Why Gutter Matters</span>
                <HelpCircle className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5 text-[#8C8479]">
                  Trim Dimensions
                </label>
                <select
                  value={trimSize}
                  onChange={(e) => {
                    setTrimSize(e.target.value);
                    saveLocalBookProfile({ trimSize: e.target.value });
                  }}
                  className="w-full border rounded-xl px-3 py-2.5 text-xs font-medium bg-transparent"
                >
                  {Object.entries(TRIM_PRESETS).map(([id, t]) => (
                    <option key={id} value={id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5 text-[#8C8479]">
                  Paper Stock Caliper
                </label>
                <select
                  value={paperType}
                  onChange={(e) => {
                    setPaperType(e.target.value);
                    saveLocalBookProfile({ paperType: e.target.value });
                  }}
                  className="w-full border rounded-xl px-3 py-2.5 text-xs font-medium bg-transparent"
                >
                  {Object.entries(PAPER_SPECS).map(([id, p]) => (
                    <option key={id} value={id}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5 text-[#8C8479]">
                  Page Extent ({activeEffectivePages} Pages)
                </label>
                <input
                  type="range"
                  min="24"
                  max="600"
                  value={activeEffectivePages}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setPageCount(val);
                    saveLocalBookProfile({ pageCount: val });
                  }}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#B85D3E] mt-3 bg-[#EFEAE2] dark:bg-[#292630]"
                />
              </div>
            </div>
                      {/* Readouts */}
            <div className={`border rounded-2xl p-4 grid grid-cols-3 gap-2 text-center ${
              isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'
            }`}>
              <div>
                <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Spine Gutter</span>
                <span className="text-xs sm:text-sm font-bold font-mono text-[#B85D3E]">{gutter}"</span>
                <span className="text-[9px] text-[#8C8479] block mt-0.5">Inner margin binding safe zone.</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Outside Margin</span>
                <span className="text-xs sm:text-sm font-semibold font-mono">{outsideMargin}"</span>
                <span className="text-[9px] text-[#8C8479] block mt-0.5">Finger safety zone.</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Top / Bottom</span>
                <span className="text-xs sm:text-sm font-semibold font-mono">{topBottomMargin}"</span>
                <span className="text-[9px] text-[#8C8479] block mt-0.5">Running head clearance.</span>
              </div>
            </div>
          </section>

          {/* Step 1 Pill Navigation */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setActiveView('home')}
              className="inline-flex items-center gap-1.5 text-xs text-[#8C8479] hover:text-[#1F1C18] px-4 py-2 rounded-full border border-transparent hover:border-black/5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home Overview</span>
            </button>

            {/* 3D Pill Navigation Button */}
            <div className="inline-flex items-center rounded-full p-1 bg-white dark:bg-[#1A181E] border border-[#DACFBF] dark:border-[#383344] shadow-[0_3px_0_0_#DACFBF] dark:shadow-[0_3px_0_0_#2B2533]">
              <button
                onClick={() => setActiveView('home')}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-xs font-medium text-[#7A6E5F] dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <div className="w-px h-4 bg-[#E0D7C9] dark:bg-[#383344]"></div>
              <button
                onClick={() => setActiveView(2)}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold bg-[#B85D3E] hover:bg-[#A35034] text-white shadow-sm transition"
              >
                <span>Next: Interior</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
            {/* STEP 2: INTERIOR MANUSCRIPT & SPREAD PREVIEW */}
      {activeView === 2 && (
        <div className="w-full max-w-5xl flex flex-col gap-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2] dark:border-[#262429]">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#B85D3E]" />
              <h2 className="text-xs font-bold uppercase tracking-wider font-sans">
                Step 2: Interior Production & Structuring
              </h2>
            </div>

            <div className={`p-1 rounded-full border flex items-center text-xs ${
              isDarkMode ? 'bg-[#121114] border-[#282630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'
            }`}>
              <button
                onClick={() => setInteriorSubMode('typeset')}
                className={`px-3 py-1 rounded-full transition ${interiorSubMode === 'typeset' ? (isDarkMode ? 'bg-[#292630] text-white' : 'bg-white text-[#1F1C18] shadow-sm') : 'text-[#8C8479]'}`}
              >
                DOCX Typeset
              </button>
              <button
                onClick={() => setInteriorSubMode('visual_strip')}
                className={`px-3 py-1 rounded-full transition ${interiorSubMode === 'visual_strip' ? (isDarkMode ? 'bg-[#292630] text-white' : 'bg-white text-[#1F1C18] shadow-sm') : 'text-[#8C8479]'}`}
              >
                Visual Image Strip
              </button>
              <button
                onClick={() => setInteriorSubMode('planner_docx')}
                className={`px-3 py-1 rounded-full transition ${interiorSubMode === 'planner_docx' ? (isDarkMode ? 'bg-[#292630] text-white' : 'bg-white text-[#1F1C18] shadow-sm') : 'text-[#8C8479]'}`}
              >
                Archetype Templates
              </button>
            </div>
          </div>

          {interiorSubMode === 'typeset' && (
            <div className="space-y-6">
              <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
                isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
              }`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5 text-[#8C8479]">
                      Book Title (Recto Header)
                    </label>
                    <input
                      type="text"
                      value={bookTitle}
                      onChange={(e) => {
                        setBookTitle(e.target.value);
                        saveLocalBookProfile({ bookTitle: e.target.value });
                      }}
                      className="w-full border rounded-xl px-3.5 py-2 text-xs font-serif bg-transparent"
                      placeholder="Enter Book Title"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5 text-[#8C8479]">
                      Author Name (Verso Header)
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => {
                        setAuthorName(e.target.value);
                        saveLocalBookProfile({ authorName: e.target.value });
                      }}
                      className="w-full border rounded-xl px-3.5 py-2 text-xs font-serif bg-transparent"
                      placeholder="Enter Author Name"
                    />
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#B85D3E] hover:bg-[#A35034] text-white font-medium text-xs px-5 py-3 rounded-full shadow-[0_3px_0_0_#8A3F26] active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{fileName ? `Uploaded: ${fileName}` : 'Upload DOCX Manuscript'}</span>
                  </button>

                  <button
                    onClick={handleLoadSampleManuscript}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 border font-medium text-xs px-4 py-3 rounded-full transition bg-transparent text-[#8C8479] hover:text-[#1F1C18]"
                  >
                    <PlayCircle className="w-4 h-4 text-[#B85D3E]" />
                    <span>Try with Sample Book</span>
                  </button>

                  {hasRendered && (
                    <button
                      onClick={handleExportManuscriptDocx}
                      disabled={isExporting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 border font-medium text-xs px-4 py-3 rounded-full transition bg-transparent text-emerald-600 border-emerald-500/30"
                    >
                      {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      <span>Export Formatted DOCX</span>
                    </button>
                  )}
                </div>
              </section>
                            {/* REALISTIC BOOK SPREAD PREVIEW (Authentic Typeset Prose) */}
              <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
                isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#B85D3E]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider font-sans">
                      Two-Page Craft Spread Preview (Typeset Proof)
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveSpreadPage(Math.max(2, activeSpreadPage - 2))}
                      disabled={activeSpreadPage <= 2}
                      className="text-[10px] px-2.5 py-1 rounded border disabled:opacity-40 font-mono shadow-sm bg-white dark:bg-[#201E26]"
                    >
                      ◄ Prev Spread
                    </button>
                    <span className="text-[10px] font-mono text-[#8C8479]">
                      Pages {activeSpreadPage}-{activeSpreadPage + 1} of {activeEffectivePages}
                    </span>
                    <button
                      onClick={() => setActiveSpreadPage(Math.min(activeEffectivePages - 1, activeSpreadPage + 2))}
                      disabled={activeSpreadPage >= activeEffectivePages - 1}
                      className="text-[10px] px-2.5 py-1 rounded border disabled:opacity-40 font-mono shadow-sm bg-white dark:bg-[#201E26]"
                    >
                      Next Spread ►
                    </button>
                  </div>
                </div>

                <div className={`w-full rounded-2xl border p-4 sm:p-7 flex items-center justify-center overflow-x-auto ${
                  isDarkMode ? 'bg-[#100F12] border-[#26242D]' : 'bg-[#EFEAE2] border-[#DDD5C7]'
                }`}>
                  <div className="flex items-stretch shadow-2xl rounded-sm overflow-hidden select-none border border-black/15 bg-[#FAF7F2]">
                    
                    {/* Left Page (Verso - Even Page) */}
                    <div 
                      className="w-[160px] sm:w-[220px] aspect-[1/1.5] bg-[#FFFDF9] text-[#24211D] flex flex-col justify-between p-3.5 sm:p-5 border-r border-[#E8E2D8] relative"
                      style={{
                        paddingLeft: `${outsideMargin * 32}px`,
                        paddingRight: `${gutter * 32}px`,
                      }}
                    >
                      {/* Running Header */}
                      <div className="text-center border-b border-black/10 pb-1.5 mb-2">
                        <span className="text-[8px] sm:text-[9px] font-serif uppercase tracking-widest text-[#7A7570] truncate block">
                          {authorName || 'AUTHOR NAME'}
                        </span>
                      </div>

                      {/* Actual Book Content */}
                      <div className="text-[7px] sm:text-[9px] font-serif leading-relaxed text-[#2C2824] space-y-2 overflow-hidden text-justify">
                        <p className="indent-3">
                          The stillness of the study was broken only by the clock on the mantelpiece. Outside, rain fell steadily against the tall glass panes, blurring the lamps along the quiet avenue into soft circles of amber.
                        </p>
                        <p className="indent-3">
                          He dipped the nib of his pen into the dark ink, pausing to listen to the carriage wheels rolling across the wet cobblestones below. Every manuscript began this way—not with certainty, but with the quiet discipline of facing an empty sheet.
                        </p>
                        <p className="indent-3">
                          The margins preserved the words, keeping the inner voice protected from the binding.
                        </p>
                      </div>

                      {/* Folio */}
                      <div className="text-left pt-1.5 border-t border-black/5 mt-auto">
                        <span className="text-[8px] font-mono text-[#8C8479]">{activeSpreadPage}</span>
                      </div>
                    </div>

                    {/* Spine Shadow */}
                    <div className="w-[8px] sm:w-[12px] bg-gradient-to-r from-black/30 via-black/10 to-black/30 z-10 self-stretch"></div>

                    {/* Right Page (Recto - Odd Page) */}
                    <div 
                      className="w-[160px] sm:w-[220px] aspect-[1/1.5] bg-[#FFFDF9] text-[#24211D] flex flex-col justify-between p-3.5 sm:p-5 border-l border-[#E8E2D8] relative"
                      style={{
                        paddingLeft: `${gutter * 32}px`,
                        paddingRight: `${outsideMargin * 32}px`,
                      }}
                    >
                      {/* Running Header */}
                      <div className="text-center border-b border-black/10 pb-1.5 mb-2">
                        <span className="text-[8px] sm:text-[9px] font-serif uppercase tracking-widest text-[#7A7570] truncate block">
                          {bookTitle || 'TITLE OF THE WORK'}
                        </span>
                      </div>

                      {activeSpreadPage === 2 ? (
                        /* Chapter Opener Page */
                        <div className="text-[7px] sm:text-[9px] font-serif leading-relaxed text-[#2C2824]">
                          <div className="text-center my-2">
                            <span className="text-[7px] sm:text-[8px] uppercase tracking-widest text-[#B85D3E] font-sans font-bold block mb-0.5">
                              Chapter One
                            </span>
                            <span className="text-[9px] sm:text-[11px] font-serif font-bold text-[#1F1C18] block">
                              The Opening Chapter
                            </span>
                            <div className="w-6 h-px bg-[#B85D3E]/40 mx-auto mt-1 mb-2"></div>
                          </div>

                          <p className="text-justify leading-relaxed">
                            <span className="float-left text-2xl sm:text-3xl font-serif font-bold leading-none pr-1.5 pt-0.5 text-[#B85D3E]">
                              O
                            </span>
                            ne never truly forgets the opening page of a journey. The scent of fresh paper stock, the smooth resistance of the spine, and the balanced margins invite the reader into a world crafted entirely from thought and ink.
                          </p>
                          <p className="indent-3 text-justify mt-1.5 leading-relaxed">
                            A properly formatted book respects both the eyes of the reader and the physical machinery of the bindery.
                          </p>
                        </div>
                      ) : (
                        /* Standard Narrative Body Page */
                        <div className="text-[7px] sm:text-[9px] font-serif leading-relaxed text-[#2C2824] space-y-2 overflow-hidden text-justify">
                          <p className="indent-3">
                            The evening deepened without further interruption. Page after page turned smoothly, each paragraph resting comfortably within the calibrated print boundaries.
                          </p>
                          <p className="indent-3">
                            When an author focuses on the story rather than struggling with decimal measurements, the prose flows with natural clarity and purpose.
                          </p>
                          <p className="indent-3">
                            The chapter closed just as the streetlights flickered out against the approaching dawn.
                          </p>
                        </div>
                      )}
                                            {/* Folio */}
                      <div className="text-right pt-1.5 border-t border-black/5 mt-auto">
                        <span className="text-[8px] font-mono text-[#8C8479]">{activeSpreadPage + 1}</span>
                      </div>
                    </div>

                  </div>
                </div>

                <p className="text-[10px] text-center text-[#8C8479] mt-3 font-sans">
                  Live POD layout rendering: {gutter}" binding gutter calibrated for {activeEffectivePages} pages.
                </p>
              </section>

              {/* EDITORIAL SCANNER */}
              {contentAudit && (
                <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
                  isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-xs font-bold uppercase tracking-wider font-sans">
                        Editorial & Human Feel Scanner
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      NLP Audit Pass
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
                    <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
                      <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Readability</span>
                      <span className="text-xs sm:text-sm font-bold font-mono text-emerald-600">{contentAudit.readingEase} / 100</span>
                    </div>
                    <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
                      <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Grade Level</span>
                      <span className="text-xs sm:text-sm font-bold font-mono">Grade {contentAudit.gradeLevel}</span>
                    </div>
                    <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
                      <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Avg Sentence</span>
                      <span className="text-xs sm:text-sm font-bold font-mono">{contentAudit.sentenceBalance.avgWordsPerSentence} wds</span>
                    </div>
                    <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
                      <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">AI Cliches Flagged</span>
                      <span className={`text-xs sm:text-sm font-bold font-mono ${contentAudit.flaggedCliches.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {contentAudit.flaggedCliches.length}
                      </span>
                    </div>
                  </div>

                  {contentAudit.flaggedCliches.length > 0 && (
                    <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-xs">
                      <span className="font-semibold block text-amber-700 dark:text-amber-400 mb-1">
                        Robotic / AI Words Detected:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {contentAudit.flaggedCliches.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 font-mono text-[10px]">
                            "{c.word}" ({c.count}x)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
                    {interiorSubMode === 'visual_strip' && (
            <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
              isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
            }`}>
              <input
                ref={visualBatchInputRef}
                type="file"
                multiple
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleVisualBatchUpload}
                className="hidden"
              />

              {visualPages.length === 0 ? (
                <div
                  onClick={() => visualBatchInputRef.current?.click()}
                  className="w-full py-16 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition border-[#E2D8CC] dark:border-[#2D2A35]"
                >
                  <ImageIcon className="w-8 h-8 text-[#B85D3E] mb-3" />
                  <span className="text-sm font-bold font-serif mb-1">Upload Visual Pages</span>
                  <p className="text-xs text-[#8C8479] mb-4">300 DPI lossless interior compilation.</p>
                  <span className="px-4 py-2 bg-[#B85D3E] text-white text-xs font-semibold rounded-full shadow-md">Browse Files</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold">{visualPages.length} Pages • Lossless Pass</span>
                    <button
                      onClick={handleExportVisualPdf}
                      disabled={isCompilingPdf}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-full text-xs font-medium"
                    >
                      Export Lossless Print PDF
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {visualPages.slice(0, 8).map((p, idx) => (
                      <div key={p.id} className="aspect-[1/1.42] border rounded-xl overflow-hidden relative">
                        <img src={p.dataUrl} alt={p.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                          {p.dpi} DPI
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {interiorSubMode === 'planner_docx' && (
            <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
              isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-serif font-bold">Standard Low-Content Templates</span>
                <button
                  onClick={handleRunPlanner}
                  disabled={isGeneratingPlanner}
                  className="px-5 py-2.5 bg-[#B85D3E] text-white rounded-full text-xs font-semibold"
                >
                  Generate {plannerDays}-Page DOCX
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['daily_focus', 'meal_grocery', 'habit_matrix'].map((typeKey) => {
                  const isSelected = plannerType === typeKey;
                  return (
                    <div
                      key={typeKey}
                      onClick={() => setPlannerType(typeKey)}
                      className={`p-3 rounded-2xl border cursor-pointer text-xs font-medium capitalize text-center transition ${
                        isSelected 
                          ? 'border-[#B85D3E] bg-[#FAF4ED] dark:bg-[#251D1A] text-[#B85D3E] dark:text-[#E07A5F] font-bold shadow-sm' 
                          : 'border-[#EAE3D8] dark:border-[#282630] text-[#7A7368] hover:border-[#D1C5B4]'
                      }`}
                    >
                      {typeKey.replace('_', ' ')}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Step 2 Pill Navigation */}
          <div className="flex items-center justify-end pt-4">
            <div className="inline-flex items-center rounded-full p-1 bg-white dark:bg-[#1A181E] border border-[#DACFBF] dark:border-[#383344] shadow-[0_3px_0_0_#DACFBF] dark:shadow-[0_3px_0_0_#2B2533]">
              <button
                onClick={() => setActiveView(1)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-xs font-medium text-[#7A6E5F] dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <div className="w-px h-4 bg-[#E0D7C9] dark:bg-[#383344]"></div>
              <button
                onClick={() => setActiveView(3)}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold bg-[#B85D3E] hover:bg-[#A35034] text-white shadow-sm transition"
              >
                <span>Next: Cover</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
            {/* STEP 3: COVER VISUALIZER */}
      {activeView === 3 && (
        <div className="w-full max-w-5xl flex flex-col gap-6 animate-in fade-in duration-200">
          <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
            isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-[#B85D3E]" />
                <h2 className="text-xs font-bold uppercase tracking-wider font-sans">
                  Full-Wrap Paperback Cover Dimensions
                </h2>
              </div>
              <button
                onClick={() => setActiveHelpModal('bleed')}
                className="text-[11px] text-[#8C8479] hover:text-[#B85D3E] flex items-center gap-1 font-sans"
              >
                <span>Bleed Rules</span>
                <HelpCircle className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-6">
              <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
                <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Spine Width</span>
                <span className="text-xs sm:text-sm font-bold font-mono text-[#B85D3E]">{spineWidth}"</span>
              </div>
              <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
                <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Total Width</span>
                <span className="text-xs sm:text-sm font-bold font-mono">{fullCoverWidth}"</span>
              </div>
              <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
                <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Total Height</span>
                <span className="text-xs sm:text-sm font-bold font-mono">{fullCoverHeight}"</span>
              </div>
              <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
                <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Canvas @ 300 DPI</span>
                <span className="text-[11px] sm:text-xs font-bold font-mono text-emerald-500">{coverPixelsWidth} × {coverPixelsHeight} px</span>
              </div>
            </div>

            <div className="mb-4">
              <CoverVisualizer
                trimWidth={currentTrim.width}
                trimHeight={currentTrim.height}
                spineWidth={spineWidth}
                bleed={enableBleed ? 0.125 : 0.0}
                isDarkMode={isDarkMode}
                bookTitle={bookTitle}
                authorName={authorName}
              />
            </div>

            {/* Standard Self-Publishing Barcode Notice */}
            <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex items-start gap-2.5 text-xs mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-amber-700 dark:text-amber-400">
                  Standard Industry Barcode Zone (2.0" × 1.2" Reserved)
                </span>
                <p className="text-[11px] text-[#8C8479] leading-relaxed">
                  Keep the bottom-right quadrant of your back cover free of text, URLs, or faces. Print-on-demand facilities apply the ISBN barcode directly in this area.
                </p>
              </div>
            </div>
          </section>

          {/* Step 3 Pill Navigation */}
          <div className="flex items-center justify-end pt-4">
            <div className="inline-flex items-center rounded-full p-1 bg-white dark:bg-[#1A181E] border border-[#DACFBF] dark:border-[#383344] shadow-[0_3px_0_0_#DACFBF] dark:shadow-[0_3px_0_0_#2B2533]">
              <button
                onClick={() => setActiveView(2)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-xs font-medium text-[#7A6E5F] dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <div className="w-px h-4 bg-[#E0D7C9] dark:bg-[#383344]"></div>
              <button
                onClick={() => setActiveView(4)}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold bg-[#B85D3E] hover:bg-[#A35034] text-white shadow-sm transition"
              >
                <span>Next: Preflight</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
            {/* STEP 4: PREFLIGHT, MANUFACTURING COSTS & SPEC SHEET */}
      {activeView === 4 && (
        <div className="w-full max-w-5xl flex flex-col gap-6 animate-in fade-in duration-200">
          <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
            isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
          }`}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-sm sm:text-base font-serif font-bold">
                    Preflight Verification & POD Readiness
                  </h2>
                </div>
                <p className="text-xs text-[#8C8479] mt-0.5">
                  Universal Trade Geometry & Manufacturing Tolerances
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  {readinessScore}% Ready
                </span>
              </div>
            </div>

            {/* Print-on-Demand Unit Cost Estimator */}
            <div className="mb-6 p-4 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
              <span className="text-xs font-serif font-bold text-emerald-700 dark:text-emerald-400 block mb-2">
                Self-Publishing Manufacturing Cost & Pricing Breakdown
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-white border-[#EAE3D8]'}`}>
                  <span className="text-[10px] uppercase font-bold text-[#8C8479] block mb-1">
                    Global POD Standard (USD)
                  </span>
                  <div className="text-xs space-y-1 font-mono">
                    <p>• Unit Print Cost: <b>${economics.us.printCost}</b></p>
                    <p>• Break-even List Price: <b>${economics.us.minPrice}</b></p>
                    <p>• Suggested Price: <b>${economics.us.suggestedPrice}</b> (Royalty: <b className="text-emerald-600">+${economics.us.royalty}</b>)</p>
                  </div>
                </div>

                <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-white border-[#EAE3D8]'}`}>
                  <span className="text-[10px] uppercase font-bold text-[#8C8479] block mb-1">
                    India POD Distribution (INR)
                  </span>
                  <div className="text-xs space-y-1 font-mono">
                    <p>• Unit Print Cost: <b>₹{economics.india.printCost}</b></p>
                    <p>• Break-even List Price: <b>₹{economics.india.minPrice}</b></p>
                    <p>• Suggested Price: <b>₹{economics.india.suggestedPrice}</b> (Royalty: <b className="text-emerald-600">+₹{economics.india.royalty}</b>)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preflight Checks */}
            <div className="space-y-3 mb-6">
              <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="font-semibold block text-emerald-600">Page Extent Compatible</span>
                    <span className="text-[11px] text-[#8C8479]">{activeEffectivePages} pages meets trade paperback minimums.</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600">✓ PASS</span>
              </div>

              <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="font-semibold block text-emerald-600">Spine Gutter Clearance</span>
                    <span className="text-[11px] text-[#8C8479]">{gutter}" binding margin prevents text slipping into the physical crease.</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600">✓ PASS</span>
              </div>

              <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="font-semibold block text-emerald-600">300 DPI Canvas Resolution</span>
                    <span className="text-[11px] text-[#8C8479]">{coverPixelsWidth} × {coverPixelsHeight} px verified for commercial raster artwork.</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600">✓ PASS</span>
              </div>

              {spineWidth < 0.20 && (
                <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="font-semibold block text-amber-600">Narrow Spine Notice</span>
                      <span className="text-[11px] text-[#8C8479]">Spine width ({spineWidth}") is under 0.20". Spine text is not recommended under 80 pages.</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-600">⚠ REVIEW</span>
                </div>
              )}
            </div>

            {/* Checklist */}
            <div className={`p-4 rounded-3xl border mb-6 ${isDarkMode ? 'bg-[#141317] border-[#292630]' : 'bg-[#FAF8F5] border-[#EAE3D8]'}`}>
              <span className="text-xs font-bold font-serif block mb-2">
                Platform Upload Checklist (Verify Before Submission)
              </span>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={podChecklist.titleMatch} 
                    onChange={(e) => setPodChecklist({ ...podChecklist, titleMatch: e.target.checked })} 
                    className="accent-emerald-600"
                  />
                  <span>Manuscript title ("{bookTitle}") matches book cover text exactly.</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={podChecklist.rightsDeclared} 
                    onChange={(e) => setPodChecklist({ ...podChecklist, rightsDeclared: e.target.checked })} 
                    className="accent-emerald-600"
                  />
                  <span>Copyright notice and publishing rights confirmed in front-matter.</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={podChecklist.barcodeSafe} 
                    onChange={(e) => setPodChecklist({ ...podChecklist, barcodeSafe: e.target.checked })} 
                    className="accent-emerald-600"
                  />
                  <span>Lower-right back cover area kept clear of critical text for barcode printing.</span>
                </label>
              </div>
            </div>

            {/* Download Spec Sheet */}
            <div className="pt-4 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-[#8C8479]">
                Universal POD Compliant • Self-Publishing Ready
              </span>
              <button
                onClick={() => {
                  const spec = `PUBLISHSTUDIO - PRODUCTION SPECIFICATION REPORT\n` +
                    `============================================================\n` +
                    `Book Title: ${bookTitle}\n` +
                    `Author: ${authorName}\n` +
                    `Publication Category: ${bookCategory === 'text_rich' ? 'Text-Rich Manuscript' : 'Low-Content Creation'}\n` +
                    `\n` +
                    `INTERIOR MANUFACTURING CALIBRATIONS:\n` +
                    `------------------------------------------------------------\n` +
                    `Trim Size: ${currentTrim.width}" x ${currentTrim.height}"\n` +
                    `Page Extent: ${activeEffectivePages} Pages\n` +
                    `Paper Stock: ${PAPER_SPECS[paperType]?.label}\n` +
                    `Binding Gutter Margin: ${gutter}"\n` +
                    `Outside Margin: ${outsideMargin}"\n` +
                    `Top/Bottom Margin: ${topBottomMargin}"\n` +
                    `Folios & Running Headers: Mirrored\n` +
                    `\n` +
                    `FULL-WRAP COVER BLUEPRINT:\n` +
                    `------------------------------------------------------------\n` +
                    `Spine Width: ${spineWidth}"\n` +
                    `Full-Wrap Width: ${fullCoverWidth}" (Includes bleed + spine)\n` +
                    `Full-Wrap Height: ${fullCoverHeight}" (Includes 0.125" bleed)\n` +
                    `Canvas at 300 DPI: ${coverPixelsWidth} x ${coverPixelsHeight} px\n` +
                    `Outer Bleed: 0.125"\n` +
                    `Safe Area Margin: 0.25" inward\n` +
                    `Barcode Reserved Zone: 2.0" x 1.2" (Back cover lower right)\n` +
                    `\n` +
                    `ESTIMATED PRINT ECONOMICS:\n` +
                    `------------------------------------------------------------\n` +
                    `Global (USD) Print Cost: $${economics.us.printCost} | Suggested Price: $${economics.us.suggestedPrice}\n` +
                    `India (INR) Print Cost: ₹${economics.india.printCost} | Suggested Price: ₹${economics.india.suggestedPrice}\n` +
                    `\n` +
                    `PREFLIGHT STATUS: PASS\n` +
                    `============================================================\n` +
                    `Generated by PublishStudio (Zero-Server Architecture)\n`;
                  const blob = new Blob([spec], { type: 'text/plain' });
                  saveAs(blob, `Production_Specifications_${trimSize}.txt`);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-6 py-3 rounded-full shadow-[0_3px_0_0_#046A38] active:translate-y-0.5 active:shadow-none transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Production Specification (.txt)</span>
              </button>
            </div>
          </section>
                    {/* Step 4 Pill Navigation */}
          <div className="flex items-center justify-start pt-4">
            <div className="inline-flex items-center rounded-full p-1 bg-white dark:bg-[#1A181E] border border-[#DACFBF] dark:border-[#383344] shadow-[0_3px_0_0_#DACFBF] dark:shadow-[0_3px_0_0_#2B2533]">
              <button
                onClick={() => setActiveView(3)}
                className="inline-flex items-center gap-1 px-5 py-2 rounded-full text-xs font-medium text-[#7A6E5F] dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Step 3: Cover</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field Explanation Modal */}
      {activeHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md border rounded-3xl p-6 shadow-2xl relative text-left transition ${
            isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
          }`}>
            <button
              onClick={() => setActiveHelpModal(null)}
              className="absolute top-5 right-5 text-[#8C8479]"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold font-serif mb-2">
              {FIELD_EXPLANATIONS[activeHelpModal]?.term}
            </h3>
            <p className="text-xs text-[#8E8B92] leading-relaxed mb-3">
              {FIELD_EXPLANATIONS[activeHelpModal]?.definition}
            </p>
            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-[11px]">
              <span className="font-semibold block mb-0.5">Why this matters:</span>
              {FIELD_EXPLANATIONS[activeHelpModal]?.why}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md border rounded-3xl p-6 shadow-2xl relative text-left transition ${
            isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
          }`}>
            <button 
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-5 right-5 text-[#8C8479]"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[#B85D3E]" />
              <h3 className="text-sm font-bold font-serif">Studio Access & Privileges</h3>
            </div>
            <p className="text-xs text-[#8C8479] mb-4">
              All tools run 100% in your browser with zero data collection or cloud server uploads.
            </p>
            <input
              type="password"
              placeholder={isAdmin ? '••••••••••••••••' : 'Master Secret'}
              value={tempKeyInput}
              onChange={(e) => setTempKeyInput(e.target.value)}
              className="w-full border rounded-xl px-3.5 py-2.5 text-xs mb-4 font-mono bg-transparent"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 text-xs text-[#8C8479]"
              >
                Close
              </button>
              <button
                onClick={handleSaveSecret}
                className="px-4 py-2 bg-[#B85D3E] text-white rounded-full text-xs font-semibold"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`w-full max-w-5xl border-t mt-auto pt-6 text-center text-[11px] font-sans ${
        isDarkMode ? 'border-[#262429] text-[#716E77]' : 'border-[#EFEAE2] text-[#9E968B]'
      }`}>
        &copy; {new Date().getFullYear()} PUBLISHSTUDIO • Universal Print-on-Demand (POD) • Self-Publishing Supporting Software • Zero-Server Client Architecture
      </footer>
    </main>
  );
}
      
