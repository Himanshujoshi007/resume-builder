import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import type { ResumeData } from '@/lib/resume-types';

export async function POST(request: NextRequest) {
  try {
    const { resumeData, jobDescription } = await request.json();

    if (!resumeData || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing resumeData or jobDescription' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const prompt = `You are a professional resume writer and career coach. Analyze the following job description and tailor the resume to better match it.

JOB DESCRIPTION:
${jobDescription}

CURRENT RESUME:
${JSON.stringify(resumeData, null, 2)}

Please provide a tailored version of the resume that:
1. Adjusts the professional summary to highlight experiences and skills most relevant to the job description
2. Reorders and emphasizes skills that match the job requirements
3. Rewrites experience bullet points to better align with the job description's keywords and requirements
4. Suggests any additional certifications or skills that would be beneficial
5. Keeps all information truthful - only rephrase and reorganize, don't fabricate

Return the result as a valid JSON object matching the exact same ResumeData structure with these fields:
- personalInfo: { fullName, jobTitle, email, phone, location, linkedin }
- summary: string
- certifications: string[]
- skills: { category: string, skills: string }[]
- experience: { jobTitle: string, company: string, startDate: string, endDate: string, location: string, bullets: string[] }[]
- education: { degree: string, startDate: string, endDate: string, school: string, location: string }[]
- projects: { title: string, bullets: string[] }[]

IMPORTANT: Return ONLY the JSON object, no markdown code fences, no explanation.`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a professional resume writer. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const tailoredResume: ResumeData = JSON.parse(cleanedResponse);

    return NextResponse.json({ tailoredResume });
  } catch (error) {
    console.error('Tailor resume error:', error);
    return NextResponse.json(
      { error: 'Failed to tailor resume. Please try again.' },
      { status: 500 }
    );
  }
}
