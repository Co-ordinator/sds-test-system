'use strict';

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const reportService = require('../services/report.service');
const logger = require('../utils/logger');

const LOGO_PATH = path.join(__dirname, '../../../frontend/public/siyinqaba.png');

/* ── Colours — neutral formal palette ───────────────────────────────── */
const NAVY    = '#2D8BC4';
const STRIPE  = '#f7f9fc';
const BORDER  = '#d1d5db';
const TEXT    = '#111827';
const MUTED   = '#6b7280';
const WHITE   = '#ffffff';
const BAR_TRK = '#e5e7eb';

/* ── Report-type registry ────────────────────────────────────────────────── */
const REPORT_TYPES = {
  executive_summary:      { label: 'Executive Summary Report',         fetchData: (s, f) => s.getExecutiveSummary(f) },
  regional:               { label: 'Regional Distribution Report',     fetchData: (s, f) => s.getRegionalReport(f) },
  gender_demographics:    { label: 'Gender & Demographics Report',     fetchData: (s, f) => s.getGenderReport(f) },
  career_intelligence:    { label: 'Career Intelligence Report',       fetchData: (s, f) => s.getCareerIntelligenceReport(f) },
  institution_performance:{ label: 'Institution Performance Report',   fetchData: (s, f) => s.getInstitutionReport(f) },
  assessment_trends:      { label: 'Assessment Trends Report',         fetchData: (s, f) => s.getTrendsReport(f) },
};

const REGION_LABELS   = { hhohho:'Hhohho', manzini:'Manzini', lubombo:'Lubombo', shiselweni:'Shiselweni' };
const GENDER_LABELS   = { male:'Male', female:'Female', other:'Other', prefer_not_to_say:'Prefer not to say' };
const USER_TYPE_LABELS = {
  'High School Student':'High School', 'University Student':'University',
  Professional:'Professional', 'Test Administrator':'Test Admin', 'System Administrator':'Sys Admin',
};

/* ── PDF layout constants ────────────────────────────────────────────────── */
const PW = 595, PH = 842, LM = 45, RM = 45, CW = PW - LM - RM;
const CONTENT_BOTTOM = PH - 55;

const fmtNum   = n => Number(n || 0).toLocaleString();
const capFirst = s => s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '—';

/* drawPageHeader ──────────────────────────────────────────────────────── */
function drawPageHeader(doc, reportLabel, dateStr, preparedBy, filterSummary) {
  doc.rect(0, 0, PW, PH).fill(WHITE);
  doc.font('Helvetica-Bold').fontSize(18).fillColor(TEXT);
  doc.text('GOVERNMENT', LM + 10, 28);
  doc.text('OF   ESWATINI', LM, 28, { width: CW - 10, align: 'right' });

  if (fs.existsSync(LOGO_PATH)) {
    try {
      doc.image(LOGO_PATH, (PW - 72) / 2, 18, { width: 72 });
    } catch (_) {}
  }

  doc.font('Helvetica-Bold').fontSize(8).fillColor(TEXT);
  doc.text('Tel:  +268 4041971/2/3', LM, 74);
  doc.text('Fax: +268 4049889', LM, 86);
  doc.text('Email: mkhaliphi@gov.sz', LM, 98);

  doc.text('Principal Secretary\'s Office', LM, 74, { width: CW, align: 'right' });
  doc.font('Helvetica').fontSize(8);
  doc.text('Ministry of Labour & Social Security', LM, 86, { width: CW, align: 'right' });
  doc.text('P.O. Box 198, Mbabane H100', LM, 98, { width: CW, align: 'right' });

  doc.moveTo(LM, 116).lineTo(PW - RM, 116).strokeColor('#000000').lineWidth(0.7).stroke();
  doc.font('Helvetica-Bold').fontSize(12).fillColor(TEXT)
    .text(reportLabel.toUpperCase(), LM, 128, { width: CW, align: 'center' });
  doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
    .text(`Generated: ${dateStr}  ·  Prepared by: ${preparedBy}`, LM, 144, { width: CW, align: 'center' });

  doc.rect(LM, 160, CW, 24).lineWidth(0.5).strokeColor(BORDER).stroke();
  doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(6.5)
    .text('ACTIVE FILTERS', LM + 8, 168, { width: 70 });
  doc.fillColor(TEXT).font('Helvetica').fontSize(6.5)
    .text(filterSummary, LM + 80, 168, { width: CW - 88, ellipsis: true });

  doc.moveTo(LM, 192).lineTo(PW - RM, 192).strokeColor(BORDER).lineWidth(0.6).stroke();
  return 206;
}

