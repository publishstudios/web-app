'use client';
import React, { useState, useRef } from 'react';
import { Upload, BookOpen, Layers, ArrowRight, FileText, CheckCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import mammoth from 'mammoth';

export default function Home() {
  const [pageCount, setPageCount] = useState(120);
  const [trimSize, setTrimSize] = useState('6x9');
  const [pages, setPages] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePageIdx, setActivePageIdx] = useState(0);
  const fileInputRef = useRef(null);

  // Universal POD gutter calculation rules
  const calculateGutter = (total) => {
    if (total <= 150) return 0.375;
    if (total <= 300) return 0.500;
    if (total <= 500) return 0.625;
    if (total <= 700) return 0.750;
    return 0.875;
  };

  const gutter = calculateGutter(pageCount);
  const outsideMargin = 0.375;
  const topBottomMargin = 0.5;

  // Split parsed text into book page chunks (~260 words per 6x9 trade page)
  const paginateHtml = (htmlContent) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const elements = Array.from(tempDiv.children);

    const generatedPages = [];
    let currentPageHtml = '';
    let wordBudget = 0;
    const maxWordsPerPage = trimSize === '6x9' ? 280 : trimSize === '5.5x8.5' ? 240 : 380;

    elements.forEach((el) => {
      const wordsInEl = el.innerText ? el.innerText.trim().split(/\s+/).length : 0;
      if (wordBudget + wordsInEl > maxWordsPerPage && currentPageHtml !== '') {
        generatedPages.push(currentPageHtml);
        currentPageHtml = el.outerHTML;
        wordBudget = wordsInEl;
      } else {
        currentPageHtml += el.outerHTML;
        wordBudget += wordsInEl;
      }
    });

    if (currentPageHtml) {
      generatedPages.push(currentPageHtml);
    }

    setPages(generatedPages.length > 0 ? generatedPages : [htmlContent]);
    setActivePageIdx(0);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      paginateHtml(result.value);
    } catch (err) {
      alert('Error parsing DOCX file. Please verify it is a valid .docx document.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Dimensions mapped to inches (rendered via CSS aspect ratios)
  const trimDimensions = {
    '6x9': { width: '360px', minHeight: '540px' },
    '5.5x8.5': { width: '330px', minHeight: '510px' },
    '8.5x11': { width: '420px', minHeight: '544px' },
    '5x8': { width: '300px', minHeight: '480px' },
  };

  const isRightPage = activePageIdx % 2 === 1; // Alternating Recto / Verso
  const currentLeftPad = isRightPage ? gutter * 96 : outsideMargin * 96;
  const currentRightPad = isRightPage ? outsideMargin * 96 : gutter * 96;

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
          v1.1.0 Paginated
        </span>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-3xl text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3 text-white">
          Automated Book Layout & Typesetting
        </h1>
        <p className="text-slate-400 text-xs md:text-sm max-w-lg mx-auto">
          Universal trade trim templates, dynamic gutter calculation, and real multi-page print layout preview.
        </p>
      </section>

      {/* Margin & Gutter Inspector */}
      <section className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Trim & Margin Control</h2>
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
              Estimated Total Pages ({pageCount})
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

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 grid grid-cols-3 gap-2 text-center font-mono">
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

      {/* Upload Button */}
      <section className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-xl mb-8">
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
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-6 py-3 rounded-xl transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Formatting Pages...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>{fileName ? `Uploaded: ${fileName}` : 'Upload DOCX Manuscript'}</span>
            </>
          )}
        </button>
      </section>

      {/* Paginated Book Sheet Viewer */}
      {pages.length > 0 && (
        <section className="w-full flex flex-col items-center mb-16">
          {/* Page Flip Bar */}
          <div className="flex items-center gap-4 mb-4 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
            <button
              onClick={() => setActivePageIdx((p) => Math.max(p - 1, 0))}
              disabled={activePageIdx === 0}
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-mono text-slate-300">
              Page {activePageIdx + 1} of {pages.length} ({isRightPage ? 'Recto / Right' : 'Verso / Left'})
            </span>
            <button
              onClick={() => setActivePageIdx((p) => Math.min(p + 1, pages.length - 1))}
              disabled={activePageIdx === pages.length - 1}
              className="p-1 rounded hover:bg-slate-800 disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Physical Book Page Simulation */}
          <div
            className="bg-[#faf8f5] text-slate-900 shadow-2xl rounded-sm border border-stone-300 flex flex-col justify-between transition-all duration-200"
            style={{
              width: trimDimensions[trimSize].width,
              minHeight: trimDimensions[trimSize].minHeight,
              paddingLeft: `${currentLeftPad}px`,
              paddingRight: `${currentRightPad}px`,
              paddingTop: `${topBottomMargin * 96}px`,
              paddingBottom: `${topBottomMargin * 96}px`,
            }}
          >
            {/* Running Header */}
            <div className="w-full text-[9px] uppercase tracking-widest text-stone-500 border-b border-stone-200 pb-1 mb-4 flex justify-between font-serif">
              <span>{isRightPage ? fileName.replace('.docx', '') : 'PUBLISHSTUDIO'}</span>
              <span>{activePageIdx + 1}</span>
            </div>

            {/* Book Body Copy */}
            <div
              className="book-page-body font-serif text-[12px] leading-relaxed text-stone-900 flex-1 space-y-2 [&>p]:indent-4 [&>p:first-of-type]:indent-0"
              dangerouslySetInnerHTML={{ __html: pages[activePageIdx] }}
            />

            {/* Page Number (Running Footer) */}
            <div className="w-full text-center text-[10px] font-serif text-stone-600 pt-3 border-t border-stone-200 mt-4">
              {activePageIdx + 1}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="w-full max-w-4xl border-t border-slate-900 mt-auto pt-6 text-center text-[11px] text-slate-600">
        &copy; {new Date().getFullYear()} PublishStudio. Standard Trade POD Compliant Architecture.
      </footer>
    </main>
  );
              }
