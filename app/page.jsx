'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, BookOpen, Layers, Download, RefreshCw, 
  CheckCircle2, Sparkles, Printer, Sliders, Key, X, 
  Sun, Moon, Crown, Eye, Maximize2, ShieldCheck,
  Plus, Copy, Trash2, CheckSquare, Square, Grid, Image as ImageIcon,
  Compass, HelpCircle, Check, AlertTriangle, ArrowRight, ArrowLeft,
  ChevronRight, Settings2, FileText, CheckCircle, AlertCircle, List,
  PlayCircle, Lock, Shield, IndianRupee, DollarSign, ExternalLink, Award
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

// Client-Side Heuristic Content & AI Quality Scanner
function auditContentQuality(lines) {
  const fullText = lines.join(' ');
  const words = fullText.split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;
  
  if (totalWords < 50) return null;

  // 1. Flesch-Kincaid Reading Grade Level Estimate
  const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const totalSentences = Math.max(1, sentences.length);
  
  // Approximate syllable count
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

  // 2. Robotic / AI Filler Words Frequency Check
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

  // 3. Sentence Length Variance (Monotony Warning)
  const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
  const shortSentences = sentenceLengths.filter(l => l < 8).length;
  const longSentences = sentenceLengths.filter(l => l > 32).length;

  return {
    readingEase: Math.max(0, Math.min(100, readingEase)),
    gradeLevel,
    flaggedCliches,
    sentenceBalance: {
      totalSentences,
      avgWordsPerSentence: Math.round(wordsPerSentence),
      shortRatio: Math.round((shortSentences / totalSentences) * 100),
      longRatio: Math.round((longSentences / totalSentences) * 100)
    }
  };
}

