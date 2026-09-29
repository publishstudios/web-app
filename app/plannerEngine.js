import { 
  Document, Packer, Paragraph, TextRun, 
  PageBreak, AlignmentType, Table, TableRow, TableCell, 
  WidthType 
} from 'docx';
import { saveAs } from 'file-saver';

export const SEED_PROMPTS = {
  daily_focus: [
    { theme: "Deep Work Sprint", prompt: "Identify your single highest-leverage priority today. What makes it essential?" },
    { theme: "Energy Calibration", prompt: "Notice when your cognitive energy dips. Schedule low-friction admin tasks there." },
    { theme: "Stoic Audit", prompt: "What external interruption can you proactively eliminate before midday?" },
    { theme: "Constraint Setting", prompt: "If you only had two focused hours today, which item must be completed?" },
    { theme: "Momentum Micro-Step", prompt: "Execute one 5-minute task right now to eliminate starting friction." },
  ],
  meal_grocery: [
    { theme: "Pantry Foundation", prompt: "Audit existing dry goods and produce before committing to protein prep." },
    { theme: "Batch Leverage", prompt: "Roast a double portion of vegetables tonight for fast midday grain bowls." },
    { theme: "Zero-Waste Focus", prompt: "Incorporate perishable greens and herbs into today's meal before restocking." },
    { theme: "Budget Optimization", prompt: "Swap one premium dinner element with a seasoned legume or whole grain base." },
  ],
  habit_matrix: [
    { theme: "Trigger Anchor", prompt: "Anchor your most challenging habit directly behind your first morning beverage." },
    { theme: "Friction Removal", prompt: "Position your tools, gear, or reading material visible the night before." },
    { theme: "Identity Shift", prompt: "Consistency compounds faster than intensity. Complete the bare minimum rep." },
    { theme: "Weekly Calibration", prompt: "Rate your execution consistency across primary routines from 1 to 5." },
  ]
};

