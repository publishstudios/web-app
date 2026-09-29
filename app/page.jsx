'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, BookOpen, Layers, Download, RefreshCw, 
  CheckCircle2, Sparkles, Printer, Sliders, Key, X, 
  Award, Calendar, Compass, Coffee, CheckSquare, ArrowRight
} from 'lucide-react';
import { 
  Document, Packer, Paragraph, TextRun, HeadingLevel, 
  PageBreak, AlignmentType 
} from 'docx';
import { saveAs } from 'file-saver';
import { generatePlannerDocx } from './plannerEngine';

export default function Home() {
  const [activeTab, setActiveTab] = useState('manuscript');
  const [trimSize, setTrimSize] = useState('6x9');
  const [pageCount, setPageCount] = useState(120);

  const [credits, setCredits] = useState(3);
  const [apiKey, setApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState('');

  const [fileName, setFileName] = useState('');
  const [rawTextLines, setRawTextLines] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const [plannerType, setPlannerType] = useState('daily_focus');
  const [plannerDays, setPlannerDays] = useState(90);
  const [customNiche, setCustomNiche] = useState('');
  const [isGeneratingPlanner, setIsGeneratingPlanner] = useState(false);

  const fileInputRef = useRef(null);
  const docxViewerRef = useRef(null);

  useEffect(() => {
    const savedCredits = localStorage.getItem('ps_credits');
    const savedKey = localStorage.getItem('ps_gemini_key');
    if (savedCredits !== null) setCredits(Number(savedCredits));
    if (savedKey) {
      setApiKey(savedKey);
      setTempKeyInput(savedKey);
    }
  }, []);

  const saveApiKey = () => {
    setApiKey(tempKeyInput.trim());
    localStorage.setItem('ps_gemini_key', tempKeyInput.trim());
    setShowKeyModal(false);
  };

  const calculateGutter = (total) => {
    if (total <= 150) return 0.375;
    if (total <= 300) return 0.500;
    if (total <= 500) return 0.625;
    if (total <= 700) return 0.750;
    return 0.875;
  };

  const gutter = calculateGutter(activeTab === 'manuscript' ? pageCount : plannerDays);
  const outsideMargin = 0.375;
  const topBottomMargin = 0.5;

  const trimDimensionsTwips = {
    '6x9': { width: 6 * 1440, height: 9 * 1440 },
    '5.5x8.5': { width: 5.5 * 1440, height: 8.5 * 1440 },
    '8.5x11': { width: 8.5 * 1440, height: 11 * 1440 },
    '5x8': { width: 5 * 1440, height: 8 * 1440 },
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
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
        const lines = extractedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
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
      const isBreakMarker = (t) => /^(dedication|contents|table of contents|acknowledgments|disclaimer|introduction|chapter\s+\d+|part\s+\d+)/i.test(t);

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
              }),
            ],
            heading: isHeading ? HeadingLevel.HEADING_1 : undefined,
            alignment: isHeading ? AlignmentType.CENTER : AlignmentType.LEFT,
            spacing: {
              line: 340,
              before: isHeading ? 360 : 0,
              after: isHeading ? 240 : 120,
            },
          })
        );
      });

      const doc = new Document({
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
          },
          children: paragraphs,
        }],
      });

      const blob = await Packer.toBlob(doc);
      const cleanBase = fileName ? fileName.replace(/\.docx$/i, '') : 'Manuscript';
      saveAs(blob, `${cleanBase}_Formatted_${trimSize}.docx`);
      setStatusMessage('Manuscript successfully exported with mirror margins.');
    } catch (err) {
      console.error(err);
      alert('Error creating DOCX file.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRunPlanner = async () => {
    if (credits <= 0 && !apiKey) {
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

      if (!apiKey && credits > 0) {
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
    <main className="min-h-screen bg-[#FBF9F5] text-[#2D2A26] flex flex-col items-center px-4 py-8 selection:bg-[#EADFD8] selection:text-[#B85D3E]">
      {/* Atelier Header */}
      <header className="w-full max-w-4xl flex items-center justify-between border-b border-[#EFEAE2] pb-5 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#FAF4ED] border border-[#E9DFD3] rounded-2xl shadow-sm text-[#B85D3E]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-serif font-bold tracking-tight text-[#1F1C18]">PUBLISHSTUDIO</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF3EC] text-[#B85D3E] font-medium border border-[#E9DFD3]">
                Atelier 3.2
              </span>
            </div>
            <span className="text-[11px] text-[#8C8479] tracking-wide font-sans">Craft Print & Planner Studio</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Trial / BYOK Indicator */}
          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E8E1D7] bg-white hover:bg-[#FAF7F2] text-xs transition shadow-sm font-sans"
          >
            {apiKey ? (
              <>
                <Key className="w-3.5 h-3.5 text-[#5A8264]" />
                <span className="text-[#5A8264] font-medium">BYOK Active</span>
              </>
            ) : (
              <>
                <Award className="w-3.5 h-3.5 text-[#B85D3E]" />
                <span className="text-[#6B645A] font-medium">{credits} Free Credits</span>
              </>
            )}
          </button>

          {/* Mode Switcher */}
          <div className="flex items-center bg-[#F1ECE4] p-1 rounded-full border border-[#E5DED4]">
            <button
              onClick={() => setActiveTab('manuscript')}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium transition ${
                activeTab === 'manuscript'
                  ? 'bg-white text-[#1F1C18] shadow-sm'
                  : 'text-[#827A70] hover:text-[#2D2A26]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-[#B85D3E]" />
              <span>Typeset</span>
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium transition ${
                activeTab === 'planner'
                  ? 'bg-white text-[#1F1C18] shadow-sm'
                  : 'text-[#827A70] hover:text-[#2D2A26]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#B85D3E]" />
              <span>Planner</span>
            </button>
          </div>
        </div>
      </header>

      {/* Manufacturing Trim & Margins Card */}
      <section className="w-full max-w-4xl bg-white border border-[#EFEAE2] rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#B85D3E]" />
            <h2 className="text-xs font-bold text-[#1F1C18] uppercase tracking-wider font-sans">Manufacturing Specifications</h2>
          </div>
          <span className="text-[11px] text-[#4F7358] font-sans bg-[#F0F5F1] border border-[#D5E3D8] px-2.5 py-0.5 rounded-full font-medium">
            POD Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="text-[11px] font-semibold text-[#8C8479] uppercase tracking-wider block mb-2 font-sans">
              Trim Dimensions
            </label>
            <select
              value={trimSize}
              onChange={(e) => setTrimSize(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs text-[#2D2A26] font-medium focus:outline-none focus:border-[#B85D3E] transition"
            >
              <option value="6x9">6" x 9" (Standard Trade Paperback)</option>
              <option value="5.5x8.5">5.5" x 8.5" (Digest / Fiction)</option>
              <option value="8.5x11">8.5" x 11" (Workbook / Manual)</option>
              <option value="5x8">5" x 8" (Compact Fiction)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#8C8479] uppercase tracking-wider block mb-2 font-sans">
              {activeTab === 'manuscript' ? `Manuscript Extent (${pageCount} pages)` : `Planner Duration (${plannerDays} pages)`}
            </label>
            <input
              type="range"
              min="24"
              max="500"
              value={activeTab === 'manuscript' ? pageCount : plannerDays}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (activeTab === 'manuscript') setPageCount(val);
                else setPlannerDays(val);
              }}
              className="w-full h-2 bg-[#EFEAE2] rounded-lg appearance-none cursor-pointer accent-[#B85D3E] mt-3"
            />
          </div>
        </div>

        <div className="bg-[#FAF8F5] border border-[#EFEAE2] rounded-2xl p-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <span className="text-[10px] text-[#9E968B] uppercase tracking-wider block mb-1 font-sans">Spine Gutter</span>
            <span className="text-sm font-bold text-[#B85D3E] font-mono">{gutter}"</span>
          </div>
          <div>
            <span className="text-[10px] text-[#9E968B] uppercase tracking-wider block mb-1 font-sans">Outside Margin</span>
            <span className="text-sm font-semibold text-[#3B3731] font-mono">{outsideMargin}"</span>
          </div>
          <div>
            <span className="text-[10px] text-[#9E968B] uppercase tracking-wider block mb-1 font-sans">Top / Bottom</span>
            <span className="text-sm font-semibold text-[#3B3731] font-mono">{topBottomMargin}"</span>
          </div>
        </div>
      </section>

      {/* TAB 1: TYPESET STUDIO */}
      {activeTab === 'manuscript' && (
        <>
          <section className="w-full max-w-4xl bg-white border border-[#EFEAE2] rounded-3xl p-6 sm:p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.03)] mb-8">
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
                className="inline-flex items-center gap-2 bg-[#B85D3E] hover:bg-[#A35034] text-white font-medium text-xs px-5 py-3 rounded-full transition shadow-md shadow-[#B85D3E]/20 disabled:opacity-50"
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
                    className="inline-flex items-center gap-1.5 bg-[#FAF8F5] hover:bg-[#F2EDE4] border border-[#E5DDD1] text-[#2D2A26] font-medium text-xs px-4 py-3 rounded-full transition"
                  >
                    {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-[#5A8264]" />}
                    <span>Export Mirror-Margin DOCX</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 bg-[#FAF8F5] hover:bg-[#F2EDE4] border border-[#E5DDD1] text-[#2D2A26] font-medium text-xs px-4 py-3 rounded-full transition"
                  >
                    <Printer className="w-4 h-4 text-[#B85D3E]" />
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

          <section className="w-full max-w-4xl flex flex-col items-center">
            <div
              ref={docxViewerRef}
              className="w-full flex flex-col items-center gap-8 py-4 [&_.docx-page-sheet]:shadow-xl [&_.docx-page-sheet]:rounded-sm [&_.docx-page-sheet]:border [&_.docx-page-sheet]:border-[#E8E2D8] [&_.docx-page-sheet]:bg-white [&_.docx-page-sheet]:text-black"
            />
          </section>
        </>
      )}
            {/* TAB 2: PLANNER GENERATOR */}
      {activeTab === 'planner' && (
        <section className="w-full max-w-4xl bg-white border border-[#EFEAE2] rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4 text-[#B85D3E]" />
            <h2 className="text-xs font-bold text-[#1F1C18] uppercase tracking-wider font-sans">Curated Planner Archetypes</h2>
          </div>

          {/* Archetype Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div 
              onClick={() => setPlannerType('daily_focus')}
              className={`p-5 rounded-2xl border cursor-pointer transition relative text-left ${
                plannerType === 'daily_focus' 
                  ? 'bg-[#FAF4ED] border-[#B85D3E] shadow-sm' 
                  : 'bg-[#FAF9F6] border-[#EAE3D8] hover:border-[#D8CFBF]'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-white border border-[#E8E1D6] inline-block mb-3 text-[#B85D3E] shadow-2xl">
                <Compass className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#1F1C18] block mb-1 font-serif">Daily Focus & Timeblock</span>
              <p className="text-[11px] text-[#6B6357] leading-relaxed">Priorities, time blocks, and rotating cognitive deep work prompts.</p>
            </div>

            <div 
              onClick={() => setPlannerType('meal_grocery')}
              className={`p-5 rounded-2xl border cursor-pointer transition relative text-left ${
                plannerType === 'meal_grocery' 
                  ? 'bg-[#FAF4ED] border-[#B85D3E] shadow-sm' 
                  : 'bg-[#FAF9F6] border-[#EAE3D8] hover:border-[#D8CFBF]'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-white border border-[#E8E1D6] inline-block mb-3 text-[#B85D3E] shadow-2xl">
                <Coffee className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#1F1C18] block mb-1 font-serif">Meal & Kitchen Command</span>
              <p className="text-[11px] text-[#6B6357] leading-relaxed">Weekly lunch & dinner rotation tables with pantry checklists.</p>
            </div>

            <div 
              onClick={() => setPlannerType('habit_matrix')}
              className={`p-5 rounded-2xl border cursor-pointer transition relative text-left ${
                plannerType === 'habit_matrix' 
                  ? 'bg-[#FAF4ED] border-[#B85D3E] shadow-sm' 
                  : 'bg-[#FAF9F6] border-[#EAE3D8] hover:border-[#D8CFBF]'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-white border border-[#E8E1D6] inline-block mb-3 text-[#B85D3E] shadow-2xl">
                <CheckSquare className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#1F1C18] block mb-1 font-serif">Habit Tracking Matrix</span>
              <p className="text-[11px] text-[#6B6357] leading-relaxed">7-day tracker grids and habit loops with strategic focus rules.</p>
            </div>
          </div>

          {/* Custom Infill Direction */}
          <div className="mb-6">
            <label className="text-[11px] font-semibold text-[#8C8479] uppercase tracking-wider block mb-2 font-sans">
              Custom Sub-Niche / AI Direction (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Stoic Philosophy, Mediterranean Diet, ADHD Daily Executive Routine"
              value={customNiche}
              onChange={(e) => setCustomNiche(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-[#E8E2D8] rounded-xl px-4 py-2.5 text-xs text-[#2D2A26] placeholder:text-[#9E968B] focus:outline-none focus:border-[#B85D3E] transition"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-[#EFEAE2]">
            <div className="text-xs text-[#6B6357] font-mono">
              Output: <span className="text-[#1F1C18] font-bold">{plannerDays} Pages</span> • Trim: <span className="text-[#1F1C18] font-bold">{trimSize}"</span> • Gutter: <span className="text-[#B85D3E] font-bold">{gutter}"</span>
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

          {statusMessage && (
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#5A8264] font-medium font-sans">
              <CheckCircle2 className="w-4 h-4" />
              <span>{statusMessage}</span>
            </div>
          )}
        </section>
      )}

      {/* BYOK Settings Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-[#1F1C18]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-[#EFEAE2] rounded-3xl p-6 sm:p-7 shadow-2xl relative text-left">
            <button 
              onClick={() => setShowKeyModal(false)}
              className="absolute top-5 right-5 text-[#8C8479] hover:text-[#1F1C18]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2 bg-[#FAF4ED] rounded-xl text-[#B85D3E]">
                <Key className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#1F1C18] font-serif">Google Gemini API Key (BYOK)</h3>
            </div>

            <p className="text-xs text-[#6B6357] mb-4 leading-relaxed font-sans">
              You receive 3 free generations via the curated vault. To unlock unlimited generations with custom dynamic AI prompts, add your free Google Gemini API key.
            </p>

            <input
              type="password"
              placeholder="AIzaSy..."
              value={tempKeyInput}
              onChange={(e) => setTempKeyInput(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs text-[#2D2A26] placeholder:text-[#9E968B] focus:outline-none focus:border-[#B85D3E] mb-4 font-mono"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setApiKey('');
                  setTempKeyInput('');
                  localStorage.removeItem('ps_gemini_key');
                  setShowKeyModal(false);
                }}
                className="px-3.5 py-2 rounded-full text-xs text-[#8C8479] hover:text-[#1F1C18] transition"
              >
                Clear Key
              </button>
              <button
                onClick={saveApiKey}
                className="px-4 py-2 bg-[#B85D3E] hover:bg-[#A35034] text-white rounded-full text-xs font-semibold transition"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Atelier Footer */}
      <footer className="w-full max-w-4xl border-t border-[#EFEAE2] mt-auto pt-6 text-center text-[11px] text-[#9E968B] font-sans">
        &copy; {new Date().getFullYear()} PUBLISHSTUDIO • Atelier Edition • Zero-Server Architecture
      </footer>
    </main>
  );
              }