/* drawContinuationHeader ──────────────────────────────────────────── */
function drawContinuationHeader(doc, reportLabel) {
  doc.rect(0, 0, PW, 42).fill(WHITE);
  doc.moveTo(LM, 18).lineTo(PW - RM, 18).strokeColor('#000000').lineWidth(0.6).stroke();
  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(8)
    .text(reportLabel.toUpperCase(), LM, 24, { width: Math.round(CW * 0.65) });
  doc.fillColor(MUTED).font('Helvetica').fontSize(6.5)
    .text('Ministry of Labour & Social Security · Kingdom of Eswatini', LM, 24, { width: CW, align: 'right' });
  return 54;
}

/* checkPage ────────────────────────────────────────────────────────── */
function checkPage(doc, y, needed, reportLabel) {
  if (y + needed > CONTENT_BOTTOM) {
    doc.addPage();
    return drawContinuationHeader(doc, reportLabel);
  }
  return y;
}

/* sectionHead — navy left accent bar ──────────────────────────────── */
function sectionHead(doc, y, title, reportLabel) {
  y = checkPage(doc, y, 26, reportLabel);
  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9)
    .text(title, LM, y + 4, { width: CW });
  doc.moveTo(LM, y + 18).lineTo(PW - RM, y + 18).strokeColor(BORDER).lineWidth(0.6).stroke();
  return y + 26;
}

/* tableRow — supports per-cell bg colours ──────────────────────────── */
function tableRow(doc, y, colWidths, values, opts = {}) {
  const { isHeader = false, shade = false, bold = false, cellColors = [] } = opts;
  const ROW_H = 18;
  const bg = isHeader ? WHITE : (shade ? STRIPE : WHITE);
  doc.rect(LM, y, CW, ROW_H).fill(bg);
  let x = LM;
  colWidths.forEach((w, i) => {
    const val = values[i] !== undefined && values[i] !== null ? String(values[i]) : '—';
    if (cellColors[i]) {
      doc.rect(x + 1, y + 1, w - 2, ROW_H - 2).fill(cellColors[i]);
    }
    doc.rect(x, y, w, ROW_H).lineWidth(0.35).strokeColor(BORDER).stroke();
    const fc = isHeader ? TEXT : (cellColors[i] ? WHITE : TEXT);
    doc.fillColor(fc).font(isHeader || bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5)
      .text(val, x + 5, y + 5, { width: w - 10, ellipsis: true, align: 'left' });
    x += w;
  });
  return y + ROW_H;
}

/* statCard — accent-colour top bar + large value ────────────────────── */
function statCard(doc, x, y, w, h, label, value, sub, accentColor) {
  doc.rect(x, y, w, h).fill(WHITE);
  doc.rect(x, y, w, h).lineWidth(0.45).strokeColor(BORDER).stroke();
  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(21)
    .text(String(value), x + 4, y + 11, { width: w - 8, align: 'center' });
  doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(6.5)
    .text(label.toUpperCase(), x + 4, y + h - 26, { width: w - 8, align: 'center' });
  if (sub) {
    doc.fillColor(MUTED).font('Helvetica').fontSize(6.5)
      .text(sub, x + 4, y + h - 14, { width: w - 8, align: 'center' });
  }
}

/* drawHBar — horizontal progress bar with track ────────────────────── */
function drawHBar(doc, x, y, w, h, value, max, barColor) {
  const fill = max > 0 ? Math.min(Math.round((value / max) * w), w) : 0;
  doc.rect(x, y, w, h).fill(BAR_TRK);
  if (fill > 0) doc.rect(x, y, fill, h).fill(barColor || NAVY);
}