export async function generatePlannerDocx({ plannerType, plannerDays, customNiche, trimSize, gutter, outsideMargin, topBottomMargin, apiKey }) {
  let dailyInfill = [];

  if (apiKey && customNiche?.trim()) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate 10 daily themes and actionable prompts for a planner about: "${customNiche}". Return ONLY a JSON array like: [{"theme":"Title","prompt":"Action text"}]` }] }]
        })
      });
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      dailyInfill = JSON.parse(cleanJson);
    } catch (e) {
      console.warn("AI prompt fetch failed, using seed bank", e);
    }
  }

  if (!dailyInfill || dailyInfill.length === 0) {
    dailyInfill = SEED_PROMPTS[plannerType] || SEED_PROMPTS.daily_focus;
  }

  const trimDimensions = {
    '6x9': { width: 6 * 1440, height: 9 * 1440 },
    '5.5x8.5': { width: 5.5 * 1440, height: 8.5 * 1440 },
    '8.5x11': { width: 8.5 * 1440, height: 11 * 1440 },
    '5x8': { width: 5 * 1440, height: 8 * 1440 },
  };

  const selectedTrim = trimDimensions[trimSize] || trimDimensions['6x9'];
  const children = [];

  // Title sheet
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: customNiche?.trim() ? `${customNiche.toUpperCase()} PLANNER` :
                plannerType === 'daily_focus' ? 'DAILY FOCUS JOURNAL' :
                plannerType === 'meal_grocery' ? 'MEAL & KITCHEN COMMAND' : 'HABIT MATRIX LOG',
          font: 'Georgia',
          size: 32,
          bold: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 2600, after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'This Master Journal Belongs To: __________________________', font: 'Georgia', size: 20 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // Interior loop
  for (let day = 1; day <= plannerDays; day++) {
    const item = dailyInfill[(day - 1) % dailyInfill.length];

    if (plannerType === 'daily_focus') {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `DAY ${day}: ${item.theme.toUpperCase()}`, font: 'Georgia', size: 22, bold: true }),
            new TextRun({ text: '   •   Date: ______________', font: 'Georgia', size: 16 }),
          ],
          spacing: { after: 180 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Focus: "${item.prompt}"`, font: 'Georgia', size: 18, italics: true })],
          spacing: { after: 220 },
        }),
        new Paragraph({ children: [new TextRun({ text: 'CORE PRIORITIES', font: 'Georgia', size: 16, bold: true })], spacing: { before: 140, after: 100 } }),
        new Paragraph({ children: [new TextRun({ text: '1. [  ]  _________________________________________________', font: 'Georgia', size: 18 })], spacing: { after: 120 } }),
        new Paragraph({ children: [new TextRun({ text: '2. [  ]  _________________________________________________', font: 'Georgia', size: 18 })], spacing: { after: 120 } }),
        new Paragraph({ children: [new TextRun({ text: '3. [  ]  _________________________________________________', font: 'Georgia', size: 18 })], spacing: { after: 240 } }),
        new Paragraph({ children: [new TextRun({ text: 'TIME BLOCKS', font: 'Georgia', size: 16, bold: true })], spacing: { after: 100 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: ['06:00 - 09:00', '09:00 - 12:00', '12:00 - 15:00', '15:00 - 18:00', 'Evening'].map(slot => (
            new TableRow({
              children: [
                new TableCell({ width: { size: 32, type: WidthType.PERCENTAGE }, children: [new Paragraph(slot)] }),
                new TableCell({ width: { size: 68, type: WidthType.PERCENTAGE }, children: [new Paragraph('')] }),
              ]
            })
          ))
        }),
        new Paragraph({ children: [new TextRun({ text: 'DAILY AUDIT & NOTES', font: 'Georgia', size: 16, bold: true })], spacing: { before: 240, after: 80 } }),
        new Paragraph({ children: [new TextRun({ text: '____________________________________________________________________', font: 'Georgia', size: 16 })], spacing: { after: 70 } }),
        new Paragraph({ children: [new TextRun({ text: '____________________________________________________________________', font: 'Georgia', size: 16 })] })
      );
    } else if (plannerType === 'meal_grocery') {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `WEEK ${day}: ${item.theme.toUpperCase()}`, font: 'Georgia', size: 22, bold: true })],
          spacing: { after: 140 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Prep Tip: "${item.prompt}"`, font: 'Georgia', size: 18, italics: true })],
          spacing: { after: 180 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
            new TableRow({
              children: [
                new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph(d)] }),
                new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [new Paragraph('Lunch: ')] }),
                new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, children: [new Paragraph('Dinner: ')] }),
              ]
            })
          ))
        }),
        new Paragraph({ children: [new TextRun({ text: 'GROCERY & PANTRY RESTOCK', font: 'Georgia', size: 16, bold: true })], spacing: { before: 240, after: 80 } }),
        new Paragraph({ children: [new TextRun({ text: '[  ]  ____________________________       [  ]  ____________________________', font: 'Georgia', size: 16 })], spacing: { after: 80 } }),
        new Paragraph({ children: [new TextRun({ text: '[  ]  ____________________________       [  ]  ____________________________', font: 'Georgia', size: 16 })] })
      );
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `CYCLE ${day}: ${item.theme.toUpperCase()}`, font: 'Georgia', size: 22, bold: true })],
          spacing: { after: 140 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Rule: "${item.prompt}"`, font: 'Georgia', size: 18, italics: true })],
          spacing: { after: 180 },
        }),
        new Paragraph({ children: [new TextRun({ text: 'Daily Habit Routine       M  T  W  T  F  S  S   Verdict', font: 'Courier New', size: 16, bold: true })], spacing: { after: 120 } }),
        ...[1, 2, 3, 4, 5].map(idx => (
          new Paragraph({ children: [new TextRun({ text: `${idx}. ___________________ [ ][ ][ ][ ][ ][ ][ ]   _____`, font: 'Courier New', size: 16 })], spacing: { after: 110 } })
        )),
        new Paragraph({ children: [new TextRun({ text: 'PERFORMANCE OBSERVATIONS', font: 'Georgia', size: 16, bold: true })], spacing: { before: 220, after: 80 } }),
        new Paragraph({ children: [new TextRun({ text: '____________________________________________________________________', font: 'Georgia', size: 16 })] })
      );
    }

    if (day < plannerDays) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

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
      children: children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${plannerType}_${plannerDays}Pages_${trimSize}_POD.docx`);
     }
        
