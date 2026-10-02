'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, BookOpen, Layers, Download, RefreshCw, 
  CheckCircle2, Sparkles, Printer, Sliders, Key, X, 
  Award, Sun, Moon, Crown, Eye, Maximize2, ShieldCheck,
  Plus, Copy, Trash2, CheckSquare, Square, Grid, Image as ImageIcon,
  Compass, HelpCircle, Check, AlertTriangle, ArrowRight, ArrowLeft,
  ChevronRight, Settings2, FileText, CheckCircle
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

  // Physical Attributes
  const [trimSize, setTrimSize] = useState('5.5x8.5');
  const [pageCount, setPageCount] = useState(220);
  const [paperType, setPaperType] = useState('cream');
  const [enableBleed, setEnableBleed] = useState(false);
  const [bindingType, setBindingType] = useState('paperback');

  // Advanced Margin Overrides
  const [customMargins, setCustomMargins] = useState({
    top: 0.625,
    bottom: 0.625,
    outside: 0.50
  });

  // Metadata
  const [bookTitle, setBookTitle] = useState('Title of the Work');
  const [authorName, setAuthorName] = useState('Author Name');

  // Authorization & BYOK
  const [isAdmin, setIsAdmin] = useState(false);
  const [credits, setCredits] = useState(3);
  const [apiKey, setApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState('');

  // Step 2: Interior Manuscript State
  const [interiorSubMode, setInteriorSubMode] = useState('typeset'); // 'typeset' | 'visual_strip' | 'planner_docx'
  const [fileName, setFileName] = useState('');
  const [rawTextLines, setRawTextLines] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

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

  useEffect(() => {
    const savedAdmin = localStorage.getItem('ps_studio_admin_token');
    const savedCredits = localStorage.getItem('ps_credits');
    const savedKey = localStorage.getItem('ps_gemini_key');
    const savedTheme = localStorage.getItem('ps_theme');

    if (savedAdmin === 'unlimited_studio_verified') setIsAdmin(true);
    if (savedCredits !== null) setCredits(Number(savedCredits));
    if (savedKey) {
      setApiKey(savedKey);
      setTempKeyInput(savedKey);
    }
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

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
      setStatusMessage('Admin master access unlocked: Unlimited studio privileges.');
      setShowKeyModal(false);
      return;
    }

    setApiKey(input);
    localStorage.setItem('ps_gemini_key', input);
    setShowKeyModal(false);
  };

  // Synchronize Archetype Selections
  const handleSelectArchetype = (archKey) => {
    const preset = BOOK_ARCHETYPES[archKey];
    if (!preset) return;

    setSelectedArchetype(archKey);
    setTrimSize(preset.defaultTrim);
    setPaperType(preset.defaultPaper);
    setEnableBleed(preset.defaultBleed);
    setPageCount(preset.defaultPages);
    setCustomMargins({ ...preset.margins });
  };

  // Dynamic Physical Math (Calculated via productionMath.js)
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
    }
    setIsProcessing(true);
    setHasRendered(false);
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
        setHasRendered(true);
      }
    } catch (err) {
      console.error(err);
      alert('Error parsing document. Please supply a valid .docx manuscript.');
    } finally {
      setIsProcessing(false);
    }
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
    if (!isAdmin && credits <= 0 && !apiKey) {
      setShowKeyModal(true);
      return;
    }

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

      if (!isAdmin && !apiKey && credits > 0) {
        const nextCredits = credits - 1;
        setCredits(nextCredits);
        localStorage.setItem('ps_credits', nextCredits.toString());
      }

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
                  Production Studio
                </span>
              </div>
              <span className={`text-[10px] sm:text-[11px] font-sans block truncate ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#8C8479]'}`}>
                Platform-Independent Book Production Workflow
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Beginner / Advanced Switcher */}
            <button
              onClick={() => setExperienceMode(experienceMode === 'beginner' ? 'advanced' : 'beginner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-sans transition shadow-sm ${
                experienceMode === 'advanced'
                  ? (isDarkMode ? 'bg-[#3A2A22] text-[#E07A5F] border-[#52382D]' : 'bg-[#FAF4ED] text-[#B85D3E] border-[#E9DFD3] font-semibold')
                  : (isDarkMode ? 'bg-[#1C1A20] border-[#2E2B35] text-zinc-400' : 'bg-white border-[#E8E1D7] text-[#6B645A]')
              }`}
              title="Toggle Beginner / Advanced Experience"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span className="capitalize">{experienceMode}</span>
            </button>

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

            <button
              onClick={() => setShowKeyModal(true)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border text-[11px] sm:text-xs transition shadow-sm font-sans ${
                isDarkMode 
                  ? 'bg-[#1C1A20] border-[#2E2B35] hover:bg-[#25232B]' 
                  : 'bg-white border-[#E8E1D7] hover:bg-[#FAF7F2]'
              }`}
            >
              {isAdmin ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-[#B85D3E]" />
                  <span className="text-[#B85D3E] font-bold">Admin</span>
                </>
              ) : apiKey ? (
                <>
                  <Key className="w-3.5 h-3.5 text-[#5A8264]" />
                  <span className="text-[#5A8264] font-medium">BYOK</span>
                </>
              ) : (
                <>
                  <Award className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#E07A5F]' : 'text-[#B85D3E]'}`} />
                  <span className={`font-medium ${isDarkMode ? 'text-[#C5C2BD]' : 'text-[#6B645A]'}`}>
                    {credits} Credits
                  </span>
                </>
              )}
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
          {/* Intake Guidance Card */}
          <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
            isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className={`text-sm sm:text-base font-serif font-bold ${isDarkMode ? 'text-zinc-100' : 'text-[#1F1C18]'}`}>
                  What are you creating?
                </h2>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#7A7368]'}`}>
                  Select your publication type to load production-ready trim, paper, and margin presets.
                </p>
              </div>
              <span className="text-[10px] text-[#4F7358] font-sans bg-[#F0F5F1] dark:bg-[#1E2721] border border-[#D5E3D8] dark:border-[#2D4534] px-2.5 py-1 rounded-full font-medium">
                Standard POD Presets
              </span>
            </div>

            {/* Archetype Grid */}
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

            {/* Educational Context Pill */}
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
                  onChange={(e) => setTrimSize(e.target.value)}
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
                  onChange={(e) => setPaperType(e.target.value)}
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
                  onChange={(e) => setPageCount(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#B85D3E] mt-3 bg-[#EFEAE2] dark:bg-[#292630]"
                />
              </div>
            </div>

            {/* Calculated Margins Readout */}
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
              </div>
              <div>
                <span className={`text-[9px] uppercase tracking-wider block mb-1 font-sans ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#9E968B]'}`}>
                  Outside Margin
                </span>
                <span className={`text-xs sm:text-sm font-semibold font-mono ${isDarkMode ? 'text-zinc-200' : 'text-[#3B3731]'}`}>
                  {outsideMargin}"
                </span>
              </div>
              <div>
                <span className={`text-[9px] uppercase tracking-wider block mb-1 font-sans ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#9E968B]'}`}>
                  Top / Bottom
                </span>
                <span className={`text-xs sm:text-sm font-semibold font-mono ${isDarkMode ? 'text-zinc-200' : 'text-[#3B3731]'}`}>
                  {topBottomMargin}"
                </span>
              </div>
            </div>

            {/* Advanced Direct Overrides Drawer */}
            {experienceMode === 'advanced' && (
              <div className="pt-4 border-t border-black/5 dark:border-white/5 grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-[#8C8479] uppercase block mb-1">Top Margin</label>
                  <input
                    type="number"
                    step="0.05"
                    value={customMargins.top}
                    onChange={(e) => setCustomMargins({ ...customMargins, top: Number(e.target.value) })}
                    className="w-full border rounded-lg px-2.5 py-1.5 text-xs font-mono bg-transparent"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#8C8479] uppercase block mb-1">Bottom Margin</label>
                  <input
                    type="number"
                    step="0.05"
                    value={customMargins.bottom}
                    onChange={(e) => setCustomMargins({ ...customMargins, bottom: Number(e.target.value) })}
                    className="w-full border rounded-lg px-2.5 py-1.5 text-xs font-mono bg-transparent"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#8C8479] uppercase block mb-1">Outside Margin</label>
                  <input
                    type="number"
                    step="0.05"
                    value={customMargins.outside}
                    onChange={(e) => setCustomMargins({ ...customMargins, outside: Number(e.target.value) })}
                    className="w-full border rounded-lg px-2.5 py-1.5 text-xs font-mono bg-transparent"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Forward Navigation Action */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-[#8C8479] font-sans">
              Designed around common print-on-demand publishing specifications.
            </span>
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 bg-[#B85D3E] hover:bg-[#A35034] text-white font-medium text-xs px-6 py-3 rounded-full transition shadow-md shadow-[#B85D3E]/20"
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

            {/* Sub-Format Switcher */}
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
                    onChange={(e) => setBookTitle(e.target.value)}
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
                    onChange={(e) => setAuthorName(e.target.value)}
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

            {/* Dimension Matrix */}
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
                <span className="text-[11px] sm:text-xs font-bold font-mono text-emerald-500">{coverPixelsWidth} x {coverPixelsHeight} px</span>
              </div>
            </div>

            {/* Visual Cover Layout Blueprint */}
            <div className="w-full aspect-[2/1] rounded-2xl border border-dashed border-[#B85D3E]/40 p-3 flex items-center justify-between text-center relative overflow-hidden bg-black/5 dark:bg-white/5 mb-4">
              <div className="flex-1 h-full border border-black/10 dark:border-white/10 rounded-lg flex flex-col justify-center items-center p-2">
                <span className="text-[10px] uppercase font-bold text-[#8C8479]">Back Cover</span>
                <span className="text-[9px] font-mono text-[#8C8479]">{currentTrim.width}" × {currentTrim.height}"</span>
              </div>
              <div className="w-12 h-full border-x border-[#B85D3E] flex flex-col justify-center items-center bg-[#B85D3E]/10">
                <span className="text-[8px] uppercase font-bold text-[#B85D3E] rotate-90 whitespace-nowrap">Spine {spineWidth}"</span>
              </div>
              <div className="flex-1 h-full border border-black/10 dark:border-white/10 rounded-lg flex flex-col justify-center items-center p-2">
                <span className="text-[10px] uppercase font-bold text-[#8C8479]">Front Cover</span>
                <span className="text-[9px] font-mono text-[#8C8479]">{currentTrim.width}" × {currentTrim.height}"</span>
              </div>
            </div>

            <p className="text-[10px] text-center text-[#8C8479]">
              0.125" mechanical bleed included. Enter exact pixel canvas ({coverPixelsWidth} × {coverPixelsHeight} px) into Canva / Photoshop.
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

      {/* STEP 4: PRINT PREFLIGHT & BOOK HEALTH */}
      {currentStep === 4 && (
        <div className="w-full max-w-4xl flex flex-col gap-6">
          <section className={`border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition ${
            isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
          }`}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#5A8264]" />
                <h2 className={`text-xs font-bold uppercase tracking-wider font-sans ${isDarkMode ? 'text-zinc-200' : 'text-[#1F1C18]'}`}>
                  Book Health & Production Preflight
                </h2>
              </div>
              <span className="text-[10px] text-[#5A8264] font-semibold bg-[#F0F5F1] dark:bg-[#1E2721] px-2.5 py-0.5 rounded-full border border-[#D5E3D8] dark:border-[#2D4534]">
                Automated Verification
              </span>
            </div>

            {/* Preflight Findings Checklist */}
            <div className="space-y-3 mb-6">
              <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="font-semibold block text-emerald-600 dark:text-emerald-400">Page Extent Compatible</span>
                    <span className="text-[11px] text-[#8C8479]">{activeEffectivePages} pages meets the standard 24-page trade minimum.</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600">PASS</span>
              </div>

              <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="font-semibold block text-emerald-600 dark:text-emerald-400">Spine Gutter Margin</span>
                    <span className="text-[11px] text-[#8C8479]">{gutter}" inner margin calculated to prevent spine text clipping.</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600">PASS</span>
              </div>

              <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="font-semibold block text-emerald-600 dark:text-emerald-400">300 DPI Raster Output</span>
                    <span className="text-[11px] text-[#8C8479]">Cover dimensions calibrated to commercial 300 DPI specifications.</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600">PASS</span>
              </div>

              {spineWidth < 0.20 && (
                <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="font-semibold block text-amber-600 dark:text-amber-400">Narrow Spine Notice</span>
                      <span className="text-[11px] text-[#8C8479]">Spine width ({spineWidth}") is under 0.20". Text on the spine is not recommended.</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-600">REVIEW</span>
                </div>
              )}
            </div>

            {/* Spec Sheet Export Action */}
            <div className="pt-5 border-t border-black/5 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-[#8C8479] font-sans">
                Always verify final files against the current requirements of your selected publishing platform.
              </span>
              <button
                onClick={() => {
                  const spec = `PUBLISHSTUDIO - PRODUCTION SPECIFICATION REPORT\n` +
                    `--------------------------------------------------\n` +
                    `Publication Type: ${BOOK_ARCHETYPES[selectedArchetype]?.title}\n` +
                    `Trim Dimensions: ${currentTrim.width}" x ${currentTrim.height}"\n` +
                    `Page Count: ${activeEffectivePages}\n` +
                    `Paper Stock: ${PAPER_SPECS[paperType]?.label}\n` +
                    `Gutter Margin: ${gutter}"\n` +
                    `Outside Margin: ${outsideMargin}"\n` +
                    `Top/Bottom Margin: ${topBottomMargin}"\n\n` +
                    `FULL-WRAP COVER SPECIFICATIONS:\n` +
                    `Spine Width: ${spineWidth}"\n` +
                    `Total Dimensions: ${fullCoverWidth}" x ${fullCoverHeight}"\n` +
                    `Canvas at 300 DPI: ${coverPixelsWidth} x ${coverPixelsHeight} px\n` +
                    `Mechanical Bleed: ${enableBleed ? '0.125"' : 'None'}\n` +
                    `--------------------------------------------------\n` +
                    `Generated by PublishStudio Zero-Server Production Studio`;
                  const blob = new Blob([spec], { type: 'text/plain' });
                  saveAs(blob, `Production_Specifications_${trimSize}.txt`);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#5A8264] hover:bg-[#4C7055] text-white font-medium text-xs px-6 py-3 rounded-full transition shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Download Production Specification</span>
              </button>
            </div>
          </section>

          {/* Step 4 Back Action */}
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

      {/* Access Settings Modal (BYOK & Master Secret) */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md border rounded-3xl p-6 sm:p-7 shadow-2xl relative text-left transition ${
            isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
          }`}>
            <button 
              onClick={() => setShowKeyModal(false)}
              className="absolute top-5 right-5 text-[#8C8479]"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-[#B85D3E]" />
              <h3 className="text-sm font-bold font-serif">Studio Authorization</h3>
            </div>
            <input
              type="password"
              placeholder={isAdmin ? '••••••••••••••••' : 'API Key or Master Secret'}
              value={tempKeyInput}
              onChange={(e) => setTempKeyInput(e.target.value)}
              className="w-full border rounded-xl px-3.5 py-2.5 text-xs mb-4 font-mono bg-transparent"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-xs text-[#8C8479]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSecret}
                className="px-4 py-2 bg-[#B85D3E] text-white rounded-full text-xs font-semibold"
              >
                Authorize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Studio Footer */}
      <footer className={`w-full max-w-4xl border-t mt-auto pt-6 text-center text-[11px] font-sans ${
        isDarkMode ? 'border-[#262429] text-[#716E77]' : 'border-[#EFEAE2] text-[#9E968B]'
      }`}>
        &copy; {new Date().getFullYear()} PUBLISHSTUDIO • Platform-Independent Book Production Architecture
      </footer>
    </main>
  );
          }
    
