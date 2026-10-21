'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Book,
  HelpCircle,
  Sparkles,
  Download,
  ArrowRight,
  ArrowLeft,
  FolderOpen,
  X,
  Globe,
  Cpu,
  Calendar,
  ChevronRight,
  Upload,
  FileText,
  Type,
  Check,
  Sliders,
  Layers,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Wand2,
  Info,
  Plus,
  Trash2,
  BookOpen,
  Bookmark
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } from 'docx';
import { PDFDocument } from 'pdf-lib';
import {
  saveProjectToStorage,
  getAllProjectsFromStorage,
  deleteProjectFromStorage,
  recordReviewToStorage
} from './projectStorage';

/* --------------------------------------------------------------------------
   MASTER DATA & SPECIFICATIONS
-------------------------------------------------------------------------- */
const ARCHETYPES = [
  {
    id: 'fiction',
    name: 'Fiction & Novel',
    defaultTrim: '5.5x8.5',
    paper: 'cream',
    desc: '5.5"x8.5", Cream paper',
    colorTag: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30'
  },
  {
    id: 'nonfiction',
    name: 'Non-Fiction & Memoir',
    defaultTrim: '6x9',
    paper: 'white',
    desc: '6"x9", White paper',
    colorTag: 'bg-blue-500/15 text-blue-800 border-blue-500/30'
  },
  {
    id: 'workbook',
    name: 'Workbook & Training Manual',
    defaultTrim: '8.5x11',
    paper: 'white',
    desc: '8.5"x11", White paper',
    colorTag: 'bg-amber-500/15 text-amber-800 border-amber-500/30'
  },
  {
    id: 'custom',
    name: 'Custom Specification',
    defaultTrim: '6x9',
    paper: 'white',
    desc: '6"x9", White paper',
    colorTag: 'bg-purple-500/15 text-purple-800 border-purple-500/30'
  }
];

const TRIM_OPTIONS = [
  { id: '5x8', name: '5" x 8" (Compact Novella)', width: 5.0, height: 8.0, wordsPerPage: 220 },
  { id: '5.25x8', name: '5.25" x 8" (Pocket Fiction)', width: 5.25, height: 8.0, wordsPerPage: 235 },
  { id: '5.5x8.5', name: '5.5" x 8.5" (Standard Trade Paperback)', width: 5.5, height: 8.5, wordsPerPage: 250 },
  { id: '6x9', name: '6" x 9" (Standard Trade Paperback)', width: 6.0, height: 9.0, wordsPerPage: 300 },
  { id: '7x10', name: '7" x 10" (Executive / Handbook)', width: 7.0, height: 10.0, wordsPerPage: 380 },
  { id: '8.5x11', name: '8.5" x 11" (Workbook / Manual)', width: 8.5, height: 11.0, wordsPerPage: 450 }
];

const PAPER_SPECS = {
  cream: { label: 'Standard Cream (50-55 lb / 74-81 gsm)', caliper: 0.002500 },
  white: { label: 'Standard White (50-55 lb / 74-81 gsm)', caliper: 0.002252 },
  premium_color: { label: 'Premium Color (70 lb / 104 gsm)', caliper: 0.002700 }
};

const FONTS_TOP4 = [
  { id: 'EB Garamond, serif', name: 'Garamond', genre: 'Literary Fiction & Memoir' },
  { id: 'Merriweather, serif', name: 'Merriweather', genre: 'Trade Non-Fiction' },
  { id: 'Playfair Display, serif', name: 'Playfair / Cinzel', genre: 'Luxury & Historical' },
  { id: 'Inter, sans-serif', name: 'Inter Sans', genre: 'Workbooks & Modern Guides' }
];

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
  BR: { name: 'Brazil (BRL)', currency: 'BR', symbol: 'R$', base: 5.50, perPage: 0.08, fxRate: 5.10, defaultPrice: 65.00 }
};

const INITIAL_CHAPTERS = [
  {
    id: 'ch-1',
    status: 'draft',
    number: 'Chapter One',
    title: 'The Sea Before Rain',
    paragraphs: [
      "The stillness of the study was broken only by the clock on the mantelpiece. Outside, rain fell steadily against the tall glass panes, blurring the lamps along the quiet avenue into soft circles of amber. He dipped the nib of his pen into the dark ink, pausing to listen to the carriage wheels rolling across the wet cobblestones below.",
      "Every manuscript began this way—not with certainty, but with the quiet discipline of facing an empty sheet. The margins preserved the words, keeping the inner voice protected from the binding. A properly formatted book respects both the eyes of the reader and the physical machinery of the bindery."
    ]
  },
  {
    id: 'ch-2',
    status: 'draft',
    number: 'Chapter Two',
    title: 'The Proof of Binding',
    paragraphs: [
      "As morning arrived, the light revealed the true texture of the cream paper. The typeface held firmly to the fibers, its serif contours clear and undisturbed.",
      "In publishing, true precision is invisible; the reader experiences only the natural cadence of the thoughts, effortlessly flowing across each spread."
    ]
  }
];

