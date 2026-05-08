import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import type { ResumeData } from '@/lib/resume-types';

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

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64}`;

    // Use AI Vision API to read the PDF directly - NO PDF library needed!
    // The AI can natively read PDF documents via the file_url content type.
    const zai = await ZAI.create();

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'system',
          content: 'You are a resume parsing expert. Always respond with valid JSON only. No markdown, no explanation.'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Read this PDF resume and convert it into a structured JSON format.

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
- IMPORTANT: certifications MUST be an array of plain strings, NOT objects
- IMPORTANT: Return ONLY the JSON object, no markdown code fences, no explanation`
            },
            {
              type: 'image_url',
              image_url: {
                url: dataUrl
              }
            }
          ]
        }
      ],
      thinking: { type: 'disabled' }
    });

    const responseText = response.choices[0]?.message?.content || '';

    if (!responseText || responseText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not read the PDF. Please ensure it is a valid resume with selectable text.' },
        { status: 400 }
      );
    }

    // Clean and parse the JSON response
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