/* drawPieChart — SVG-path pie + right-side legend ──────────────────── */
const PIE_PAL = ['#F44336', '#FFEB3B', '#7FBEEB', '#457b9d', '#2d6a4f', '#6d6875'];
function drawPieChart(doc, x, y, r, data, labelFn) {
  const total = data.reduce((s, d) => s + Number(d.value), 0) || 1;
  const cx = x + r, cy = y + r;
  let cumAngle = -Math.PI / 2;
  data.forEach((d, i) => {
    const sa = (Number(d.value) / total) * 2 * Math.PI;
    if (sa < 0.001) return;
    const ea = cumAngle + sa;
    const color = PIE_PAL[i % PIE_PAL.length];
    if (sa >= 2 * Math.PI - 0.001) {
      doc.circle(cx, cy, r).fill(color);
    } else {
      const x1 = cx + r * Math.cos(cumAngle), y1 = cy + r * Math.sin(cumAngle);
      const x2 = cx + r * Math.cos(ea),       y2 = cy + r * Math.sin(ea);
      doc.path(`M${cx},${cy} L${x1},${y1} A${r},${r},0,${sa > Math.PI ? 1 : 0},1,${x2},${y2} Z`)
        .fillColor(color).fill();
    }
    const ex = cx + r * Math.cos(ea), ey = cy + r * Math.sin(ea);
    doc.moveTo(cx, cy).lineTo(ex, ey).strokeColor('#ffffff').lineWidth(0.8).stroke();
    cumAngle = ea;
  });
  const legendX = x + r * 2 + 14, LH = 14;
  data.forEach((d, i) => {
    const color = PIE_PAL[i % PIE_PAL.length];
    const pct = Math.round((Number(d.value) / total) * 100);
    const ly = y + i * LH;
    doc.rect(legendX, ly + 3, 8, 8).fill(color);
    const lbl = labelFn ? labelFn(d) : (d.label || '—');
    doc.fillColor(TEXT).font('Helvetica').fontSize(7.5)
      .text(lbl, legendX + 12, ly + 3, { width: 155, ellipsis: true });
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(7.5)
      .text(`${fmtNum(d.value)}  (${pct}%)`, legendX + 170, ly + 3, { width: 85, align: 'right' });
  });
  return y + Math.max(r * 2, data.length * LH) + 10;
}

/* drawPieChartCol — pie centred in column, legend below (for side-by-side) */
function drawPieChartCol(doc, colX, y, colW, r, title, data) {
  const total = data.reduce((s, d) => s + Number(d.value), 0) || 1;
  const cx = colX + Math.floor(colW / 2), cy = y + r;
  let cumAngle = -Math.PI / 2;
  data.forEach((d, i) => {
    const sa = (Number(d.value) / total) * 2 * Math.PI;
    if (sa < 0.001) return;
    const ea = cumAngle + sa;
    const color = PIE_PAL[i % PIE_PAL.length];
    if (sa >= 2 * Math.PI - 0.001) {
      doc.circle(cx, cy, r).fill(color);
    } else {
      const x1 = cx + r * Math.cos(cumAngle), y1 = cy + r * Math.sin(cumAngle);
      const x2 = cx + r * Math.cos(ea),       y2 = cy + r * Math.sin(ea);
      doc.path(`M${cx},${cy} L${x1},${y1} A${r},${r},0,${sa > Math.PI ? 1 : 0},1,${x2},${y2} Z`)
        .fillColor(color).fill();
    }
    const ex = cx + r * Math.cos(ea), ey = cy + r * Math.sin(ea);
    doc.moveTo(cx, cy).lineTo(ex, ey).strokeColor('#ffffff').lineWidth(0.8).stroke();
    cumAngle = ea;
  });
  if (title) {
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(6.5)
      .text(title.toUpperCase(), colX, y - 12, { width: colW, align: 'center' });
  }
  const LH = 13, legendY = y + r * 2 + 6;
  data.forEach((d, i) => {
    const color = PIE_PAL[i % PIE_PAL.length];
    const pct = Math.round((Number(d.value) / total) * 100);
    const ly = legendY + i * LH;
    doc.rect(colX + 2, ly + 2, 7, 7).fill(color);
    doc.fillColor(TEXT).font('Helvetica').fontSize(6.5)
      .text(`${d.label || '—'}`, colX + 12, ly + 2, { width: colW - 46, ellipsis: true });
    doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(6.5)
      .text(`${pct}%`, colX + colW - 32, ly + 2, { width: 30, align: 'right' });
  });
  return legendY + data.length * LH;
}

/* rateGrade — A/B/C/D grade based on completion rate ─────────────────── */
function rateGrade(rate) {
  if (rate >= 80) return { grade: 'A' };
  if (rate >= 60) return { grade: 'B' };
  if (rate >= 40) return { grade: 'C' };
  return              { grade: 'D' };
}

function drawGradeBadge(doc, x, y, rate) {
  const { grade } = rateGrade(rate);
  doc.rect(x, y, 16, 16).lineWidth(0.35).strokeColor(BORDER).stroke();
  doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9)
    .text(grade, x, y + 4, { width: 16, align: 'center' });
}

/* drawPageFooters ────────────────────────────────────────────────────── */
function drawPageFooters(doc, reportLabel) {
  return reportLabel;
}

