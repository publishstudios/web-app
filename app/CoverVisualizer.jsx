'use client';
import React, { useState } from 'react';
import { Eye, Shield, AlertTriangle, Layers, Info } from 'lucide-react';

export default function CoverVisualizer({
  trimWidth = 6.0,
  trimHeight = 9.0,
  spineWidth = 0.3,
  bleed = 0.125,
  isDarkMode = false,
  bookTitle = 'Book Title',
  authorName = 'Author Name'
}) {
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(true);

  // Total mathematical dimensions in inches
  const totalWidth = Number(((trimWidth * 2) + spineWidth + (bleed * 2)).toFixed(3));
  const totalHeight = Number((trimHeight + (bleed * 2)).toFixed(3));

  // Visual SVG scaling (100 pixels per inch for SVG coordinate space)
  const scale = 100;
  const svgWidth = totalWidth * scale;
  const svgHeight = totalHeight * scale;

  // Key Coordinates in SVG units
  const bleedPt = bleed * scale;
  const trimWidthPt = trimWidth * scale;
  const trimHeightPt = trimHeight * scale;
  const spineWidthPt = spineWidth * scale;

  // Boundary lines X coordinates
  const leftTrimX = bleedPt;
  const spineStartX = bleedPt + trimWidthPt;
  const spineEndX = spineStartX + spineWidthPt;
  const rightTrimX = spineEndX + trimWidthPt;

  // Boundary lines Y coordinates
  const topTrimY = bleedPt;
  const bottomTrimY = bleedPt + trimHeightPt;

  // Safe area margin (0.25" from trim, 0.0625" from spine hinges)
  const safeMargin = 0.25 * scale;
  const spineSafeHinge = 0.0625 * scale;

  // Feasibility Check
  const canFitSpineText = spineWidth >= 0.20;

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Visualizer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs flex items-center gap-1.5 font-sans">
            <Layers className="w-3.5 h-3.5 text-[#B85D3E]" />
            <span>Interactive Cover Blueprint</span>
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-[#8C8479]">
            Scale: 1:1 Proportional
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSafeZones(!showSafeZones)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${
              showSafeZones 
                ? (isDarkMode ? 'bg-[#2A2322] border-[#E07A5F] text-[#E07A5F]' : 'bg-[#FAF4ED] border-[#B85D3E] text-[#B85D3E]') 
                : 'border-transparent text-[#8C8479]'
            }`}
          >
            Safe Zones: {showSafeZones ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setShowMeasurements(!showMeasurements)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${
              showMeasurements 
                ? (isDarkMode ? 'bg-[#2A2322] border-[#E07A5F] text-[#E07A5F]' : 'bg-[#FAF4ED] border-[#B85D3E] text-[#B85D3E]') 
                : 'border-transparent text-[#8C8479]'
            }`}
          >
            Guides: {showMeasurements ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Scaled Responsive Vector Viewport */}
      <div className={`w-full rounded-2xl border p-2 sm:p-4 overflow-x-auto shadow-inner ${
        isDarkMode ? 'bg-[#0E0D10] border-[#292630]' : 'bg-[#F2EEE9] border-[#E5DDD2]'
      }`}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-[420px] select-none mx-auto drop-shadow-md"
          style={{ minWidth: '320px' }}
        >
          <defs>
            {/* Pattern for Outer Bleed Area */}
            <pattern id="bleedPattern" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2" stroke={isDarkMode ? '#3A2E2C' : '#E8DDD5'} strokeWidth="1" />
            </pattern>
          </defs>

          {/* 1. Full Canvas Background with Bleed Perimeter */}
          <rect
            x="0"
            y="0"
            width={svgWidth}
            height={svgHeight}
            fill="url(#bleedPattern)"
            stroke={isDarkMode ? '#5E3E37' : '#D4A396'}
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* 2. Physical Trim Area (Paper Canvas) */}
          <rect
            x={leftTrimX}
            y={topTrimY}
            width={trimWidthPt * 2 + spineWidthPt}
            height={trimHeightPt}
            fill={isDarkMode ? '#1B1A1E' : '#FAF8F5'}
            stroke={isDarkMode ? '#4A4652' : '#C7BFB5'}
            strokeWidth="1.5"
          />

          {/* 3. Spine Area */}
          <rect
            x={spineStartX}
            y={topTrimY}
            width={spineWidthPt}
            height={trimHeightPt}
            fill={isDarkMode ? '#232026' : '#F1EDE6'}
            stroke={isDarkMode ? '#4A4652' : '#C7BFB5'}
            strokeWidth="1"
          />

          {/* 4. Safe Zones (Optional Overlay) */}
          {showSafeZones && (
            <>
              {/* Back Cover Safe Zone */}
              <rect
                x={leftTrimX + safeMargin}
                y={topTrimY + safeMargin}
                width={trimWidthPt - safeMargin - spineSafeHinge}
                height={trimHeightPt - (safeMargin * 2)}
                fill="none"
                stroke="#10B981"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.8"
              />

              {/* Front Cover Safe Zone */}
              <rect
                x={spineEndX + spineSafeHinge}
                y={topTrimY + safeMargin}
                width={trimWidthPt - safeMargin - spineSafeHinge}
                height={trimHeightPt - (safeMargin * 2)}
                fill="none"
                stroke="#10B981"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.8"
              />

              {/* Spine Safe Zone (if wide enough) */}
              {canFitSpineText && (
                <rect
                  x={spineStartX + spineSafeHinge}
                  y={topTrimY + safeMargin}
                  width={spineWidthPt - (spineSafeHinge * 2)}
                  height={trimHeightPt - (safeMargin * 2)}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="0.75"
                  strokeDasharray="2 2"
                  opacity="0.7"
                />
              )}

              {/* Barcode Safe Exclusion Area (Bottom Right of Back Cover) */}
              <rect
                x={spineStartX - (2.0 * scale) - (0.25 * scale)}
                y={bottomTrimY - (1.2 * scale) - (0.25 * scale)}
                width={2.0 * scale}
                height={1.2 * scale}
                fill={isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'}
                stroke="#EF4444"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <text
                x={spineStartX - (1.25 * scale)}
                y={bottomTrimY - (0.75 * scale)}
                fill="#EF4444"
                fontSize="12"
                fontWeight="600"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                Barcode Reserved Zone
              </text>
            </>
          )}

          {/* 5. Typography Mockup Labels */}
          {/* Back Cover Label */}
          <text
            x={leftTrimX + (trimWidthPt / 2)}
            y={topTrimY + (trimHeightPt / 2) - 15}
            fill={isDarkMode ? '#8E8B92' : '#8C8479'}
            fontSize="18"
            fontWeight="bold"
            fontFamily="serif"
            textAnchor="middle"
          >
            BACK COVER
          </text>
          <text
            x={leftTrimX + (trimWidthPt / 2)}
            y={topTrimY + (trimHeightPt / 2) + 12}
            fill={isDarkMode ? '#6C6970' : '#A89F93'}
            fontSize="12"
            fontFamily="monospace"
            textAnchor="middle"
          >
            {trimWidth}" × {trimHeight}"
          </text>

          {/* Spine Label & Text */}
          <g transform={`rotate(90, ${spineStartX + (spineWidthPt / 2)}, ${topTrimY + (trimHeightPt / 2)})`}>
            <text
              x={spineStartX + (spineWidthPt / 2)}
              y={topTrimY + (trimHeightPt / 2) + 4}
              fill={canFitSpineText ? (isDarkMode ? '#E07A5F' : '#B85D3E') : '#EF4444'}
              fontSize={Math.min(14, Math.max(9, spineWidth * 30))}
              fontWeight="bold"
              fontFamily="sans-serif"
              textAnchor="middle"
            >
              {canFitSpineText ? `${bookTitle.toUpperCase()} • ${authorName}` : 'SPINE (NO TEXT)'}
            </text>
          </g>

          {/* Front Cover Label */}
          <text
            x={spineEndX + (trimWidthPt / 2)}
            y={topTrimY + (trimHeightPt / 2) - 15}
            fill={isDarkMode ? '#8E8B92' : '#8C8479'}
            fontSize="18"
            fontWeight="bold"
            fontFamily="serif"
            textAnchor="middle"
          >
            FRONT COVER
          </text>
          <text
            x={spineEndX + (trimWidthPt / 2)}
            y={topTrimY + (trimHeightPt / 2) + 12}
            fill={isDarkMode ? '#6C6970' : '#A89F93'}
            fontSize="12"
            fontFamily="monospace"
            textAnchor="middle"
          >
            {trimWidth}" × {trimHeight}"
          </text>

          {/* 6. Measurement Dimensions Overlays */}
          {showMeasurements && (
            <>
              {/* Outer Bleed Annotation */}
              <text
                x={svgWidth / 2}
                y={topTrimY / 2 + 4}
                fill="#D97706"
                fontSize="11"
                fontWeight="600"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                ▲ 0.125" Outer Print Bleed Perimeter
              </text>

              {/* Spine Width Indicator at Bottom */}
              <text
                x={spineStartX + (spineWidthPt / 2)}
                y={bottomTrimY + (bleedPt / 2) + 4}
                fill={isDarkMode ? '#E07A5F' : '#B85D3E'}
                fontSize="11"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                Spine: {spineWidth}"
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Blueprint Legend */}
      <div className={`p-3 rounded-xl border text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 font-sans ${
        isDarkMode ? 'bg-[#141317] border-[#292630]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
      }`}>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <span className="text-[#8C8479]">0.125" Bleed (Cut off)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-[#8C8479]">0.25" Safe Zone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
          <span className="text-[#8C8479]">Barcode Exclusion</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#B85D3E] shrink-0" />
          <span className="text-[#8C8479]">Spine: {spineWidth}"</span>
        </div>
      </div>

      {/* Narrow Spine Warning */}
      {!canFitSpineText && (
        <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <b>Narrow Spine ({spineWidth}")</b>: Books under ~80 pages (under 0.20" thick) are too narrow for reliable spine text. Keep spine artwork solid or patterned.
          </span>
        </div>
      )}
    </div>
  );
    }
            
