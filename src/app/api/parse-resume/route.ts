import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { ResumeData } from '@/lib/resume-types';

// Disable the worker for Node.js/serverless environment
GlobalWorkerOptions.workerSrc = '';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('resume') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Extract text from PDF using pdfjs-dist (works on Vercel serverless)
    const bytes = await file.arrayBuffer();
    const uint8Array = new Uint8Array(bytes);

    let extractedText = '';

    try {
      const pdfDoc = await getDocument({ data: uint8Array }).promise;
      const numPages = pdfDoc.numPages;
      const pageTexts: string[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        pageTexts.push(pageText);
      }

      extractedText = pageTexts.join('\n\n');
    } catch (pdfError) {
      console.error('PDF parse error:', pdfError);
      return NextResponse.json(
        { error: 'Could not read the PDF file. Please ensure it is a valid PDF with selectable text.' },
        { status: 400 }
      );
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from the PDF. Please ensure the PDF contains selectable text (not a scanned image).' },
        { status: 400 }
      );
    }

    // Use AI to parse the extracted text into ResumeData structure
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

    const parsedResume: ResumeData = JSON.parse(cleanedResponse);

    return NextResponse.json({ resumeData: parsedResume });
  } catch (error) {
    console.error('Resume parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse resume. Please ensure the PDF is a valid resume with selectable text.' },
      { status: 500 }
    );
  }
}
