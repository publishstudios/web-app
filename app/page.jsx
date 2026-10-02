'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, BookOpen, Layers, Download, RefreshCw, 
  CheckCircle2, Sparkles, Printer, Sliders, Key, X, 
  Award, Sun, Moon, Crown, Eye, Maximize2, ShieldCheck,
  Plus, Copy, Trash2, CheckSquare, Square, Grid, Image as ImageIcon,
  Sparkle, AlertCircle
} from 'lucide-react';
import { 
  Document, Packer, Paragraph, TextRun, HeadingLevel, 
  PageBreak, AlignmentType, Header, Footer, PageNumber
} from 'docx';
import { saveAs } from 'file-saver';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generatePlannerDocx } from './plannerEngine';

// Secure SHA-256 Hash of "StudioMasterAdmin"
const ADMIN_DIGEST_HASH = 'bf447475f3a0a382c4ae72bbec2c7a5223abf12f205c066e4a2bc1e0691d1ea1';

async function computeSHA256(message) {
  const msgBuffer = new TextEncoder().encode(message.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('manuscript');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [trimSize, setTrimSize] = useState('6x9');
  const [pageCount, setPageCount] = useState(120);
  const [paperType, setPaperType] = useState('cream'); // 'cream' or 'white'

  const [bookTitle, setBookTitle] = useState('Title of the Work');
  const [authorName, setAuthorName] = useState('Author Name');

  // Authorization & Credits
  const [isAdmin, setIsAdmin] = useState(false);
  const [credits, setCredits] = useState(3);
  const [apiKey, setApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState('');

  // Manuscript State
  const [fileName, setFileName] = useState('');
  const [rawTextLines, setRawTextLines] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Planner Tab: Mode Switcher ('archetypes' | 'visual_builder')
  const [plannerMode, setPlannerMode] = useState('visual_builder');
  const [plannerType, setPlannerType] = useState('daily_focus');
  const [plannerDays, setPlannerDays] = useState(90);
  const [customNiche, setCustomNiche] = useState('');
  const [isGeneratingPlanner, setIsGeneratingPlanner] = useState(false);

  // Visual Image Strip State
  const [visualPages, setVisualPages] = useState([]); // { id, name, dataUrl, rawBytes, mimeType, width, height, dpi }
  const [selectedPageIds, setSelectedPageIds] = useState(new Set());
  const [repeatMultiplier, setRepeatMultiplier] = useState(4);
  const [enableFolios, setEnableFolios] = useState(false);
  const [enableBleed, setEnableBleed] = useState(true);
  const [isCompilingPdf, setIsCompilingPdf] = useState(false);

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

    if (savedAdmin === 'unlimited_studio_verified') {
      setIsAdmin(true);
    }
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
      setStatusMessage('Admin master access unlocked: Unlimited generations enabled.');
      setShowKeyModal(false);
      return;
    }

    setApiKey(input);
    localStorage.setItem('ps_gemini_key', input);
    setShowKeyModal(false);
  };

  const calculateGutter = (total) => {
    if (total <= 150) return 0.375;
    if (total <= 300) return 0.500;
    if (total <= 500) return 0.625;
    if (total <= 700) return 0.750;
    return 0.875;
  };

  // Synchronize total extent with uploaded image pages or slider
  const activePages = activeTab === 'manuscript' 
    ? pageCount 
    : (plannerMode === 'visual_builder' && visualPages.length > 0 ? visualPages.length : plannerDays);

  const gutter = calculateGutter(activePages);
  const outsideMargin = 0.375;
  const topBottomMargin = 0.5;

  const trimSpecs = {
    '6x9': { width: 6.0, height: 9.0 },
    '5.5x8.5': { width: 5.5, height: 8.5 },
    '8.5x11': { width: 8.5, height: 11.0 },
    '5x8': { width: 5.0, height: 8.0 },
  };

  const currentTrim = trimSpecs[trimSize] || trimSpecs['6x9'];

  // Cover Calculator Math
  const paperThicknessMultiplier = paperType === 'cream' ? 0.0025 : 0.002252;
  const spineWidth = Number((activePages * paperThicknessMultiplier).toFixed(3));
  const bleed = 0.125;
  const fullCoverWidth = Number(((currentTrim.width * 2) + spineWidth + (bleed * 2)).toFixed(3));
  const fullCoverHeight = Number((currentTrim.height + (bleed * 2)).toFixed(3));

  const coverPixelsWidth = Math.round(fullCoverWidth * 300);
  const coverPixelsHeight = Math.round(fullCoverHeight * 300);

  const trimDimensionsTwips = {
    '6x9': { width: 6 * 1440, height: 9 * 1440 },
    '5.5x8.5': { width: 5.5 * 1440, height: 8.5 * 1440 },
    '8.5x11': { width: 8.5 * 1440, height: 11 * 1440 },
    '5x8': { width: 5 * 1440, height: 8 * 1440 },
  };
    // Calculate true DPI for uploaded image against current trim size
  const calculateTrueDpi = (pixelWidth, pixelHeight) => {
    const targetWidth = enableBleed ? currentTrim.width + 0.125 : currentTrim.width;
    const targetHeight = enableBleed ? currentTrim.height + 0.25 : currentTrim.height;
    const dpiX = Math.round(pixelWidth / targetWidth);
    const dpiY = Math.round(pixelHeight / targetHeight);
    return Math.min(dpiX, dpiY);
  };

  // Lossless binary image intake without HTML5 Canvas downsampling
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

  // Batch Image Drop / Upload (Natural numerical sorting)
  const handleVisualBatchUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Natural sort filenames (page_1, page_2, page_10)
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    const processed = [];
    for (const f of files) {
      if (f.type.startsWith('image/')) {
        const item = await processImageFile(f);
        processed.push(item);
      }
    }

    setVisualPages((prev) => [...prev, ...processed]);
    setStatusMessage(`Added ${processed.length} image pages to visual strip.`);
    if (visualBatchInputRef.current) visualBatchInputRef.current.value = '';
  };

  // Insert single image after a specific index
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

  // Card Operations: Duplicate Single
  const duplicateSingleCard = (idx) => {
    setVisualPages((prev) => {
      const target = prev[idx];
      const clone = {
        ...target,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  };

  // Card Operations: Delete Single
  const deleteSingleCard = (idx) => {
    setVisualPages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Multi-Select Operations
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

  // Lossless PDF-Lib Compiler (Zero Downsampling, Full DPI Passthrough)
  const handleExportVisualPdf = async () => {
    if (!visualPages.length) return;
    setIsCompilingPdf(true);
    setStatusMessage('Compiling lossless PDF interior...');

    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Convert inches to PDF points (1 inch = 72 points)
      const bleedTopBottomPt = enableBleed ? 0.125 * 72 : 0;
      const pageWidthPt = (currentTrim.width * 72) + (enableBleed ? 0.125 * 72 : 0);
      const pageHeightPt = (currentTrim.height * 72) + (bleedTopBottomPt * 2);

      for (let i = 0; i < visualPages.length; i++) {
        const pageItem = visualPages[i];
        const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);
        const pageNumber = i + 1;
        const isEven = pageNumber % 2 === 0;

        let embeddedImage;
        if (pageItem.mimeType.includes('png')) {
          embeddedImage = await pdfDoc.embedPng(pageItem.rawBytes);
        } else {
          embeddedImage = await pdfDoc.embedJpg(pageItem.rawBytes);
        }

        // Draw image directly onto page bounds (lossless pixel retention)
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: pageWidthPt,
          height: pageHeightPt,
        });

        // Optional running folios
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
      saveAs(blob, `Visual_Planner_${trimSize}_${visualPages.length}Pages.pdf`);
      setStatusMessage(`Complete: Exported ${visualPages.length}-page lossless PDF interior.`);
    } catch (err) {
      console.error(err);
      alert('Error creating PDF. Please check your image formats.');
    } finally {
      setIsCompilingPdf(false);
    }
  };

  // Manuscript Upload & DOCX Handlers
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
      const selectedTrim = trimDimensionsTwips[trimSize] || trimDimensionsTwips['6x9'];
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
            children: [
              new TextRun({
                children: [PageNumber.CURRENT],
                font: 'Georgia',
                size: 18,
                color: '524E49',
              }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { before: 180 },
          }),
        ],
      });

      const footerOdd = new Footer({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                children: [PageNumber.CURRENT],
                font: 'Georgia',
                size: 18,
                color: '524E49',
              }),
            ],
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
              size: selectedTrim,
              margin: {
                top: Math.round(topBottomMargin * 1440),
                bottom: Math.round(topBottomMargin * 1440),
                left: Math.round(gutter * 1440),
                right: Math.round(outsideMargin * 1440),
                mirrorMargins: true,
              },
            },
            titlePage: true,
            evenAndOddHeaders: true,
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
      setStatusMessage('Manuscript exported with mirror margins, running heads & mirrored folios.');
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
      {/* Responsive Two-Tier Header */}
      <header className={`w-full max-w-4xl flex flex-col gap-3.5 border-b pb-5 mb-6 sm:mb-8 ${
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
                  v4.5
                </span>
              </div>
              <span className={`text-[10px] sm:text-[11px] font-sans block truncate ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#8C8479]'}`}>
                Craft Print & Low-Content Studio
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
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

        <div className="w-full flex items-center justify-center sm:justify-end">
          <div className={`w-full sm:w-auto grid grid-cols-2 sm:flex items-center p-1 rounded-full border ${
            isDarkMode ? 'bg-[#1A181E] border-[#2B2833]' : 'bg-[#F1ECE4] border-[#E5DED4]'
          }`}>
            <button
              onClick={() => setActiveTab('manuscript')}
              className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition ${
                activeTab === 'manuscript'
                  ? (isDarkMode ? 'bg-[#2B2833] text-white shadow-sm' : 'bg-white text-[#1F1C18] shadow-sm')
                  : (isDarkMode ? 'text-[#8E8B92] hover:text-white' : 'text-[#827A70] hover:text-[#2D2A26]')
              }`}
            >
              <Sliders className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#E07A5F]' : 'text-[#B85D3E]'}`} />
              <span>Typeset</span>
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition ${
                activeTab === 'planner'
                  ? (isDarkMode ? 'bg-[#2B2833] text-white shadow-sm' : 'bg-white text-[#1F1C18] shadow-sm')
                  : (isDarkMode ? 'text-[#8E8B92] hover:text-white' : 'text-[#827A70] hover:text-[#2D2A26]')
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isDarkMode ? 'text-[#E07A5F]' : 'text-[#B85D3E]'}`} />
              <span>Planner Studio</span>
            </button>
          </div>
        </div>
      </header>

      {/* Manufacturing Trim & Margins Card */}
      <section className={`w-full max-w-4xl border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] mb-6 transition ${
        isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
      }`}>
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div className="flex items-center gap-2">
            <Layers className={`w-4 h-4 ${isDarkMode ? 'text-[#E07A5F]' : 'text-[#B85D3E]'}`} />
            <h2 className={`text-xs font-bold uppercase tracking-wider font-sans ${isDarkMode ? 'text-zinc-200' : 'text-[#1F1C18]'}`}>
              Manufacturing Specifications
            </h2>
          </div>
          <span className="text-[10px] sm:text-[11px] text-[#4F7358] font-sans bg-[#F0F5F1] border border-[#D5E3D8] px-2.5 py-0.5 rounded-full font-medium">
            POD Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-5">
          <div>
            <label className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider block mb-1.5 sm:mb-2 font-sans ${
              isDarkMode ? 'text-[#8E8B92]' : 'text-[#8C8479]'
            }`}>
              Trim Dimensions
            </label>
            <select
              value={trimSize}
              onChange={(e) => setTrimSize(e.target.value)}
              className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none transition ${
                isDarkMode 
                  ? 'bg-[#121114] border-[#2D2A35] text-zinc-200 focus:border-[#E07A5F]' 
                  : 'bg-[#FAF9F6] border-[#E8E2D8] text-[#2D2A26] focus:border-[#B85D3E]'
              }`}
            >
              <option value="6x9">6" x 9" (Standard Trade Paperback)</option>
              <option value="5.5x8.5">5.5" x 8.5" (Digest / Fiction)</option>
              <option value="8.5x11">8.5" x 11" (Workbook / Manual)</option>
              <option value="5x8">5" x 8" (Compact Fiction)</option>
            </select>
          </div>

          <div>
            <label className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider block mb-1.5 sm:mb-2 font-sans ${
              isDarkMode ? 'text-[#8E8B92]' : 'text-[#8C8479]'
            }`}>
              {activeTab === 'manuscript' 
                ? `Manuscript Extent (${pageCount} pages)` 
                : (plannerMode === 'visual_builder' && visualPages.length > 0 
                    ? `Visual Strip Extent (${visualPages.length} pages)` 
                    : `Planner Duration (${plannerDays} pages)`)}
            </label>
            <input
              type="range"
              min="24"
              max="500"
              value={activeTab === 'manuscript' ? pageCount : (plannerMode === 'visual_builder' && visualPages.length > 0 ? visualPages.length : plannerDays)}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (activeTab === 'manuscript') setPageCount(val);
                else setPlannerDays(val);
              }}
              disabled={activeTab === 'planner' && plannerMode === 'visual_builder' && visualPages.length > 0}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#B85D3E] mt-3 ${
                isDarkMode ? 'bg-[#292630]' : 'bg-[#EFEAE2]'
              } ${activeTab === 'planner' && plannerMode === 'visual_builder' && visualPages.length > 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>

        <div className={`border rounded-2xl p-3 sm:p-4 grid grid-cols-3 gap-2 sm:gap-3 text-center ${
          isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'
        }`}>
          <div>
            <span className={`text-[9px] sm:text-[10px] uppercase tracking-wider block mb-1 font-sans ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#9E968B]'}`}>
              Spine Gutter
            </span>
            <span className={`text-xs sm:text-sm font-bold font-mono ${isDarkMode ? 'text-[#E07A5F]' : 'text-[#B85D3E]'}`}>{gutter}"</span>
          </div>
          <div>
            <span className={`text-[9px] sm:text-[10px] uppercase tracking-wider block mb-1 font-sans ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#9E968B]'}`}>
              Outside Margin
            </span>
            <span className={`text-xs sm:text-sm font-semibold font-mono ${isDarkMode ? 'text-zinc-200' : 'text-[#3B3731]'}`}>{outsideMargin}"</span>
          </div>
          <div>
            <span className={`text-[9px] sm:text-[10px] uppercase tracking-wider block mb-1 font-sans ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#9E968B]'}`}>
              Top / Bottom
            </span>
            <span className={`text-xs sm:text-sm font-semibold font-mono ${isDarkMode ? 'text-zinc-200' : 'text-[#3B3731]'}`}>{topBottomMargin}"</span>
          </div>
        </div>
      </section>

      {/* FULL-WRAP COVER CALCULATOR */}
      <section className={`w-full max-w-4xl border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] mb-6 sm:mb-8 transition ${
        isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Maximize2 className={`w-4 h-4 ${isDarkMode ? 'text-[#E07A5F]' : 'text-[#B85D3E]'}`} />
            <h2 className={`text-xs font-bold uppercase tracking-wider font-sans ${isDarkMode ? 'text-zinc-200' : 'text-[#1F1C18]'}`}>
              Full-Wrap Paperback Cover Dimensions
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPaperType('cream')}
              className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition ${
                paperType === 'cream'
                  ? (isDarkMode ? 'bg-[#3A2A22] text-[#E07A5F] border border-[#52382D]' : 'bg-[#FAF3EC] text-[#B85D3E] border border-[#E9DFD3]')
                  : (isDarkMode ? 'text-[#8E8B92]' : 'text-[#8C8479]')
              }`}
            >
              Cream Paper
            </button>
            <button
              onClick={() => setPaperType('white')}
              className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition ${
                paperType === 'white'
                  ? (isDarkMode ? 'bg-[#3A2A22] text-[#E07A5F] border border-[#52382D]' : 'bg-[#FAF3EC] text-[#B85D3E] border border-[#E9DFD3]')
                  : (isDarkMode ? 'text-[#8E8B92]' : 'text-[#8C8479]')
              }`}
            >
              White Paper
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4">
          <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
            <span className={`text-[9px] uppercase tracking-wider block mb-1 font-sans ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#9E968B]'}`}>Spine Width</span>
            <span className={`text-xs sm:text-sm font-bold font-mono ${isDarkMode ? 'text-[#E07A5F]' : 'text-[#B85D3E]'}`}>{spineWidth}"</span>
          </div>
          <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
            <span className={`text-[9px] uppercase tracking-wider block mb-1 font-sans ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#9E968B]'}`}>Total Width</span>
            <span className={`text-xs sm:text-sm font-bold font-mono ${isDarkMode ? 'text-zinc-200' : 'text-[#1F1C18]'}`}>{fullCoverWidth}"</span>
          </div>
          <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
            <span className={`text-[9px] uppercase tracking-wider block mb-1 font-sans ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#9E968B]'}`}>Total Height</span>
            <span className={`text-xs sm:text-sm font-bold font-mono ${isDarkMode ? 'text-zinc-200' : 'text-[#1F1C18]'}`}>{fullCoverHeight}"</span>
          </div>
          <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-[#121114] border-[#292630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'}`}>
            <span className={`text-[9px] uppercase tracking-wider block mb-1 font-sans ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#9E968B]'}`}>Canvas @ 300 DPI</span>
            <span className={`text-[11px] sm:text-xs font-bold font-mono ${isDarkMode ? 'text-emerald-400' : 'text-[#4F7358]'}`}>{coverPixelsWidth} x {coverPixelsHeight} px</span>
          </div>
        </div>

        <div className={`flex items-center justify-between text-[10px] font-sans px-3.5 py-2.5 rounded-xl border ${
          isDarkMode ? 'bg-[#121114] border-[#292630] text-[#8E8B92]' : 'bg-[#FAF8F5] border-[#EFEAE2] text-[#8C8479]'
        }`}>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>KDP Bleed Standard: 0.125" included on all 4 outer margins</span>
          </div>
          <span className="font-mono">Ready for Canva / Photoshop</span>
        </div>
      </section>
                        {/* TAB 1: TYPESET STUDIO */}
      {activeTab === 'manuscript' && (
        <>
          <section className={`w-full max-w-4xl border rounded-3xl p-5 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] mb-6 sm:mb-8 transition ${
            isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mb-5">
              <div>
                <label className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider block mb-1.5 font-sans ${
                  isDarkMode ? 'text-[#8E8B92]' : 'text-[#8C8479]'
                }`}>
                  Book Title (Odd / Recto Header)
                </label>
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs font-serif focus:outline-none transition ${
                    isDarkMode 
                      ? 'bg-[#121114] border-[#2D2A35] text-zinc-100 focus:border-[#E07A5F]' 
                      : 'bg-[#FAF9F6] border-[#E8E2D8] text-[#2D2A26] focus:border-[#B85D3E]'
                  }`}
                  placeholder="Enter Title"
                />
              </div>

              <div>
                <label className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider block mb-1.5 font-sans ${
                  isDarkMode ? 'text-[#8E8B92]' : 'text-[#8C8479]'
                }`}>
                  Author Name (Even / Verso Header)
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs font-serif focus:outline-none transition ${
                    isDarkMode 
                      ? 'bg-[#121114] border-[#2D2A35] text-zinc-100 focus:border-[#E07A5F]' 
                      : 'bg-[#FAF9F6] border-[#E8E2D8] text-[#2D2A26] focus:border-[#B85D3E]'
                  }`}
                  placeholder="Enter Author"
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#B85D3E] hover:bg-[#A35034] text-white font-medium text-xs px-5 py-3 rounded-full transition shadow-md shadow-[#B85D3E]/20 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering Native Sheets...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>{fileName ? `Uploaded: ${fileName}` : 'Upload DOCX Manuscript'}</span>
                  </>
                )}
              </button>

              {hasRendered && (
                <>
                  <button
                    onClick={handleExportManuscriptDocx}
                    disabled={isExporting}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 border font-medium text-xs px-4 py-3 rounded-full transition ${
                      isDarkMode 
                        ? 'bg-[#222026] hover:bg-[#2B2930] border-[#34313B] text-zinc-200' 
                        : 'bg-[#FAF8F5] hover:bg-[#F2EDE4] border-[#E5DDD1] text-[#2D2A26]'
                    }`}
                  >
                    {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-[#5A8264]" />}
                    <span>Export Formatted DOCX</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 border font-medium text-xs px-4 py-3 rounded-full transition ${
                      isDarkMode 
                        ? 'bg-[#222026] hover:bg-[#2B2930] border-[#34313B] text-zinc-200' 
                        : 'bg-[#FAF8F5] hover:bg-[#F2EDE4] border-[#E5DDD1] text-[#2D2A26]'
                    }`}
                  >
                    <Printer className={`w-4 h-4 ${isDarkMode ? 'text-[#E07A5F]' : 'text-[#B85D3E]'}`} />
                    <span>Print / Save Vector PDF</span>
                  </button>
                </>
              )}
            </div>

            {statusMessage && (
              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#5A8264] font-medium font-sans">
                <CheckCircle2 className="w-4 h-4" />
                <span>{statusMessage}</span>
              </div>
            )}
          </section>

          {/* INTERACTIVE BOOK CRAFT EMPTY STATE */}
          {!hasRendered && (
            <section className={`w-full max-w-4xl border rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] mb-8 transition ${
              isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
            }`}>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EFEAE2] dark:border-[#262429]">
                <div className="flex items-center gap-2">
                  <Eye className={`w-4 h-4 ${isDarkMode ? 'text-[#E07A5F]' : 'text-[#B85D3E]'}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider font-sans ${isDarkMode ? 'text-zinc-200' : 'text-[#1F1C18]'}`}>
                    Book Craft Spread Preview (Interactive Mockup)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#8E8B92]">
                  {trimSize}" • {gutter}" Gutter
                </span>
              </div>

              <div className="relative w-full rounded-2xl bg-[#EBE5DC] dark:bg-[#0E0D10] p-3 sm:p-6 shadow-inner flex flex-col items-center">
                <div className="w-full max-w-2xl grid grid-cols-2 gap-1 sm:gap-2 shadow-2xl rounded-sm overflow-hidden border border-[#D5CDBD] dark:border-[#282630]">
                  
                  {/* VERSO PAGE */}
                  <div className="bg-[#FAF8F5] text-[#2D2A26] p-4 sm:p-7 flex flex-col justify-between aspect-[1/1.42] relative select-none border-r border-[#E0D7C8]">
                    <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-gradient-to-l from-black/10 to-transparent pointer-events-none" />

                    <div className="text-center pb-2 border-b border-[#EADFD8]">
                      <span className="text-[9px] sm:text-[11px] font-serif uppercase tracking-widest text-[#7A7570] block truncate">
                        {authorName || 'AUTHOR NAME'}
                      </span>
                    </div>

                    <div className="space-y-2 sm:space-y-2.5 my-auto">
                      <div className="h-1.5 bg-[#D8CFBF] rounded-full w-full opacity-80" />
                      <div className="h-1.5 bg-[#D8CFBF] rounded-full w-11/12 opacity-80" />
                      <div className="h-1.5 bg-[#D8CFBF] rounded-full w-full opacity-80" />
                      <div className="h-1.5 bg-[#D8CFBF] rounded-full w-4/5 opacity-70" />
                      <div className="h-1.5 bg-[#D8CFBF] rounded-full w-full opacity-80" />
                      <div className="h-1.5 bg-[#D8CFBF] rounded-full w-10/12 opacity-75" />
                    </div>

                    <div className="pt-2 border-t border-[#EADFD8] text-left">
                      <span className="text-[9px] sm:text-[11px] font-serif font-bold text-[#524E49]">
                        2
                      </span>
                    </div>
                  </div>

                  {/* RECTO PAGE */}
                  <div className="bg-[#FAF8F5] text-[#2D2A26] p-4 sm:p-7 flex flex-col justify-between aspect-[1/1.42] relative select-none">
                    <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />

                    <div className="text-center pb-2 border-b border-[#EADFD8]">
                      <span className="text-[9px] sm:text-[11px] font-serif uppercase tracking-widest text-[#7A7570] block truncate">
                        {bookTitle || 'BOOK TITLE'}
                      </span>
                    </div>

                    <div className="my-auto">
                      <div className="text-center mb-3 sm:mb-4">
                        <span className="text-[8px] sm:text-[10px] uppercase font-sans tracking-widest text-[#B85D3E] font-bold block">
                          Chapter One
                        </span>
                        <span className="text-[11px] sm:text-sm font-serif font-bold text-[#1F1C18]">
                          The Genesis
                        </span>
                      </div>

                      <div className="flex gap-2 items-start mb-2">
                        <span className="text-2xl sm:text-4xl font-serif leading-none font-bold text-[#1F1C18]">
                          O
                        </span>
                        <div className="space-y-1.5 sm:space-y-2 flex-1 pt-0.5">
                          <div className="h-1.5 bg-[#D8CFBF] rounded-full w-full opacity-80" />
                          <div className="h-1.5 bg-[#D8CFBF] rounded-full w-full opacity-80" />
                        </div>
                      </div>

                      <div className="space-y-2 sm:space-y-2.5">
                        <div className="h-1.5 bg-[#D8CFBF] rounded-full w-full opacity-80" />
                        <div className="h-1.5 bg-[#D8CFBF] rounded-full w-10/12 opacity-75" />
                        <div className="h-1.5 bg-[#D8CFBF] rounded-full w-11/12 opacity-80" />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#EADFD8] text-right">
                      <span className="text-[9px] sm:text-[11px] font-serif font-bold text-[#524E49]">
                        3
                      </span>
                    </div>
                  </div>

                </div>

                <p className="mt-4 text-[10px] sm:text-[11px] font-sans text-center text-[#7A7570] dark:text-[#8E8B92]">
                  Live POD layout rendering: {gutter}" binding gutter calculated for {pageCount} pages.
                </p>
              </div>
            </section>
          )}

          {/* Native DOCX Sheets Viewer */}
          <section className="w-full max-w-4xl flex flex-col items-center">
            <div
              ref={docxViewerRef}
              className="w-full flex flex-col items-center gap-8 py-4 [&_.docx-page-sheet]:shadow-xl [&_.docx-page-sheet]:rounded-sm [&_.docx-page-sheet]:border [&_.docx-page-sheet]:border-[#E8E2D8] [&_.docx-page-sheet]:bg-white [&_.docx-page-sheet]:text-black"
            />
          </section>
        </>
      )}
                {/* TAB 2: PLANNER STUDIO (VISUAL STRIP & ARCHETYPES) */}
      {activeTab === 'planner' && (
        <section className={`w-full max-w-4xl border rounded-3xl p-5 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] mb-6 sm:mb-8 transition ${
          isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
        }`}>
          {/* Sub-Mode Selector */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-[#EFEAE2] dark:border-[#262429] mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 ${isDarkMode ? 'text-[#E07A5F]' : 'text-[#B85D3E]'}`} />
              <h2 className={`text-xs font-bold uppercase tracking-wider font-sans ${isDarkMode ? 'text-zinc-200' : 'text-[#1F1C18]'}`}>
                Planner Creation Engine
              </h2>
            </div>

            <div className={`p-1 rounded-full border flex items-center ${
              isDarkMode ? 'bg-[#121114] border-[#282630]' : 'bg-[#FAF8F5] border-[#EFEAE2]'
            }`}>
              <button
                onClick={() => setPlannerMode('visual_builder')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                  plannerMode === 'visual_builder'
                    ? (isDarkMode ? 'bg-[#292630] text-white shadow-sm' : 'bg-white text-[#1F1C18] shadow-sm')
                    : (isDarkMode ? 'text-[#8E8B92]' : 'text-[#8C8479]')
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#B85D3E]" />
                <span>Visual Image Strip</span>
              </button>

              <button
                onClick={() => setPlannerMode('archetypes')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                  plannerMode === 'archetypes'
                    ? (isDarkMode ? 'bg-[#292630] text-white shadow-sm' : 'bg-white text-[#1F1C18] shadow-sm')
                    : (isDarkMode ? 'text-[#8E8B92]' : 'text-[#8C8479]')
                }`}
              >
                <Grid className="w-3.5 h-3.5 text-[#5A8264]" />
                <span>DOCX Archetypes</span>
              </button>
            </div>
          </div>

          {/* MODE 1: VISUAL IMAGE STRIP BUILDER */}
          {plannerMode === 'visual_builder' && (
            <div className="flex flex-col gap-6">
              {/* Global Strip Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSelectAll}
                    disabled={!visualPages.length}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-medium transition disabled:opacity-40 ${
                      isDarkMode ? 'bg-[#151418] border-[#282630] text-zinc-300' : 'bg-[#FAF8F5] border-[#E8E2D8] text-[#2D2A26]'
                    }`}
                  >
                    {selectedPageIds.size > 0 && selectedPageIds.size === visualPages.length ? (
                      <CheckSquare className="w-3.5 h-3.5 text-[#B85D3E]" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-[#8C8479]" />
                    )}
                    <span>Select All ({visualPages.length})</span>
                  </button>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enableFolios}
                      onChange={(e) => setEnableFolios(e.target.checked)}
                      className="accent-[#B85D3E] rounded"
                    />
                    <span className={`text-[11px] font-sans ${isDarkMode ? 'text-zinc-300' : 'text-[#524E49]'}`}>
                      Print Folios (Page Numbers)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={enableBleed}
                      onChange={(e) => setEnableBleed(e.target.checked)}
                      className="accent-[#B85D3E] rounded"
                    />
                    <span className={`text-[11px] font-sans ${isDarkMode ? 'text-zinc-300' : 'text-[#524E49]'}`}>
                      0.125" Bleed Lock
                    </span>
                  </label>
                </div>

                <div className="text-[11px] font-mono text-[#8C8479]">
                  Lossless Passthrough • 300+ DPI Preserved
                </div>
              </div>

              {/* Multi-File Intake Dropzone */}
              <input
                ref={visualBatchInputRef}
                type="file"
                multiple
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleVisualBatchUpload}
                className="hidden"
              />

              <input
                ref={visualSingleInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleInsertSingleImage}
                className="hidden"
              />

              {visualPages.length === 0 ? (
                <div
                  onClick={() => visualBatchInputRef.current?.click()}
                  className={`w-full py-16 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition ${
                    isDarkMode 
                      ? 'border-[#2D2A35] bg-[#141317] hover:border-[#E07A5F]/50' 
                      : 'border-[#E2D8CC] bg-[#FAF8F5] hover:border-[#B85D3E]/50'
                  }`}
                >
                  <div className="p-4 rounded-2xl bg-[#FAF4ED] dark:bg-[#251E1C] text-[#B85D3E] mb-3">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <span className={`text-sm font-bold font-serif mb-1 ${isDarkMode ? 'text-white' : 'text-[#1F1C18]'}`}>
                    Drop Planner Page Images Here
                  </span>
                  <p className={`text-xs max-w-sm text-center mb-4 ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#8C8479]'}`}>
                    Upload single templates, multi-page weekly sets, or complete books (PNG/JPG). Full resolution is retained untouched.
                  </p>
                  <span className="px-4 py-2 bg-[#B85D3E] text-white text-xs font-semibold rounded-full shadow-md shadow-[#B85D3E]/20">
                    Browse Files
                  </span>
                </div>
              ) : (
                /* Atelier Visual Card Grid */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-20">
                  {visualPages.map((page, index) => {
                    const isSelected = selectedPageIds.has(page.id);
                    const isUltraHd = page.dpi >= 400;
                    const isSharp = page.dpi >= 300;

                    return (
                      <div
                        key={page.id}
                        className={`group relative rounded-2xl border overflow-hidden transition-all duration-200 flex flex-col justify-between ${
                          isSelected 
                            ? (isDarkMode ? 'ring-2 ring-[#E07A5F] border-[#E07A5F] bg-[#221C1B]' : 'ring-2 ring-[#B85D3E] border-[#B85D3E] bg-[#FAF3EC]') 
                            : (isDarkMode ? 'border-[#292630] bg-[#141317]' : 'border-[#EAE3D8] bg-[#FAF9F6]')
                        }`}
                      >
                        {/* Top Badges: Select Checkbox & DPI Pill */}
                        <div className="p-2 flex items-center justify-between absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent">
                          <button
                            onClick={() => toggleSelectCard(page.id)}
                            className="text-white hover:text-[#E07A5F] transition"
                          >
                            {isSelected ? <CheckSquare className="w-4 h-4 text-[#B85D3E]" /> : <Square className="w-4 h-4 opacity-80" />}
                          </button>

                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold backdrop-blur-md ${
                            isUltraHd 
                              ? 'bg-purple-900/70 text-purple-200 border border-purple-400/30' 
                              : isSharp 
                                ? 'bg-emerald-900/70 text-emerald-200 border border-emerald-400/30' 
                                : 'bg-amber-900/70 text-amber-200 border border-amber-400/30'
                          }`}>
                            {page.dpi} DPI
                          </span>
                        </div>

                        {/* Page Preview Thumbnail */}
                        <div className="w-full aspect-[1/1.42] overflow-hidden bg-black/5 flex items-center justify-center relative">
                          <img
                            src={page.dataUrl}
                            alt={page.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Bottom Label & Card Micro-Dock */}
                        <div className="p-2.5 flex items-center justify-between border-t border-[#EFEAE2] dark:border-[#262429]">
                          <span className="text-[10px] font-mono font-bold text-[#8C8479]">
                            p. {index + 1}
                          </span>

                          {/* Action Dock (3 Modern Icons) */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                insertIndexRef.current = index;
                                visualSingleInputRef.current?.click();
                              }}
                              className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition text-zinc-600 dark:text-zinc-300"
                              title="Insert new image after this"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => duplicateSingleCard(index)}
                              className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition text-zinc-600 dark:text-zinc-300"
                              title="Duplicate page"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteSingleCard(index)}
                              className="p-1 rounded-md hover:bg-rose-500/10 text-rose-500 transition"
                              title="Remove page"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Floating Glass Set Duplication & PDF Export Bar */}
              {visualPages.length > 0 && (
                <div className="sticky bottom-6 w-full max-w-3xl mx-auto z-40">
                  <div className={`p-3.5 rounded-3xl border shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 ${
                    isDarkMode ? 'bg-[#18171B]/90 border-[#322F3B]' : 'bg-white/95 border-[#E6DDD0]'
                  }`}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => visualBatchInputRef.current?.click()}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-semibold transition ${
                          isDarkMode ? 'bg-[#222026] border-[#34313B] text-zinc-200' : 'bg-[#FAF8F5] border-[#E2D8CC] text-[#1F1C18]'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5 text-[#B85D3E]" />
                        <span>Add Pages</span>
                      </button>

                      {selectedPageIds.size > 0 && (
                        <div className="flex items-center gap-2 border-l pl-3 border-[#E2D8CC] dark:border-[#322F3B]">
                          <select
                            value={repeatMultiplier}
                            onChange={(e) => setRepeatMultiplier(Number(e.target.value))}
                            className={`border rounded-xl px-2 py-1 text-xs font-mono focus:outline-none ${
                              isDarkMode ? 'bg-[#121114] border-[#322F3B] text-zinc-200' : 'bg-[#FAF9F6] border-[#E2D8CC] text-[#2D2A26]'
                            }`}
                          >
                            <option value={1}>x 1 Repeat</option>
                            <option value={4}>x 4 (1 Month)</option>
                            <option value={12}>x 12 (1 Quarter)</option>
                            <option value={52}>x 52 (Full Year)</option>
                          </select>

                          <button
                            onClick={handleDuplicateSelectedSet}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#B85D3E] text-white rounded-full text-xs font-semibold shadow-sm"
                            title="Duplicate selected set"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Duplicate Set ({selectedPageIds.size})</span>
                          </button>

                          <button
                            onClick={handleDeleteSelected}
                            className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-full transition"
                            title="Delete Selected"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleExportVisualPdf}
                      disabled={isCompilingPdf}
                      className="inline-flex items-center gap-2 bg-[#5A8264] hover:bg-[#4C7055] text-white font-medium text-xs px-5 py-2.5 rounded-full transition shadow-md shadow-[#5A8264]/20 disabled:opacity-50"
                    >
                      {isCompilingPdf ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Embedding Lossless PDF...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Print PDF ({visualPages.length} pgs)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: CURATED DOCX ARCHETYPES */}
          {plannerMode === 'archetypes' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-6">
                {/* Daily Focus Card */}
                <div 
                  onClick={() => setPlannerType('daily_focus')}
                  className={`p-4 rounded-3xl border cursor-pointer transition-all duration-200 text-left flex flex-col justify-between overflow-hidden ${
                    plannerType === 'daily_focus' 
                      ? (isDarkMode ? 'bg-[#241F20] border-[#E07A5F] shadow-lg ring-2 ring-[#E07A5F]/20' : 'bg-[#FAF4ED] border-[#B85D3E] shadow-md ring-2 ring-[#B85D3E]/20') 
                      : (isDarkMode ? 'bg-[#151418] border-[#282630] hover:border-[#3A3745]' : 'bg-[#FAF9F6] border-[#EAE3D8] hover:border-[#D8CFBF]')
                  }`}
                >
                  <div className="w-full h-32 sm:h-36 rounded-2xl relative overflow-hidden mb-4 shadow-sm group">
                    <img 
                      src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80" 
                      alt="Daily Focus" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-white bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                          90-Day Sprint
                        </span>
                        <div className="w-2.5 h-6 bg-[#B85D3E] rounded-b-sm shadow-sm" />
                      </div>
                      <div className="text-white">
                        <div className="text-xs font-serif font-bold tracking-wide">The Focused Day</div>
                        <span className="text-[10px] text-zinc-300 font-sans">Cognitive Deep Work</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className={`text-sm font-bold block mb-1 font-serif ${isDarkMode ? 'text-zinc-100' : 'text-[#1F1C18]'}`}>
                      Daily Focus & Timeblock
                    </span>
                    <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-[#9E9BA3]' : 'text-[#6B6357]'}`}>
                      Priorities, time blocks, and rotating cognitive deep work prompts.
                    </p>
                  </div>
                </div>

{/* Meal & Kitchen Command Card */}
                <div 
                  onClick={() => setPlannerType('meal_grocery')}
                  className={`p-4 rounded-3xl border cursor-pointer transition-all duration-200 text-left flex flex-col justify-between overflow-hidden ${
                    plannerType === 'meal_grocery' 
                      ? (isDarkMode ? 'bg-[#241F20] border-[#E07A5F] shadow-lg ring-2 ring-[#E07A5F]/20' : 'bg-[#FAF4ED] border-[#B85D3E] shadow-md ring-2 ring-[#B85D3E]/20') 
                      : (isDarkMode ? 'bg-[#151418] border-[#282630] hover:border-[#3A3745]' : 'bg-[#FAF9F6] border-[#EAE3D8] hover:border-[#D8CFBF]')
                  }`}
                >
                  <div className="w-full h-32 sm:h-36 rounded-2xl relative overflow-hidden mb-4 shadow-sm group">
                    <img 
                      src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=600&q=80" 
                      alt="Meal Command" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-white bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                          Weekly Rotation
                        </span>
                        <div className="w-2.5 h-6 bg-[#5A8264] rounded-b-sm shadow-sm" />
                      </div>
                      <div className="text-white">
                        <div className="text-xs font-serif font-bold tracking-wide">Kitchen & Pantry</div>
                        <span className="text-[10px] text-zinc-300 font-sans">Dinner & Grocery Matrix</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className={`text-sm font-bold block mb-1 font-serif ${isDarkMode ? 'text-zinc-100' : 'text-[#1F1C18]'}`}>
                      Meal & Kitchen Command
                    </span>
                    <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-[#9E9BA3]' : 'text-[#6B6357]'}`}>
                      Weekly lunch & dinner rotation tables with pantry checklists.
                    </p>
                  </div>
                </div>

                {/* Habit Tracking Matrix Card */}
                <div 
                  onClick={() => setPlannerType('habit_matrix')}
                  className={`p-4 rounded-3xl border cursor-pointer transition-all duration-200 text-left flex flex-col justify-between overflow-hidden ${
                    plannerType === 'habit_matrix' 
                      ? (isDarkMode ? 'bg-[#241F20] border-[#E07A5F] shadow-lg ring-2 ring-[#E07A5F]/20' : 'bg-[#FAF4ED] border-[#B85D3E] shadow-md ring-2 ring-[#B85D3E]/20') 
                      : (isDarkMode ? 'bg-[#151418] border-[#282630] hover:border-[#3A3745]' : 'bg-[#FAF9F6] border-[#EAE3D8] hover:border-[#D8CFBF]')
                  }`}
                >
                  <div className="w-full h-32 sm:h-36 rounded-2xl relative overflow-hidden mb-4 shadow-sm group">
                    <img 
                      src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80" 
                      alt="Habit Matrix" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-white bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                          Habit Loops
                        </span>
                        <div className="w-2.5 h-6 bg-[#65619A] rounded-b-sm shadow-sm" />
                      </div>
                      <div className="text-white">
                        <div className="text-xs font-serif font-bold tracking-wide">Atomic Rituals</div>
                        <span className="text-[10px] text-zinc-300 font-sans">7-Day Consistency Grids</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className={`text-sm font-bold block mb-1 font-serif ${isDarkMode ? 'text-zinc-100' : 'text-[#1F1C18]'}`}>
                      Habit Tracking Matrix
                    </span>
                    <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-[#9E9BA3]' : 'text-[#6B6357]'}`}>
                      7-day tracker grids and habit loops with strategic focus rules.
                    </p>
                  </div>
                </div>
              </div>

              {/* Custom Infill Direction */}
              <div className="mb-6">
                <label className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider block mb-1.5 sm:mb-2 font-sans ${
                  isDarkMode ? 'text-[#8E8B92]' : 'text-[#8C8479]'
                }`}>
                  Custom Sub-Niche / AI Direction (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stoic Philosophy, Mediterranean Diet, ADHD Daily Executive Routine"
                  value={customNiche}
                  onChange={(e) => setCustomNiche(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none transition ${
                    isDarkMode 
                      ? 'bg-[#121114] border-[#2D2A35] text-zinc-200 placeholder:text-zinc-600 focus:border-[#E07A5F]' 
                      : 'bg-[#FAF9F6] border-[#E8E2D8] text-[#2D2A26] placeholder:text-[#9E968B] focus:border-[#B85D3E]'
                  }`}
                />
              </div>

              <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t ${
                isDarkMode ? 'border-[#292630]' : 'border-[#EFEAE2]'
              }`}>
                <div className={`text-xs font-mono text-center sm:text-left ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#6B6357]'}`}>
                  Output: <span className={`font-bold ${isDarkMode ? 'text-zinc-100' : 'text-[#1F1C18]'}`}>{plannerDays} Pages</span> • Trim: <span className={`font-bold ${isDarkMode ? 'text-zinc-100' : 'text-[#1F1C18]'}`}>{trimSize}"</span> • Gutter: <span className={`font-bold ${isDarkMode ? 'text-[#E07A5F]' : 'text-[#B85D3E]'}`}>{gutter}"</span>
                </div>

                <button
                  onClick={handleRunPlanner}
                  disabled={isGeneratingPlanner}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#B85D3E] hover:bg-[#A35034] text-white font-medium text-xs px-6 py-3 rounded-full transition shadow-md shadow-[#B85D3E]/20 disabled:opacity-50"
                >
                  {isGeneratingPlanner ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Document...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Generate Print-Ready Planner DOCX</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#5A8264] font-medium font-sans">
              <CheckCircle2 className="w-4 h-4" />
              <span>{statusMessage}</span>
            </div>
          )}
        </section>
      )}

      {/* Access Settings Modal (BYOK & Master Secret) */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md border rounded-3xl p-6 sm:p-7 shadow-2xl relative text-left transition ${
            isDarkMode ? 'bg-[#18171B] border-[#292630]' : 'bg-white border-[#EFEAE2]'
          }`}>
            <button 
              onClick={() => setShowKeyModal(false)}
              className={`absolute top-5 right-5 ${isDarkMode ? 'text-zinc-400 hover:text-white' : 'text-[#8C8479] hover:text-[#1F1C18]'}`}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-[#2A1D1A] text-[#E07A5F]' : 'bg-[#FAF4ED] text-[#B85D3E]'}`}>
                {isAdmin ? <Crown className="w-4 h-4" /> : <Key className="w-4 h-4" />}
              </div>
              <h3 className={`text-sm font-bold font-serif ${isDarkMode ? 'text-white' : 'text-[#1F1C18]'}`}>
                {isAdmin ? 'Studio Admin Active' : 'Access Authorization (BYOK)'}
              </h3>
            </div>

            <p className={`text-xs mb-4 leading-relaxed font-sans ${isDarkMode ? 'text-[#8E8B92]' : 'text-[#6B6357]'}`}>
              {isAdmin 
                ? 'Your Master Admin privileges are verified. You have unrestricted, unlimited generation capacity across all tools.'
                : 'Enter your Google Gemini API key for dynamic generation, or enter your master administrative credentials to unlock unlimited studio privileges.'}
            </p>

            <input
              type="password"
              placeholder={isAdmin ? '••••••••••••••••' : 'AIzaSy... or Secret Key'}
              value={tempKeyInput}
              onChange={(e) => setTempKeyInput(e.target.value)}
              className={`w-full border rounded-xl px-3.5 py-2.5 text-xs mb-4 font-mono transition ${
                isDarkMode 
                  ? 'bg-[#121114] border-[#2D2A35] text-zinc-200 placeholder:text-zinc-600 focus:border-[#E07A5F]' 
                  : 'bg-[#FAF9F6] border-[#E8E2D8] text-[#2D2A26] placeholder:text-[#9E968B] focus:border-[#B85D3E]'
              }`}
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setApiKey('');
                  setTempKeyInput('');
                  setIsAdmin(false);
                  localStorage.removeItem('ps_gemini_key');
                  localStorage.removeItem('ps_studio_admin_token');
                  setShowKeyModal(false);
                }}
                className={`px-3.5 py-2 rounded-full text-xs transition ${
                  isDarkMode ? 'text-[#8E8B92] hover:text-white' : 'text-[#8C8479] hover:text-[#1F1C18]'
                }`}
              >
                Reset Access
              </button>
              <button
                onClick={handleSaveSecret}
                className="px-4 py-2 bg-[#B85D3E] hover:bg-[#A35034] text-white rounded-full text-xs font-semibold transition"
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
        &copy; {new Date().getFullYear()} PUBLISHSTUDIO • Atelier Edition • Zero-Server Architecture
      </footer>
    </main>
  );
                                                        }