export default function PublishStudioApp() {
  /* ROUTING & ACTIVE VIEW */
  const [activeView, setActiveView] = useState('home'); // 'home' | 'studio'
  const [currentStep, setCurrentStep] = useState(1);
  const [workflowMode, setWorkflowMode] = useState('manual'); // 'manual' | 'upload' | 'planner'
  const [plannerImages, setPlannerImages] = useState([]);
  const [plannerWarnings, setPlannerWarnings] = useState([]);
  const [plannerExportError, setPlannerExportError] = useState('');

  /* BOOK DNA / METADATA */
  const [bookTitle, setBookTitle] = useState('The Memory Chef');
  const [bookSubtitle, setBookSubtitle] = useState('A Novel of Love, Loss and Second Chances');
  const [authorName, setAuthorName] = useState('Kavita Chougule');
  const [copyrightNotice, setCopyrightNotice] = useState('Copyright © 2026 Kavita Chougule. All rights reserved.');
  const [dedicationText, setDedicationText] = useState('For those who preserve memories through love and ink.');
  const [targetFormat, setTargetFormat] = useState('both'); // 'ebook' | 'paperback' | 'both'
  const [rememberAuthor, setRememberAuthor] = useState(true);

  /* PHYSICAL & TYPOGRAPHY SPECS */
  const [selectedArchetype, setSelectedArchetype] = useState('fiction');
  const [trimSize, setTrimSize] = useState('5.5x8.5');
  const [paperType, setPaperType] = useState('cream');
  const [interiorBleed, setInteriorBleed] = useState(false);
  const [pageExtent, setPageExtent] = useState(120);

  const [typography, setTypography] = useState({
    fontFamily: 'EB Garamond, serif',
    bookTitleSize: 26,
    bookTitleWeight: 'bold',
    chapterTitleSize: 18,
    chapterTitleWeight: 'bold',
    chapterTitleItalic: false,
    bodySize: 11,
    bodyLineHeight: 1.6
  });

  /* STRUCTURED CHAPTER MANIFEST */
  const [chapters, setChapters] = useState(INITIAL_CHAPTERS);
  const [activeSectionId, setActiveSectionId] = useState('ch-1'); // 'title-page' | 'copyright' | 'toc' | 'dedication' | chapter-id
  const [spreadMode, setSpreadMode] = useState('2-page'); // '1-page' | '2-page'
  const [quickFixDrawerOpen, setQuickFixDrawerOpen] = useState(false);
  const [scoringModalOpen, setScoringModalOpen] = useState(false);
  const [exportSuccessOpen, setExportSuccessOpen] = useState(false);
  const [exportError, setExportError] = useState('');
  const [deletePromptOpen, setDeletePromptOpen] = useState(false);
  const [shelfProjects, setShelfProjects] = useState([]);
  const [storageNotice, setStorageNotice] = useState('');

  /* FINANCIAL / REVENUE MATRIX */
  const [usPaperbackPrice, setUsPaperbackPrice] = useState('12.99');
  const [usEbookPrice, setUsEbookPrice] = useState('4.99');
  const [royaltyShareTier, setRoyaltyShareTier] = useState(0.60);
  const [selectedKdpCountries, setSelectedKdpCountries] = useState(['IN', 'US', 'UK', 'DE', 'CA', 'AU']);
  const [initialMonthlySales, setInitialMonthlySales] = useState(50);
  const [monthlyGrowthRate, setMonthlyGrowthRate] = useState(5);

  /* MODALS & DRAWERS */
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  const [helpProfileDrawerOpen, setHelpProfileDrawerOpen] = useState(false);
  const [isShelfOpen, setIsShelfOpen] = useState(false);
  const [authorProfileEmail, setAuthorProfileEmail] = useState('');
  const [feedbackFeedback, setFeedbackFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  /* INITIAL LOCAL MEMORY LOAD */
  useEffect(() => {
    const key = localStorage.getItem('ps_user_ai_key');
    if (key) setUserApiKey(key);
    const savedAuthor = localStorage.getItem('ps_default_author');
    if (savedAuthor) setAuthorName(savedAuthor);
    getAllProjectsFromStorage().then(setShelfProjects).catch(() => {
      // IndexedDB may be unavailable in private browsing; the rest of the editor remains usable.
      setShelfProjects([]);
    });
  }, []);

  const handleAuthorNameChange = (val) => {
    setAuthorName(val);
    if (rememberAuthor && val.trim().length > 0) {
      localStorage.setItem('ps_default_author', val.trim());
    }
  };

  /* EXPORT: build a real editable Word document from the current manuscript.
     Keep this function isolated so export rules can be updated without rewriting the UI. */
  const handleExportWord = async () => {
    setExportError('');
    if (workflowMode === 'manual') {
      const unfinished = chapters.filter(chapter => chapter.status !== 'final');
      if (unfinished.length) {
        setExportError(`Before exporting a guided book, mark every chapter Final. Still to review: ${unfinished.map(chapter => chapter.number || chapter.title || 'Untitled chapter').join(', ')}.`);
        return;
      }
    }
    try {
      const children = [
        new Paragraph({ text: bookTitle || 'Untitled Book', heading: HeadingLevel.TITLE, alignment: 'center' }),
      ];
      if (bookSubtitle?.trim()) children.push(new Paragraph({ text: bookSubtitle.trim(), alignment: 'center' }));
      children.push(new Paragraph({ text: `By ${authorName || 'Unknown Author'}`, alignment: 'center' }));
      children.push(new Paragraph({ children: [new PageBreak()] }));
      if (copyrightNotice?.trim()) {
        children.push(new Paragraph({ text: copyrightNotice.trim(), alignment: 'center' }));
        children.push(new Paragraph({ children: [new PageBreak()] }));
      }
      if (dedicationText?.trim()) {
        children.push(new Paragraph({ text: dedicationText.trim(), alignment: 'center' }));
        children.push(new Paragraph({ children: [new PageBreak()] }));
      }
      chapters.forEach((chapter, index) => {
        if (index > 0 || chapter.blankPageBefore) children.push(new Paragraph({ children: [new PageBreak()] }));
        // A second page break intentionally leaves one blank page before this chapter.
        if (chapter.blankPageBefore) children.push(new Paragraph({ children: [new PageBreak()] }));
        if (chapter.number?.trim()) children.push(new Paragraph({ text: chapter.number.trim(), heading: HeadingLevel.HEADING_1, alignment: 'center' }));
        if (chapter.title?.trim()) children.push(new Paragraph({ text: chapter.title.trim(), heading: HeadingLevel.HEADING_2, alignment: 'center' }));
        (chapter.paragraphs || []).forEach((text) => {
          if (text?.trim()) children.push(new Paragraph({ children: [new TextRun({ text: text.trim() })], spacing: { after: 180, line: 360 } }));
        });
      });
      const doc = new Document({ sections: [{ properties: {}, children }] });
      const blob = await Packer.toBlob(doc);
      const safeTitle = (bookTitle || 'manuscript').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'manuscript';
      saveAs(blob, `${safeTitle}.docx`);
      // Save a bookshelf snapshot after file generation. If local storage is unavailable, do not block the download.
      try {
        await saveProjectToStorage({
          id: `project-${bookTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now()}`,
          title: bookTitle || 'Untitled Book', author: authorName || 'Unknown Author', trimSize, pageExtent,
          workflowMode, chapters: chapters.map(chapter => ({ ...chapter, paragraphs: [...(chapter.paragraphs || [])] }))
        });
        setShelfProjects(await getAllProjectsFromStorage());
      } catch (storageError) {
        console.warn('The Word file was created, but the bookshelf snapshot could not be saved.', storageError);
      }
      setExportSuccessOpen(true);
    } catch (error) {
      console.error('Word export failed:', error);
      setExportError('The Word document could not be created. Please try again. If the problem continues, refresh the page and retry.');
    }
  };

  /* PLANNER EXPORT: build a print-size PDF from uploaded page images. Images are contained, never stretched or cropped. */
  const handleExportPlannerPdf = async () => {
    setPlannerExportError('');
    if (!plannerImages.length) {
      setPlannerExportError('Upload at least one interior page image before exporting.');
      return;
    }
    try {
      const pdf = await PDFDocument.create();
      const trim = TRIM_OPTIONS.find(option => option.id === trimSize) || TRIM_OPTIONS.find(option => option.id === '8.5x11');
      const pageWidth = trim.width * 72;
      const pageHeight = trim.height * 72;
      for (const item of plannerImages) {
        const bytes = await item.file.arrayBuffer();
        const image = item.type === 'image/png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
        const page = pdf.addPage([pageWidth, pageHeight]);
        const scale = Math.min(pageWidth / image.width, pageHeight / image.height);
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        page.drawImage(image, { x: (pageWidth - drawWidth) / 2, y: (pageHeight - drawHeight) / 2, width: drawWidth, height: drawHeight });
      }
      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const safeTitle = (bookTitle || 'planner-interior').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'planner-interior';
      saveAs(blob, `${safeTitle}-print-interior.pdf`);
      setExportSuccessOpen(true);
    } catch (error) {
      console.error('Planner PDF export failed:', error);
      setPlannerExportError('The print PDF could not be created. Use PNG or JPEG page images and try again.');
    }
  };

  const handlePlannerImageSelection = async (event) => {
    const files = Array.from(event.target.files || []).filter(file => ['image/png', 'image/jpeg'].includes(file.type));
    const warnings = [];
    const prepared = [];
    for (const file of files) {
      const dimensions = await new Promise(resolve => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
        img.onerror = () => { resolve(null); URL.revokeObjectURL(url); };
        img.src = url;
      });
      if (!dimensions) { warnings.push(`${file.name}: could not read image dimensions.`); continue; }
      const trim = TRIM_OPTIONS.find(option => option.id === trimSize) || TRIM_OPTIONS.find(option => option.id === '8.5x11');
      if (dimensions.width < trim.width * 300 || dimensions.height < trim.height * 300) {
        warnings.push(`${file.name}: ${dimensions.width}×${dimensions.height}px may be below 300 DPI for ${trim.width}×${trim.height} inches.`);
      }
      prepared.push({ file, type: file.type, ...dimensions });
    }
    if (files.length !== (event.target.files || []).length) warnings.push('Only PNG and JPEG images are supported. Unsupported files were skipped.');
    setPlannerImages(prev => [...prev, ...prepared]);
    setPlannerWarnings(warnings);
    event.target.value = '';
  };

  /* CHAPTER MANIPULATION */
  const handleAddChapter = () => {
    const nextNum = chapters.length + 1;
    const newId = `ch-${Date.now()}`;
    const newChapter = {
      id: newId,
      status: 'draft',
      number: `Chapter ${nextNum}`, 
      title: 'Untitled Chapter',
      paragraphs: ['Click here to start writing or pasting this chapter...']
    };
    setChapters([...chapters, newChapter]);
    setActiveSectionId(newId);
  };

  const handleDeleteChapter = (idToDelete) => {
    if (chapters.length <= 1) {
      alert('Your book must have at least one chapter.');
      return;
    }
    const filtered = chapters.filter(c => c.id !== idToDelete);
    setChapters(filtered);
    if (activeSectionId === idToDelete) {
      setActiveSectionId(filtered[0].id);
    }
  };

  const handleUpdateParagraph = (chapterId, pIdx, newText) => {
    setChapters(prev =>
      prev.map(ch => {
        if (ch.id === chapterId) {
          const updatedParas = [...ch.paragraphs];
          updatedParas[pIdx] = newText;
          return { ...ch, paragraphs: updatedParas };
        }
        return ch;
      })
    );
  };

  const handleUpdateChapterTitle = (chapterId, newTitle) => {
    setChapters(prev =>
      prev.map(ch => (ch.id === chapterId ? { ...ch, title: newTitle } : ch))
    );
  };

  const handleUpdateChapterNumber = (chapterId, newNumber) => {
    setChapters(prev =>
      prev.map(ch => (ch.id === chapterId ? { ...ch, number: newNumber } : ch))
    );
  };

  /* TRIM & PHYSICAL GEOMETRY */
  const currentTrim = useMemo(() => {
    return TRIM_OPTIONS.find(t => t.id === trimSize) || TRIM_OPTIONS[2];
  }, [trimSize]);

  const totalWords = useMemo(() => {
    return chapters.reduce((total, ch) => {
      return total + ch.paragraphs.reduce((sub, p) => sub + p.split(/\s+/).filter(Boolean).length, 0);
    }, 0);
  }, [chapters]);

  const computedTotalPages = useMemo(() => {
    const wpp = currentTrim.wordsPerPage || 250;
    const contentPages = Math.ceil(totalWords / wpp);
    return Math.max(24, 6 + contentPages); // 6 preliminary front matter pages
  }, [totalWords, currentTrim]);

  const calculatedGutter = useMemo(() => {
    if (pageExtent < 150) return 0.375;
    if (pageExtent <= 300) return 0.500;
    if (pageExtent <= 500) return 0.625;
    return 0.750;
  }, [pageExtent]);

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

  /* TOC GENERATOR MAPPING */
  const tocEntries = useMemo(() => {
    let currentPageCursor = 7; // Chapters typically start on page 7 (Recto)
    const wpp = currentTrim.wordsPerPage || 250;

    return chapters.map(ch => {
      const chWords = ch.paragraphs.reduce((acc, p) => acc + p.split(/\s+/).filter(Boolean).length, 0);
      const estPages = Math.max(2, Math.ceil(chWords / wpp));
      const entry = {
        id: ch.id,
        number: ch.number,
        title: ch.title,
        pageNumber: currentPageCursor
      };
      currentPageCursor += estPages;
      if (currentPageCursor % 2 === 0) currentPageCursor += 1; // Align to odd (recto) start
      return entry;
    });
  }, [chapters, currentTrim]);

  /* CLIENT-SIDE QUALITY & GRAMMAR HEURISTICS */
  const activeChapter = useMemo(() => {
    return chapters.find(c => c.id === activeSectionId) || chapters[0];
  }, [chapters, activeSectionId]);

  const editorialAnalysis = useMemo(() => {
    const issues = [];
    let fillerCount = 0;
    let passiveCount = 0;
    let typoCount = 0;

    const fillerRegex = /\b(very|really|suddenly|just|perhaps|somewhat|basically|quite)\b/gi;
    const passiveRegex = /\b(was|were|been|being)\s+([a-z]+ed|[a-z]+en)\b/gi;

    chapters.forEach((ch, chIdx) => {
      ch.paragraphs.forEach((p, pIdx) => {
        let match;
        while ((match = fillerRegex.exec(p)) !== null) {
          fillerCount++;
          issues.push({
            type: 'filler',
            chId: ch.id,
            pIdx,
            word: match[0],
            message: `Filler word "${match[0]}". Tighter prose recommended.`,
            fix: ''
          });
        }
        while ((match = passiveRegex.exec(p)) !== null) {
          passiveCount++;
          issues.push({
            type: 'passive',
            chId: ch.id,
            pIdx,
            word: match[0],
            message: `Passive construction "${match[0]}".`,
            fix: match[0].split(' ')[1]
          });
        }
      });
    });

    const readabilityScore = Math.min(25, Math.max(12, Math.round(25 - (fillerCount * 0.5))));
    const mechanicsScore = Math.min(25, Math.max(12, 25));
    const styleScore = Math.min(25, Math.max(12, Math.round(25 - (passiveCount * 0.6))));
    const geometryScore = pageExtent >= 80 ? 25 : 18;
    const totalScore = Math.min(100, readabilityScore + mechanicsScore + styleScore + geometryScore);

    return {
      issues,
      totalScore,
      breakdown: { readability: readabilityScore, mechanics: mechanicsScore, style: styleScore, geometry: geometryScore }
    };
  }, [chapters, pageExtent]);

  const applyQuickFix = (issue) => {
    const targetCh = chapters.find(c => c.id === issue.chId);
    if (!targetCh) return;
    const updatedParas = [...targetCh.paragraphs];
    const targetText = updatedParas[issue.pIdx];
    if (issue.type === 'filler') {
      const regex = new RegExp(`\\b${issue.word}\\s*`, 'i');
      updatedParas[issue.pIdx] = targetText.replace(regex, '');
    }
    setChapters(prev => prev.map(c => c.id === issue.chId ? { ...c, paragraphs: updatedParas } : c));
  };

  /* FINANCIAL / TERRITORY REPORT */
  const activeSelectedTerritories = useMemo(() => {
    const pbUs = parseFloat(usPaperbackPrice) || 12.99;
    const ebUs = parseFloat(usEbookPrice) || 4.99;

    return Object.entries(POD_MARKETPLACES)
      .filter(([code]) => selectedKdpCountries.includes(code))
      .map(([code, market]) => {
        const printCost = market.base + (pageExtent * market.perPage);
        const pbPrice = code === 'US' ? pbUs : parseFloat((pbUs * market.fxRate).toFixed(2));
        const pbRoyalty = (pbPrice * royaltyShareTier) - printCost;
        const ebRoyalty = (ebUs * 0.70) - (0.15 * market.fxRate);
        const combined = targetFormat === 'paperback' ? pbRoyalty : targetFormat === 'ebook' ? ebRoyalty : (pbRoyalty + ebRoyalty);

        return {
          code,
          name: market.name,
          symbol: market.symbol,
          printCost: printCost.toFixed(2),
          retailPrice: pbPrice.toFixed(2),
          royalty: Math.max(0, combined).toFixed(2)
        };
      });
  }, [pageExtent, usPaperbackPrice, usEbookPrice, royaltyShareTier, targetFormat, selectedKdpCountries]);

  return (
    <div className="min-h-screen bg-[#F5EFE3] text-[#1C2010]">
      {/* HEADER DOCK */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md border-b border-[#D8C9A8] bg-[#F5EFE3]/95">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div onClick={() => setActiveView('home')} className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
              <Book className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <div>
                <span className="font-editorial font-bold text-base text-[#1C2010]">PUBLISHSTUDIO</span>
                <p className="text-[10px] text-emerald-700 font-bold">Self Publishing Supporting Software</p>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 text-white shadow-xs">
                Book OS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('home')}
              className="px-3 py-1.5 rounded-full text-xs font-bold soft-btn-pill text-emerald-800 cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => setAiModalOpen(true)}
              className="px-3 py-1.5 rounded-full text-xs font-bold soft-btn-pill text-indigo-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">AI Studio</span>
            </button>
            <button
              onClick={() => setIsShelfOpen(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold soft-btn-pill text-amber-800 flex items-center gap-1.5 cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">My Books</span>
            </button>
            <button
              onClick={() => setHelpProfileDrawerOpen(true)}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-teal-700 to-emerald-700 text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Help & Profile</span>
            </button>
          </div>
        </div>
      </header>

      {/* SECTION: HOME WORKFLOW SELECTOR — Update pathway labels and descriptions here. Export logic is defined separately above. */}
      {/* VIEW A: LANDING / HOME */}
      {activeView === 'home' && (
        <main className="max-w-6xl mx-auto px-4 py-12 space-y-16 animate-in fade-in">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-teal-800 bg-teal-500/15 border border-teal-500/30 px-3.5 py-1.5 rounded-full">
              Self Publishing Supporting Software
            </span>
            <h1 className="font-editorial text-4xl sm:text-6xl font-extrabold text-[#1C2010] leading-tight">
              Focus More on Writing,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-600">
                Less on Formatting!
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[#555045] max-w-2xl mx-auto leading-relaxed">
              Prepare cleaner publishing files with section-by-section book setup, formatting checks, gutter estimates, and royalty planning. Always review the final files against your chosen platform’s current requirements.
            </p>
          </div>

          {/* 3 CORE ENTRY PATHWAYS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* OPTION A: GUIDED CHAPTER BUILDER (RECOMMENDED) */}
            <div
              onClick={() => {
                setWorkflowMode('manual');
                setActiveView('studio');
                setCurrentStep(1);
              }}
              className="p-8 rounded-3xl soft-raised space-y-3 bg-[#FAF6ED] border-t-4 border-emerald-600 cursor-pointer hover:shadow-xl transition-all group scale-[1.02] ring-2 ring-emerald-500/30"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  ★
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-900 font-mono">
                  OPTION A
                </span>
              </div>
              <h3 className="font-editorial text-xl font-bold text-[#1C2010]">
                Guided Section & Chapter Studio
              </h3>
              <p className="text-xs text-[#555045] leading-relaxed">
                Add book titles, front matter, and chapters with automatic Tables of Contents tailored for eBook and Print. Direct click-to-edit.
              </p>
              <div className="pt-2 text-xs font-bold text-emerald-800 flex items-center gap-1 group-hover:underline">
                <span>Start Clean Chapter Builder &rarr;</span>
              </div>
            </div>

            {/* OPTION B: TEXT-RICH MANUSCRIPTS */}
            <div
              onClick={() => {
                setWorkflowMode('upload');
                setSelectedArchetype('fiction');
                setActiveView('studio');
                setCurrentStep(1);
              }}
              className="p-8 rounded-3xl soft-raised space-y-3 bg-[#F5EFE3] border-t-4 border-teal-600 cursor-pointer hover:shadow-xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  A
                </div>
                <span className="text-xs font-bold text-teal-800 group-hover:underline">Configure &rarr;</span>
              </div>
              <h3 className="font-editorial text-xl font-bold text-[#1C2010]">Full Manuscript Ingestion</h3>
              <p className="text-xs text-[#555045] leading-relaxed">
                For an existing Word manuscript: upload, review the setup, then export an editable Word file. DOCX upload parsing is not available in this revision yet.
              </p>
            </div>

            {/* OPTION C: LOW-CONTENT CREATIONS */}
            <div
              onClick={() => {
                setWorkflowMode('planner');
                setSelectedArchetype('workbook');
                setTrimSize('8.5x11');
                setActiveView('studio');
                setCurrentStep(1);
              }}
              className="p-8 rounded-3xl soft-raised space-y-3 bg-[#F5EFE3] border-t-4 border-amber-600 cursor-pointer hover:shadow-xl transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  B
                </div>
                <span className="text-xs font-bold text-amber-800 group-hover:underline">Configure &rarr;</span>
              </div>
              <h3 className="font-editorial text-xl font-bold text-[#1C2010]">Low-Content & Planners</h3>
              <p className="text-xs text-[#555045] leading-relaxed">
                Upload interior page images, check resolution warnings, preview the trim-size output, and export a print-sized PDF. Image pages are contained without stretching or cropping.
              </p>
            </div>
          </div>
        </main>
      )}

      {/* VIEW B: 4-STEP WORKFLOW STUDIO */}
      {activeView === 'studio' && (
        <main className="max-w-6xl mx-auto px-4 py-8 pb-32 animate-in fade-in">
          {/* STEP TRACKER WITH ACTIVE CONNECTOR LINES */}
          <div className="mb-8">
            <div className="p-3 rounded-full soft-inset flex items-center justify-between bg-[#ECE4D0]/80">
              {[
                { step: 1, label: '1. Setup' },
                { step: 2, label: '2. Interior Studio' },
                { step: 3, label: '3. Cover Blueprint' },
                { step: 4, label: '4. Preflight' }
              ].map((s, idx) => {
                const isActive = currentStep === s.step;
                const isPassed = currentStep > s.step;
                return (
                  <React.Fragment key={s.step}>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(s.step)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white font-bold shadow-md scale-105'
                          : isPassed
                          ? 'text-emerald-900 font-bold bg-emerald-500/20'
                          : 'text-[#555045]/60 hover:text-[#1C2010]'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                          isActive
                            ? 'bg-white text-emerald-800'
                            : isPassed
                            ? 'bg-emerald-700 text-white'
                            : 'bg-black/10 text-[#555045]'
                        }`}
                      >
                        {isPassed ? '✓' : s.step}
                      </span>
                      <span className="hidden sm:inline">{s.label}</span>
                    </button>
                    {idx < 3 && (
                      <div
                        className={`flex-1 h-1 mx-1.5 rounded-full transition-all duration-300 ${
                          currentStep > s.step ? 'bg-emerald-600 shadow-xs' : 'bg-black/10'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* STEP 1: SPECIFICATION & MANUSCRIPT SETUP */}
          {/* ========================================================================= */}
          {workflowMode === 'planner' && (
            <section className="mb-6 rounded-3xl soft-raised bg-[#FAF6ED] border border-amber-500/30 p-5 space-y-3">
              <div><h2 className="font-editorial text-xl font-bold text-[#1C2010]">Planner & Interior Page Images</h2><p className="text-xs text-[#555045] mt-1">Upload pages in the order they should appear. PNG and JPEG are supported. Low-resolution pages are flagged; images are not silently stretched or cropped.</p></div>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-700 text-white text-xs font-bold cursor-pointer"><Upload className="w-4 h-4" /> Upload page images<input type="file" accept="image/png,image/jpeg" multiple className="sr-only" onChange={handlePlannerImageSelection} /></label>
              {plannerImages.length > 0 && <div className="space-y-2"><p className="text-xs font-bold text-emerald-900">{plannerImages.length} page image(s) selected</p>{plannerImages.map((item, index) => <div key={`${item.file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-white p-2 text-xs"><span className="truncate">{index + 1}. {item.file.name}</span><span className="shrink-0 text-[#777064]">{item.width}×{item.height}px</span><button type="button" onClick={() => setPlannerImages(prev => prev.filter((_, i) => i !== index))} className="font-bold text-red-700">Remove</button></div>)}</div>}
              {plannerWarnings.map((warning, index) => <p key={index} className="text-xs text-amber-900 bg-amber-100 rounded-lg p-2">⚠ {warning}</p>)}
              {plannerExportError && <p role="alert" className="text-xs text-red-800 bg-red-50 rounded-lg p-2">{plannerExportError}</p>}
            </section>
          )}

          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D8C9A8]/70">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-[#0E6266] bg-[#0E6266]/10 px-2.5 py-0.5 rounded-full">
                      Step 01
                    </span>
                    <span className="text-[10px] text-[#555045] font-semibold">Book DNA & Physical Geometry</span>
                  </div>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2010] mt-1">
                    Book Details & Setup
                  </h2>
                </div>

                <div className="flex items-center gap-2 p-2 px-3.5 rounded-2xl soft-raised bg-[#FAF6ED] border border-[#D8C9A8]/60 w-fit">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="text-left">
                    <span className="text-[9px] uppercase tracking-wider block font-bold text-[#555045]">Active Author</span>
                    <strong className="text-xs text-emerald-900 font-bold">{authorName || 'Kavita Chougule'}</strong>
                  </div>
                </div>
              </div>

              {/* TARGET FORMAT SELECTION PILL */}
              <div className="p-4 rounded-3xl soft-raised bg-[#FAF6ED] border border-[#D8C9A8]/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs uppercase text-[#1C2010]">Target Publishing Format</h4>
                  <p className="text-[11px] text-[#555045]">Determines Table of Contents structure per KDP standards</p>
                </div>
                <div className="flex gap-1.5 p-1 rounded-2xl soft-inset bg-[#ECE4D0]">
                  {[
                    { id: 'ebook', label: '📱 eBook (Reflowable)' },
                    { id: 'paperback', label: '📖 Paperback / Hardcover' },
                    { id: 'both', label: '✨ Both Formats' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setTargetFormat(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        targetFormat === f.id
                          ? 'bg-[#0E6266] text-white shadow-xs'
                          : 'text-[#555045] hover:text-[#1C2010]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* BOOK IDENTITY INPUTS */}
              <div className="p-6 rounded-3xl soft-raised bg-[#F5EFE3] border border-[#D8C9A8]/50 space-y-4">
                <div className="flex items-center justify-between border-b border-black/5 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1C2010] flex items-center gap-2">
                    <Type className="w-4 h-4 text-emerald-700" />
                    Book & Author Profile
                  </span>
                  <label className="flex items-center gap-2 text-xs text-[#555045] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberAuthor}
                      onChange={(e) => {
                        setRememberAuthor(e.target.checked);
                        if (e.target.checked && authorName) {
                          localStorage.setItem('ps_default_author', authorName);
                        }
                      }}
                      className="accent-[#0E6266] w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-emerald-900">
                      Remember author as default for all books
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1 text-[#1C2010]">
                      Book Title
                    </label>
                    <input
                      type="text"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      placeholder="e.g. The Memory Chef"
                      className="w-full p-3 rounded-2xl text-xs font-bold soft-inset outline-none text-[#1C2010] bg-[#FFFDF9]/80 border border-[#D8C9A8]/40 focus:border-[#0E6266]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1 text-[#1C2010]">
                      Author Name
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => handleAuthorNameChange(e.target.value)}
                      placeholder="e.g. Kavita Chougule"
                      className="w-full p-3 rounded-2xl text-xs font-bold soft-inset outline-none text-[#1C2010] bg-[#FFFDF9]/80 border border-[#D8C9A8]/40 focus:border-[#0E6266]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1 text-[#1C2010]">
                      Subtitle (Optional)
                    </label>
                    <input
                      type="text"
                      value={bookSubtitle}
                      onChange={(e) => setBookSubtitle(e.target.value)}
                      className="w-full p-3 rounded-2xl text-xs font-bold soft-inset outline-none text-[#1C2010] bg-[#FFFDF9]/80 border border-[#D8C9A8]/40 focus:border-[#0E6266]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-1 text-[#1C2010]">
                      Copyright Notice
                    </label>
                    <input
                      type="text"
                      value={copyrightNotice}
                      onChange={(e) => setCopyrightNotice(e.target.value)}
                      className="w-full p-3 rounded-2xl text-xs font-bold soft-inset outline-none text-[#1C2010] bg-[#FFFDF9]/80 border border-[#D8C9A8]/40 focus:border-[#0E6266]"
                    />
                  </div>
                </div>
              </div>

              {/* PHYSICAL TRIM & PAPER STOCK */}
              <div className="p-6 sm:p-7 rounded-3xl soft-raised space-y-6 bg-[#F5EFE3] border border-[#D8C9A8]/50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-2 text-[#1C2010]">
                      Trim Size Dimension
                    </label>
                    <select
                      value={trimSize}
                      onChange={(e) => setTrimSize(e.target.value)}
                      className="w-full p-3.5 rounded-2xl text-xs font-bold soft-inset outline-none text-[#1C2010] bg-[#FFFDF9]/80 cursor-pointer border border-[#D8C9A8]/50 focus:border-[#0E6266]"
                    >
                      {TRIM_OPTIONS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-2 text-[#1C2010]">
                      Paper Stock & Caliper
                    </label>
                    <select
                      value={paperType}
                      onChange={(e) => setPaperType(e.target.value)}
                      className="w-full p-3.5 rounded-2xl text-xs font-bold soft-inset outline-none text-[#1C2010] bg-[#FFFDF9]/80 cursor-pointer border border-[#D8C9A8]/50 focus:border-[#0E6266]"
                    >
                      {Object.entries(PAPER_SPECS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider block mb-2 text-[#1C2010]">
                      Interior Bleed
                    </label>
                    <div className="p-1 rounded-2xl soft-inset bg-[#FFFDF9]/80 flex border border-[#D8C9A8]/50">
                      <button
                        type="button"
                        onClick={() => setInteriorBleed(false)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                          !interiorBleed ? 'bg-[#0E6266] text-white' : 'text-[#555045]'
                        }`}
                      >
                        No Bleed
                      </button>
                      <button
                        type="button"
                        onClick={() => setInteriorBleed(true)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                          interiorBleed ? 'bg-[#0E6266] text-white' : 'text-[#555045]'
                        }`}
                      >
                        Full Bleed
                      </button>
                    </div>
                  </div>
                </div>

                {/* COMPUTED WORD & PAGE COUNTS */}
                <div className="p-4 rounded-2xl soft-inset bg-white/70 border border-[#D8C9A8]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span>
                      Words: <strong className="text-[#0E6266] font-mono">{totalWords}</strong>
                    </span>
                    <span className="text-[#D8C9A8]">|</span>
                    <span>
                      Chapters: <strong className="text-amber-800 font-mono">{chapters.length}</strong>
                    </span>
                    <span className="text-[#D8C9A8]">|</span>
                    <span>
                      Computed Pages: <strong className="text-emerald-800 font-mono">{computedTotalPages}</strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPageExtent(computedTotalPages)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0E6266] text-white text-[11px] font-bold shadow-xs cursor-pointer"
                  >
                    Sync Spine to Computed Pages ({computedTotalPages} Pgs)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: STRUCTURED INTERIOR STUDIO & LIVE SPREAD */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#D8C9A8]/70">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold text-[#0E6266] bg-[#0E6266]/10 px-2.5 py-0.5 rounded-full">
                      Step 02
                    </span>
                    <span className="text-[10px] text-[#555045] font-semibold">Structured Section & Chapter Studio</span>
                  </div>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2010] mt-1">
                    Interior Typeset & Live Proof
                  </h2>
                </div>

                <div className="flex items-center gap-3 bg-[#FAF6ED] p-2.5 px-4 rounded-2xl soft-raised border border-[#D8C9A8]/60">
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider block font-bold text-[#555045]">
                      Overall Book Score
                    </span>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-lg font-mono font-extrabold text-emerald-800">
                        {editorialAnalysis.totalScore}/100
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                        {editorialAnalysis.totalScore >= 85 ? 'Trade Ready' : 'Polishing Needed'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScoringModalOpen(true)}
                    className="p-1.5 rounded-xl bg-[#0E6266]/10 hover:bg-[#0E6266]/20 text-[#0E6266] cursor-pointer"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* STUDIO MAIN WORKBENCH: SIDEBAR + LIVE SPREAD */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* 1. SECTIONS TREE (LEFT SIDEBAR) */}
                <div className="p-4 rounded-3xl soft-raised bg-[#FAF6ED] border border-[#D8C9A8]/60 space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-[#555045] block px-1">
                    FRONT MATTER
                  </span>
                  <div className="space-y-1">
                    {[
                      { id: 'title-page', label: 'Title Page' },
                      { id: 'copyright', label: 'Copyright Notice' },
                      { id: 'toc', label: 'Table of Contents (Auto)' },
                      { id: 'dedication', label: 'Dedication' }
                    ].map(sec => (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setActiveSectionId(sec.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                          activeSectionId === sec.id
                            ? 'bg-[#0E6266] text-white shadow-xs'
                            : 'text-[#555045] hover:bg-black/5'
                        }`}
                      >
                        <span>{sec.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-black/10 flex items-center justify-between px-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-[#555045]">
                      CHAPTERS ({chapters.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddChapter}
                      className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                      title="Add Chapter"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                    {chapters.map((ch, idx) => (
                      <div
                        key={ch.id}
                        className={`group rounded-xl p-2 px-3 text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                          activeSectionId === ch.id
                            ? 'bg-[#0E6266] text-white shadow-xs'
                            : 'text-[#1C2010] hover:bg-black/5'
                        }`}
                        onClick={() => setActiveSectionId(ch.id)}
                      >
                        <div className="truncate pr-2">
                          <span className="block text-[9px] opacity-75">{ch.number}</span>
                          <span className="truncate block">{ch.title}</span>
                        </div>
                        {chapters.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChapter(ch.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-300 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. REALISTIC TYPESET RENDERING CONTAINER (RIGHT 3 COLS) */}
                <div className="lg:col-span-3 space-y-4">
                  {/* SPREAD BAR TOGGLES */}
                  <div className="p-3 rounded-2xl soft-inset bg-[#ECE4D0]/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1C2010]">
                        Viewing: <strong className="text-emerald-900">{activeSectionId.toUpperCase()}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuickFixDrawerOpen(!quickFixDrawerOpen)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-900 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Quick-Fix ({editorialAnalysis.issues.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* LIVE EDITABLE BOOK SHEET */}
                  <div
                    className="p-8 sm:p-12 rounded-3xl soft-raised bg-[#FAF6ED] border border-[#D8C9A8]/60 shadow-lg min-h-[500px]"
                    style={{ fontFamily: typography.fontFamily }}
                  >
                    {/* SECTION A: TITLE PAGE */}
                    {activeSectionId === 'title-page' && (
                      <div className="text-center py-16 space-y-6 max-w-md mx-auto animate-in fade-in">
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setBookTitle(e.currentTarget.textContent || '')}
                          className="font-editorial text-3xl font-extrabold text-[#1C2010] outline-none border-b border-transparent hover:border-black/20 focus:border-[#0E6266]"
                        >
                          {bookTitle}
                        </div>
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setBookSubtitle(e.currentTarget.textContent || '')}
                          className="text-xs text-[#555045] italic outline-none border-b border-transparent hover:border-black/20 focus:border-[#0E6266]"
                        >
                          {bookSubtitle}
                        </div>
                        <div className="pt-8 text-sm font-bold text-[#0E6266]">
                          {authorName}
                        </div>
                      </div>
                    )}

                    {/* SECTION B: COPYRIGHT NOTICE */}
                    {activeSectionId === 'copyright' && (
                      <div className="py-20 text-xs text-[#555045] space-y-4 max-w-sm mx-auto text-center animate-in fade-in">
                        <p
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setCopyrightNotice(e.currentTarget.textContent || '')}
                          className="outline-none border-b border-transparent hover:border-black/20 focus:border-[#0E6266]"
                        >
                          {copyrightNotice}
                        </p>
                        <p className="text-[10px]">
                          Published via PublishStudio Book OS. No part of this publication may be reproduced without prior permission.
                        </p>
                      </div>
                    )}

                    {/* SECTION C: AUTO-GENERATED TABLE OF CONTENTS */}
                    {activeSectionId === 'toc' && (
                      <div className="py-8 max-w-md mx-auto space-y-6 animate-in fade-in">
                        <div className="text-center border-b border-black/10 pb-3">
                          <h3 className="font-editorial text-xl font-bold tracking-widest text-[#1C2010] uppercase">
                            Contents
                          </h3>
                          <span className="text-[10px] font-mono text-[#0E6266]">
                            {targetFormat === 'ebook' ? '• Reflowable eBook Format (No Page Numbers)' : '• Print POD Format (Dot Leaders)'}
                          </span>
                        </div>

                        {/* TOC RENDER LIST */}
                        <div className="space-y-3 text-xs">
                          {tocEntries.map((entry) => (
                            <div
                              key={entry.id}
                              onClick={() => setActiveSectionId(entry.id)}
                              className="flex items-center justify-between cursor-pointer hover:text-[#0E6266] transition-colors"
                            >
                              <span className="font-bold text-[#1C2010]">
                                {entry.number}: {entry.title}
                              </span>

                              {targetFormat !== 'ebook' && (
                                <span className="font-mono text-[#555045]">
                                  . . . . . . . . . {entry.pageNumber}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SECTION D: DEDICATION */}
                    {activeSectionId === 'dedication' && (
                      <div className="py-24 text-center max-w-sm mx-auto italic text-sm text-[#3A352F] animate-in fade-in">
                        <p
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setDedicationText(e.currentTarget.textContent || '')}
                          className="outline-none border-b border-transparent hover:border-black/20 focus:border-[#0E6266]"
                        >
                          "{dedicationText}"
                        </p>
                      </div>
                    )}

                    {/* SECTION E: ACTIVE CHAPTER WITH IN-PLACE EDITING */}
                    {activeChapter && !['title-page', 'copyright', 'toc', 'dedication'].includes(activeSectionId) && (
                      <div className="space-y-6 animate-in fade-in">
                        {/* RUNNING HEADER */}
                        <div className="text-center pb-3 border-b border-black/10 text-[10px] uppercase tracking-widest text-[#555045] font-bold">
                          {bookTitle} • {authorName}
                        </div>

                        {/* EDITABLE CHAPTER NUMBER & TITLE */}
                        <div className="text-center space-y-1 pt-4">
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleUpdateChapterNumber(activeChapter.id, e.currentTarget.textContent || '')}
                            className="text-xs uppercase tracking-widest font-mono text-emerald-800 font-bold outline-none border-b border-transparent hover:border-black/20 focus:border-[#0E6266]"
                          >
                            {activeChapter.number}
                          </div>
                          <h3
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleUpdateChapterTitle(activeChapter.id, e.currentTarget.textContent || '')}
                            style={{
                              fontSize: `${typography.chapterTitleSize}px`,
                              fontWeight: typography.chapterTitleWeight
                            }}
                            className="font-editorial text-[#1C2010] outline-none border-b border-transparent hover:border-black/20 focus:border-[#0E6266]"
                          >
                            {activeChapter.title}
                          </h3>
                        </div>

                        {/* CHAPTER STATUS AND PAGE LAYOUT CONTROLS */}
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
                          <button
                            type="button"
                            onClick={() => setChapters(prev => prev.map(c => c.id === activeChapter.id ? { ...c, status: c.status === 'final' ? 'draft' : 'final' } : c))}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${activeChapter.status === 'final' ? 'bg-emerald-100 border-emerald-400 text-emerald-900' : 'bg-white border-black/10 text-[#555045]'}`}
                          >
                            {activeChapter.status === 'final' ? '✓ Chapter marked Final' : 'Mark chapter Final'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setChapters(prev => prev.map(c => c.id === activeChapter.id ? { ...c, blankPageBefore: !c.blankPageBefore } : c))}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${activeChapter.blankPageBefore ? 'bg-amber-100 border-amber-400 text-amber-900' : 'bg-white border-black/10 text-[#555045]'}`}
                            title="Add or remove an intentional blank page before this chapter in the Word export"
                          >
                            {activeChapter.blankPageBefore ? '✓ Blank page before chapter (on)' : 'Insert blank page before chapter'}
                          </button>
                          <span className="text-[10px] text-[#777064]">This setting is included in Word export; review pagination in Word after export.</span>
                        </div>

                        {/* EDITABLE PARAGRAPHS */}
                        <div className="space-y-4 pt-4">
                          {activeChapter.paragraphs.map((p, pIdx) => (
                            <p
                              key={pIdx}
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => handleUpdateParagraph(activeChapter.id, pIdx, e.currentTarget.textContent || '')}
                              style={{
                                fontSize: `${typography.bodySize}px`,
                                lineHeight: typography.bodyLineHeight
                              }}
                              className="text-[#2D2A26] outline-none border-b border-transparent hover:border-black/20 focus:border-[#0E6266] transition-colors leading-relaxed"
                            >
                              {p}
                            </p>
                          ))}
                        </div>

                        {/* ADD PARAGRAPH BUTTON */}
                        <div className="pt-4 border-t border-black/5 flex justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...activeChapter.paragraphs, 'Enter new paragraph text here...'];
                              setChapters(prev => prev.map(c => c.id === activeChapter.id ? { ...c, paragraphs: updated } : c));
                            }}
                            className="px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 text-xs font-bold text-[#555045] flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Paragraph to Chapter</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* QUICK FIX SIDE DRAWER */}
              {quickFixDrawerOpen && (
                <div className="p-5 rounded-3xl soft-inset bg-teal-500/5 border border-teal-500/20 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-black/10">
                    <span className="text-xs font-bold uppercase text-teal-900">
                      Editorial Quick-Fix Inspector ({editorialAnalysis.issues.length})
                    </span>
                    <button onClick={() => setQuickFixDrawerOpen(false)} className="text-xs font-bold">
                      Close ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                    {editorialAnalysis.issues.map((issue, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-white shadow-xs text-xs space-y-1">
                        <span className="text-[9px] font-mono uppercase font-bold text-amber-800 block">
                          {issue.type.toUpperCase()}
                        </span>
                        <p className="text-[11px] text-[#2D2A26]">{issue.message}</p>
                        <button
                          type="button"
                          onClick={() => applyQuickFix(issue)}
                          className="w-full py-1 rounded-lg bg-[#0E6266] text-white text-[10px] font-bold cursor-pointer"
                        >
                          Apply 1-Click Fix
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: COVER BLUEPRINT */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2010]">
                  Step 3: Cover Blueprint Specification
                </h2>
                <p className="text-xs text-[#555045] mt-1">300 DPI full-wrap layout with barcode protection margin</p>
              </div>

              <div className="p-3 rounded-2xl soft-inset grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-semibold">
                <div>SPINE WIDTH: <span className="font-mono text-emerald-700 font-bold">{spineWidth}"</span></div>
                <div>TOTAL WIDTH: <span className="font-mono text-blue-700 font-bold">{fullCoverWidth}"</span></div>
                <div>TOTAL HEIGHT: <span className="font-mono text-purple-700 font-bold">{fullCoverHeight}"</span></div>
                <div>CANVAS @ 300 DPI: <span className="font-mono text-amber-700 font-bold">{coverPixelsWidth} x {coverPixelsHeight} px</span></div>
              </div>

              <div className="p-6 rounded-3xl soft-raised">
                <div className="p-6 rounded-2xl soft-inset">
                  <div className="relative w-full aspect-[2/1] border-2 border-dashed border-rose-400 rounded bg-[#FFFDF9] flex items-center justify-between p-4 overflow-hidden">
                    <div className="flex-1 h-full border-r border-dashed border-black/20 p-2 flex flex-col justify-between bg-amber-500/5">
                      <span className="text-xs font-bold text-center block text-amber-900">
                        BACK COVER ({currentTrim.width}" × {currentTrim.height}")
                      </span>
                      <div className="self-end p-2 border border-rose-500 bg-rose-500/20 rounded text-[8px] font-mono text-rose-700 font-bold">
                        BARCODE ZONE (2.0" × 1.2")
                      </div>
                    </div>
                    <div className="w-8 sm:w-12 h-full flex items-center justify-center bg-teal-500/10 border-r border-dashed border-black/20 text-[9px] font-mono -rotate-90 text-teal-900 font-bold">
                      {pageExtent >= 80 ? bookTitle.slice(0, 14) : ''}
                    </div>
                    <div className="flex-1 h-full p-2 flex flex-col justify-between items-center text-center bg-emerald-500/5">
                      <span className="text-xs font-bold block text-emerald-900">FRONT COVER</span>
                      <div>
                        <h4 className="font-editorial text-sm font-bold text-[#1C2010]">{bookTitle}</h4>
                        <p className="text-[10px] text-emerald-800">{authorName}</p>
                      </div>
                      <span className="text-[8px] text-emerald-700 font-semibold">0.25" Safe Margin</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: PREFLIGHT & REVENUE */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              {workflowMode === 'manual' && <p className="text-xs text-[#555045] bg-amber-50 border border-amber-200 rounded-xl p-3">Guided book export requires every chapter to be marked Final in the chapter editor. This is a workflow check, not a publishing-platform approval.</p>}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1C2010]">
                    Step 4: Preflight Verification & 15-Territory Financials
                  </h2>
                </div>
                <span className="px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-900 font-bold text-xs">
                  Review required
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {activeSelectedTerritories.map((item) => (
                  <div key={item.code} className="p-3.5 rounded-2xl soft-inset bg-white/80 text-xs space-y-1">
                    <span className="font-bold text-emerald-800 block flex justify-between">
                      <span>{item.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10">{item.code}</span>
                    </span>
                    <div className="flex justify-between">
                      <span className="text-[#555045]">Print Cost:</span>
                      <span className="font-mono text-rose-700">{item.symbol}{item.printCost}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 border-t border-black/10">
                      <span>Royalty:</span>
                      <span className="text-emerald-700">+{item.symbol}{item.royalty}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {exportError && <div role="alert" className="fixed bottom-16 left-4 right-4 z-40 mx-auto max-w-2xl rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 shadow">{exportError}</div>}

          {/* DOCK BAR */}
          <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-md flex items-center justify-between max-w-6xl mx-auto border-t border-black/10">
            <button
              onClick={() => setActiveView('home')}
              className="px-4 py-2 rounded-full text-xs font-semibold soft-btn-pill text-emerald-800 cursor-pointer"
            >
              Home Overview
            </button>
            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-4 py-2 rounded-full text-xs font-bold soft-btn-pill flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}
              {currentStep < 4 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="px-5 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center gap-1 shadow cursor-pointer"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={workflowMode === 'planner' ? handleExportPlannerPdf : handleExportWord}
                  className="px-5 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center gap-1 shadow cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{workflowMode === 'planner' ? 'Export Print PDF' : 'Export Word (.DOCX)'}</span>
                </button>
              )}
            </div>
            <button
              onClick={() => setHelpProfileDrawerOpen(true)}
              className="px-4 py-2 rounded-full text-xs font-bold soft-btn-pill text-teal-800 cursor-pointer"
            >
              Help & Profile
            </button>
          </div>
        </main>
      )}

      {/* EXPORT SUCCESS: only shown after DOCX generation and download are initiated. */}
      {exportSuccessOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="export-success-title">
          <div className="w-full max-w-lg rounded-3xl p-7 soft-raised space-y-4 bg-[#F5EFE3] text-center">
            <div className="text-4xl" aria-hidden="true">🎉</div>
            <h2 id="export-success-title" className="font-editorial text-2xl font-bold text-[#1C2010]">Congratulations, Author!</h2>
            <p className="text-sm leading-relaxed text-[#555045]">{workflowMode === 'planner' ? 'Your print-sized planner PDF has been generated and the download has been initiated.' : 'Your book’s Word document has been generated and the download has been initiated.'} You’ve taken another step toward bringing your work into the world. Your story matters—keep going!</p>
            <p className="text-xs text-[#555045]">Please open the downloaded file and review its layout before publishing. This export does not guarantee acceptance by a publishing platform.</p>
            <button onClick={() => { setExportSuccessOpen(false); if (workflowMode === 'manual') setDeletePromptOpen(true); }} className="px-6 py-2.5 rounded-full text-sm font-bold bg-gradient-to-r from-emerald-700 to-teal-700 text-white">Continue</button>
          </div>
        </div>
      )}

      {/* DELETION IS OPTIONAL AND CONFIRMED; the downloaded file remains on the user's device. */}
      {deletePromptOpen && workflowMode === 'manual' && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="delete-book-title">
          <div className="w-full max-w-md rounded-3xl p-6 soft-raised space-y-4 bg-[#F5EFE3]">
            <h2 id="delete-book-title" className="font-editorial text-xl font-bold text-[#1C2010]">Make room for a new project?</h2>
            <p className="text-sm text-[#555045]">Would you like to remove this book from your bookshelf? This does not delete the Word document downloaded to your device.</p>
            <div className="flex flex-wrap justify-end gap-2">
              <button onClick={() => setDeletePromptOpen(false)} className="px-4 py-2 rounded-full text-sm font-semibold soft-btn-pill">Keep on Bookshelf</button>
              <button onClick={async () => {
                setDeletePromptOpen(false);
                try {
                  const saved = await getAllProjectsFromStorage();
                  const match = saved.find(project => project.title === bookTitle && project.author === authorName);
                  if (match?.id) {
                    await deleteProjectFromStorage(match.id);
                    setShelfProjects(prev => prev.filter(project => project.id !== match.id));
                    setStorageNotice('Book removed from the saved bookshelf. Your downloaded Word file is unchanged.');
                  } else {
                    setStorageNotice('No saved bookshelf record matched this draft, so nothing was deleted. The downloaded Word file is unchanged.');
                  }
                } catch {
                  setStorageNotice('Bookshelf storage could not be accessed. No book was deleted. Your downloaded Word file is unchanged.');
                }
                setIsShelfOpen(true);
              }} className="px-4 py-2 rounded-full text-sm font-bold bg-red-700 text-white">Delete from Bookshelf</button>
            </div>
          </div>
        </div>
      )}

      {/* METHODOLOGY SCORING MODAL */}
      {scoringModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl p-6 soft-raised space-y-4 bg-[#F5EFE3]">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <h3 className="font-editorial font-bold text-base text-[#1C2010]">
                Industry Scoring Criteria & Methodology
              </h3>
              <button onClick={() => setScoringModalOpen(false)}>
                <X className="w-4 h-4 cursor-pointer" />
              </button>
            </div>
            <p className="text-xs text-[#555045]">
              PublishStudio rates manuscripts against 4 industry publishing benchmarks (25 pts each = 100 max):
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-white flex justify-between">
                <span>1. Readability & Cadence:</span>
                <strong className="font-mono text-emerald-800">{editorialAnalysis.breakdown.readability}/25</strong>
              </div>
              <div className="p-3 rounded-2xl bg-white flex justify-between">
                <span>2. Mechanical Accuracy:</span>
                <strong className="font-mono text-emerald-800">{editorialAnalysis.breakdown.mechanics}/25</strong>
              </div>
              <div className="p-3 rounded-2xl bg-white flex justify-between">
                <span>3. Stylistic Hygiene:</span>
                <strong className="font-mono text-emerald-800">{editorialAnalysis.breakdown.style}/25</strong>
              </div>
              <div className="p-3 rounded-2xl bg-white flex justify-between">
                <span>4. Print Geometry Compliance:</span>
                <strong className="font-mono text-emerald-800">{editorialAnalysis.breakdown.geometry}/25</strong>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setScoringModalOpen(false)}
              className="w-full py-2 rounded-full bg-[#0E6266] text-white text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* AI MODAL */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl p-6 soft-raised space-y-4 bg-[#F5EFE3]">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <h3 className="font-editorial font-bold text-base">Client-Side AI Studio</h3>
              <button onClick={() => setAiModalOpen(false)}>
                <X className="w-4 h-4 cursor-pointer" />
              </button>
            </div>
            <input
              type="password"
              placeholder="Gemini API Key (AIzaSy...)"
              value={userApiKey}
              onChange={(e) => setUserApiKey(e.target.value)}
              className="w-full p-2.5 rounded-xl text-xs bg-white border border-indigo-500/30 outline-none"
            />
            <button
              onClick={() => {
                setAiModalOpen(false);
                alert('AI Key saved!');
              }}
              className="w-full py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold"
            >
              Save Key
            </button>
          </div>
        </div>
      )}

      {/* HELP DRAWER */}
      {helpProfileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl p-6 soft-raised space-y-4 bg-[#F5EFE3]">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <h3 className="font-editorial font-bold text-base text-emerald-900">Help & Author Identity</h3>
              <button onClick={() => setHelpProfileDrawerOpen(false)}>
                <X className="w-4 h-4 cursor-pointer" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Author Name"
              value={authorName}
              onChange={(e) => handleAuthorNameChange(e.target.value)}
              className="w-full p-2.5 rounded-xl text-xs bg-white border border-emerald-500/30 outline-none"
            />
            <button
              onClick={() => setHelpProfileDrawerOpen(false)}
              className="w-full py-2 rounded-full bg-gradient-to-r from-emerald-700 to-teal-700 text-white text-xs font-bold"
            >
              Save Details
            </button>
          </div>
        </div>
      )}

      {/* MY BOOKSHELF */}
      {isShelfOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl p-6 soft-raised space-y-4 bg-[#F5EFE3]">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <h3 className="font-editorial font-bold text-base text-amber-900">My Bookshelf</h3>
              <button onClick={() => setIsShelfOpen(false)}>
                <X className="w-4 h-4 cursor-pointer" />
              </button>
            </div>
            {storageNotice && <p role="status" className="p-3 rounded-xl bg-white text-xs text-[#555045]">{storageNotice}</p>}
            <div className="p-3 rounded-2xl soft-inset flex justify-between items-center bg-amber-500/5 border border-amber-500/20">
              <div>
                <h4 className="font-bold text-xs text-[#1C2010]">{bookTitle}</h4>
                <p className="text-[10px] text-amber-800">{authorName} • {trimSize} • {pageExtent} Pgs</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-900">Active Draft</span>
            </div>
            {shelfProjects.length > 0 ? shelfProjects.map(project => (
              <div key={project.id} className="p-3 rounded-2xl bg-white border border-black/5 flex items-center justify-between gap-3">
                <div className="min-w-0"><p className="text-xs font-bold truncate text-[#1C2010]">{project.title || 'Untitled project'}</p><p className="text-[10px] text-[#777064]">{project.author || 'Unknown author'}</p></div>
                <button type="button" onClick={async () => { if (window.confirm(`Remove “${project.title || 'Untitled project'}” from your bookshelf?`)) { await deleteProjectFromStorage(project.id); setShelfProjects(prev => prev.filter(item => item.id !== project.id)); } }} className="text-xs font-bold text-red-700">Remove</button>
              </div>
            )) : <p className="text-xs text-[#777064]">No saved bookshelf projects yet. This panel does not automatically save every draft.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
