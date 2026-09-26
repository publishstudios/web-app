'use client';
import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle, BookOpen, Layers, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Home() {
  const [pageCount, setPageCount] = useState(120);
  const [trimSize, setTrimSize] = useState('6x9');
  const [bleed, setBleed] = useState(false);

  // Dynamic industry gutter formula
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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-12">
      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between border-b border-slate-800 pb-6 mb-12">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white block">PUBLISHSTUDIO</span>
            <span className="text-xs text-indigo-400 font-mono tracking-widest uppercase">Print OS Engine</span>
          </div>
        </div>
        <span className="text-xs font-medium px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-slate-400">
          v1.0.0 Ready
        </span>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-3xl text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
          Automated Book Layout & Typesetting
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
          Universal trade trim templates, dynamic gutter calculation, and client-side print validation with zero server lock-in.
        </p>
      </section>

      {/* Free Lead Magnet: Margin & Gutter Calculator */}
      <section className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Print Margin & Gutter Inspector</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Trim Dimension
            </label>
            <select
              value={trimSize}
              onChange={(e) => setTrimSize(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="6x9">6" x 9" (Standard Trade Paperback)</option>
              <option value="5.5x8.5">5.5" x 8.5" (Digest / Fiction)</option>
              <option value="8.5x11">8.5" x 11" (Workbook / Manual)</option>
              <option value="5x8">5" x 8" (Compact Fiction)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Estimated Page Count ({pageCount})
            </label>
            <input
              type="range"
              min="24"
              max="800"
              value={pageCount}
              onChange={(e) => setPageCount(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
            />
          </div>
        </div>

        {/* Calculated Output Specs */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <span className="text-xs text-slate-500 block mb-1">Inside Gutter</span>
            <span className="text-base font-bold text-indigo-400">{gutter}"</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block mb-1">Outside Margin</span>
            <span className="text-base font-bold text-slate-200">{outsideMargin}"</span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block mb-1">Top / Bottom</span>
            <span className="text-base font-bold text-slate-200">{topBottomMargin}"</span>
          </div>
        </div>
      </section>

      {/* Document Ingestion & Formatting CTA */}
      <section className="w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-900/50 rounded-2xl p-6 md:p-8 text-center shadow-2xl">
        <div className="w-12 h-12 bg-indigo-950 border border-indigo-800 rounded-xl flex items-center justify-center mx-auto mb-4 text-indigo-400">
          <Upload className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Ready to Format Your Manuscript?</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
          Upload any manuscript (DOCX / Markdown) to convert directly into standard POD-compliant printable layouts.
        </p>
        <button
          onClick={() => alert('Parser pipeline initialized! Ready to load DOCX source.')}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-6 py-3 rounded-xl transition duration-150 shadow-lg shadow-indigo-600/30"
        >
          <span>Select Document to Format</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-4xl border-t border-slate-900 mt-16 pt-6 text-center text-xs text-slate-600">
        &copy; {new Date().getFullYear()} PublishStudio. Standard Trade POD Compliant Architecture.
      </footer>
    </main>
  );
      }
