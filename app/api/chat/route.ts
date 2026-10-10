
import { openai } from '@ai-sdk/openai';
import { streamText, tool, embed } from 'ai';
import { Index } from '@upstash/vector';
import { z } from 'zod';

const index = new Index();

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `
You are Sim Racing Coach, an educational assistant specializing in
sim racing driving technique, racecraft, and racing fundamentals.

You have access to a document collection through the getInformation tool.
Use this tool for substantive questions about racing technique, braking,
cornering, racing lines, weight transfer, overtaking, defending, and
racecraft.

Ground factual answers in the retrieved passages. Do not claim that a
document says something unless its retrieved content supports the claim.
If the documents do not contain enough information to answer, say so
clearly rather than inventing a citation or pretending you found an answer.

Explain concepts clearly and practically. Distinguish general racing
principles from simulator-specific advice. Do not invent exact braking
markers, car setups, or track-specific instructions that the sources
do not establish.

When relevant, refer to the source filenames and page numbers returned
by the retrieval tool. If sources disagree or a passage is ambiguous,
acknowledge that limitation.
    `.trim(),
    messages,
    tools: {
      getInformation: tool({
        description:
          'Search the indexed sim racing documents for evidence about driving technique, racing lines, braking, cornering, vehicle dynamics, overtaking, defending, and racecraft. Use this tool before answering substantive questions about these topics.',
        parameters: z.object({
          query: z
            .string()
            .describe(
              'A focused search query describing the racing concept or question to investigate'
            ),
        }),
        execute: async ({ query }) => {
          const { embedding } = await embed({
            model: openai.embedding('text-embedding-3-small'),
            value: query,
          });

          const hits = await index.query({
            vector: embedding,
            topK: 5,
            includeMetadata: true,
          });

          return hits.map((hit) => ({
            text: (hit.metadata?.text as string) ?? '',
            source: (hit.metadata?.source as string) ?? 'Unknown source',
            page: (hit.metadata?.page as number) ?? null,
            score: hit.score,
          }));
        },
      }),
    },
    maxSteps: 3,
  });

  return result.toDataStreamResponse();
}
