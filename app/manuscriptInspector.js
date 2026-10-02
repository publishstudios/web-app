// Zero-Server Client-Side DOCX Structural Inspector & Anomaly Scanner

export function inspectManuscriptDOM(containerElement, rawLines = []) {
  if (!containerElement && (!rawLines || rawLines.length === 0)) {
    return null;
  }

  // 1. Text & Word Statistics
  const fullText = containerElement ? (containerElement.innerText || '') : rawLines.join('\n');
  const words = fullText.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // 2. Page Sheets Detection (from rendered preview sheets)
  const pageSheets = containerElement 
    ? Array.from(containerElement.querySelectorAll('.docx-page-sheet, section.docx, .docx-wrapper > section')) 
    : [];
  const renderedPageCount = pageSheets.length;

  // 3. Chapter & Heading Extraction
  const chapterRegex = /^(chapter\s+([0-9]+|[ivxlcdm]+|[a-z]+)|prologue|epilogue|introduction|conclusion|preface|foreword|part\s+([0-9]+|[ivxlcdm]+))/i;
  
  const detectedChapters = [];
  const detectedHeadings = [];
  
  rawLines.forEach((line, index) => {
    const trimmed = line.trim();
    if (chapterRegex.test(trimmed)) {
      detectedChapters.push({ title: trimmed, lineIndex: index });
    } else if (/^heading\s+[1-3]/i.test(trimmed) || (trimmed.length < 60 && /^[A-Z0-9\s:,-]{4,}$/.test(trimmed) && trimmed.length > 3)) {
      detectedHeadings.push({ title: trimmed, lineIndex: index });
    }
  });

  // 4. Anomaly Detection Engine
  const anomalies = [];
  const passes = [];

  // Anomaly A: Consecutive empty paragraph returns (common author habit instead of page breaks)
  let consecutiveEmptyCount = 0;
  let maxEmptyStreak = 0;

  const domParagraphs = containerElement ? Array.from(containerElement.querySelectorAll('p')) : [];
  if (domParagraphs.length > 0) {
    domParagraphs.forEach((p) => {
      const isBlank = !p.textContent || p.textContent.trim().length === 0;
      if (isBlank) {
        consecutiveEmptyCount++;
        if (consecutiveEmptyCount > maxEmptyStreak) maxEmptyStreak = consecutiveEmptyCount;
      } else {
        consecutiveEmptyCount = 0;
      }
    });
  }

  if (maxEmptyStreak >= 3) {
    anomalies.push({
      type: 'warning',
      code: 'EMPTY_PARAGRAPH_SPACING',
      title: 'Consecutive Blank Paragraphs Detected',
      message: `Detected streaks of ${maxEmptyStreak} empty paragraph returns. In professional book production, use deliberate Page Breaks rather than pressing Enter repeatedly to push text.`,
    });
  } else {
    passes.push({
      code: 'CLEAN_SPACING',
      title: 'Paragraph Flow',
      message: 'Clean vertical paragraph spacing without excessive manual returns.',
    });
  }

  // Anomaly B: Chapter count sanity
  if (detectedChapters.length === 0) {
    anomalies.push({
      type: 'review',
      code: 'NO_CHAPTERS_FOUND',
      title: 'No Explicit Chapter Markers Recognized',
      message: 'No standard chapter markers (e.g., "Chapter 1", "Prologue") were detected. If this is a narrative work, ensure chapter titles use standard headings.',
    });
  } else {
    passes.push({
      code: 'CHAPTERS_DETECTED',
      title: 'Chapter Structure',
      message: `Identified ${detectedChapters.length} chapter markers throughout the manuscript.`,
    });
  }

  // Anomaly C: Blank pages in rendered preview
  let blankPageIndices = [];
  if (pageSheets.length > 0) {
    pageSheets.forEach((sheet, idx) => {
      const sheetText = sheet.innerText ? sheet.innerText.trim() : '';
      if (sheetText.length === 0) {
        blankPageIndices.push(idx + 1);
      }
    });
  }

  if (blankPageIndices.length > 0) {
    anomalies.push({
      type: 'review',
      code: 'BLANK_PAGES',
      title: `${blankPageIndices.length} Blank Page(s) Found`,
      message: `Page(s) ${blankPageIndices.slice(0, 5).join(', ')}${blankPageIndices.length > 5 ? '...' : ''} appear empty. Verify these are intentional section dividers.`,
    });
  } else {
    passes.push({
      code: 'NO_UNINTENDED_BLANKS',
      title: 'Page Content Density',
      message: 'All rendered pages contain valid text elements.',
    });
  }

  // Anomaly D: Minimum Word Count Check
  if (wordCount < 1000) {
    anomalies.push({
      type: 'review',
      code: 'LOW_WORD_COUNT',
      title: 'Short Manuscript Extent',
      message: `Total word count is ${wordCount.toLocaleString()} words. Standard print books typically require at least 5,000–10,000 words to achieve printable spine thickness.`,
    });
  } else {
    passes.push({
      code: 'HEALTHY_EXTENT',
      title: 'Word Count Extent',
      message: `${wordCount.toLocaleString()} words parsed across ${rawLines.length.toLocaleString()} text blocks.`,
    });
  }

  return {
    wordCount,
    paragraphCount: domParagraphs.length || rawLines.length,
    renderedPageCount: renderedPageCount || Math.ceil(wordCount / 280),
    detectedChapters,
    detectedHeadings,
    blankPageIndices,
    anomalies,
    passes,
  };
}
