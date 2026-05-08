import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import type { ResumeData } from '@/lib/resume-types';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildResumeHTML(data: ResumeData): string {
  const { personalInfo, summary, certifications, skills, experience, education, projects } = data;

  const contactParts = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.linkedin,
  ].filter(Boolean);

  let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: A4; margin: 40px 50px; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; line-height: 1.4; color: #000; }
  .name { font-size: 20pt; font-weight: bold; text-align: center; margin-bottom: 2px; }
  .title { font-size: 12pt; text-align: center; margin-bottom: 4px; color: #333; }
  .contact { font-size: 9pt; text-align: center; margin-bottom: 10px; color: #444; }
  .section-header { font-size: 11pt; font-weight: bold; text-transform: uppercase; border-bottom: 1.5px solid #000; padding-bottom: 2px; margin-top: 12px; margin-bottom: 6px; letter-spacing: 0.5px; }
  .summary { font-size: 10pt; margin-bottom: 4px; text-align: justify; }
  .bullet-list { list-style: none; padding-left: 0; margin: 0; }
  .bullet-item { font-size: 10pt; margin-bottom: 3px; padding-left: 14px; position: relative; text-align: justify; }
  .bullet-item::before { content: ""; position: absolute; left: 0; top: 6px; width: 5px; height: 5px; background-color: #000; border-radius: 50%; }
  .cert-item { font-size: 10pt; margin-bottom: 3px; padding-left: 14px; position: relative; }
  .cert-item::before { content: ""; position: absolute; left: 0; top: 6px; width: 5px; height: 5px; background-color: #000; border-radius: 50%; }
  .skill-category { font-size: 10pt; margin-bottom: 4px; padding-left: 14px; position: relative; }
  .skill-category .cat-name { font-weight: bold; }
  .skill-category::before { content: ""; position: absolute; left: 0; top: 6px; width: 5px; height: 5px; background-color: #000; border-radius: 50%; }
  .exp-entry { margin-bottom: 10px; }
  .exp-header { display: flex; justify-content: space-between; align-items: baseline; }
  .exp-job { font-weight: bold; font-size: 10pt; }
  .exp-date { font-size: 9pt; color: #444; }
  .edu-entry { margin-bottom: 6px; }
  .edu-header { display: flex; justify-content: space-between; align-items: baseline; }
  .edu-degree { font-weight: bold; font-size: 10pt; }
  .edu-date { font-size: 9pt; color: #444; }
  .edu-school { font-size: 10pt; }
  .proj-entry { margin-bottom: 8px; }
  .proj-title { font-weight: bold; font-size: 10pt; font-style: italic; }
</style>
</head>
<body>`;

  // Name
  html += `<div class="name">${escapeHtml(personalInfo.fullName || 'Your Name')}</div>`;

  // Job Title
  html += `<div class="title">${escapeHtml(personalInfo.jobTitle || '')}</div>`;

  // Contact
  if (contactParts.length > 0) {
    html += `<div class="contact">${contactParts.map(escapeHtml).join(' | ')}</div>`;
  }

  // Summary
  if (summary.trim()) {
    html += `<div class="section-header">Summary</div>`;
    html += `<div class="summary">${escapeHtml(summary)}</div>`;
  }

  // Certifications
  const safeCerts = certifications.map(c => typeof c === 'string' ? c : String(c));
  const filteredCerts = safeCerts.filter(c => c.trim());
  if (filteredCerts.length > 0) {
    html += `<div class="section-header">Certifications</div>`;
    filteredCerts.forEach(cert => {
      html += `<div class="cert-item">${escapeHtml(cert)}</div>`;
    });
  }

  // Technical Skills
  const filteredSkills = skills.filter(s => s.category.trim() || s.skills.trim());
  if (filteredSkills.length > 0) {
    html += `<div class="section-header">Technical Skills</div>`;
    filteredSkills.forEach(skill => {
      html += `<div class="skill-category"><span class="cat-name">${escapeHtml(skill.category)}</span>: ${escapeHtml(skill.skills)}</div>`;
    });
  }

  // Professional Experience
  const filteredExp = experience.filter(e => e.jobTitle.trim() || e.company.trim());
  if (filteredExp.length > 0) {
    html += `<div class="section-header">Professional Experience</div>`;
    filteredExp.forEach(exp => {
      html += `<div class="exp-entry">`;
      html += `<div class="exp-header"><span class="exp-job">${escapeHtml(exp.jobTitle)}${exp.company ? ', ' + escapeHtml(exp.company) : ''}</span><span class="exp-date">${escapeHtml(exp.startDate)}${exp.endDate ? ' – ' + escapeHtml(exp.endDate) : ''}${exp.location ? ' | ' + escapeHtml(exp.location) : ''}</span></div>`;
      exp.bullets.filter(b => b.trim()).forEach(bullet => {
        html += `<div class="bullet-item">${escapeHtml(bullet)}</div>`;
      });
      html += `</div>`;
    });
  }

  // Education
  const filteredEdu = education.filter(e => e.degree.trim() || e.school.trim());
  if (filteredEdu.length > 0) {
    html += `<div class="section-header">Education</div>`;
    filteredEdu.forEach(edu => {
      html += `<div class="edu-entry">`;
      html += `<div class="edu-header"><span class="edu-degree">${escapeHtml(edu.degree)}</span><span class="edu-date">${escapeHtml(edu.startDate)}${edu.endDate ? ' – ' + escapeHtml(edu.endDate) : ''}</span></div>`;
      html += `<div class="edu-school">${escapeHtml(edu.school)}${edu.location ? ', ' + escapeHtml(edu.location) : ''}</div>`;
      html += `</div>`;
    });
  }

  // Projects
  const filteredProj = projects.filter(p => p.title.trim());
  if (filteredProj.length > 0) {
    html += `<div class="section-header">Projects</div>`;
    filteredProj.forEach(proj => {
      html += `<div class="proj-entry">`;
      html += `<div class="proj-title">${escapeHtml(proj.title)}</div>`;
      proj.bullets.filter(b => b.trim()).forEach(bullet => {
        html += `<div class="bullet-item">${escapeHtml(bullet)}</div>`;
      });
      html += `</div>`;
    });
  }

  html += `</body></html>`;
  return html;
}

export async function POST(request: NextRequest) {
  try {
    const resumeData: ResumeData = await request.json();
    const html = buildResumeHTML(resumeData);

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '40px', right: '50px', bottom: '40px', left: '50px' },
      printBackground: true,
    });
    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