/* ── Section renderers ───────────────────────────────────────────────────── */
function renderExecutiveSummary(doc, data, y, lbl) {
  /* ─ 4 KPI cards ─ */
  const rate = data.completionRate || 0;
  const CARD_H = 62, GAP = 8, CARD_W = Math.floor((CW - GAP * 3) / 4);
  statCard(doc, LM,                    y, CARD_W, CARD_H, 'Total Participants',     fmtNum(data.totalUsers),           null, null);
  statCard(doc, LM+(CARD_W+GAP),       y, CARD_W, CARD_H, 'Assessments Taken',      fmtNum(data.totalAssessments),     null, null);
  statCard(doc, LM+(CARD_W+GAP)*2,     y, CARD_W, CARD_H, 'Assessments Completed',  fmtNum(data.completedAssessments), null, null);
  statCard(doc, LM+(CARD_W+GAP)*3,     y, CARD_W, CARD_H, 'Completion Rate',         `${rate}%`,
    rate >= 70 ? 'On Target' : rate >= 40 ? 'Needs Attention' : 'Below Target', null);
  y += CARD_H + 18;

  /* ─ Holland Code bar chart ─ */
  y = sectionHead(doc, y, '1. Holland Code Distribution  (Top 10)', lbl);
  const HDESC = { R:'Realistic', I:'Investigative', A:'Artistic', S:'Social', E:'Enterprising', C:'Conventional' };
  const hMax  = Math.max(...(data.hollandDist || []).map(r => Number(r.count)), 1);
  const hC0 = Math.round(CW * 0.13), hC1 = Math.round(CW * 0.33), hC2 = Math.round(CW * 0.40), hC3 = CW - hC0 - hC1 - hC2;
  y = tableRow(doc, y, [hC0, hC1, hC2, hC3], ['Code', 'Personality Profile', 'Frequency', 'Count'], { isHeader: true });
  (data.hollandDist || []).forEach((row, idx) => {
    y = checkPage(doc, y, 20, lbl);
    const code = row.holland_code || '', cnt = Number(row.count);
    const desc = code.split('').map(c => HDESC[c] || c).join(' / ');
    const bg   = idx % 2 === 1 ? STRIPE : WHITE;
    doc.rect(LM, y, CW, 20).fill(bg).rect(LM, y, CW, 20).lineWidth(0.2).strokeColor(BORDER).stroke();
    drawHBar(doc, LM + hC0 + hC1 + 3, y + 5, hC2 - 6, 10, cnt, hMax, NAVY);
    doc.fillColor(TEXT).font('Helvetica').fontSize(7.5)
      .text(code, LM + 5, y + 6, { width: hC0 - 8 })
      .text(desc, LM + hC0 + 5, y + 6, { width: hC1 - 10, ellipsis: true })
      .text(fmtNum(cnt), LM + hC0 + hC1 + hC2 + 5, y + 6, { width: hC3 - 8 });
    y += 20;
  });
  y += 12;

  /* ─ Gender / Region / User Type — 3 pie charts side by side ─ */
  y = checkPage(doc, y + 6, 140, lbl);
  y = sectionHead(doc, y, '2–4. Participant Distribution', lbl);
  const COL_W = Math.floor(CW / 3);
  const gData  = (data.genderDist   || []).map(r => ({ label: GENDER_LABELS[r.gender]             || capFirst(r.gender),    value: Number(r.count) }));
  const rData  = (data.regionDist   || []).map(r => ({ label: REGION_LABELS[r.region]             || capFirst(r.region),    value: Number(r.count) }));
  const uData  = (data.userTypeDist || []).map(r => ({ label: USER_TYPE_LABELS[r.user_type] || r.user_type || '—', value: Number(r.count) }));
  const colEnd1 = drawPieChartCol(doc, LM,                y + 12, COL_W, 34, 'Gender',    gData);
  const colEnd2 = drawPieChartCol(doc, LM + COL_W,       y + 12, COL_W, 34, 'Region',    rData);
  const colEnd3 = drawPieChartCol(doc, LM + COL_W * 2,   y + 12, COL_W, 34, 'User Type', uData);
  return Math.max(colEnd1, colEnd2, colEnd3) + 10;
}

