'use client';
import React, { useState, useRef } from 'react';
import { Upload, BookOpen, Layers, ArrowRight, FileText, CheckCircle, RefreshCw } from 'lucide-react';
import mammoth from 'mammoth';

export default function Home() {
  const [pageCount, setPageCount] = useState(120);
  const [trimSize, setTrimSize] = useState('6x9');
  const [parsedHtml, setParsedHtml] = useState('');
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  // Universal POD gutter calculation rules
  const calculateGutter = (pages) => {
    if (pages <= 150) return 0.375;
    if (pages <= 300) return 0.500;
    if (pages <= 500) return 0.625;
    if (pages <= 700) return 0.750;
    return 0.875;
  };

  const gutter = calculateGutter(pageCount);
  const outsideMargin = 0.375;
  const topBottomMargin = 0.375;

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setParsedHtml(result.value);
    } catch (err) {
      alert('Error parsing DOCX file. Please verify it is a valid .docx document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-10 selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between border-b border-slate-800 pb-5 mb-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white block">PUBLISHSTUDIO</span>
            <span className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">Print OS Engine</span>
          </div>
        </div>
        <span className="text-[11px] font-medium px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-slate-400">
          v1.0.0 Ready
        </span>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-3xl text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3 text-white">
          Automated Book Layout & Typesetting
        </h1>
        <p className="text-slate-400 text-xs md:text-sm max-w-lg mx-auto">
          Universal trade trim templates, dynamic gutter calculation, and client-side print validation with zero server lock-in.
        </p>
      </section>

      {/* Free Lead Magnet: Margin & Gutter Inspector */}
      <section className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Print Margin & Gutter Inspector</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Trim Dimension
            </label>
            <select
              value={trimSize}
              onChange={(e) => setTrimSize(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="6x9">6" x 9" (Standard Trade Paperback)</option>
              <option value="5.5x8.5">5.5" x 8.5" (Digest / Fiction)</option>
              <option value="8.5x11">8.5" x 11" (Workbook / Manual)</option>
              <option value="5x8">5" x 8" (Compact Fiction)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Estimated Page Count ({pageCount})
            </label>
            <input
              type="range"
              min="24"
              max="800"
              value={pageCount}
              onChange={(e) => setPageCount(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-3"
            />
          </div>
        </div>

        {/* Calculated Output Specs */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Inside Gutter</span>
            <span className="text-sm font-bold text-indigo-400">{gutter}"</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Outside Margin</span>
            <span className="text-sm font-bold text-slate-200">{outsideMargin}"</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Top / Bottom</span>
            <span className="text-sm font-bold text-slate-200">{topBottomMargin}"</span>
          </div>
        </div>
      </section>

      {/* Document Ingestion & Formatting CTA */}
      <section className="w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-950/80 rounded-2xl p-6 md:p-8 text-center shadow-xl">
        <div className="w-12 h-12 bg-indigo-950/80 border border-indigo-800/50 rounded-xl flex items-center justify-center mx-auto mb-4 text-indigo-400">
          <Upload className="w-5 h-5" />
        </div>
        <h3 className="text-base font-bold text-white mb-2">Ready to Format Your Manuscript?</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
          Upload any Word manuscript (.docx) to convert directly into trade POD-compliant printable layouts in real time.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-6 py-3 rounded-xl transition duration-150 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Parsing Manuscript...</span>
            </>
          ) : (
            <>
              <span>{fileName ? 'Choose Another DOCX' : 'Select DOCX Manuscript'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {fileName && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-emerald-400 font-mono">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Loaded: {fileName}</span>
          </div>
        )}
      </section>

      {/* Live Formatted Book Page Preview */}
      {parsedHtml && (
        <section className="w-full max-w-2xl mt-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Live Trade Page Typeset Preview
            </h3>
            <span className="text-[10px] text-slate-500">Trim: {trimSize} | Gutter: {gutter}"</span>
          </div>

          <div 
            className="bg-stone-50 text-slate-900 rounded-lg shadow-2xl p-8 border border-stone-300 font-serif leading-relaxed text-sm overflow-x-auto min-h-[400px]"
            style={{
              paddingLeft: `${gutter * 96}px`,
              paddingRight: `${outsideMargin * 96}px`,
              paddingTop: `${topBottomMargin * 96}px`,
              paddingBottom: `${topBottomMargin * 96}px`,
            }}
            dangerouslySetInnerHTML={{ __html: parsedHtml }}
          />
        </section>
      )}

      {/* Footer */}
      <footer className="w-full max-w-4xl border-t border-slate-900 mt-16 pt-6 text-center text-[11px] text-slate-600">
        &copy; {new Date().getFullYear()} PublishStudio. Standard Trade POD Compliant Architecture.
      </footer>
    </main>
  );
}
