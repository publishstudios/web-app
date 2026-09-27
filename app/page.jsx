'use client';
import React, { useState, useRef } from 'react';
import { Upload, BookOpen, Layers, ArrowRight, Printer, RefreshCw, FileCheck, Download } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

export default function Home() {
  const [pageCount, setPageCount] = useState(120);
  const [trimSize, setTrimSize] = useState('6x9');
  const [fileName, setFileName] = useState('');
  const [rawTextLines, setRawTextLines] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  
  const fileInputRef = useRef(null);
  const docxViewerRef = useRef(null);

  // Universal POD gutter rules
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

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setHasRendered(false);

    try {
      // Dynamic import docx-preview for 100% client-side execution
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

        // Extract raw text lines for building the formatted Word export
        const extractedText = docxViewerRef.current.innerText || '';
        const lines = extractedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        setRawTextLines(lines);

        setHasRendered(true);
      }
    } catch (err) {
      console.error(err);
      alert('Error parsing Word document. Please ensure it is a valid .docx file.');
    } finally {
      setIsProcessing(false);
    }
  };

  // One-Click Formatted Word (.docx) Generator with Trade Mirror Margins
  const handleExportDocx = async () => {
    if (!rawTextLines.length) return;
    setIsExporting(true);

    try {
      // Dimensions in twips (1 inch = 1440 twips)
      const trimDimensionsTwips = {
        '6x9': { width: 6 * 1440, height: 9 * 1440 },
        '5.5x8.5': { width: 5.5 * 1440, height: 8.5 * 1440 },
        '8.5x11': { width: 8.5 * 1440, height: 11 * 1440 },
        '5x8': { width: 5 * 1440, height: 8 * 1440 },
      };

      const selectedTrim = trimDimensionsTwips[trimSize] || trimDimensionsTwips['6x9'];

      const paragraphs = rawTextLines.map((line) => {
        // Detect section headings
        const isHeading = /^(chapter|contents|table of contents|dedication|acknowledgments|introduction|part)/i.test(line);

        return new Paragraph({
          children: [
            new TextRun({
              text: line,
              font: 'Georgia',
              size: isHeading ? 28 : 22, // 14pt for headings, 11pt for body
              bold: isHeading,
            }),
          ],
          heading: isHeading ? HeadingLevel.HEADING_1 : undefined,
          spacing: {
            line: 340, // 1.4 line height
            before: isHeading ? 360 : 0,
            after: isHeading ? 200 : 140,
          },
        });
      });

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                size: {
                  width: selectedTrim.width,
                  height: selectedTrim.height,
                },
                margin: {
                  top: Math.round(topBottomMargin * 1440),
                  bottom: Math.round(topBottomMargin * 1440),
                  left: Math.round(gutter * 1440),        // Inside binding gutter
                  right: Math.round(outsideMargin * 1440), // Outside trim margin
                  mirrorMargins: true,                     // Alternating recto/verso book margins
                },
              },
            },
            children: paragraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const cleanBaseName = fileName ? fileName.replace(/\.docx$/i, '') : 'Book';
      saveAs(blob, `${cleanBaseName}_POD_Formatted_${trimSize}.docx`);
    } catch (err) {
      console.error(err);
      alert('Error exporting formatted DOCX.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-8 selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="w-full max-w-5xl flex items-center justify-between border-b border-slate-800 pb-5 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white block">PUBLISHSTUDIO</span>
            <span className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">Print OS Engine</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasRendered && (
            <>
              <button
                onClick={handleExportDocx}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Export Formatted Word (.docx)</span>
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3.5 py-1.5 rounded-lg transition"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-400" />
                <span>PDF Print</span>
              </button>
            </>
          )}
          <span className="text-[11px] font-medium px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-emerald-400">
            v2.1 DOCX Export
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-3xl text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3 text-white">
          Real Word Document Engine
        </h1>
        <p className="text-slate-400 text-xs md:text-sm max-w-lg mx-auto">
          Client-side DOCX rendering with trade-accurate mirror margins, and instant pre-formatted Word export.
        </p>
      </section>

      {/* Margin & Gutter Inspector */}
      <section className="w-full max-w-3xl bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">POD Trim & Binding Specs</h2>
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
              Target Page Count ({pageCount})
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
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Required Gutter</span>
            <span className="text-sm font-bold text-indigo-400">{gutter}"</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Outer Margin</span>
            <span className="text-sm font-bold text-slate-200">{outsideMargin}"</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Top / Bottom</span>
            <span className="text-sm font-bold text-slate-200">{topBottomMargin}"</span>
          </div>
        </div>
      </section>

      {/* Upload Box */}
      <section className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-xl mb-8">
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
              <span>Rendering Real Word Document...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>{fileName ? `Loaded: ${fileName}` : 'Upload DOCX Document'}</span>
            </>
          )}
        </button>

        {fileName && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-indigo-400 font-mono">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Ready for view & export: {fileName}</span>
          </div>
        )}
      </section>

      {/* Real Word Document Paginated Canvas Container */}
      <section className="w-full max-w-4xl flex flex-col items-center">
        <div
          ref={docxViewerRef}
          className="w-full flex flex-col items-center gap-8 py-4 [&_.docx-page-sheet]:shadow-2xl [&_.docx-page-sheet]:rounded-sm [&_.docx-page-sheet]:border [&_.docx-page-sheet]:border-stone-300 [&_.docx-page-sheet]:bg-white [&_.docx-page-sheet]:text-black"
        />
      </section>

      {/* Footer */}
      <footer className="w-full max-w-5xl border-t border-slate-900 mt-auto pt-6 text-center text-[11px] text-slate-600">
        &copy; {new Date().getFullYear()} PublishStudio. Client-Side DOCX Rendering Engine.
      </footer>
    </main>
  );
              }
