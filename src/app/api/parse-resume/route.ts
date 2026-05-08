import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import type { ResumeData } from '@/lib/resume-types';

/**
 * Parse resume API — accepts plain text from copy-paste.
 * No PDF handling at all. 100% Vercel-compatible.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = body.text;

    if (!text || typeof text !== 'string' || text.trim().length < 20) {
      return NextResponse.json(
        { error: 'Please paste more resume content. The text provided is too short to parse.' },
        { status: 400 }
      );
    }

    const extractedText = text.trim();

    // Use AI to structure the text into ResumeData
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
- IMPORTANT: Return ONLY the JSON object, no markdown code fences, no explanation
- IMPORTANT: The response must be valid JSON that can be parsed by JSON.parse()`;

    let completion;
    try {
      completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a resume parsing expert. Always respond with valid JSON only. No markdown, no code fences, no explanation. Just the raw JSON object.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
      });
    } catch (aiError: unknown) {
      console.error('AI API call failed:', aiError);
      const errMsg = aiError instanceof Error ? aiError.message : 'Unknown AI error';
      return NextResponse.json(
        { error: `AI service error: ${errMsg}. Please try again.` },
        { status: 502 }
      );
    }

    const rawResponse = completion.choices[0]?.message?.content;

    if (!rawResponse || rawResponse.trim().length === 0) {
      return NextResponse.json(
        { error: 'AI returned an empty response. Please try again.' },
        { status: 502 }
      );
    }

    // Clean the response — remove markdown code fences if AI added them
    const cleanedResponse = rawResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Parse JSON with detailed error
    let parsedResume: ResumeData;
    try {
      parsedResume = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON parse error. AI response was:', cleanedResponse.substring(0, 500));
      return NextResponse.json(
        { error: 'AI returned invalid formatting. Please try again — the AI sometimes needs a second attempt.' },
        { status: 502 }
      );
    }

    // Validate that the parsed object has the expected structure
    if (!parsedResume.personalInfo || !Array.isArray(parsedResume.experience)) {
      console.error('Invalid resume structure:', JSON.stringify(parsedResume).substring(0, 200));
      return NextResponse.json(
        { error: 'AI returned an incomplete structure. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ resumeData: parsedResume });
  } catch (error) {
    console.error('Resume parsing error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to parse resume: ${message}. Please try again.` },
      { status: 500 }
    );
  }
}
