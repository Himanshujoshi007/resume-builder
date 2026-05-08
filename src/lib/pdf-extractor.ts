/**
 * Client-side PDF text extractor using pdfjs-dist.
 * This runs entirely in the browser — no server-side PDF libraries needed.
 * This is the most reliable approach for Vercel deployment.
 */
import * as pdfjsLib from 'pdfjs-dist';

// Use CDN worker — no bundling issues, works everywhere
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
  const numPages = pdf.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str || '')
      .join(' ');
    pageTexts.push(pageText);
  }

  return pageTexts.join('\n\n');
}
