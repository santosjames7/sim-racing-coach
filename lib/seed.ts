
/**
 * Seed Upstash Vector with chunks from every PDF in data/.
 * Each chunk stores its source filename and page number.
 *
 * Run with: npm run seed
 */

import { config as loadEnv } from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Index } from '@upstash/vector';
import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import pdfParse from 'pdf-parse';

loadEnv({ path: path.join(process.cwd(), '.env.local') });

const DATA_DIR = path.join(process.cwd(), 'data');
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const BATCH_SIZE = 100;

type Chunk = {
  text: string;
  page: number;
  source: string;
};

function chunkText(
  text: string,
  page: number,
  source: string
): Chunk[] {
  const chunks: Chunk[] = [];
  let i = 0;

  while (i < text.length) {
    let end = Math.min(text.length, i + CHUNK_SIZE);

    if (end < text.length) {
      const lookahead = text.slice(end, end + 200);
      const match = lookahead.match(/[.!?]\s/);

      if (match && match.index !== undefined) {
        end += match.index + 1;
      }
    }

    const piece = text.slice(i, end).trim();

    if (piece.length > 0) {
      chunks.push({ text: piece, page, source });
    }

    if (end >= text.length) break;
    i = end - CHUNK_OVERLAP;
  }

  return chunks;
}


async function loadAndChunkPdf(
  filePath: string
): Promise<Chunk[]> {
  const buffer = await fs.readFile(filePath);
  const source = path.basename(filePath);

  // Insert an explicit marker for every page while extracting text.
  const parsed = await pdfParse(buffer, {
    pagerender: async (pageData: any) => {
      const content = await pageData.getTextContent();

      const pageText = content.items
        .map((item: any) => item.str ?? '')
        .join(' ');

      return `\n<<<PDF_PAGE_${pageData.pageNumber}>>>\n${pageText}`;
    },
  });

  const pageSections = parsed.text.split(
    /<<<PDF_PAGE_(\d+)>>>/
  );

  const chunks: Chunk[] = [];

  // split() produces alternating text and page-number entries.
  for (let i = 1; i < pageSections.length; i += 2) {
    const page = Number(pageSections[i]);
    const pageText = pageSections[i + 1]?.trim() ?? '';

    if (!pageText || !Number.isFinite(page)) continue;

    chunks.push(...chunkText(pageText, page, source));
  }

  if (chunks.length === 0) {
    throw new Error(
      `No page text extracted from ${source}. Check whether the PDF contains selectable text.`
    );
  }

  return chunks;
}


function makeSourceId(source: string): string {
  return path
    .basename(source, '.pdf')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
}

async function main() {
  if (
    !process.env.UPSTASH_VECTOR_REST_URL ||
    !process.env.UPSTASH_VECTOR_REST_TOKEN
  ) {
    throw new Error(
      'Missing Upstash credentials in .env.local.'
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY in .env.local.');
  }

  const files = (await fs.readdir(DATA_DIR))
    .filter((file) => file.toLowerCase().endsWith('.pdf'))
    .sort();

  if (files.length === 0) {
    throw new Error(`No PDF files found in ${DATA_DIR}`);
  }

  console.log(`Found ${files.length} PDF files.`);

  const allChunks: Chunk[] = [];

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    console.log(`Reading ${file}...`);

    const chunks = await loadAndChunkPdf(filePath);

    console.log(
      `  ${chunks.length} chunks across ${
        new Set(chunks.map((chunk) => chunk.page)).size
      } page(s)`
    );

    allChunks.push(...chunks);
  }

  console.log(`Total chunks: ${allChunks.length}`);

  console.log('Generating embeddings...');

  const { embeddings } = await embedMany({
    model: openai.embedding('text-embedding-3-small'),
    values: allChunks.map((chunk) => chunk.text),
  });

  const index = new Index();

  const records = allChunks.map((chunk, i) => {
    const sourceId = makeSourceId(chunk.source);

    return {
      id: `${sourceId}_chunk_${i}`,
      vector: embeddings[i],
      metadata: {
        text: chunk.text,
        page: chunk.page,
        source: chunk.source,
      },
    };
  });

  console.log(`Uploading ${records.length} vectors...`);

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    await index.upsert(records.slice(i, i + BATCH_SIZE));
    console.log(
      `  Uploaded ${Math.min(i + BATCH_SIZE, records.length)}/${records.length}`
    );
  }

  console.log('✅ All PDFs indexed successfully.');
  console.log('Sources:', [...new Set(allChunks.map((c) => c.source))]);
}

main().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
