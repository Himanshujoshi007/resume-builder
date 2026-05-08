/**
 * Resume Builder - Express Server
 * Lightweight Node.js server that serves the Next.js static build
 * and handles API routes for resume parsing, AI tailoring, and PDF generation.
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { chromium } = require('playwright');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// Serve static files from Next.js export
const staticDir = path.join(__dirname, 'out');
app.use(express.static(staticDir));

// Multer for file uploads (stored in memory)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ─── API: Parse Resume ──────────────────────────────────────
app.post('/api/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    if (!file.mimetype.includes('pdf') && !file.originalname.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'Only PDF files are supported' });
    }

    // Save the uploaded file temporarily
    const tempPath = path.join('/tmp', `resume_upload_${Date.now()}.pdf`);
    fs.writeFileSync(tempPath, file.buffer);

    let extractedText = '';

    try {
      // Extract text using pdfplumber via Python
      const pythonScript = `
import pdfplumber
import json
import sys

try:
    text_parts = []
    with pdfplumber.open(sys.argv[1]) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    print(json.dumps({"text": "\\n".join(text_parts)}))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;
      const scriptPath = path.join('/tmp', `extract_${Date.now()}.py`);
      fs.writeFileSync(scriptPath, pythonScript);

      const result = execSync(`python3 "${scriptPath}" "${tempPath}"`, {
        encoding: 'utf-8',
        timeout: 30000,
      });

      const parsed = JSON.parse(result.trim());
      if (parsed.error) {
        throw new Error(parsed.error);
      }
      extractedText = parsed.text;

      // Clean up script
      try { fs.unlinkSync(scriptPath); } catch {}
    } finally {
      // Clean up temp PDF
      try { fs.unlinkSync(tempPath); } catch {}
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({
        error: 'Could not extract text from the PDF. Please ensure the PDF contains selectable text.'
      });
    }

    // Use AI to parse the extracted text into ResumeData structure
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const prompt = `You are a resume parsing expert. Parse the following resume text and convert it into a structured JSON format.

RESUME TEXT:
${extractedText}

Return the result as a valid JSON object with EXACTLY this structure:
{
  "personalInfo": {
    "fullName": "string",
    "jobTitle": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string (or empty string if not found)"
  },
  "summary": "string (the professional summary/objective)",
  "certifications": ["string"],
  "skills": [
    {
      "category": "string (the skill category name)",
      "skills": "string (the skills listed under this category)"
    }
  ],
  "experience": [
    {
      "jobTitle": "string",
      "company": "string",
      "startDate": "string (MM/YYYY format)",
      "endDate": "string (MM/YYYY format or 'Present')",
      "location": "string",
      "bullets": ["string"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "startDate": "string (MM/YYYY format)",
      "endDate": "string (MM/YYYY format)",
      "school": "string",
      "location": "string"
    }
  ],
  "projects": [
    {
      "title": "string",
      "bullets": ["string"]
    }
  ]
}

Rules:
- If a field is not found in the resume, use an empty string "" for strings, or empty array [] for arrays
- For dates, convert to MM/YYYY format if possible
- Keep all information exactly as written in the resume - do not modify or fabricate
- For skills, group them into logical categories based on how they appear in the resume
- If skills are listed as a simple list without categories, create appropriate categories
- IMPORTANT: certifications MUST be an array of plain strings, NOT objects. Example: ["AWS Certified Cloud Practitioner", "PL-300"]
- IMPORTANT: Return ONLY the JSON object, no markdown code fences, no explanation`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a resume parsing expert. Always respond with valid JSON only. No markdown, no explanation.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsedResume = JSON.parse(cleanedResponse);

    return res.json({ resumeData: parsedResume });
  } catch (error) {
    console.error('Resume parsing error:', error);
    return res.status(500).json({
      error: 'Failed to parse resume. Please ensure the PDF is a valid resume with selectable text.'
    });
  }
});

// ─── API: Tailor Resume ─────────────────────────────────────
app.post('/api/tailor-resume', async (req, res) => {
  try {
    const { resumeData, jobDescription, additionalInstructions } = req.body;

    if (!resumeData || !jobDescription) {
      return res.status(400).json({ error: 'Missing resumeData or jobDescription' });
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    // Build additional instructions context
    let instructionsContext = '';
    if (additionalInstructions && additionalInstructions.trim()) {
      instructionsContext = `\n\nPERSONALIZED USER INSTRUCTIONS (HIGHEST PRIORITY — these override the default behavior):
${additionalInstructions.trim()}

The user has provided these specific instructions. You MUST follow them precisely and they take priority over the default tailoring approach. Apply these instructions across ALL relevant sections of the resume. Examples of what the user might ask and how to handle them:
- "Focus on my 2nd experience at Optum" → Give more detail and emphasis to the 2nd experience entry, while still tailoring other sections
- "Make bullet points concise" → Shorten ALL bullet points in experience AND projects AND summary
- "Highlight Python and SQL more" → Emphasize Python/SQL in skills, summary, experience bullets, and projects
- "Make it more action-oriented" → Rewrite ALL bullet points across ALL sections with strong action verbs
- "Remove the project section" → Set projects to []
- "Change job title to Data Engineer" → Update personalInfo.jobTitle accordingly
- "Only update the summary" → Only modify the summary, keep everything else exactly as-is
- "Don't touch my education" → Keep education exactly as-is, tailor everything else
- "Add more technical details to experience" → Enrich ALL experience bullets with technical specifics
- "Make the summary under 3 sentences" → Rewrite summary to be concise (under 3 sentences)
Always honor the user's personalized instructions across ALL sections while maintaining alignment with the job description.`;
    }

    const prompt = `You are a professional resume writer and career coach. Your task is to tailor the resume to match the job description.

JOB DESCRIPTION:
${jobDescription}

CURRENT RESUME:
${JSON.stringify(resumeData, null, 2)}
${instructionsContext}

${additionalInstructions && additionalInstructions.trim()
      ? 'Since the user provided personalized instructions, follow THOSE instructions as the primary guide for how to tailor the resume, while still aligning with the job description.'
      : 'DEFAULT BEHAVIOR (no personalized instructions provided): Tailor the following sections of the resume:'
    }

${!additionalInstructions || !additionalInstructions.trim() ? `
1. PROFESSIONAL SUMMARY — Rewrite to highlight experiences and skills most relevant to the JD. Use keywords from the JD naturally. Keep it impactful and concise.

2. TECHNICAL SKILLS — Reorder skill categories to put the most relevant ones first. Within each category, reorder skills so the ones matching the JD appear first. Adjust category names if they could better reflect JD terminology.

3. ALL WORK EXPERIENCE — Rewrite EVERY bullet point in EVERY experience entry to better align with the JD's keywords, requirements, and responsibilities. Reorder experiences (most relevant first). Emphasize achievements and metrics that match what the JD is looking for. Add keywords from the JD naturally into the bullet points.

4. JOB TITLE — Update personalInfo.jobTitle to match or closely align with the target job title from the JD.

5. CERTIFICATIONS — Reorder to put the most relevant ones first.

6. PROJECTS — Rewrite bullet points to emphasize aspects most relevant to the JD. Reorder projects (most relevant first).

7. EDUCATION — Keep as-is unless the JD strongly suggests a particular emphasis.
` : ''}

CRITICAL RULES:
- You MUST return ALL sections in the response, even if a section doesn't need changes — return it as-is but still include it.
- Keep all information truthful — only rephrase, reorganize, and emphasize. Never fabricate experiences, skills, or qualifications.
- Certifications MUST be an array of plain strings, NOT objects. Example: ["AWS Certified", "PL-300"]
- Bullet points in experience and projects MUST be arrays of plain strings.

Also, analyze how well the CURRENT resume (before tailoring) matches the job description and provide a match score.

Return the result as a valid JSON object with EXACTLY this structure:
{
  "tailoredResume": {
    "personalInfo": { "fullName": "", "jobTitle": "", "email": "", "phone": "", "location": "", "linkedin": "" },
    "summary": "",
    "certifications": ["string"],
    "skills": [{ "category": "", "skills": "" }],
    "experience": [{ "jobTitle": "", "company": "", "startDate": "", "endDate": "", "location": "", "bullets": ["string"] }],
    "education": [{ "degree": "", "startDate": "", "endDate": "", "school": "", "location": "" }],
    "projects": [{ "title": "", "bullets": ["string"] }]
  },
  "matchScore": {
    "overall": <number 0-100>,
    "breakdown": {
      "skills": <number 0-100>,
      "experience": <number 0-100>,
      "education": <number 0-100>,
      "keywords": <number 0-100>,
      "overallFit": <number 0-100>
    },
    "improvements": [<array of strings describing what was improved>]
  }
}

The matchScore should reflect the ORIGINAL resume's match with the job description (before tailoring).
Scoring guide: barely matches = 20-40, decent = 50-70, great = 75-90.

IMPORTANT: Return ONLY the JSON object, no markdown code fences, no explanation.`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a professional resume writer. Always respond with valid JSON only. No markdown, no explanation.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleanedResponse);

    return res.json(result);
  } catch (error) {
    console.error('Tailor resume error:', error);
    return res.status(500).json({ error: 'Failed to tailor resume. Please try again.' });
  }
});

// ─── API: Generate PDF ──────────────────────────────────────
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildResumeHTML(data) {
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
  if (summary && summary.trim()) {
    html += `<div class="section-header">Summary</div>`;
    html += `<div class="summary">${escapeHtml(summary)}</div>`;
  }

  // Certifications
  const safeCerts = (certifications || []).map(c => typeof c === 'string' ? c : String(c));
  const filteredCerts = safeCerts.filter(c => c.trim());
  if (filteredCerts.length > 0) {
    html += `<div class="section-header">Certifications</div>`;
    filteredCerts.forEach(cert => {
      html += `<div class="cert-item">${escapeHtml(cert)}</div>`;
    });
  }

  // Technical Skills
  const filteredSkills = (skills || []).filter(s => (s.category || '').trim() || (s.skills || '').trim());
  if (filteredSkills.length > 0) {
    html += `<div class="section-header">Technical Skills</div>`;
    filteredSkills.forEach(skill => {
      html += `<div class="skill-category"><span class="cat-name">${escapeHtml(skill.category || '')}</span>: ${escapeHtml(skill.skills || '')}</div>`;
    });
  }

  // Professional Experience
  const filteredExp = (experience || []).filter(e => (e.jobTitle || '').trim() || (e.company || '').trim());
  if (filteredExp.length > 0) {
    html += `<div class="section-header">Professional Experience</div>`;
    filteredExp.forEach(exp => {
      html += `<div class="exp-entry">`;
      html += `<div class="exp-header"><span class="exp-job">${escapeHtml(exp.jobTitle || '')}${exp.company ? ', ' + escapeHtml(exp.company) : ''}</span><span class="exp-date">${escapeHtml(exp.startDate || '')}${exp.endDate ? ' – ' + escapeHtml(exp.endDate) : ''}${exp.location ? ' | ' + escapeHtml(exp.location) : ''}</span></div>`;
      (exp.bullets || []).filter(b => b.trim()).forEach(bullet => {
        html += `<div class="bullet-item">${escapeHtml(bullet)}</div>`;
      });
      html += `</div>`;
    });
  }

  // Education
  const filteredEdu = (education || []).filter(e => (e.degree || '').trim() || (e.school || '').trim());
  if (filteredEdu.length > 0) {
    html += `<div class="section-header">Education</div>`;
    filteredEdu.forEach(edu => {
      html += `<div class="edu-entry">`;
      html += `<div class="edu-header"><span class="edu-degree">${escapeHtml(edu.degree || '')}</span><span class="edu-date">${escapeHtml(edu.startDate || '')}${edu.endDate ? ' – ' + escapeHtml(edu.endDate) : ''}</span></div>`;
      html += `<div class="edu-school">${escapeHtml(edu.school || '')}${edu.location ? ', ' + escapeHtml(edu.location) : ''}</div>`;
      html += `</div>`;
    });
  }

  // Projects
  const filteredProj = (projects || []).filter(p => (p.title || '').trim());
  if (filteredProj.length > 0) {
    html += `<div class="section-header">Projects</div>`;
    filteredProj.forEach(proj => {
      html += `<div class="proj-entry">`;
      html += `<div class="proj-title">${escapeHtml(proj.title)}</div>`;
      (proj.bullets || []).filter(b => b.trim()).forEach(bullet => {
        html += `<div class="bullet-item">${escapeHtml(bullet)}</div>`;
      });
      html += `</div>`;
    });
  }

  html += `</body></html>`;
  return html;
}

app.post('/api/generate-pdf', async (req, res) => {
  let browser = null;
  try {
    const resumeData = req.body;
    const html = buildResumeHTML(resumeData);

    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '40px', right: '50px', bottom: '40px', left: '50px' },
      printBackground: true,
    });
    await browser.close();
    browser = null;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    if (browser) {
      try { await browser.close(); } catch {}
    }
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// ─── SPA Fallback ───────────────────────────────────────────
// For client-side routing: serve index.html for all non-API, non-static routes
app.use((req, res) => {
  const indexPath = path.join(staticDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.status(404).send('Not found');
});

// ─── Start Server ───────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ========================================`);
  console.log(`  Resume Builder Server`);
  console.log(`  Running on http://localhost:${PORT}`);
  console.log(`  ========================================\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Prevent crashes from unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