function renderRegional(doc, data, y, lbl) {
  const regions = data.regions || [];
  const t = data.totals || {};
  const totalRate = t.totalUsers > 0 ? Math.round((t.completedAssessments / t.totalUsers) * 100) : 0;

  /* ─ Regional participant share pie ─ */
  y = sectionHead(doc, y, 'Participant Share by Region', lbl);
  y = drawPieChart(doc, LM, y, 48,
    regions.map(r => ({ label: REGION_LABELS[r.region] || capFirst(r.region), value: Number(r.totalUsers) })));
  y += 8;

  /* ─ Scorecard table with grade badges + inline bars ─ */
  y = sectionHead(doc, y, 'Regional Performance Scorecard', lbl);
  const GW = 22, BARW = Math.round(CW * 0.22);
  const c0 = Math.round(CW * 0.17), c2 = Math.round(CW * 0.13), c3 = c2, c5 = Math.round(CW * 0.12);
  const c4 = CW - c0 - GW - c2 - c3 - BARW - c5;
  y = tableRow(doc, y, [c0, GW, c2, c3, BARW + c4, c5],
    ['Region', 'Grade', 'Participants', 'Completed', 'Completion Rate', 'Top Code'], { isHeader: true });
  regions.forEach((row, idx) => {
    y = checkPage(doc, y, 22, lbl);
    const rate = row.completionRate || 0;
    const { grade } = rateGrade(rate);
    const rowBg = idx % 2 === 1 ? STRIPE : WHITE;
    doc.rect(LM, y, CW, 22).fill(rowBg).rect(LM, y, CW, 22).lineWidth(0.2).strokeColor(BORDER).stroke();
    /* grade label */
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9).text(grade, LM + c0 + 3, y + 7, { width: GW - 6, align: 'center' });
    /* progress bar */
    const barX = LM + c0 + GW + c2 + c3 + 4;
    drawHBar(doc, barX, y + 6, BARW - 8, 10, rate, 100, NAVY);
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(7).text(`${rate}%`, barX + BARW, y + 7, { width: 28 });
    doc.fillColor(TEXT).font('Helvetica').fontSize(7.5)
      .text(REGION_LABELS[row.region] || capFirst(row.region), LM + 5, y + 7, { width: c0 - 8 })
      .text(fmtNum(row.totalUsers), LM + c0 + GW + 5, y + 7, { width: c2 - 8 })
      .text(fmtNum(row.completedAssessments), LM + c0 + GW + c2 + 5, y + 7, { width: c3 - 8 })
      .text(row.topCode || '—', LM + c0 + GW + c2 + c3 + BARW + c4 + 5, y + 7, { width: c5 - 8 });
    y += 22;
  });
  /* totals */
  y = checkPage(doc, y + 6, 22, lbl);
  const totLine = `NATIONAL TOTALS  —  ${fmtNum(t.totalUsers)} participants, ${fmtNum(t.completedAssessments)} completed  (${totalRate}% national rate)`;
  y = tableRow(doc, y, [CW], [totLine], { bold: true });
  return y;
}

function renderGender(doc, data, y, lbl) {
  const gBreak = data.genderBreakdown || [];

  /* ─ Gender distribution pie ─ */
  y = sectionHead(doc, y, '1. Gender Distribution', lbl);
  y = drawPieChart(doc, LM, y, 48,
    gBreak.map(g => ({ label: GENDER_LABELS[g.gender] || capFirst(g.gender), value: Number(g.totalUsers) })));
  y += 8;

  y = sectionHead(doc, y, '2. Participant Type by Gender', lbl);
  const d0 = Math.round(CW * 0.4), d1 = Math.round(CW * 0.3), d2 = CW - d0 - d1;
  y = tableRow(doc, y, [d0, d1, d2], ['User Type', 'Gender', 'Count'], { isHeader: true });
  (data.userTypeDist || []).forEach((row, idx) => {
    y = checkPage(doc, y, 18, lbl);
    y = tableRow(doc, y, [d0, d1, d2], [
      USER_TYPE_LABELS[row.user_type] || row.user_type || '—',
      GENDER_LABELS[row.gender] || capFirst(row.gender),
      fmtNum(row.count),
    ], { shade: idx % 2 === 1 });
  });
  y += 14;

  y = sectionHead(doc, y, '3. Regional Gender Distribution', lbl);
  y = tableRow(doc, y, [d0, d1, d2], ['Region', 'Gender', 'Count'], { isHeader: true });
  (data.regionGenderDist || []).forEach((row, idx) => {
    y = checkPage(doc, y, 18, lbl);
    y = tableRow(doc, y, [d0, d1, d2], [
      REGION_LABELS[row.region] || capFirst(row.region),
      GENDER_LABELS[row.gender] || capFirst(row.gender),
      fmtNum(row.count),
    ], { shade: idx % 2 === 1 });
  });
  return y;
}

