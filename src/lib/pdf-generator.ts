/**
 * Client-side PDF generator using jsPDF.
 * Runs entirely in the browser — no server needed.
 * This is 100% Vercel-compatible since no PDF library runs on the server.
 */
import { jsPDF } from 'jspdf';
import type { ResumeData } from './resume-types';

function safeStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

export function generateResumePDF(data: ResumeData): void {
  const { personalInfo, summary, certifications, skills, experience, education, projects } = data;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 55;
  const marginRight = 55;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 50;

  function checkPageBreak(needed: number = 30): boolean {
    if (y + needed > pageHeight - 50) {
      doc.addPage();
      y = 50;
      return true;
    }
    return false;
  }

  function drawSectionHeader(title: string): void {
    checkPageBreak(30);
    y += 8;
    doc.setDrawColor(0);
    doc.setLineWidth(1);
    doc.line(marginLeft, y, pageWidth - marginRight, y);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(title.toUpperCase(), marginLeft, y);
    y += 6;
  }

  function drawBullet(text: string): void {
    checkPageBreak(18);
    const bulletX = marginLeft + 8;
    const textX = marginLeft + 18;
    const maxTextWidth = contentWidth - 18;

    doc.setFillColor(0, 0, 0);
    doc.circle(bulletX, y - 2, 2.5, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);

    const lines = doc.splitTextToSize(text, maxTextWidth);
    doc.text(lines, textX, y);
    y += lines.length * 13;
  }

  // ─── Name ────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  const nameText = personalInfo.fullName || 'Your Name';
  const nameWidth = doc.getTextWidth(nameText);
  doc.text(nameText, (pageWidth - nameWidth) / 2, y);
  y += 24;

  // ─── Job Title ───────────────────────────────────────────
  if (personalInfo.jobTitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);
    const titleWidth = doc.getTextWidth(personalInfo.jobTitle);
    doc.text(personalInfo.jobTitle, (pageWidth - titleWidth) / 2, y);
    y += 16;
  }

  // ─── Contact Info ────────────────────────────────────────
  const contactParts = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.linkedin,
  ].filter(s => s && s.trim());

  if (contactParts.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(68, 68, 68);
    const contactText = contactParts.join('  |  ');
    const contactWidth = doc.getTextWidth(contactText);
    doc.text(contactText, (pageWidth - contactWidth) / 2, y);
    y += 14;
  }

  // ─── Summary ─────────────────────────────────────────────
  const summaryText = safeStr(summary);
  if (summaryText.trim()) {
    drawSectionHeader('Summary');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);
    const summaryLines = doc.splitTextToSize(summaryText, contentWidth);
    doc.text(summaryLines, marginLeft, y);
    y += summaryLines.length * 13;
  }

  // ─── Certifications ──────────────────────────────────────
  const certArray = (certifications || []).map((c: unknown) => typeof c === 'string' ? c : String(c)).filter((c: string) => c.trim());
  if (certArray.length > 0) {
    drawSectionHeader('Certifications');
    certArray.forEach((cert: string) => drawBullet(cert));
  }

  // ─── Technical Skills ────────────────────────────────────
  const skillArray = (skills || []).filter((s: { category: string; skills: string }) => (s.category || '').trim() || (s.skills || '').trim());
  if (skillArray.length > 0) {
    drawSectionHeader('Technical Skills');
    skillArray.forEach((skill: { category: string; skills: string }) => {
      checkPageBreak(16);
      const bulletX = marginLeft + 8;
      const textX = marginLeft + 18;
      const maxTextWidth = contentWidth - 18;

      doc.setFillColor(0, 0, 0);
      doc.circle(bulletX, y - 2, 2.5, 'F');

      const label = skill.category ? `${skill.category}: ` : '';
      const skillText = skill.skills || '';

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const labelWidth = doc.getTextWidth(label);
      doc.text(label, textX, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 51, 51);
      const remainingWidth = maxTextWidth - labelWidth;
      const skillLines = doc.splitTextToSize(skillText, remainingWidth);
      doc.text(skillLines, textX + labelWidth, y);
      y += skillLines.length * 13;
    });
  }

  // ─── Professional Experience ─────────────────────────────
  const expArray = (experience || []).filter((e: { jobTitle: string; company: string }) => (e.jobTitle || '').trim() || (e.company || '').trim());
  if (expArray.length > 0) {
    drawSectionHeader('Professional Experience');
    expArray.forEach((exp: { jobTitle: string; company: string; startDate: string; endDate: string; location: string; bullets: string[] }) => {
      checkPageBreak(30);

      const leftText = `${exp.jobTitle || ''}${exp.company ? ', ' + exp.company : ''}`;
      const rightText = `${exp.startDate || ''}${exp.endDate ? ' \u2013 ' + exp.endDate : ''}${exp.location ? ' | ' + exp.location : ''}`;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(leftText, marginLeft, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(68, 68, 68);
      const rightWidth = doc.getTextWidth(rightText);
      doc.text(rightText, pageWidth - marginRight - rightWidth, y);
      y += 14;

      (exp.bullets || []).filter((b: string) => b.trim()).forEach((bullet: string) => drawBullet(bullet));
      y += 6;
    });
  }

  // ─── Education ───────────────────────────────────────────
  const eduArray = (education || []).filter((e: { degree: string; school: string }) => (e.degree || '').trim() || (e.school || '').trim());
  if (eduArray.length > 0) {
    drawSectionHeader('Education');
    eduArray.forEach((edu: { degree: string; startDate: string; endDate: string; school: string; location: string }) => {
      checkPageBreak(25);

      const leftText = edu.degree || '';
      const rightText = `${edu.startDate || ''}${edu.endDate ? ' \u2013 ' + edu.endDate : ''}`;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(leftText, marginLeft, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(68, 68, 68);
      const rightWidth = doc.getTextWidth(rightText);
      doc.text(rightText, pageWidth - marginRight - rightWidth, y);
      y += 14;

      const schoolText = `${edu.school || ''}${edu.location ? ', ' + edu.location : ''}`;
      if (schoolText) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(51, 51, 51);
        doc.text(schoolText, marginLeft, y);
        y += 14;
      }
      y += 6;
    });
  }

  // ─── Projects ────────────────────────────────────────────
  const projArray = (projects || []).filter((p: { title: string }) => (p.title || '').trim());
  if (projArray.length > 0) {
    drawSectionHeader('Projects');
    projArray.forEach((proj: { title: string; bullets: string[] }) => {
      checkPageBreak(25);

      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(proj.title, marginLeft, y);
      y += 14;

      (proj.bullets || []).filter((b: string) => b.trim()).forEach((bullet: string) => drawBullet(bullet));
      y += 6;
    });
  }

  // Save the PDF (triggers browser download)
  doc.save(`${(personalInfo.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.pdf`);
}
