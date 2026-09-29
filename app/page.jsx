'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, BookOpen, Layers, Download, RefreshCw, 
  CheckCircle2, Sparkles, Printer, Sliders, Key, X, Award
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
      setStatusMessage('Export complete: Formatted DOCX ready for distribution.');
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

      setStatusMessage(`Generated ${plannerDays}-page interior DOCX successfully!`);
    } catch (err) {
      console.error(err);
      alert('Error generating planner interior.');
    } finally {
      setIsGeneratingPlanner(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center px-4 py-8 selection:bg-indigo-600 selection:text-white">
      {/* Studio Header */}
      <header className="w-full max-w-5xl flex items-center justify-between border-b border-zinc-800/80 pb-5 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-lg shadow-indigo-600/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight text-white block">PUBLISHSTUDIO</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">v3.1 PRO</span>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono tracking-wider uppercase">Algorithmic Publishing OS</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800/80 text-xs font-mono transition"
          >
            {apiKey ? (
              <>
                <Key className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">BYOK Active</span>
              </>
            ) : (
              <>
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-zinc-300">{credits} Credits</span>
              </>
            )}
          </button>

          <div className="flex items-center bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('manuscript')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
                activeTab === 'manuscript' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Typeset</span>
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition ${
                activeTab === 'planner' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Planner</span>
            </button>
          </div>
        </div>
      </header>

      {/* Manufacturing Trim & Margins */}
      <section className="w-full max-w-4xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 shadow-2xl mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Manufacturing Trim & Margins</h2>
          </div>
          <span className="text-[11px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-md">
            POD Validated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-2">Trim Dimensions</label>
            <select
              value={trimSize}
              onChange={(e) => setTrimSize(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="6x9">6" x 9" (Standard Trade Paperback)</option>
              <option value="5.5x8.5">5.5" x 8.5" (Digest / Fiction)</option>
              <option value="8.5x11">8.5" x 11" (Workbook / Manual)</option>
              <option value="5x8">5" x 8" (Compact Fiction)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-2">
              {activeTab === 'manuscript' ? `Target Page Count (${pageCount})` : `Interior Duration (${plannerDays} pages)`}
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
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-3"
            />
          </div>
        </div>

        <div className="bg-zinc-950/80 border border-zinc-800/70 rounded-xl p-4 grid grid-cols-3 gap-3 text-center font-mono">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Binding Gutter</span>
            <span className="text-sm font-semibold text-indigo-400">{gutter}"</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Outer Margin</span>
            <span className="text-sm font-semibold text-zinc-300">{outsideMargin}"</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Top / Bottom</span>
            <span className="text-sm font-semibold text-zinc-300">{topBottomMargin}"</span>
          </div>
        </div>
      </section>

      {/* Typeset Studio Tab */}
      {activeTab === 'manuscript' && (
        <>
          <section className="w-full max-w-4xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 text-center shadow-2xl mb-8">
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
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-5 py-3 rounded-xl transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
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
                    className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-medium text-xs px-4 py-3 rounded-xl transition"
                  >
                    {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-emerald-400" />}
                    <span>Export Mirror-Margin DOCX</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-medium text-xs px-4 py-3 rounded-xl transition"
                  >
                    <Printer className="w-4 h-4 text-indigo-400" />
                    <span>Print / Save Vector PDF</span>
                  </button>
                </>
              )}
            </div>

            {statusMessage && (
              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>{statusMessage}</span>
              </div>
            )}
          </section>

          <section className="w-full max-w-4xl flex flex-col items-center">
            <div
              ref={docxViewerRef}
              className="w-full flex flex-col items-center gap-8 py-4 [&_.docx-page-sheet]:shadow-2xl [&_.docx-page-sheet]:rounded-sm [&_.docx-page-sheet]:border [&_.docx-page-sheet]:border-zinc-300 [&_.docx-page-sheet]:bg-white [&_.docx-page-sheet]:text-black"
            />
          </section>
        </>
      )}

            {/* Planner Generator Tab */}
      {activeTab === 'planner' && (
        <section className="w-full max-w-4xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 shadow-2xl mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Algorithmic & AI Infill Generator</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div 
              onClick={() => setPlannerType('daily_focus')}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                plannerType === 'daily_focus' 
                  ? 'bg-zinc-800/90 border-indigo-500 shadow-md shadow-indigo-500/10' 
                  : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <span className="text-xs font-semibold text-white block mb-1">Daily Focus & Timeblock</span>
              <p className="text-[11px] text-zinc-400">Priorities, time blocks, and rotating cognitive prompts.</p>
            </div>

            <div 
              onClick={() => setPlannerType('meal_grocery')}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                plannerType === 'meal_grocery' 
                  ? 'bg-zinc-800/90 border-indigo-500 shadow-md shadow-indigo-500/10' 
                  : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <span className="text-xs font-semibold text-white block mb-1">Meal & Kitchen Command</span>
              <p className="text-[11px] text-zinc-400">Weekly lunch/dinner rotation tables with pantry checklists.</p>
            </div>

            <div 
              onClick={() => setPlannerType('habit_matrix')}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                plannerType === 'habit_matrix' 
                  ? 'bg-zinc-800/90 border-indigo-500 shadow-md shadow-indigo-500/10' 
                  : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <span className="text-xs font-semibold text-white block mb-1">Habit Tracking Matrix</span>
              <p className="text-[11px] text-zinc-400">7-day tracker grids and habit loops with strategic tips.</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-2">
              Custom Sub-Niche / AI Direction (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Stoic Philosophy, Ketogenic Meal Prep, ADHD Executive Focus"
              value={customNiche}
              onChange={(e) => setCustomNiche(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800/80">
            <div className="text-xs text-zinc-400 font-mono">
              Output: <span className="text-white">{plannerDays} Pages</span> • Trim: <span className="text-white">{trimSize}"</span> • Gutter: <span className="text-indigo-400">{gutter}"</span>
            </div>

            <button
              onClick={handleRunPlanner}
              disabled={isGeneratingPlanner}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs px-6 py-3 rounded-xl transition shadow-lg shadow-indigo-600/25 disabled:opacity-50"
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
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>{statusMessage}</span>
            </div>
          )}
        </section>
      )}

      {/* BYOK Settings Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowKeyModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <Key className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Gemini API Key (BYOK)</h3>
            </div>

            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              You get 3 free generations via the curated vault. To unlock unlimited generations with custom dynamic AI prompts, add your free Google Gemini API key.
            </p>

            <input
              type="password"
              placeholder="AIzaSy..."
              value={tempKeyInput}
              onChange={(e) => setTempKeyInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 mb-4 font-mono"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setApiKey('');
                  setTempKeyInput('');
                  localStorage.removeItem('ps_gemini_key');
                  setShowKeyModal(false);
                }}
                className="px-3.5 py-2 rounded-xl text-xs text-zinc-400 hover:text-white transition"
              >
                Clear Key
              </button>
              <button
                onClick={saveApiKey}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Studio Footer */}
      <footer className="w-full max-w-5xl border-t border-zinc-900 mt-auto pt-6 text-center text-[11px] text-zinc-600 font-mono">
        &copy; {new Date().getFullYear()} PUBLISHSTUDIO • Standard POD Specifications • Zero-Server Architecture
      </footer>
    </main>
  );
}
