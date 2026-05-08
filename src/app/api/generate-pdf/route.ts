import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import type { ResumeData } from '@/lib/resume-types';

function safeStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

export async function POST(request: NextRequest) {
  try {
    const data: ResumeData = await request.json();
    const { personalInfo, summary, certifications, skills, experience, education, projects } = data;

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 55, right: 55 },
      info: {
        Title: `${personalInfo.fullName || 'Resume'}_Resume`,
        Author: personalInfo.fullName || 'Resume Builder',
      },
    });

    // Collect PDF chunks
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Get the promise for the final buffer
    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // ─── Helper functions ───────────────────────────────────────
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    function checkPageBreak(needed: number = 40): boolean {
      if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        return true;
      }
      return false;
    }

    function drawSectionHeader(title: string): void {
      checkPageBreak(30);
      doc.moveDown(0.6);
      // Gold accent line + header
      doc.save();
      doc.moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.margins.left + pageWidth, doc.y)
        .strokeColor('#000000')
        .lineWidth(1.2)
        .stroke();
      doc.restore();
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#000000')
        .text(title.toUpperCase(), doc.page.margins.left, doc.y, {
          width: pageWidth,
          align: 'left',
          characterSpacing: 0.5,
        });
      doc.moveDown(0.3);
    }

    function drawBullet(text: string): void {
      checkPageBreak(20);
      const bulletX = doc.page.margins.left + 8;
      const textX = doc.page.margins.left + 18;
      const textWidth = pageWidth - 18;

      // Draw filled circle bullet
      doc.save();
      doc.circle(bulletX, doc.y + 5, 2.5)
        .fillColor('#000000')
        .fill();
      doc.restore();

      doc.font('Helvetica')
        .fontSize(10)
        .fillColor('#333333')
        .text(text, textX, doc.y, {
          width: textWidth,
          align: 'justify',
          lineGap: 2,
        });
      doc.moveDown(0.15);
    }

    // ─── Name ────────────────────────────────────────────────
    doc.font('Helvetica-Bold')
      .fontSize(20)
      .fillColor('#000000')
      .text(personalInfo.fullName || 'Your Name', doc.page.margins.left, doc.y, {
        width: pageWidth,
        align: 'center',
      });

    // ─── Job Title ───────────────────────────────────────────
    if (personalInfo.jobTitle) {
      doc.moveDown(0.1);
      doc.font('Helvetica')
        .fontSize(12)
        .fillColor('#333333')
        .text(personalInfo.jobTitle, doc.page.margins.left, doc.y, {
          width: pageWidth,
          align: 'center',
        });
    }

    // ─── Contact Info ────────────────────────────────────────
    const contactParts = [
      personalInfo.email,
      personalInfo.phone,
      personalInfo.location,
      personalInfo.linkedin,
    ].filter(s => s && s.trim());

    if (contactParts.length > 0) {
      doc.moveDown(0.2);
      doc.font('Helvetica')
        .fontSize(9)
        .fillColor('#444444')
        .text(contactParts.join('  |  '), doc.page.margins.left, doc.y, {
          width: pageWidth,
          align: 'center',
        });
    }

    // ─── Summary ─────────────────────────────────────────────
    const summaryText = safeStr(summary);
    if (summaryText.trim()) {
      drawSectionHeader('Summary');
      doc.font('Helvetica')
        .fontSize(10)
        .fillColor('#333333')
        .text(summaryText, doc.page.margins.left, doc.y, {
          width: pageWidth,
          align: 'justify',
          lineGap: 2,
        });
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
        const label = skill.category ? `${skill.category}: ` : '';
        const textX = doc.page.margins.left + 18;
        const textWidth = pageWidth - 18;

        // Draw bullet
        doc.save();
        doc.circle(doc.page.margins.left + 8, doc.y + 5, 2.5)
          .fillColor('#000000')
          .fill();
        doc.restore();

        // Bold category, normal skills
        doc.font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#000000')
          .text(label, textX, doc.y, { continued: true, width: textWidth, lineGap: 2 });
        doc.font('Helvetica')
          .fillColor('#333333')
          .text(skill.skills || '', { width: textWidth, lineGap: 2 });
        doc.moveDown(0.15);
      });
    }

    // ─── Professional Experience ─────────────────────────────
    const expArray = (experience || []).filter((e: { jobTitle: string; company: string }) => (e.jobTitle || '').trim() || (e.company || '').trim());
    if (expArray.length > 0) {
      drawSectionHeader('Professional Experience');
      expArray.forEach((exp: { jobTitle: string; company: string; startDate: string; endDate: string; location: string; bullets: string[] }) => {
        checkPageBreak(30);

        // Job title + Company (left) | Date + Location (right)
        const leftText = `${exp.jobTitle || ''}${exp.company ? ', ' + exp.company : ''}`;
        const rightText = `${exp.startDate || ''}${exp.endDate ? ' – ' + exp.endDate : ''}${exp.location ? ' | ' + exp.location : ''}`;

        const yStart = doc.y;
        doc.font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#000000')
          .text(leftText, doc.page.margins.left, yStart, {
            width: pageWidth * 0.65,
            lineGap: 2,
          });

        doc.font('Helvetica')
          .fontSize(9)
          .fillColor('#444444')
          .text(rightText, doc.page.margins.left + pageWidth * 0.65, yStart, {
            width: pageWidth * 0.35,
            align: 'right',
            lineGap: 2,
          });

        doc.y = Math.max(doc.y, yStart + 14);
        doc.moveDown(0.1);

        // Bullets
        (exp.bullets || []).filter((b: string) => b.trim()).forEach((bullet: string) => drawBullet(bullet));
        doc.moveDown(0.3);
      });
    }

    // ─── Education ───────────────────────────────────────────
    const eduArray = (education || []).filter((e: { degree: string; school: string }) => (e.degree || '').trim() || (e.school || '').trim());
    if (eduArray.length > 0) {
      drawSectionHeader('Education');
      eduArray.forEach((edu: { degree: string; startDate: string; endDate: string; school: string; location: string }) => {
        checkPageBreak(25);

        const yStart = doc.y;
        const leftText = edu.degree || '';
        const rightText = `${edu.startDate || ''}${edu.endDate ? ' – ' + edu.endDate : ''}`;

        doc.font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#000000')
          .text(leftText, doc.page.margins.left, yStart, {
            width: pageWidth * 0.7,
            lineGap: 2,
          });

        doc.font('Helvetica')
          .fontSize(9)
          .fillColor('#444444')
          .text(rightText, doc.page.margins.left + pageWidth * 0.7, yStart, {
            width: pageWidth * 0.3,
            align: 'right',
            lineGap: 2,
          });

        doc.y = Math.max(doc.y, yStart + 14);

        const schoolText = `${edu.school || ''}${edu.location ? ', ' + edu.location : ''}`;
        if (schoolText) {
          doc.font('Helvetica')
            .fontSize(10)
            .fillColor('#333333')
            .text(schoolText, doc.page.margins.left, doc.y, {
              width: pageWidth,
              lineGap: 2,
            });
        }
        doc.moveDown(0.3);
      });
    }

    // ─── Projects ────────────────────────────────────────────
    const projArray = (projects || []).filter((p: { title: string }) => (p.title || '').trim());
    if (projArray.length > 0) {
      drawSectionHeader('Projects');
      projArray.forEach((proj: { title: string; bullets: string[] }) => {
        checkPageBreak(25);

        doc.font('Helvetica-BoldOblique')
          .fontSize(10)
          .fillColor('#000000')
          .text(proj.title, doc.page.margins.left, doc.y, {
            width: pageWidth,
            lineGap: 2,
          });
        doc.moveDown(0.1);

        (proj.bullets || []).filter((b: string) => b.trim()).forEach((bullet: string) => drawBullet(bullet));
        doc.moveDown(0.3);
      });
    }

    // Finalize PDF
    doc.end();

    // Wait for the buffer
    const pdfBuffer = await pdfPromise;

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${(personalInfo.fullName || 'Resume').replace(/\s+/g, '_')}_Resume.pdf"`,
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
