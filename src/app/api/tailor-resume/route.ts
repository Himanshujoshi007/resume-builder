import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import type { ResumeData } from '@/lib/resume-types';

export async function POST(request: NextRequest) {
  try {
    const { resumeData, jobDescription, additionalInstructions, section } = await request.json();

    if (!resumeData || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing resumeData or jobDescription' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    // Build section-specific or full resume prompt
    let sectionContext = '';
    if (section) {
      const sectionNames: Record<string, string> = {
        'summary': 'Professional Summary',
        'certifications': 'Certifications',
        'skills': 'Technical Skills',
        'experience': 'Professional Experience',
        'education': 'Education',
        'projects': 'Projects',
        'personalInfo': 'Personal Information',
      };
      const sectionLabel = sectionNames[section] || section;
      sectionContext = `\n\nIMPORTANT FOCUS: The user wants to tailor ONLY the "${sectionLabel}" section of the resume. Return the complete resume data but only modify the "${sectionLabel}" section. Keep all other sections exactly as they are.`;
    }

    // Build additional instructions context
    let instructionsContext = '';
    if (additionalInstructions && additionalInstructions.trim()) {
      instructionsContext = `\n\nADDITIONAL USER INSTRUCTIONS (follow these carefully):
${additionalInstructions.trim()}

These instructions are from the user themselves. Apply them while tailoring the resume. Examples of what the user might ask:
- Focus on a specific experience entry (e.g., "Focus on my 2nd experience at Optum")
- Adjust bullet point style (e.g., "Make bullet points more concise" or "Expand the 3rd bullet point")
- Emphasize certain skills (e.g., "Highlight Python and SQL more")
- Change the tone (e.g., "Make it more action-oriented")
- Add/remove specific content (e.g., "Remove the project section" or "Add more technical details to experience")
- Font/presentation preferences (e.g., "Keep bullet points short and impactful")
Always honor the user's additional instructions while maintaining alignment with the job description.`;
    }

    const prompt = `You are a professional resume writer and career coach. Analyze the following job description and tailor the resume to better match it.

JOB DESCRIPTION:
${jobDescription}

CURRENT RESUME:
${JSON.stringify(resumeData, null, 2)}
${sectionContext}${instructionsContext}

Please provide a tailored version of the resume that:
1. Adjusts the professional summary to highlight experiences and skills most relevant to the job description
2. Reorders and emphasizes skills that match the job requirements
3. Rewrites experience bullet points to better align with the job description's keywords and requirements
4. Suggests any additional certifications or skills that would be beneficial
5. Keeps all information truthful - only rephrase and reorganize, don't fabricate
6. If additional user instructions are provided, follow them precisely

Also, analyze how well the CURRENT resume (before tailoring) matches the job description and provide a match score.

Return the result as a valid JSON object with EXACTLY this structure:
{
  "tailoredResume": {
    "personalInfo": { "fullName": "", "jobTitle": "", "email": "", "phone": "", "location": "", "linkedin": "" },
    "summary": "",
    "certifications": [],
    "skills": [{ "category": "", "skills": "" }],
    "experience": [{ "jobTitle": "", "company": "", "startDate": "", "endDate": "", "location": "", "bullets": [] }],
    "education": [{ "degree": "", "startDate": "", "endDate": "", "school": "", "location": "" }],
    "projects": [{ "title": "", "bullets": [] }]
  },
  "matchScore": {
    "overall": <number 0-100 representing how well the ORIGINAL resume matches the job description>,
    "breakdown": {
      "skills": <number 0-100>,
      "experience": <number 0-100>,
      "education": <number 0-100>,
      "keywords": <number 0-100>,
      "overallFit": <number 0-100>
    },
    "improvements": [<array of strings describing what was improved or could be improved>]
  }
}

The matchScore should reflect the ORIGINAL resume's match with the job description (before tailoring), so the user can see the gap.
Be generous but realistic with scoring. A resume that barely matches should score 20-40, a decent match 50-70, and a great match 75-90.

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

    return NextResponse.json(result);
  } catch (error) {
    console.error('Tailor resume error:', error);
    return NextResponse.json(
      { error: 'Failed to tailor resume. Please try again.' },
      { status: 500 }
    );
  }
}