function renderCareerIntelligence(doc, data, y, lbl) {
  /* ─ RIASEC visual bar chart ─ */
  y = sectionHead(doc, y, '1. RIASEC Dimension Averages', lbl);
  const ri = data.riasecAverages || {};
  const riasec = [
    { key:'R', label:'Realistic',     val: parseFloat(ri.avgR || 0) },
    { key:'I', label:'Investigative', val: parseFloat(ri.avgI || 0) },
    { key:'A', label:'Artistic',      val: parseFloat(ri.avgA || 0) },
    { key:'S', label:'Social',        val: parseFloat(ri.avgS || 0) },
    { key:'E', label:'Enterprising',  val: parseFloat(ri.avgE || 0) },
    { key:'C', label:'Conventional',  val: parseFloat(ri.avgC || 0) },
  ];
  const rMax = Math.max(...riasec.map(r => r.val), 1);
  riasec.forEach(r => {
    y = checkPage(doc, y, 26, lbl);
    const barW = Math.round(CW * 0.62), labelW = Math.round(CW * 0.28);
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(8.5)
      .text(`${r.key}  ${r.label}`, LM, y + 8, { width: labelW });
    drawHBar(doc, LM + labelW + 6, y + 5, barW, 14, r.val, rMax, NAVY);
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9)
      .text(r.val.toFixed(1), LM + labelW + 6 + barW + 6, y + 7, { width: 36 });
    y += 26;
  });
  y += 10;

  /* ─ Holland Code frequency bar chart ─ */
  y = sectionHead(doc, y, '2. Holland Code Frequency  (Top 15)', lbl);
  const HFULL = { R:'Realistic', I:'Investigative', A:'Artistic', S:'Social', E:'Enterprising', C:'Conventional' };
  const hMax2 = Math.max(...(data.hollandDist || []).map(r => Number(r.count)), 1);
  const hD0 = Math.round(CW * 0.13), hD1 = Math.round(CW * 0.33), hD2 = Math.round(CW * 0.40), hD3 = CW - hD0 - hD1 - hD2;
  y = tableRow(doc, y, [hD0, hD1, hD2, hD3], ['Code', 'Personality Profile', 'Frequency', 'Count'], { isHeader: true });
  (data.hollandDist || []).forEach((row, idx) => {
    y = checkPage(doc, y, 20, lbl);
    const code = row.holland_code || '', cnt = Number(row.count);
    const desc = code.split('').map(c => HFULL[c] || c).join(' / ');
    const bg   = idx % 2 === 1 ? STRIPE : WHITE;
    doc.rect(LM, y, CW, 20).fill(bg).rect(LM, y, CW, 20).lineWidth(0.2).strokeColor(BORDER).stroke();
    drawHBar(doc, LM + hD0 + hD1 + 3, y + 5, hD2 - 6, 10, cnt, hMax2, NAVY);
    doc.fillColor(TEXT).font('Helvetica').fontSize(7.5)
      .text(code, LM + 5, y + 6, { width: hD0 - 8 })
      .text(desc, LM + hD0 + 5, y + 6, { width: hD1 - 10, ellipsis: true })
      .text(fmtNum(cnt), LM + hD0 + hD1 + hD2 + 5, y + 6, { width: hD3 - 8 });
    y += 20;
  });
  y += 14;

  /* ─ Top Occupations ─ */
  y = sectionHead(doc, y, '3. Top Occupations in System', lbl);
  const oC0 = Math.round(CW * 0.7), oC1 = CW - oC0;
  y = tableRow(doc, y, [oC0, oC1], ['Occupation Name', 'Holland Code'], { isHeader: true });
  (data.topOccupations || []).forEach((occ, idx) => {
    y = checkPage(doc, y, 18, lbl);
    y = tableRow(doc, y, [oC0, oC1], [occ.name, occ.code || '—'], { shade: idx % 2 === 1 });
  });
  return y;
}

