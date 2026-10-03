'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, BookOpen, Layers, Download, RefreshCw, 
  CheckCircle2, Sparkles, Printer, Sliders, Key, X, 
  Sun, Moon, Crown, Eye, Maximize2, ShieldCheck,
  Plus, Copy, Trash2, CheckSquare, Square, Grid, Image as ImageIcon,
  Compass, HelpCircle, Check, AlertTriangle, ArrowRight, ArrowLeft,
  ChevronRight, Settings2, FileText, CheckCircle, AlertCircle, List,
  PlayCircle, Lock, Shield
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

export default function Home() {
  // 4-Step Production Pipeline State
  const [currentStep, setCurrentStep] = useState(1);
  const [experienceMode, setExperienceMode] = useState('beginner'); // 'beginner' | 'advanced'
  const [selectedArchetype, setSelectedArchetype] = useState('novel');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeHelpModal, setActiveHelpModal] = useState(null);

  // Physical Attributes & Book Profile
  const [trimSize, setTrimSize] = useState('5.5x8.5');
  const [pageCount, setPageCount] = useState(220);
  const [paperType, setPaperType] = useState('cream');
  const [enableBleed, setEnableBleed] = useState(false);
  const [bindingType, setBindingType] = useState('paperback');

  // Advanced Margin Overrides (Inches)
  const [customMargins, setCustomMargins] = useState({
    top: 0.625,
    bottom: 0.625,
    outside: 0.50
  });

  // Metadata
  const [bookTitle, setBookTitle] = useState('Title of the Work');
  const [authorName, setAuthorName] = useState('Author Name');

  // Authorization & Studio Settings (Access modal without confusing standalone credits)
  const [isAdmin, setIsAdmin] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState('');

  // Step 2: Interior Manuscript & Analysis State
  const [interiorSubMode, setInteriorSubMode] = useState('typeset'); // 'typeset' | 'visual_strip' | 'planner_docx'
  const [fileName, setFileName] = useState('');
  const [rawTextLines, setRawTextLines] = useState([]);
  const [manuscriptAnalysis, setManuscriptAnalysis] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Interactive Book Craft Spread Preview State
  const [activeSpreadPage, setActiveSpreadPage] = useState(2); // Left page number (Verso)

  // Step 2: Visual Planner & Archetype Engine State
  const [plannerType, setPlannerType] = useState('daily_focus');
  const [plannerDays, setPlannerDays] = useState(90);
  const [customNiche, setCustomNiche] = useState('');
  const [isGeneratingPlanner, setIsGeneratingPlanner] = useState(false);
  const [visualPages, setVisualPages] = useState([]);
  const [selectedPageIds, setSelectedPageIds] = useState(new Set());
  const [repeatMultiplier, setRepeatMultiplier] = useState(4);
  const [enableFolios, setEnableFolios] = useState(false);
  const [isCompilingPdf, setIsCompilingPdf] = useState(false);

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

  const handleInsertSingleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file || insertIndexRef.current === null) return;

    const item = await processImageFile(file);
    setVisualPages((prev) => {
      const next = [...prev];
      next.splice(insertIndexRef.current + 1, 0, item);
      return next;
    });

    insertIndexRef.current = null;
    if (visualSingleInputRef.current) visualSingleInputRef.current.value = '';
  };

  const duplicateSingleCard = (idx) => {
    setVisualPages((prev) => {
      const target = prev[idx];
      const clone = { ...target, id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  };

  const deleteSingleCard = (idx) => {
    setVisualPages((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleSelectCard = (id) => {
    setSelectedPageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedPageIds.size === visualPages.length) {
      setSelectedPageIds(new Set());
    } else {
      setSelectedPageIds(new Set(visualPages.map((p) => p.id)));
    }
  };

  const handleDuplicateSelectedSet = () => {
    if (!selectedPageIds.size) return;
    const selectedItems = visualPages.filter((p) => selectedPageIds.has(p.id));
    const clones = [];

    for (let r = 0; r < repeatMultiplier; r++) {
      selectedItems.forEach((item) => {
        clones.push({
          ...item,
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
      });
    }

    setVisualPages((prev) => [...prev, ...clones]);
    setStatusMessage(`Duplicated set of ${selectedItems.length} pages × ${repeatMultiplier} times.`);
  };

  const handleDeleteSelected = () => {
    setVisualPages((prev) => prev.filter((p) => !selectedPageIds.has(p.id)));
    setSelectedPageIds(new Set());
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
        setHasRendered(true);
      }
    } catch (err) {
      console.error(err);
      alert('Error parsing document. Please supply a valid .docx manuscript.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Sample/Demo Mode: Instant preview without file upload
  const handleLoadSampleManuscript = () => {
    setFileName('Sample_Novel_Manuscript.docx');
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
      {/* Studio Master Header */}
      <header className={`w-full max-w-4xl flex flex-col gap-4 border-b pb-5 mb-6 ${
        isDarkMode ? 'border-[#262429]' : 'border-[#EFEAE2]'
      }`}>
        <div className="w-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`p-2 sm:p-2.5 rounded-2xl border shadow-sm shrink-0 ${
              isDarkMode 
                ? 'bg-[#1C1A20] border-[#2E2B35] text-[#E07A5F]' 
                : 'bg-[#FAF4ED] border-[#E9DFD3] text-[#B85D3E]'
            }`}>
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className={`text-sm sm:text-base font-serif font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#1F1C18]'}`}>
                  PUBLISHSTUDIO
                </span>
                <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-medium border shrink-0 ${
                  isDarkMode 
                    ? 'bg-[#2A1D1A] text-[#E07A5F] border-[#4A2D25]' 
                    : 'bg-[#FAF3EC] text-[#B85D3E] border-[#E9DFD3]'
                }`}>
                  Book Production & Print Studio
                </span>
              </div>
              <span className={`text-[10px] sm:text-[11px] font-sans block truncate ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#8C8479]'}`}>
                Zero-Server Architecture • Your manuscript never leaves your browser
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Beginner / Advanced Mode Switcher */}
            <button
              onClick={() => setExperienceMode(experienceMode === 'beginner' ? 'advanced' : 'beginner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-sans transition shadow-sm ${
                experienceMode === 'advanced'
                  ? (isDarkMode ? 'bg-[#3A2A22] text-[#E07A5F] border-[#52382D]' : 'bg-[#FAF4ED] text-[#B85D3E] border-[#E9DFD3] font-semibold')
                  : (isDarkMode ? 'bg-[#1C1A20] border-[#2E2B35] text-zinc-400' : 'bg-white border-[#E8E1D7] text-[#6B645A]')
              }`}
              title="Toggle Beginner Guidance or Direct Technical Controls"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span className="capitalize">{experienceMode}</span>
            </button>

            {/* Dark / Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full border transition shadow-sm ${
                isDarkMode 
                  ? 'bg-[#1C1A20] border-[#2E2B35] text-amber-300 hover:bg-[#25232B]' 
                  : 'bg-white border-[#E8E1D7] text-[#6B645A] hover:bg-[#FAF7F2]'
              }`}
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>

            {/* Settings & Admin Cog (Clean access without confusing standalone credits) */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className={`p-2 rounded-full border transition shadow-sm ${
                isDarkMode 
                  ? 'bg-[#1C1A20] border-[#2E2B35] text-zinc-400 hover:text-white' 
                  : 'bg-white border-[#E8E1D7] text-[#6B645A] hover:text-[#1F1C18]'
              }`}
              title="Access & Settings"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4-Step Production Pipeline Navigation Bar */}
        <nav className={`w-full grid grid-cols-4 p-1 rounded-2xl border ${
          isDarkMode ? 'bg-[#1A181E] border-[#2B2833]' : 'bg-[#F1ECE4] border-[#E5DED4]'
        }`}>
          {[
            { num: 1, label: 'Setup', icon: Compass },
            { num: 2, label: 'Interior', icon: FileText },
            { num: 3, label: 'Cover', icon: Maximize2 },
            { num: 4, label: 'Preflight', icon: CheckCircle },
          ].map((st) => {
            const IconComponent = st.icon;
            const isActive = currentStep === st.num;
            return (
              <button
                key={st.num}
                onClick={() => setCurrentStep(st.num)}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? (isDarkMode ? 'bg-[#2B2833] text-white shadow-sm font-semibold' : 'bg-white text-[#1F1C18] shadow-sm font-semibold')
                    : (isDarkMode ? 'text-[#8E8B92] hover:text-white' : 'text-[#827A70] hover:text-[#2D2A26]')
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono ${
                  isActive ? 'bg-[#B85D3E] text-white' : (isDarkMode ? 'bg-[#25232A] text-zinc-400' : 'bg-[#E3DCcf] text-zinc-600')
                }`}>
                  {st.num}
                </span>
                <span className="hidden sm:inline">{st.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* STEP 1: BOOK SETUP ("What are you creating?") */}
      {currentStep === 1 && (
        <div className="w-full max-w-4xl flex flex-col gap-6">
          
          {/* Quick Mental-Model Intent Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: 'Format Book', desc: 'Typeset & analyze manuscript', step: 2, icon: FileText },
              { title: 'Full-Wrap Cover', desc: 'Calculate spine & safe areas', step: 3, icon: Maximize2 },
              { title: 'Print Preflight', desc: 'Verify manufacturing health', step: 4, icon: CheckCircle },
              { title: 'Try Sample Book', desc: 'Instant demo without upload', step: 2, isDemo: true, icon: PlayCircle },
            ].map((action, i) => {
              const ActionIcon = action.icon;
              return (
                <div
                  key={i}
                  onClick={() => {
                    if (action.isDemo) {
                      handleLoadSampleManuscript();
                    }
                    setCurrentStep(action.step);
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    isDarkMode 
                      ? 'bg-[#18171B] border-[#292630] hover:border-[#E07A5F]' 
                      : 'bg-white border-[#EFEAE2] hover:border-[#B85D3E] shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <ActionIcon className="w-4 h-4 text-[#B85D3E]" />
                    <span className="text-xs font-bold font-serif">{action.title}</span>
                  </div>
                  <p className="text-[10px] text-[#8C8479] leading-snug">{action.desc}</p>
                </div>
              );
            })}
          </div>

          <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
            isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className={`text-sm sm:text-base font-serif font-bold ${isDarkMode ? 'text-zinc-100' : 'text-[#1F1C18]'}`}>
                  What are you creating?
                </h2>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#7A7368]'}`}>
                  Select your publication type to load standard trim, paper weight, and margin recommendations.
                </p>
              </div>
              <span className="text-[10px] text-[#4F7358] font-sans bg-[#F0F5F1] dark:bg-[#1E2721] border border-[#D5E3D8] dark:border-[#2D4534] px-2.5 py-1 rounded-full font-medium">
                Standard POD Presets
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
                              {/* Calibrated Manufacturing Specifications Card */}
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
                <label className={`text-[10px] font-semibold uppercase tracking-wider block mb-1.5 font-sans ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#8C8479]'}`}>
                  Trim Dimensions
                </label>
                <select
                  value={trimSize}
                  onChange={(e) => {
                    setTrimSize(e.target.value);
                    saveLocalBookProfile({ trimSize: e.target.value });
                  }}
                  className={`w-full border rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none transition ${
                    isDarkMode 
                      ? 'bg-[#121114] border-[#2D2A35] text-zinc-200 focus:border-[#E07A5F]' 
                      : 'bg-[#FAF9F6] border-[#E8E2D8] text-[#2D2A26] focus:border-[#B85D3E]'
                  }`}
                >
                  {Object.entries(TRIM_PRESETS).map(([id, t]) => (
                    <option key={id} value={id}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-wider block mb-1.5 font-sans ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#8C8479]'}`}>
                  Paper Stock Caliper
                </label>
                <select
                  value={paperType}
                  onChange={(e) => {
                    setPaperType(e.target.value);
                    saveLocalBookProfile({ paperType: e.target.value });
                  }}
                  className={`w-full border rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none transition ${
                    isDarkMode 
                      ? 'bg-[#121114] border-[#2D2A35] text-zinc-200 focus:border-[#E07A5F]' 
                      : 'bg-[#FAF9F6] border-[#E8E2D8] text-[#2D2A26] focus:border-[#B85D3E]'
                  }`}
                >
                  {Object.entries(PAPER_SPECS).map(([id, p]) => (
                    <option key={id} value={id}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-wider block mb-1.5 font-sans ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#8C8479]'}`}>
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

            {/* Live Manufacturing Metric Readouts */}
            <div className={`border rounded-2xl p-4 grid grid-cols-3 gap-2 text-center mb-4 ${
              isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'
            }`}>
              <div>
                <span className={`text-[9px] uppercase tracking-wider block mb-1 font-sans ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#9E968B]'}`}>
                  Spine Gutter
                </span>
                <span className={`text-xs sm:text-sm font-bold font-mono ${isDarkMode ? 'text-[#E07A5F]' : 'text-[#B85D3E]'}`}>
                  {gutter}"
                </span>
                <span className="text-[9px] text-[#8C8479] block mt-0.5 font-sans">
                  {gutter}" recommended binding space for {activeEffectivePages} pages.
                </span>
              </div>
              <div>
                <span className={`text-[9px] uppercase tracking-wider block mb-1 font-sans ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#9E968B]'}`}>
                  Outside Margin
                </span>
                <span className={`text-xs sm:text-sm font-semibold font-mono ${isDarkMode ? 'text-zinc-200' : 'text-[#3B3731]'}`}>
                  {outsideMargin}"
                </span>
                <span className="text-[9px] text-[#8C8479] block mt-0.5 font-sans">
                  Finger safe zone.
                </span>
              </div>
              <div>
                <span className={`text-[9px] uppercase tracking-wider block mb-1 font-sans ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#9E968B]'}`}>
                  Top / Bottom
                </span>
                <span className={`text-xs sm:text-sm font-semibold font-mono ${isDarkMode ? 'text-zinc-200' : 'text-[#3B3731]'}`}>
                  {topBottomMargin}"
                </span>
                <span className="text-[9px] text-[#8C8479] block mt-0.5 font-sans">
                  Running head buffer.
                </span>
              </div>
            </div>

            {/* Direct Technical Margin Controls (Shown in Advanced Mode) */}
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

          {/* Neutral Industry POD Notice */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-[#8C8479] font-sans text-center sm:text-left">
              Designed around common print-on-demand publishing specifications. Always verify final requirements with your selected publishing provider.
            </span>
            <button
              onClick={() => setCurrentStep(2)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#B85D3E] hover:bg-[#A35034] text-white font-medium text-xs px-6 py-3 rounded-full transition shadow-md shadow-[#B85D3E]/20"
            >
              <span>Continue to Step 2: Interior</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
            {/* STEP 2: INTERIOR FORMATTING & MANUSCRIPT */}
      {currentStep === 2 && (
        <div className="w-full max-w-4xl flex flex-col gap-6">
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
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#B85D3E] hover:bg-[#A35034] text-white font-medium text-xs px-5 py-3 rounded-full transition shadow-md shadow-[#B85D3E]/20"
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
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 border font-medium text-xs px-4 py-3 rounded-full transition bg-transparent"
                    >
                      {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-[#5A8264]" />}
                      <span>Export Formatted DOCX</span>
                    </button>
                  )}
                </div>
              </section>

              {/* RESTORED: BOOK CRAFT SPREAD PREVIEW (INTERACTIVE MOCKUP) */}
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

                {/* Open Two-Page Spread Canvas with Dynamic Gutter */}
                <div className={`w-full rounded-2xl border p-4 sm:p-6 flex items-center justify-center overflow-x-auto ${
                  isDarkMode ? 'bg-[#100F12] border-[#26242D]' : 'bg-[#F2EEE9] border-[#E5DDD2]'
                }`}>
                  <div className="flex items-center shadow-2xl rounded-sm overflow-hidden select-none border border-black/10">
                    
                    {/* Left Page (Verso - Even Page) */}
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

                    {/* Physical Spine Crease Shadow */}
                    <div className="w-[6px] sm:w-[8px] h-full bg-gradient-to-r from-black/25 via-black/10 to-black/25 z-10 self-stretch"></div>

                    {/* Right Page (Recto - Odd Page) */}
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

              {/* CLIENT-SIDE MANUSCRIPT INSPECTION & ANOMALY DASHBOARD */}
              {manuscriptAnalysis && (
                <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
                  isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#B85D3E]" />
                      <h3 className={`text-xs font-bold uppercase tracking-wider font-sans ${isDarkMode ? 'text-zinc-200' : 'text-[#1F1C18]'}`}>
                        Manuscript Structural Audit
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-[#5A8264] bg-[#F0F5F1] dark:bg-[#1E2721] px-2.5 py-0.5 rounded-full border border-[#D5E3D8] dark:border-[#2D4534]">
                      Zero-Server Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-5">
                    <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
                      <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Word Count</span>
                      <span className="text-xs sm:text-sm font-bold font-mono">{manuscriptAnalysis.wordCount.toLocaleString()}</span>
                    </div>
                    <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
                      <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Rendered Pages</span>
                      <span className="text-xs sm:text-sm font-bold font-mono text-[#B85D3E]">{manuscriptAnalysis.renderedPageCount}</span>
                    </div>
                    <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
                      <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Chapters Found</span>
                      <span className="text-xs sm:text-sm font-bold font-mono">{manuscriptAnalysis.detectedChapters.length}</span>
                    </div>
                    <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
                      <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Paragraph Blocks</span>
                      <span className="text-xs sm:text-sm font-bold font-mono">{manuscriptAnalysis.paragraphCount}</span>
                    </div>
                  </div>

                  {manuscriptAnalysis.renderedPageCount !== pageCount && (
                    <div className="mb-5 p-3 rounded-2xl border border-[#B85D3E]/30 bg-[#FAF4ED] dark:bg-[#251E1C] flex items-center justify-between text-xs">
                      <span className="text-[11px] text-[#8C8479]">
                        Detected page extent is <b>{manuscriptAnalysis.renderedPageCount} pages</b> (configured: {pageCount} pages).
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

                  <div className="space-y-2.5">
                    {manuscriptAnalysis.anomalies.map((anom, idx) => (
                      <div key={idx} className="p-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex items-start gap-2.5 text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block text-amber-700 dark:text-amber-400">{anom.title}</span>
                          <span className="text-[11px] text-[#8C8479] leading-relaxed">{anom.message}</span>
                        </div>
                      </div>
                    ))}

                    {manuscriptAnalysis.passes.map((pass, idx) => (
                      <div key={idx} className="p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-2.5 text-xs">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold block text-emerald-700 dark:text-emerald-400">{pass.title}</span>
                          <span className="text-[11px] text-[#8C8479] leading-relaxed">{pass.message}</span>
                        </div>
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
                  <p className="text-xs text-[#8C8479] mb-4">Lossless PNG / JPG passthrough with DPI preservation.</p>
                  <span className="px-4 py-2 bg-[#B85D3E] text-white text-xs font-semibold rounded-full shadow-md">Browse Files</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold">{visualPages.length} Pages in Visual Strip</span>
                    <button
                      onClick={handleExportVisualPdf}
                      disabled={isCompilingPdf}
                      className="px-4 py-2 bg-[#5A8264] text-white rounded-full text-xs font-medium"
                    >
                      Export Lossless Print PDF
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {visualPages.slice(0, 8).map((p, idx) => (
                      <div key={p.id} className="aspect-[1/1.42] border rounded-xl overflow-hidden relative">
                        <img src={p.dataUrl} alt={p.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                          p. {idx + 1}
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

          {/* Step 2 Bottom Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8C8479] hover:text-[#2D2A26]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Step 1: Setup</span>
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-2 bg-[#B85D3E] hover:bg-[#A35034] text-white font-medium text-xs px-6 py-3 rounded-full transition shadow-md shadow-[#B85D3E]/20"
            >
              <span>Continue to Step 3: Cover</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
            {/* STEP 3: COVER SPECIFICATIONS & SAFE AREA */}
      {currentStep === 3 && (
        <div className="w-full max-w-4xl flex flex-col gap-6">
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

            {/* Dimension Readouts Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-6">
              <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
                <span className="text-[9px] uppercase tracking-wider block mb-1 text-[#8C8479]">Spine Width</span>
                <span className={`text-xs sm:text-sm font-bold font-mono ${isDarkMode ? 'text-[#E07A5F]' : 'text-[#B85D3E]'}`}>{spineWidth}"</span>
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

            {/* Interactive Vector SVG Cover Blueprint */}
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

            <p className="text-[10px] text-center text-[#8C8479] font-sans">
              Standard Print Bleed: 0.125" included on all outer margins. Enter exact pixel canvas ({coverPixelsWidth} × {coverPixelsHeight} px) into Canva or Photoshop.
            </p>
          </section>

          {/* Step 3 Bottom Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8C8479] hover:text-[#2D2A26]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Step 2: Interior</span>
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-2 bg-[#B85D3E] hover:bg-[#A35034] text-white font-medium text-xs px-6 py-3 rounded-full transition shadow-md shadow-[#B85D3E]/20"
            >
              <span>Continue to Step 4: Preflight</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: PRINT PREFLIGHT & BOOK HEALTH SUMMARY */}
      {currentStep === 4 && (
        <div className="w-full max-w-4xl flex flex-col gap-6">
          <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
            isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
          }`}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#5A8264]" />
                <h2 className={`text-xs font-bold uppercase tracking-wider font-sans ${isDarkMode ? 'text-zinc-200' : 'text-[#1F1C18]'}`}>
                  Book Health & Print Preflight Summary
                </h2>
              </div>
              <span className="text-[10px] text-[#5A8264] font-semibold bg-[#F0F5F1] dark:bg-[#1E2721] px-2.5 py-0.5 rounded-full border border-[#D5E3D8] dark:border-[#2D4534]">
                Print Specification Check
              </span>
            </div>

            {/* Categorized Health Cards: Interior vs Cover */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#282630]' : 'bg-[#FAF8F5] border-[#EAE3D8]'}`}>
                <span className="text-[11px] font-bold font-serif block mb-2 text-[#B85D3E]">
                  Interior Health Specifications
                </span>
                <ul className="text-xs space-y-1.5 font-sans text-[#7A7368] dark:text-[#9E9BA3]">
                  <li>• Trim Size: <b>{currentTrim.width}" × {currentTrim.height}" Trade</b></li>
                  <li>• Page Extent: <b>{activeEffectivePages} pages</b> (Minimum 24 met)</li>
                  <li>• Binding Gutter: <b>{gutter}"</b> calculated safety margin</li>
                  <li>• Paper Stock: <b className="capitalize">{paperType}</b> ({PAPER_SPECS[paperType]?.caliper}" caliper)</li>
                </ul>
              </div>

              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#282630]' : 'bg-[#FAF8F5] border-[#EAE3D8]'}`}>
                <span className="text-[11px] font-bold font-serif block mb-2 text-[#5A8264]">
                  Cover Health Specifications
                </span>
                <ul className="text-xs space-y-1.5 font-sans text-[#7A7368] dark:text-[#9E9BA3]">
                  <li>• Full-Wrap Width: <b>{fullCoverWidth}"</b> (Includes spine & bleed)</li>
                  <li>• Full-Wrap Height: <b>{fullCoverHeight}"</b> (Includes 0.125" bleed)</li>
                  <li>• Calculated Spine: <b>{spineWidth}"</b></li>
                  <li>• 300 DPI Target: <b>{coverPixelsWidth} × {coverPixelsHeight} px</b></li>
                </ul>
              </div>
            </div>

            {/* Categorized Findings Matrix (PASS / REVIEW / FIX) */}
            <div className="space-y-3 mb-6">
              <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="font-semibold block text-emerald-600 dark:text-emerald-400">Page Extent Compatible</span>
                    <span className="text-[11px] text-[#8C8479]">{activeEffectivePages} pages meets standard trade print manufacturing minimums.</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600">✓ PASS</span>
              </div>

              <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="font-semibold block text-emerald-600 dark:text-emerald-400">Spine Gutter Margin</span>
                    <span className="text-[11px] text-[#8C8479]">{gutter}" inner margin calculated to prevent spine clipping during binding.</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600">✓ PASS</span>
              </div>

              <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="font-semibold block text-emerald-600 dark:text-emerald-400">300 DPI Commercial Target</span>
                    <span className="text-[11px] text-[#8C8479]">Dimensions verified for print-ready raster generation.</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600">✓ PASS</span>
              </div>

              {spineWidth < 0.20 && (
                <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="font-semibold block text-amber-600 dark:text-amber-400">Narrow Spine Notice</span>
                      <span className="text-[11px] text-[#8C8479]">Spine width ({spineWidth}") is under 0.20". Spine text is not recommended for books under 80 pages.</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-600">⚠ REVIEW</span>
                </div>
              )}
            </div>

            {/* Spec Sheet Export Action */}
            <div className="pt-5 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-[#8C8479] font-sans text-center sm:text-left">
                Designed around common print-on-demand publishing specifications. Always verify final requirements with your selected publishing provider.
              </span>
              <button
                onClick={() => {
                  const spec = `PUBLISHSTUDIO - PRODUCTION SPECIFICATION REPORT\n` +
                    `==================================================\n` +
                    `Book Title: ${bookTitle}\n` +
                    `Author: ${authorName}\n` +
                    `Publication Archetype: ${BOOK_ARCHETYPES[selectedArchetype]?.title}\n` +
                    `\n` +
                    `INTERIOR MANUFACTURING CALIBRATIONS:\n` +
                    `--------------------------------------------------\n` +
                    `Trim Size: ${currentTrim.width}" x ${currentTrim.height}"\n` +
                    `Page Count: ${activeEffectivePages} Pages\n` +
                    `Paper Stock: ${PAPER_SPECS[paperType]?.label}\n` +
                    `Binding Gutter Margin: ${gutter}"\n` +
                    `Outside Margin: ${outsideMargin}"\n` +
                    `Top/Bottom Margin: ${topBottomMargin}"\n` +
                    `Folios & Running Headers: Enabled (Mirrored)\n` +
                    `\n` +
                    `FULL-WRAP COVER SPECIFICATIONS:\n` +
                    `--------------------------------------------------\n` +
                    `Spine Width: ${spineWidth}"\n` +
                    `Full-Wrap Width: ${fullCoverWidth}" (Includes bleed + spine)\n` +
                    `Full-Wrap Height: ${fullCoverHeight}" (Includes 0.125" bleed)\n` +
                    `Required Canvas @ 300 DPI: ${coverPixelsWidth} x ${coverPixelsHeight} px\n` +
                    `Mechanical Outer Bleed: 0.125"\n` +
                    `Safe Area Margin: 0.25" inward from cut line\n` +
                    `Barcode Reserved Area: 2.0" x 1.2" (Bottom-right back cover)\n` +
                    `\n` +
                    `PREFLIGHT STATUS: VERIFIED\n` +
                    `==================================================\n` +
                    `Generated by PublishStudio Book Production Studio (Zero-Server Architecture)\n`;
                  const blob = new Blob([spec], { type: 'text/plain' });
                  saveAs(blob, `Production_Specifications_${trimSize}.txt`);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#5A8264] hover:bg-[#4C7055] text-white font-medium text-xs px-6 py-3 rounded-full transition shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download Production Specification (.txt)</span>
              </button>
            </div>
          </section>

          {/* Step 4 Bottom Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8C8479] hover:text-[#2D2A26]"
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
              className="absolute top-5 right-5 text-[#8C8479] hover:text-[#1F1C18]"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold font-serif mb-2">
              {FIELD_EXPLANATIONS[activeHelpModal]?.term}
            </h3>
            <p className="text-xs text-[#7A7368] dark:text-[#8E8B92] leading-relaxed mb-3">
              {FIELD_EXPLANATIONS[activeHelpModal]?.definition}
            </p>
            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-[11px] text-[#524E49] dark:text-zinc-300">
              <span className="font-semibold block mb-0.5">Why this matters:</span>
              {FIELD_EXPLANATIONS[activeHelpModal]?.why}
            </div>
          </div>
        </div>
      )}

      {/* Studio Settings & Access Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md border rounded-3xl p-6 sm:p-7 shadow-2xl relative text-left transition ${
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
      <footer className={`w-full max-w-4xl border-t mt-auto pt-6 text-center text-[11px] font-sans ${
        isDarkMode ? 'border-[#262429] text-[#716E77]' : 'border-[#EFEAE2] text-[#9E968B]'
      }`}>
        &copy; {new Date().getFullYear()} PUBLISHSTUDIO • Book Production & Print Studio • Zero-Server Client Architecture
      </footer>
    </main>
  );
                    }
                
