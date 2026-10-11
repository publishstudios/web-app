// app/HelpCenter.jsx
'use client';
import React, { useState, useMemo } from 'react';
import { Search, BookOpen, ChevronDown, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';

const KNOWLEDGE_ARTICLES = [
  {
    id: 'gutter_margins',
    category: 'Print Geometry',
    title: 'Binding Gutter Margins (Preventing Text Crease Loss)',
    summary: 'The gutter is the extra inside margin added to prevent text from disappearing into the book spine curve.',
    details: [
      'Standard books require mirror margins: Recto (odd, right) pages place the gutter on the left; Verso (even, left) pages place the gutter on the right.',
      'Under 150 pages: Minimum 0.375" (3/8 in) gutter margin.',
      '151 to 300 pages: Recommended 0.500" (1/2 in) gutter margin.',
      '301 to 500 pages: Recommended 0.625" (5/8 in) gutter margin.',
      '500+ pages: Minimum 0.750" to 0.875" gutter margin.'
    ]
  },
  {
    id: 'spine_calculation',
    category: 'Cover Blueprint',
    title: 'Spine Width Formula & The Strict 80-Page Rule',
    summary: 'Spine bulk is calculated by multiplying page count by the paper caliper (microscopic sheet thickness).',
    details: [
      'Standard 50–55 lb White Paper: Page Count × 0.002252" = Spine Width.',
      'Standard Cream Paper (Fiction Trade): Page Count × 0.002500" = Spine Width.',
      'Premium Color / 70 lb Paper: Page Count × 0.002700" = Spine Width.',
      'The 80-Page Rule: Platforms (Amazon KDP, IngramSpark) reject spine text under 80 pages because narrow spines (< 0.20") risk text wrapping onto covers.'
    ]
  },
  {
    id: 'barcode_zone',
    category: 'Cover Blueprint',
    title: 'Barcode Exclusion Zone Protection (2.0" × 1.2")',
    summary: 'Print facilities laser-print the mandatory ISBN barcode in the lower-right corner of the back cover during manufacture.',
    details: [
      'Maintain an unprinted safe box of 2.0" width by 1.2" height in the lower-right area of the back cover.',
      'Keep this zone at least 0.25" inward from trim edges and the spine fold.',
      'Do not place author portraits, critical quotes, or URLs in this boundary.'
    ]
  },
  {
    id: 'bleed_tolerances',
    category: 'Print Geometry',
    title: 'Full Bleed vs. No Bleed (0.125" Trimming Tolerances)',
    summary: 'Bleed is required whenever imagery, colored boxes, or tint backgrounds run completely to the edge of the physical page.',
    details: [
      'Industrial cutting shears have a mechanical variance of ±0.125" (1/8 in).',
      'For full-bleed covers, add 0.125" to top, bottom, left, and right outer edges.',
      'Safe Margin Zone: All text and page numbers must remain 0.25" inside the cut line.'
    ]
  },
  {
    id: 'zero_server_privacy',
    category: 'Software Architecture',
    title: 'How PublishStudio Operates 100% Zero-Server & Free',
    summary: 'Your manuscripts, intellectual property, and book drafts never leave your personal computer.',
    details: [
      'All DOCX parsing, text rendering, and PDF blueprints run in client browser memory.',
      'Multi-book drafts are saved to browser-native IndexedDB on your device, preventing cloud data harvesting or recurring server bills.',
      'Drafts remain saved across visits unless you clear your local browser history.'
    ]
  },
  {
    id: 'royalty_mechanics',
    category: 'Commercial Economics',
    title: 'Understanding Multi-Marketplace POD Royalty Formulas',
    summary: 'Print-on-demand distributors calculate author royalties after deducting base manufacturing costs.',
    details: [
      'Standard 60% Rule: Royalty = (List Price × 0.60) - Unit Manufacturing Cost.',
      'Break-Even Price Floor: The lowest list price possible without negative balance is (Manufacturing Cost ÷ 0.60).',
      'Expanded Distribution: Often uses a 40% margin model, requiring higher list prices to sustain profits.'
    ]
  }
];

export default function HelpCenter({ onBackToStudio, isDarkMode }) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [openAccordion, setOpenAccordion] = useState('gutter_margins');

  const categories = ['All', 'Print Geometry', 'Cover Blueprint', 'Software Architecture', 'Commercial Economics'];

  const filtered = useMemo(() => {
    return KNOWLEDGE_ARTICLES.filter((item) => {
      const matchCat = selectedCat === 'All' || item.category === selectedCat;
      const q = search.toLowerCase().trim();
      const matchText = !q || item.title.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q) || item.details.some(d => d.toLowerCase().includes(q));
      return matchCat && matchText;
    });
  }, [search, selectedCat]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={onBackToStudio}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-3 transition ${
              isDarkMode 
                ? 'bg-[#1C1A21] text-zinc-300 hover:bg-[#25222C] border border-[#2B2834]' 
                : 'bg-white text-[#4A4338] hover:bg-[#EAE4D8] border border-[#DFD7CA] shadow-sm'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Studio</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F1C18] dark:text-white tracking-tight">
            Publishing Manual & Tolerances
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7368] dark:text-[#9A96A0] mt-1">
            Manufacturing engineering guidelines for Amazon KDP, IngramSpark, and Notion Press.
          </p>
        </div>

        <div className={`w-full sm:w-80 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border ${
          isDarkMode 
            ? 'bg-[#18161D] border-[#292632] text-white shadow-inner' 
            : 'bg-[#EAE4D8] border-[#DFD7CA] text-[#1F1C18] shadow-[inset_2px_2px_4px_rgba(180,165,145,0.35),_inset_-2px_-2px_4px_rgba(255,255,255,0.7)]'
        }`}>
          <Search className="w-4 h-4 text-[#8C8479] shrink-0" />
          <input
            type="text"
            placeholder="Search tolerances, bleed, spine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent outline-none placeholder:text-[#9A9286]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
              selectedCat === cat
                ? 'bg-[#0E4D54] text-white shadow-sm'
                : isDarkMode
                  ? 'bg-[#18161D] text-zinc-400 hover:text-white border border-[#26242E]'
                  : 'bg-white/80 text-[#6D6559] hover:bg-white border border-[#DFD7CA]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 mx-auto text-[#8C8479] opacity-40 mb-2" />
            <p className="text-sm text-[#8C8479]">No publishing articles matching "{search}"</p>
          </div>
        ) : (
          filtered.map((item) => {
            const isOpen = openAccordion === item.id;
            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition overflow-hidden ${
                  isDarkMode
                    ? 'bg-[#18161D] border-[#282531]'
                    : 'bg-white border-[#E2DBD0] shadow-[-3px_-3px_8px_rgba(255,255,255,0.8),_3px_3px_8px_rgba(188,175,158,0.25)]'
                }`}
              >
                <button
                  onClick={() => setOpenAccordion(isOpen ? null : item.id)}
                  className="w-full text-left p-5 flex items-start justify-between gap-4"
                >
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#0E4D54] dark:text-teal-400 block mb-1">
                      {item.category}
                    </span>
                    <h2 className="text-base font-serif font-bold text-[#1F1C18] dark:text-white">
                      {item.title}
                    </h2>
                    <p className="text-xs text-[#7A7368] dark:text-[#9A96A0] mt-1 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[#8C8479] shrink-0 mt-1 transition-transform ${
                    isOpen ? 'rotate-180 text-[#0E4D54]' : ''
                  }`} />
                </button>

                {isOpen && (
                  <div className={`p-5 pt-0 border-t ${
                    isDarkMode ? 'border-[#24212C] bg-black/10' : 'border-[#F2ECE3] bg-[#FAF8F5]'
                  }`}>
                    <ul className="space-y-2.5 mt-3 text-xs text-[#524B40] dark:text-zinc-300 leading-relaxed">
                      {item.details.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0E4D54] dark:text-teal-400 shrink-0 mt-0.5" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-10 p-4 rounded-2xl border text-center text-xs text-[#7A7368] dark:text-[#9A96A0] bg-black/2 dark:bg-white/2 border-black/5 dark:border-white/5">
        <ShieldCheck className="w-4 h-4 text-[#0E4D54] inline-block mr-1.5 -mt-0.5" />
        Formulas adhere to Amazon KDP Paper Specifications and IngramSpark File Creation Guidelines.
      </div>
    </div>
  );
                  }
