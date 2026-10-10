# Sim Racing Coach

A retrieval-augmented generation (RAG) chatbot that helps users explore sim racing technique, vehicle dynamics, braking, cornering, and racecraft using indexed reference documents.

**Live Demo:** https://sim-racing-coach.vercel.app

**GitHub Repository:** https://github.com/santosjames7/sim-racing-coach

## Overview

Sim Racing Coach is a conversational knowledge assistant built on Next.js. Instead of relying only on the language model's general knowledge, it can retrieve relevant passages from a collection of reference PDFs and use them to help answer racing-related questions.

The application displays retrieved source excerpts, document filenames, page numbers, and similarity scores so users can inspect the information behind an answer.

## Features

- Conversational chat interface with suggested questions.
- Retrieval-augmented generation using a vector database.
- Semantic search over three indexed PDF reference documents.
- Source attribution showing filenames, page numbers, and retrieved excerpts.
- Streaming AI responses.
- Responsive interface built with Tailwind CSS.
- Deployed application hosted on Vercel.

## Technology Stack

- **Frontend and framework:** Next.js 15, React, TypeScript
- **Styling:** Tailwind CSS
- **AI integration:** Vercel AI SDK
- **Language model:** OpenAI GPT-4o mini
- **Embeddings:** OpenAI `text-embedding-3-small`
- **Vector database:** Upstash Vector
- **PDF processing:** `pdf-parse`

## How It Works

1. **Document ingestion:** The seed script reads PDF files from the local `data/` directory.
2. **Text chunking:** Extracted text is divided into overlapping chunks, with page and source metadata retained.
3. **Embedding generation:** Each chunk is converted into a vector using OpenAI's embedding model.
4. **Vector storage:** The embeddings and associated metadata are uploaded to Upstash Vector.
5. **Retrieval:** When a user asks a question, the application embeds the query and searches for relevant chunks.
6. **Answer generation:** The retrieved passages are provided to the language model through a tool call to help formulate an answer.
7. **Source display:** The interface displays retrieved excerpts and their associated document metadata.

## Getting Started

### Prerequisites

- Node.js and npm
- An OpenAI API key
- An Upstash Vector index
- Access to the PDF documents used for indexing

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/santosjames7/sim-racing-coach.git
cd sim-racing-coach
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key
UPSTASH_VECTOR_REST_URL=your_upstash_vector_rest_url
UPSTASH_VECTOR_REST_TOKEN=your_upstash_vector_rest_token
```

Never commit real API keys or tokens to version control.

### Indexing Documents

Place the PDF documents you are authorized to use in the `data/` directory. Run the project's seed script:

```bash
npm run seed
```

The script extracts the PDF text, generates embeddings, and uploads the indexed chunks to Upstash Vector.

Use an index configured for 1536 dimensions when using `text-embedding-3-small` with its default embedding dimensions.

### Run Locally

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Production Build

Check TypeScript:

```bash
npx tsc --noEmit
```

Build the application:

```bash
npm run build
```

## Deployment

The application is deployed on Vercel and connected to the public GitHub repository. Configure the three environment variables in the Vercel project settings before deploying.

The hosted application uses the existing Upstash Vector index, so the local PDF files do not need to be included in the public repository.

## Limitations

- Answer quality depends on the relevance and coverage of the indexed documents.
- Retrieved passages may not contain enough information to answer every question.
- Similarity scores indicate retrieval similarity, not factual correctness.
- Generated answers can still contain inaccuracies and should be checked against the source material.
- The knowledge base is limited to the documents that have been indexed.

## Security and Data Handling

API credentials are configured through environment variables and excluded from version control. PDF files are excluded from the public repository; users must obtain their own authorized copies to recreate the indexing process.

## Future Improvements

- Improve retrieval quality through chunking and retrieval experiments.
- Add source citations directly within answer paragraphs.
- Support document uploads and knowledge-base updates.
- Add evaluation questions to measure retrieval relevance and answer grounding.

## Acknowledgments

Built as a course project based on a Next.js RAG starter application, adapted into a sim racing knowledge assistant.