function renderInstitutions(doc, data, y, lbl) {
  y = sectionHead(doc, y, 'Institution Performance Ranking  (by Completion Rate)', lbl);
  const GW = 22, BARW = Math.round(CW * 0.18);
  const i0 = Math.round(CW * 0.28), i2 = Math.round(CW * 0.11), i3 = Math.round(CW * 0.11), i4 = Math.round(CW * 0.09);
  const i5 = CW - i0 - GW - i2 - i3 - i4 - BARW;
  y = tableRow(doc, y, [i0, GW, i2, i3, i4, BARW + i5],
    ['Institution', ' ', 'Type', 'Participants', 'Completed', 'Completion Rate'], { isHeader: true });
  (data.institutions || []).forEach((row, idx) => {
    y = checkPage(doc, y, 22, lbl);
    const rate = row.completionRate || 0;
    const { grade } = rateGrade(rate);
    const rowBg = idx % 2 === 1 ? STRIPE : WHITE;
    doc.rect(LM, y, CW, 22).fill(rowBg).rect(LM, y, CW, 22).lineWidth(0.2).strokeColor(BORDER).stroke();
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(9).text(grade, LM + i0 + 3, y + 7, { width: GW - 6, align: 'center' });
    const barX = LM + i0 + GW + i2 + i3 + i4 + 4;
    drawHBar(doc, barX, y + 6, BARW - 8, 10, rate, 100, NAVY);
    doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(7).text(`${rate}%`, barX + BARW, y + 7, { width: 28 });
    doc.fillColor(TEXT).font('Helvetica').fontSize(7.5)
      .text(row.name || '—', LM + 5, y + 7, { width: i0 - 8, ellipsis: true })
      .text(capFirst(row.type) || '—', LM + i0 + GW + 5, y + 7, { width: i2 - 8 })
      .text(fmtNum(row.totalStudents), LM + i0 + GW + i2 + 5, y + 7, { width: i3 - 8 })
      .text(fmtNum(row.completedAssessments), LM + i0 + GW + i2 + i3 + 5, y + 7, { width: i4 - 8 });
    y += 22;
  });
  return y;
}

function renderTrends(doc, data, y, lbl) {
  /* ─ KPI cards ─ */
  const CARD_H = 62, GAP = 12, CARD_W = Math.floor((CW - GAP) / 2);
  statCard(doc, LM,              y, CARD_W, CARD_H, 'Total Completions (Period)',   fmtNum(data.totalCompleted),     null, null);
  statCard(doc, LM+CARD_W+GAP,  y, CARD_W, CARD_H, 'New Registrations (Period)',   fmtNum(data.totalRegistrations), null, null);
  y += CARD_H + 18;

  /* ─ Monthly trend table with mini visual bars ─ */
  y = sectionHead(doc, y, 'Month-by-Month Assessment Activity', lbl);
  const maxComp = Math.max(...(data.trendData || []).map(r => Number(r.completed || 0)), 1);
  const maxReg  = Math.max(...(data.trendData || []).map(r => Number(r.registrations || 0)), 1);
  const t0 = Math.round(CW * 0.18), t1 = Math.round(CW * 0.12), MBAW = Math.round(CW * 0.24);
  const t3 = Math.round(CW * 0.12), MBBW = Math.round(CW * 0.22), t5 = CW - t0 - t1 - MBAW - t3 - MBBW;
  y = tableRow(doc, y, [t0, t1, MBAW, t3, MBBW, t5],
    ['Month', 'Completed', 'Visual', 'Registrations', 'Visual', 'Notes'], { isHeader: true });
  (data.trendData || []).forEach((row, idx) => {
    y = checkPage(doc, y, 22, lbl);
    const comp = Number(row.completed || 0), reg = Number(row.registrations || 0);
    const bg = idx % 2 === 1 ? STRIPE : WHITE;
    doc.rect(LM, y, CW, 22).fill(bg).rect(LM, y, CW, 22).lineWidth(0.2).strokeColor(BORDER).stroke();
    drawHBar(doc, LM + t0 + t1 + 3, y + 6, MBAW - 6, 10, comp, maxComp, NAVY);
    drawHBar(doc, LM + t0 + t1 + MBAW + t3 + 3, y + 6, MBBW - 6, 10, reg, maxReg, NAVY);
    doc.fillColor(TEXT).font('Helvetica').fontSize(7.5)
      .text(row.month || '—', LM + 5, y + 7, { width: t0 - 8 })
      .text(fmtNum(comp), LM + t0 + 5, y + 7, { width: t1 - 8 })
      .text(fmtNum(reg),  LM + t0 + t1 + MBAW + 5, y + 7, { width: t3 - 8 });
    y += 22;
  });
  return y;
}

/* ── Controller ──────────────────────────────────────────────────────────── */
module.exports.getReportTypes = (req, res) => {
  const types = Object.entries(REPORT_TYPES).map(([key, val]) => ({
    key,
    label: val.label,
  }));
  res.json({ status: 'success', data: { reportTypes: types } });
};