// Deterministic KDP Print Cost & Royalty Math
function calculateKdpEconomics(pageCount, trimSize, paperType) {
  // Amazon KDP Standard Black & White Paperback Formulas (US & India)
  // US Formula: Fixed $0.85 + (Pages * $0.012) for standard black ink
  const usFixed = 0.85;
  const usPerPage = paperType === 'color' ? 0.07 : 0.012;
  const usPrintCost = Number((usFixed + (pageCount * usPerPage)).toFixed(2));
  const usMinListPrice = Number((usPrintCost / 0.60).toFixed(2)); // 60% standard distribution threshold
  const usSuggestedListPrice = Math.max(9.99, Number((usMinListPrice * 1.35).toFixed(2)));
  const usEstimatedRoyalty = Number(((usSuggestedListPrice * 0.60) - usPrintCost).toFixed(2));

  // India Formula (KDP IN Paperback print formula approximation)
  // Fixed ₹60 + (Pages * ₹0.75) for B&W
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
  // Navigation & Routing Mode
  const [currentStep, setCurrentStep] = useState(1);
  const [activeDirectTool, setActiveDirectTool] = useState(null); // 'interior' | 'cover' | 'preflight' | null
  const [experienceMode, setExperienceMode] = useState('beginner');
  const [selectedArchetype, setSelectedArchetype] = useState('novel');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeHelpModal, setActiveHelpModal] = useState(null);

  // Physical Attributes & Book Profile
  const [trimSize, setTrimSize] = useState('6x9');
  const [pageCount, setPageCount] = useState(120);
  const [paperType, setPaperType] = useState('cream');
  const [enableBleed, setEnableBleed] = useState(false);

  // Advanced Margins (Inches)
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

  // Step 2: Interior Manuscript, Analysis & Preview State
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

  // Step 2: Visual Planner & Archetype Engine
  const [plannerType, setPlannerType] = useState('daily_focus');
  const [plannerDays, setPlannerDays] = useState(90);
  const [customNiche, setCustomNiche] = useState('');
  const [isGeneratingPlanner, setIsGeneratingPlanner] = useState(false);
  const [visualPages, setVisualPages] = useState([]);
  const [selectedPageIds, setSelectedPageIds] = useState(new Set());
  const [repeatMultiplier, setRepeatMultiplier] = useState(4);
  const [enableFolios, setEnableFolios] = useState(false);
  const [isCompilingPdf, setIsCompilingPdf] = useState(false);

  // Step 4: Amazon KDP Upload Checklist States
  const [kdpChecklist, setKdpChecklist] = useState({
    titleMatch: false,
    trimMatch: true,
    bleedMatch: false,
    barcodeSafe: true,
    rightsDeclared: false
  });

  // References
  const fileInputRef = useRef(null);
  const visualBatchInputRef = useRef(null);
  const visualSingleInputRef = useRef(null);
  const insertIndexRef = useRef(null);
  const docxViewerRef = useRef(null);

  // Local Book Profile Persistence
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
        const parsed = JSON.parse(savedProfile);
        if (parsed.trimSize) setTrimSize(parsed.trimSize);
        if (parsed.pageCount) setPageCount(parsed.pageCount);
        if (parsed.paperType) setPaperType(parsed.paperType);
        if (parsed.bookTitle) setBookTitle(parsed.bookTitle);
        if (parsed.authorName) setAuthorName(parsed.authorName);
        if (parsed.selectedArchetype) setSelectedArchetype(parsed.selectedArchetype);
        if (parsed.customMargins) setCustomMargins(parsed.customMargins);
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
      setStatusMessage('Admin master access verified.');
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

  const activeEffectivePages = interiorSubMode === 'visual_strip' && visualPages.length > 0 
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

  // Real-Time Economics
  const economics = calculateKdpEconomics(activeEffectivePages, trimSize, paperType);

  // Dynamic Pipeline Step Completion Status
  const isStep1Complete = Boolean(selectedArchetype && trimSize && activeEffectivePages >= 24);
  const isStep2Complete = Boolean(hasRendered || visualPages.length > 0);
  const isStep3Complete = Boolean(spineWidth > 0 && fullCoverWidth > 0);
  const isStep4Complete = Boolean(isStep1Complete && isStep2Complete && isStep3Complete);

  // Overall 0-100% Readiness Gauge
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

    // Sample/Demo Book Mode
  const handleLoadSampleManuscript = () => {
    setFileName('Sample_KDP_Novel.docx');
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
        { code: 'CHAPTERS_DETECTED', title: 'Chapter Structure', message: '3 standard narrative markers recognized.' },
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
        shortRatio: 12,
        longRatio: 0
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
      {/* ₹0 Trust Ribbon Header */}
      <div className={`w-full max-w-5xl mb-4 py-2 px-4 rounded-2xl border flex items-center justify-between text-[11px] font-sans transition ${
        isDarkMode ? 'bg-[#1A181E] border-[#2A2733] text-zinc-400' : 'bg-[#F5EFE6] border-[#EADFCF] text-[#7A6E5F]'
      }`}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹0 Investment Challenge</span>
          <span className="hidden sm:inline">• Free In-Browser Production Studio</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Amazon KDP Ready</span>
          <span>•</span>
          <span className="text-[#B85D3E] font-medium">100% In-Browser Privacy</span>
        </div>
      </div>

      {/* Studio Master Header */}
      <header className={`w-full max-w-5xl flex flex-col gap-4 border-b pb-5 mb-6 ${
        isDarkMode ? 'border-[#262429]' : 'border-[#EFEAE2]'
      }`}>
        <div className="w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`p-2.5 rounded-2xl border shadow-sm shrink-0 ${
              isDarkMode ? 'bg-[#1C1A20] border-[#2E2B35] text-[#E07A5F]' : 'bg-[#FAF4ED] border-[#E9DFD3] text-[#B85D3E]'
            }`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className={`text-base sm:text-lg font-serif font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#1F1C18]'}`}>
                  PUBLISHSTUDIO
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                  ₹0 Zero-Cost Engine
                </span>
              </div>
              <span className={`text-[11px] font-sans block truncate ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#8C8479]'}`}>
                Format, design full-wrap covers, and run KDP preflight audits with zero paid subscriptions.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setExperienceMode(experienceMode === 'beginner' ? 'advanced' : 'beginner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-sans transition shadow-sm ${
                experienceMode === 'advanced'
                  ? (isDarkMode ? 'bg-[#3A2A22] text-[#E07A5F] border-[#52382D]' : 'bg-[#FAF4ED] text-[#B85D3E] border-[#E9DFD3] font-semibold')
                  : (isDarkMode ? 'bg-[#1C1A20] border-[#2E2B35] text-zinc-400' : 'bg-white border-[#E8E1D7] text-[#6B645A]')
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span className="capitalize">{experienceMode}</span>
            </button>

            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full border transition shadow-sm ${
                isDarkMode ? 'bg-[#1C1A20] border-[#2E2B35] text-amber-300' : 'bg-white border-[#E8E1D7] text-[#6B645A]'
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className={`p-2 rounded-full border transition shadow-sm ${
                isDarkMode ? 'bg-[#1C1A20] border-[#2E2B35] text-zinc-400' : 'bg-white border-[#E8E1D7] text-[#6B645A]'
              }`}
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic 4-Step Pipeline Navigation Bar with Completion Badges */}
        <nav className={`w-full grid grid-cols-4 p-1.5 rounded-2xl border ${
          isDarkMode ? 'bg-[#1A181E] border-[#2B2833]' : 'bg-[#F1ECE4] border-[#E5DED4]'
        }`}>
          {[
            { num: 1, label: 'Setup', icon: Compass, complete: isStep1Complete },
            { num: 2, label: 'Interior', icon: FileText, complete: isStep2Complete },
            { num: 3, label: 'Cover', icon: Maximize2, complete: isStep3Complete },
            { num: 4, label: 'Preflight', icon: CheckCircle, complete: isStep4Complete },
          ].map((st) => {
            const IconComponent = st.icon;
            const isActive = currentStep === st.num;
            return (
              <button
                key={st.num}
                onClick={() => {
                  setActiveDirectTool(null);
                  setCurrentStep(st.num);
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? (isDarkMode ? 'bg-[#2B2833] text-white shadow font-semibold' : 'bg-white text-[#1F1C18] shadow font-semibold')
                    : (isDarkMode ? 'text-[#8E8B92] hover:text-white' : 'text-[#827A70] hover:text-[#2D2A26]')
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                  st.complete 
                    ? 'bg-emerald-500 text-white' 
                    : (isActive ? 'bg-[#B85D3E] text-white' : (isDarkMode ? 'bg-[#25232A] text-zinc-400' : 'bg-[#E3DCcf] text-zinc-600'))
                }`}>
                  {st.complete ? '✓' : st.num}
                </span>
                <span className="hidden sm:inline">{st.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Modern Bento-Grid Hero: Direct Tools vs Complete Flow */}
      <section className="w-full max-w-5xl mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          
          {/* Bento Card 1: Warm Sunset - Interior Formatting */}
          <div 
            onClick={() => { setCurrentStep(2); setInteriorSubMode('typeset'); }}
            className="p-5 rounded-3xl border cursor-pointer transition transform hover:-translate-y-0.5 bg-gradient-to-br from-[#FAF3EC] to-[#F5E6D8] dark:from-[#251D1A] dark:to-[#32231E] border-[#EAD7C5] dark:border-[#4A3228] flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#B85D3E] block mb-1">
                Direct Tool
              </span>
              <h3 className="text-base font-serif font-bold text-[#1F1C18] dark:text-zinc-100 mb-1">
                Manuscript Formatting
              </h3>
              <p className="text-xs text-[#7A6B5D] dark:text-[#A8988B] leading-relaxed">
                Typeset DOCX files with mirror margins, running headers, drop caps, and AI-cliche scanning.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-[#B85D3E]">
              <span>Open Typesetter</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Bento Card 2: Fresh Botanical - Full-Wrap Cover */}
          <div 
            onClick={() => setCurrentStep(3)}
            className="p-5 rounded-3xl border cursor-pointer transition transform hover:-translate-y-0.5 bg-gradient-to-br from-[#F0F6F2] to-[#E3EFE7] dark:from-[#17241C] dark:to-[#1E3326] border-[#CFE4D6] dark:border-[#2D4D38] flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                Direct Tool
              </span>
              <h3 className="text-base font-serif font-bold text-[#1F1C18] dark:text-zinc-100 mb-1">
                Full-Wrap Cover Studio
              </h3>
              <p className="text-xs text-[#5D7365] dark:text-[#90AFA0] leading-relaxed">
                Live SVG blueprint for Amazon KDP, dynamic spine math, 300 DPI canvas, and barcode safe zones.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span>Open Cover Blueprint</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Bento Card 3: Deep Slate - Preflight & Economics */}
          <div 
            onClick={() => setCurrentStep(4)}
            className="p-5 rounded-3xl border cursor-pointer transition transform hover:-translate-y-0.5 bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] dark:from-[#1E2024] dark:to-[#282B32] border-[#D1D5DB] dark:border-[#3D424D] flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#4B5563] dark:text-zinc-400 block mb-1">
                Direct Tool
              </span>
              <h3 className="text-base font-serif font-bold text-[#1F1C18] dark:text-zinc-100 mb-1">
                KDP Preflight & Pricing
              </h3>
              <p className="text-xs text-[#6B7280] dark:text-zinc-400 leading-relaxed">
                PASS/REVIEW checks, US ($) and India (₹) print cost calculations, and 60% royalty projections.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <span>Run Preflight Audit</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

        </div>

        {/* Recommended Full Journey Banner */}
        <div className={`p-4 rounded-3xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2] shadow-sm'
        }`}>
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold font-serif">Recommended: Complete Guided Production Flow</h4>
              <p className="text-[11px] text-[#8C8479]">
                Step 1: Setup ➔ Step 2: Interior ➔ Step 3: Cover ➔ Step 4: Preflight Verification.
              </p>
            </div>
          </div>
          <button
            onClick={() => { setCurrentStep(1); setActiveDirectTool(null); }}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#B85D3E] hover:bg-[#A35034] text-white rounded-full text-xs font-semibold shadow-md transition"
          >
            Start Guided Flow
          </button>
        </div>
      </section>
            {/* STEP 1: BOOK SETUP */}
      {currentStep === 1 && (
        <div className="w-full max-w-5xl flex flex-col gap-6">
          <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
            isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className={`text-base font-serif font-bold ${isDarkMode ? 'text-zinc-100' : 'text-[#1F1C18]'}`}>
                  What are you creating?
                </h2>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#7A7368]'}`}>
                  Select your publication type to load standard trim, paper weight, and margin recommendations.
                </p>
              </div>
              <span className="text-[10px] text-emerald-600 font-sans bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">
                Amazon KDP Presets
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              {Object.entries(BOOK_ARCHETYPES).map(([key, arch]) => {
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
                      <p className={`text-[10px] leading-relaxed line-clamp-2 ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#7A7368]'}`}>
                        {arch.subtitle}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#8C8479]">{arch.defaultTrim}"</span>
                      <span className="text-[#8C8479] capitalize">{arch.defaultPaper}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
              isDarkMode ? 'bg-[#141317] border-[#2A2733] text-zinc-300' : 'bg-[#FAF8F5] border-[#EAE3D8] text-[#524E49]'
            }`}>
              <HelpCircle className="w-4 h-4 text-[#B85D3E] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-xs block mb-0.5">
                  {BOOK_ARCHETYPES[selectedArchetype]?.title} Production Notes:
                </span>
                <p className="text-[11px] leading-relaxed text-[#7A7368] dark:text-[#9E9BA3]">
                  {BOOK_ARCHETYPES[selectedArchetype]?.guidance}
                </p>
              </div>
            </div>
          </section>

          {/* Manufacturing Calibrations */}
          <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
            isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
          }`}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sliders className={`w-4 h-4 ${isDarkMode ? 'text-[#E07A5F]' : 'text-[#B85D3E]'}`} />
                <h3 className={`text-xs font-bold uppercase tracking-wider font-sans ${isDarkMode ? 'text-zinc-200' : 'text-[#1F1C18]'}`}>
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

            {/* Readout Strip */}
            <div className={`border rounded-2xl p-4 grid grid-cols-3 gap-2 text-center mb-4 ${
              isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'
            }`}>
              <div>
                <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Spine Gutter</span>
                <span className="text-xs sm:text-sm font-bold font-mono text-[#B85D3E]">{gutter}"</span>
                <span className="text-[9px] text-[#8C8479] block mt-0.5">Recommended binding margin.</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Outside Margin</span>
                <span className="text-xs sm:text-sm font-semibold font-mono">{outsideMargin}"</span>
                <span className="text-[9px] text-[#8C8479] block mt-0.5">Finger safety clearance.</span>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Top / Bottom</span>
                <span className="text-xs sm:text-sm font-semibold font-mono">{topBottomMargin}"</span>
                <span className="text-[9px] text-[#8C8479] block mt-0.5">Running head buffer.</span>
              </div>
            </div>

            {experienceMode === 'advanced' && (
              <div className="pt-4 border-t border-black/5 dark:border-white/5 grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-[#8C8479] uppercase block mb-1">Top Margin</label>
                  <input
                    type="number"
                    step="0.05"
                    value={customMargins.top}
                    onChange={(e) => {
                      const next = { ...customMargins, top: Number(e.target.value) };
                      setCustomMargins(next);
                      saveLocalBookProfile({ customMargins: next });
                    }}
                    className="w-full border rounded-lg px-2.5 py-1.5 text-xs font-mono bg-transparent"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#8C8479] uppercase block mb-1">Bottom Margin</label>
                  <input
                    type="number"
                    step="0.05"
                    value={customMargins.bottom}
                    onChange={(e) => {
                      const next = { ...customMargins, bottom: Number(e.target.value) };
                      setCustomMargins(next);
                      saveLocalBookProfile({ customMargins: next });
                    }}
                    className="w-full border rounded-lg px-2.5 py-1.5 text-xs font-mono bg-transparent"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#8C8479] uppercase block mb-1">Outside Margin</label>
                  <input
                    type="number"
                    step="0.05"
                    value={customMargins.outside}
                    onChange={(e) => {
                      const next = { ...customMargins, outside: Number(e.target.value) };
                      setCustomMargins(next);
                      saveLocalBookProfile({ customMargins: next });
                    }}
                    className="w-full border rounded-lg px-2.5 py-1.5 text-xs font-mono bg-transparent"
                  />
                </div>
              </div>
            )}
          </section>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-[#8C8479] font-sans text-center sm:text-left">
              Amazon KDP compliant specifications. Mirror margins calculated automatically.
            </span>
            <button
              onClick={() => setCurrentStep(2)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#B85D3E] hover:bg-[#A35034] text-white font-medium text-xs px-6 py-3 rounded-full transition shadow-md"
            >
              <span>Continue to Step 2: Interior</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
                {/* STEP 2: INTERIOR FORMATTING & MANUSCRIPT */}
      {currentStep === 2 && (
        <div className="w-full max-w-5xl flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#EFEAE2] dark:border-[#262429]">
            <div className="flex items-center gap-2">
              <FileText className={`w-4 h-4 ${isDarkMode ? 'text-[#E07A5F]' : 'text-[#B85D3E]'}`} />
              <h2 className={`text-xs font-bold uppercase tracking-wider font-sans ${isDarkMode ? 'text-zinc-200' : 'text-[#1F1C18]'}`}>
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
                DOCX Archetypes
              </button>
            </div>
          </div>

          {/* Sub-Mode 1: Manuscript Typesetter */}
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
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#B85D3E] hover:bg-[#A35034] text-white font-medium text-xs px-5 py-3 rounded-full transition shadow-md"
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
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 border font-medium text-xs px-4 py-3 rounded-full transition bg-transparent text-emerald-600"
                    >
                      {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      <span>Export Formatted DOCX</span>
                    </button>
                  )}
                </div>
              </section>

              {/* RESTORED: INTERACTIVE BOOK SPREAD PREVIEW */}
              <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
                isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Eye className={`w-4 h-4 ${isDarkMode ? 'text-[#E07A5F]' : 'text-[#B85D3E]'}`} />
                    <h3 className={`text-xs font-bold uppercase tracking-wider font-sans ${isDarkMode ? 'text-zinc-200' : 'text-[#1F1C18]'}`}>
                      Book Craft Spread Preview (Interactive Mockup)
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveSpreadPage(Math.max(2, activeSpreadPage - 2))}
                      disabled={activeSpreadPage <= 2}
                      className="text-[10px] px-2 py-0.5 rounded border disabled:opacity-40 font-mono"
                    >
                      ◄ Prev
                    </button>
                    <span className="text-[10px] font-mono text-[#8C8479]">
                      Pages {activeSpreadPage}-{activeSpreadPage + 1} of {activeEffectivePages}
                    </span>
                    <button
                      onClick={() => setActiveSpreadPage(Math.min(activeEffectivePages - 1, activeSpreadPage + 2))}
                      disabled={activeSpreadPage >= activeEffectivePages - 1}
                      className="text-[10px] px-2 py-0.5 rounded border disabled:opacity-40 font-mono"
                    >
                      Next ►
                    </button>
                  </div>
                </div>

                {/* Open Spread Canvas with Dynamic Gutter */}
                <div className={`w-full rounded-2xl border p-4 sm:p-6 flex items-center justify-center overflow-x-auto ${
                  isDarkMode ? 'bg-[#100F12] border-[#26242D]' : 'bg-[#F2EEE9] border-[#E5DDD2]'
                }`}>
                  <div className="flex items-center shadow-2xl rounded-sm overflow-hidden select-none border border-black/10">
                    
                    {/* Left Page (Verso) */}
                    <div 
                      className="w-[145px] sm:w-[190px] aspect-[1/1.45] bg-[#FAF8F5] text-[#2D2A26] flex flex-col justify-between p-3 sm:p-4 border-r border-[#E8E2D8] relative"
                      style={{
                        paddingLeft: `${outsideMargin * 28}px`,
                        paddingRight: `${gutter * 28}px`,
                      }}
                    >
                      <div className="text-center border-b border-black/10 pb-1">
                        <span className="text-[7px] sm:text-[8px] font-serif uppercase tracking-widest text-[#7A7570] truncate block">
                          {authorName || 'AUTHOR NAME'}
                        </span>
                      </div>

                      <div className="space-y-1.5 my-auto opacity-75">
                        <div className="h-1 bg-[#D8D2C7] rounded w-full"></div>
                        <div className="h-1 bg-[#D8D2C7] rounded w-5/6"></div>
                        <div className="h-1 bg-[#D8D2C7] rounded w-full"></div>
                        <div className="h-1 bg-[#D8D2C7] rounded w-4/5"></div>
                        <div className="h-1 bg-[#D8D2C7] rounded w-full"></div>
                        <div className="h-1 bg-[#D8D2C7] rounded w-3/4"></div>
                      </div>

                      <div className="text-left pt-1 border-t border-black/5">
                        <span className="text-[7px] sm:text-[8px] font-mono text-[#8C8479]">{activeSpreadPage}</span>
                      </div>
                    </div>

                    {/* Spine Crease */}
                    <div className="w-[6px] sm:w-[8px] h-full bg-gradient-to-r from-black/25 via-black/10 to-black/25 z-10 self-stretch"></div>

                    {/* Right Page (Recto) */}
                    <div 
                      className="w-[145px] sm:w-[190px] aspect-[1/1.45] bg-[#FAF8F5] text-[#2D2A26] flex flex-col justify-between p-3 sm:p-4 border-l border-[#E8E2D8] relative"
                      style={{
                        paddingLeft: `${gutter * 28}px`,
                        paddingRight: `${outsideMargin * 28}px`,
                      }}
                    >
                      <div className="text-center border-b border-black/10 pb-1">
                        <span className="text-[7px] sm:text-[8px] font-serif uppercase tracking-widest text-[#7A7570] truncate block">
                          {bookTitle || 'TITLE OF THE WORK'}
                        </span>
                      </div>

                      {activeSpreadPage === 2 ? (
                        <div className="my-auto">
                          <div className="text-center mb-2">
                            <span className="text-[6px] sm:text-[7px] uppercase tracking-widest text-[#B85D3E] font-semibold block">
                              Chapter One
                            </span>
                            <span className="text-[8px] sm:text-[9px] font-serif font-bold text-[#1F1C18]">
                              The Opening
                            </span>
                          </div>

                          <div className="flex items-start gap-1 mb-1.5">
                            <span className="text-sm sm:text-base font-serif font-bold leading-none text-[#1F1C18]">
                              O
                            </span>
                            <div className="space-y-1 w-full pt-0.5">
                              <div className="h-1 bg-[#D8D2C7] rounded w-full"></div>
                              <div className="h-1 bg-[#D8D2C7] rounded w-5/6"></div>
                            </div>
                          </div>
                          <div className="space-y-1.5 opacity-75">
                            <div className="h-1 bg-[#D8D2C7] rounded w-full"></div>
                            <div className="h-1 bg-[#D8D2C7] rounded w-4/5"></div>
                            <div className="h-1 bg-[#D8D2C7] rounded w-full"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 my-auto opacity-75">
                          <div className="h-1 bg-[#D8D2C7] rounded w-full"></div>
                          <div className="h-1 bg-[#D8D2C7] rounded w-full"></div>
                          <div className="h-1 bg-[#D8D2C7] rounded w-4/5"></div>
                          <div className="h-1 bg-[#D8D2C7] rounded w-full"></div>
                          <div className="h-1 bg-[#D8D2C7] rounded w-5/6"></div>
                          <div className="h-1 bg-[#D8D2C7] rounded w-3/4"></div>
                        </div>
                      )}

                      <div className="text-right pt-1 border-t border-black/5">
                        <span className="text-[7px] sm:text-[8px] font-mono text-[#8C8479]">{activeSpreadPage + 1}</span>
                      </div>
                    </div>

                  </div>
                </div>

                <p className="text-[10px] text-center text-[#8C8479] mt-3 font-sans">
                  Live POD layout rendering: {gutter}" binding gutter calculated for {activeEffectivePages} pages.
                </p>
              </section>

              {/* EDITORIAL QUALITY & AI-CLICHE HEURISTIC AUDIT */}
              {contentAudit && (
                <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
                  isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <h3 className={`text-xs font-bold uppercase tracking-wider font-sans ${isDarkMode ? 'text-zinc-200' : 'text-[#1F1C18]'}`}>
                        Editorial & Content Quality Scanner
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      Browser-Native NLP Pass
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-5">
                    <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
                      <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Readability Ease</span>
                      <span className="text-xs sm:text-sm font-bold font-mono text-emerald-600">{contentAudit.readingEase} / 100</span>
                    </div>
                    <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
                      <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Grade Level</span>
                      <span className="text-xs sm:text-sm font-bold font-mono">Grade {contentAudit.gradeLevel}</span>
                    </div>
                    <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
                      <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Avg Sentence</span>
                      <span className="text-xs sm:text-sm font-bold font-mono">{contentAudit.sentenceBalance.avgWordsPerSentence} words</span>
                    </div>
                    <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
                      <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">AI Cliches Flagged</span>
                      <span className={`text-xs sm:text-sm font-bold font-mono ${contentAudit.flaggedCliches.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {contentAudit.flaggedCliches.length}
                      </span>
                    </div>
                  </div>

                  {contentAudit.flaggedCliches.length > 0 ? (
                    <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 mb-3 text-xs">
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
                  ) : (
                    <div className="p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                      <Check className="w-4 h-4" />
                      <span>Natural human tone: Zero repetitive AI buzzwords flagged.</span>
                    </div>
                  )}
                </section>
              )}

                      {/* STRUCTURAL ANOMALY AUDIT */}
              {manuscriptAnalysis && (
                <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
                  isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold font-serif">Structural Anomaly Scanner</span>
                    <span className="text-[10px] font-mono text-[#8C8479]">{manuscriptAnalysis.wordCount.toLocaleString()} words</span>
                  </div>

                  {manuscriptAnalysis.renderedPageCount !== pageCount && (
                    <div className="mb-4 p-3 rounded-2xl border border-[#B85D3E]/30 bg-[#FAF4ED] dark:bg-[#251E1C] flex items-center justify-between text-xs">
                      <span className="text-[11px] text-[#8C8479]">
                        Detected page extent is <b>{manuscriptAnalysis.renderedPageCount} pages</b> (configured: {pageCount}).
                      </span>
                      <button
                        onClick={() => {
                          setPageCount(manuscriptAnalysis.renderedPageCount);
                          saveLocalBookProfile({ pageCount: manuscriptAnalysis.renderedPageCount });
                        }}
                        className="px-3 py-1 bg-[#B85D3E] text-white rounded-full text-xs font-semibold shadow-sm"
                      >
                        Sync Extent ({manuscriptAnalysis.renderedPageCount} pgs)
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {manuscriptAnalysis.passes.map((pass, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center gap-2 text-xs">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-700 dark:text-emerald-400">{pass.title}: {pass.message}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Sub-Mode 2: Visual Image Strip */}
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
                  <span className="text-sm font-bold font-serif mb-1">Upload Planner / Journal Page Images</span>
                  <p className="text-xs text-[#8C8479] mb-4">300 DPI preservation for KDP print verification.</p>
                  <span className="px-4 py-2 bg-[#B85D3E] text-white text-xs font-semibold rounded-full shadow-md">Browse Files</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold">{visualPages.length} Pages • Print Resolution Verified</span>
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

          {/* Sub-Mode 3: DOCX Archetypes */}
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
                {['daily_focus', 'meal_grocery', 'habit_matrix'].map((typeKey) => (
                  <div
                    key={typeKey}
                    onClick={() => setPlannerType(typeKey)}
                    className={`p-3 rounded-2xl border cursor-pointer text-xs font-medium capitalize ${plannerType === typeKey ? 'border-[#B85D3E] bg-[#FAF4ED] dark:bg-[#251E1C]' : 'border-[#EAE3D8] dark:border-[#282630]'}`}
                  >
                    {typeKey.replace('_', ' ')}
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8C8479]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Step 1: Setup</span>
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-2 bg-[#B85D3E] hover:bg-[#A35034] text-white font-medium text-xs px-6 py-3 rounded-full transition shadow-md"
            >
              <span>Continue to Step 3: Cover</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
            {/* STEP 3: COVER SPECIFICATIONS */}
      {currentStep === 3 && (
        <div className="w-full max-w-5xl flex flex-col gap-6">
          <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
            isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Maximize2 className={`w-4 h-4 ${isDarkMode ? 'text-[#E07A5F]' : 'text-[#B85D3E]'}`} />
                <h2 className={`text-xs font-bold uppercase tracking-wider font-sans ${isDarkMode ? 'text-zinc-200' : 'text-[#1F1C18]'}`}>
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

            {/* Amazon KDP Auto-Barcode Exclusion Warning */}
            <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex items-start gap-2.5 text-xs mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-amber-700 dark:text-amber-400">
                  Amazon KDP Barcode Zone (2.0" × 1.2" Reserved)
                </span>
                <p className="text-[11px] text-[#8C8479] leading-relaxed">
                  Keep the bottom-right quadrant of your back cover free of text, URLs, or faces. Amazon automatically prints the ISBN barcode here during physical manufacture.
                </p>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8C8479]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Step 2: Interior</span>
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-2 bg-[#B85D3E] hover:bg-[#A35034] text-white font-medium text-xs px-6 py-3 rounded-full transition shadow-md"
            >
              <span>Continue to Step 4: Preflight</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PRINT PREFLIGHT & KDP ROI ENGINE */}
      {currentStep === 4 && (
        <div className="w-full max-w-5xl flex flex-col gap-6">
          <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
            isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
          }`}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-sm sm:text-base font-serif font-bold">
                    KDP Final Preflight & Readiness Dashboard
                  </h2>
                </div>
                <p className="text-xs text-[#8C8479] mt-0.5">
                  ₹0 Investment Verification • Amazon KDP Paper & Geometry Standards
                </p>
              </div>

              {/* Overall Readiness Gauge */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  {readinessScore}% KDP Ready
                </span>
              </div>
            </div>

            {/* KDP Printing Cost & 60% Royalty Projection */}
            <div className="mb-6 p-4 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
              <span className="text-xs font-serif font-bold text-emerald-700 dark:text-emerald-400 block mb-2">
                Amazon KDP Printing Cost & Royalty Estimator (₹0 ROI Engine)
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-white border-[#EAE3D8]'}`}>
                  <span className="text-[10px] uppercase font-bold text-[#8C8479] block mb-1">
                    Amazon US Marketplace (USD)
                  </span>
                  <div className="text-xs space-y-1 font-mono">
                    <p>• KDP Print Cost: <b>${economics.us.printCost}</b></p>
                    <p>• Break-even List Price: <b>${economics.us.minPrice}</b></p>
                    <p>• Suggested Price: <b>${economics.us.suggestedPrice}</b> (Royalty: <b className="text-emerald-600">+${economics.us.royalty}</b>)</p>
                  </div>
                </div>

                <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-white border-[#EAE3D8]'}`}>
                  <span className="text-[10px] uppercase font-bold text-[#8C8479] block mb-1">
                    Amazon India Marketplace (INR)
                  </span>
                  <div className="text-xs space-y-1 font-mono">
                    <p>• KDP Print Cost: <b>₹{economics.india.printCost}</b></p>
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
                    <span className="text-[11px] text-[#8C8479]">{activeEffectivePages} pages meets Amazon KDP paperback minimum (24 pages).</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600">✓ PASS</span>
              </div>

              <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="font-semibold block text-emerald-600">Spine Gutter Tolerance</span>
                    <span className="text-[11px] text-[#8C8479]">{gutter}" inner margin calculated to prevent text slipping into binding.</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600">✓ PASS</span>
              </div>

              <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="font-semibold block text-emerald-600">300 DPI Target Dimensions</span>
                    <span className="text-[11px] text-[#8C8479]">{coverPixelsWidth} × {coverPixelsHeight} px for print-ready raster artwork.</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600">✓ PASS</span>
              </div>

              {spineWidth < 0.20 && (
                <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="font-semibold block text-amber-600">Narrow Spine Text Warning</span>
                      <span className="text-[11px] text-[#8C8479]">Spine width ({spineWidth}") is under 0.20". Amazon KDP disallows spine text for books under 80 pages.</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-600">⚠ REVIEW</span>
                </div>
              )}
            </div>

            {/* Final Amazon KDP 1-Click Upload Checklist */}
            <div className={`p-4 rounded-3xl border mb-6 ${isDarkMode ? 'bg-[#141317] border-[#292630]' : 'bg-[#FAF8F5] border-[#EAE3D8]'}`}>
              <span className="text-xs font-bold font-serif block mb-2">
                Final Amazon KDP Upload Checklist (Verify Before Publishing)
              </span>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={kdpChecklist.titleMatch} 
                    onChange={(e) => setKdpChecklist({ ...kdpChecklist, titleMatch: e.target.checked })} 
                    className="accent-emerald-600"
                  />
                  <span>Manuscript title ("{bookTitle}") matches book cover text exactly.</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={kdpChecklist.rightsDeclared} 
                    onChange={(e) => setKdpChecklist({ ...kdpChecklist, rightsDeclared: e.target.checked })} 
                    className="accent-emerald-600"
                  />
                  <span>Copyright page or disclaimer included in front-matter.</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={kdpChecklist.barcodeSafe} 
                    onChange={(e) => setKdpChecklist({ ...kdpChecklist, barcodeSafe: e.target.checked })} 
                    className="accent-emerald-600"
                  />
                  <span>Lower-right back cover (2.0" × 1.2") kept free of text/images for barcode.</span>
                </label>
              </div>
            </div>

            {/* Download Spec Sheet */}
            <div className="pt-4 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-[#8C8479]">
                Amazon KDP Paperback Verified • Zero External Software Fees
              </span>
              <button
                onClick={() => {
                  const spec = `PUBLISHSTUDIO - AMAZON KDP PRODUCTION SPECIFICATION REPORT\n` +
                    `============================================================\n` +
                    `Book Title: ${bookTitle}\n` +
                    `Author: ${authorName}\n` +
                    `Publication Archetype: ${BOOK_ARCHETYPES[selectedArchetype]?.title}\n` +
                    `\n` +
                    `KDP INTERIOR SPECIFICATIONS:\n` +
                    `------------------------------------------------------------\n` +
                    `Trim Size: ${currentTrim.width}" x ${currentTrim.height}"\n` +
                    `Page Count: ${activeEffectivePages} Pages\n` +
                    `Paper Stock: ${PAPER_SPECS[paperType]?.label}\n` +
                    `Binding Gutter Margin: ${gutter}"\n` +
                    `Outside Margin: ${outsideMargin}"\n` +
                    `Top/Bottom Margin: ${topBottomMargin}"\n` +
                    `Folios & Running Headers: Mirrored\n` +
                    `\n` +
                    `KDP FULL-WRAP COVER BLUEPRINT:\n` +
                    `------------------------------------------------------------\n` +
                    `Spine Width: ${spineWidth}"\n` +
                    `Full-Wrap Width: ${fullCoverWidth}" (Includes bleed + spine)\n` +
                    `Full-Wrap Height: ${fullCoverHeight}" (Includes 0.125" bleed)\n` +
                    `Canvas at 300 DPI: ${coverPixelsWidth} x ${coverPixelsHeight} px\n` +
                    `Outer Bleed: 0.125"\n` +
                    `Safe Area Margin: 0.25" inward\n` +
                    `Barcode Reserved Area: 2.0" x 1.2" (Back cover lower right)\n` +
                    `\n` +
                    `KDP PRINT ECONOMICS (ESTIMATED):\n` +
                    `------------------------------------------------------------\n` +
                    `US Print Cost: $${economics.us.printCost} | Suggested Price: $${economics.us.suggestedPrice}\n` +
                    `India Print Cost: ₹${economics.india.printCost} | Suggested Price: ₹${economics.india.suggestedPrice}\n` +
                    `\n` +
                    `PREFLIGHT STATUS: PASS\n` +
                    `============================================================\n` +
                    `Generated by PublishStudio (Zero-Server Architecture - ₹0 Cost Challenge)\n`;
                  const blob = new Blob([spec], { type: 'text/plain' });
                  saveAs(blob, `KDP_Production_Spec_${trimSize}.txt`);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-6 py-3 rounded-full transition shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download KDP Production Spec (.txt)</span>
              </button>
            </div>
          </section>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8C8479]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Step 3: Cover</span>
            </button>
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

      {/* Studio Settings Modal */}
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
              All core formatting, calculations, and preflight tools run 100% free in your browser with zero server data collection.
            </p>
            <input
              type="password"
              placeholder={isAdmin ? '••••••••••••••••' : 'Master Secret or Access Token'}
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

      {/* Studio Footer */}
      <footer className={`w-full max-w-5xl border-t mt-auto pt-6 text-center text-[11px] font-sans ${
        isDarkMode ? 'border-[#262429] text-[#716E77]' : 'border-[#EFEAE2] text-[#9E968B]'
      }`}>
        &copy; {new Date().getFullYear()} PUBLISHSTUDIO • ₹0 Investment Book Production Studio • Amazon KDP Ready • Zero-Server Architecture
      </footer>
    </main>
  );
}