module.exports.previewReport = async (req, res, next) => {
  try {
    const { type } = req.params;
    const config = REPORT_TYPES[type];
    if (!config) return res.status(400).json({ status: 'error', message: `Unknown report type: ${type}` });

    const filters = {
      institutionId: req.query.institutionId || '',
      region:        req.query.region        || '',
      userType:      req.query.userType      || '',
      gender:        req.query.gender        || '',
      startDate:     req.query.startDate     || '',
      endDate:       req.query.endDate       || '',
    };

    const data = await config.fetchData(reportService, filters);
    res.json({ status: 'success', data });
  } catch (err) {
    logger.error({ actionType: 'REPORT_PREVIEW_FAILED', message: err.message, req });
    next(err);
  }
};

module.exports.generateReport = async (req, res, next) => {
  try {
    const filters = req.body.filters || {};

    /* Backward compat: accept single `type` or `sections` array */
    let sections = req.body.sections;
    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      const fallback = req.body.type || req.query.type || 'executive_summary';
      sections = [fallback];
    }
    const validSections = sections.filter(s => REPORT_TYPES[s]);
    if (validSections.length === 0) return res.status(400).json({ status: 'error', message: 'No valid report sections specified' });

    /* Dynamic report title based on filters */
    let reportLabel = 'National Report';
    if (filters.institutionId) reportLabel = 'Institutional Report';
    else if (filters.region) reportLabel = `Regional Report: ${REGION_LABELS[filters.region] || capFirst(filters.region)}`;

    /* Fetch data for all requested sections in parallel */
    const sectionData = {};
    await Promise.all(validSections.map(async (s) => {
      sectionData[s] = await REPORT_TYPES[s].fetchData(reportService, filters);
    }));

    const dateStr = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
    const preparedBy = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Administrator' : 'System';

    const filterParts = [];
    if (filters.region)        filterParts.push(`Region: ${REGION_LABELS[filters.region] || filters.region}`);
    if (filters.institutionId) filterParts.push('Institution: Selected');
    if (filters.userType)      filterParts.push(`User Type: ${filters.userType}`);
    if (filters.gender)        filterParts.push(`Gender: ${filters.gender}`);
    if (filters.startDate)     filterParts.push(`From: ${filters.startDate}`);
    if (filters.endDate)       filterParts.push(`To: ${filters.endDate}`);
    const filterSummary = filterParts.length > 0 ? filterParts.join('  |  ') : 'No filters applied — showing all data';

    const filename = `report_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ size: 'A4', margins: { top: 0, bottom: 0, left: 0, right: 0 }, bufferPages: true });
    doc.pipe(res);

    let y = drawPageHeader(doc, reportLabel, dateStr, preparedBy, filterSummary);

    const RENDER_MAP = {
      executive_summary:       renderExecutiveSummary,
      regional:                renderRegional,
      gender_demographics:     renderGender,
      career_intelligence:     renderCareerIntelligence,
      institution_performance: renderInstitutions,
      assessment_trends:       renderTrends,
    };

    for (const s of validSections) {
      const data = sectionData[s];
      const renderFn = RENDER_MAP[s];
      if (!data || !renderFn) continue;

      /* Section divider between sections */
      if (s !== validSections[0]) {
        y = checkPage(doc, y + 8, 30, reportLabel);
        doc.moveTo(LM, y).lineTo(PW - RM, y).strokeColor(BORDER).lineWidth(0.5).stroke();
        y += 12;
      }

      /* Section heading */
      y = checkPage(doc, y, 40, reportLabel);
      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9)
        .text(REPORT_TYPES[s].label.toUpperCase(), LM, y, { width: CW });
      y += 16;

      y = renderFn(doc, data, y, reportLabel);
    }

    /* Narrative disclaimer */
    y = checkPage(doc, y + 16, 50, reportLabel);
    doc.rect(LM, y, CW, 36).fill(WHITE).lineWidth(0.35).strokeColor(BORDER).stroke();
    doc.fillColor(MUTED).font('Helvetica').fontSize(7)
      .text(
        'This report has been prepared by the Ministry of Labour and Social Security, Kingdom of Eswatini, using data from the ' +
        'National Career Guidance System. The information is intended for official government use only and may not be distributed ' +
        'without written authorisation from the Ministry.',
        LM + 8, y + 6, { width: CW - 16 }
      );

    drawPageFooters(doc, reportLabel);
    doc.end();

    logger.info({ actionType: 'REPORT_GENERATED', message: `${validSections.join(',')} report generated by ${preparedBy}`, req, details: { sections: validSections, filters } });
  } catch (err) {
    logger.error({ actionType: 'REPORT_GENERATION_FAILED', message: err.message, req });
    next(err);
  }
};
