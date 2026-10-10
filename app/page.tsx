
'use client';

import { useChat } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';

type Source = {
  text?: string;
  source?: string;
  page?: number | null;
  score?: number;
};

export default function Page() {
  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    status,
    error,
  } = useChat({
    api: '/api/chat',
  });

  const busy = status === 'streaming' || status === 'submitted';

  const suggestions = [
    'How does trail braking help rotate a car?',
    'How does weight transfer affect cornering?',
    'How should I approach overtaking another driver?',
    'What causes understeer and oversteer?',
  ];

  return (
    <main className="mx-auto min-h-screen max-w-5xl bg-slate-50 px-4 py-8 sm:px-6">
      <header className="mb-8">
        <div className="mb-3 inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-800">
          YOUR SIM RACING KNOWLEDGE BASE
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Sim Racing Coach
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Learn racing technique, vehicle dynamics, braking, cornering, and
          racecraft using your indexed reference documents. Sources appear
          beneath answers when retrieval is used.
        </p>
      </header>

      {messages.length === 0 && (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">
            What would you like to improve?
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Ask a question or choose an example to get started.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((question) => (
              <button
                key={question}
                type="button"
                disabled={busy}
                onClick={() => setInput(question)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition hover:border-cyan-400 hover:bg-cyan-50 disabled:opacity-50"
              >
                {question}
              </button>
            ))}
          </div>
        </section>
      )}

      <ul className="mb-6 min-h-[180px] space-y-6">
        {messages.map((message) => (
          <li
            key={message.id}
            className={
              message.role === 'user'
                ? 'flex flex-col items-end'
                : 'flex flex-col items-start'
            }
          >
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {message.role === 'user' ? 'You' : 'Sim Racing Coach'}
            </div>

            <div
              className={
                message.role === 'user'
                  ? 'max-w-[90%] whitespace-pre-wrap break-words rounded-2xl bg-cyan-700 px-4 py-3 text-sm leading-6 text-white'
                  : 'w-full max-w-[95%] break-words rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm leading-7 text-slate-800 shadow-sm'
              }
            >
              {message.role === 'user' ? (
                message.content
              ) : (
                <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="mb-3">{children}</p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-slate-950">
                          {children}
                        </strong>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-4 list-decimal space-y-2 pl-6">
                          {children}
                        </ol>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-4 list-disc space-y-2 pl-6">
                          {children}
                        </ul>
                      ),
                      li: ({ children }) => (
                        <li className="pl-1">{children}</li>
                      ),
                      h1: ({ children }) => (
                        <h2 className="mb-3 mt-5 text-xl font-bold text-slate-900">
                          {children}
                        </h2>
                      ),
                      h2: ({ children }) => (
                        <h2 className="mb-2 mt-5 text-lg font-bold text-slate-900">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="mb-2 mt-4 font-semibold text-slate-900">
                          {children}
                        </h3>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="my-3 border-l-4 border-cyan-200 pl-4 text-slate-600">
                          {children}
                        </blockquote>
                      ),
                      a: ({ children, href }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-700 underline underline-offset-2 hover:text-cyan-900"
                        >
                          {children}
                        </a>
                      ),
                      code: ({ children }) => (
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em] text-slate-800">
                          {children}
                        </code>
                      ),
                      hr: () => <hr className="my-4 border-slate-200" />,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {message.role === 'assistant' &&
              message.toolInvocations?.map(
                (invocation) =>
                  invocation.state === 'result' &&
                  invocation.toolName === 'getInformation' && (
                    <details
                      key={invocation.toolCallId}
                      className="mt-3 w-full max-w-[95%] overflow-hidden rounded-xl border border-slate-200 bg-white"
                    >
                      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-50">
                        <span className="ml-1">
                          Retrieved sources (
                          {Array.isArray(invocation.result)
                            ? (invocation.result as Source[]).length
                            : 0}
                          )
                        </span>
                      </summary>

                      <ul className="space-y-3 border-t border-slate-100 p-4">
                        {Array.isArray(invocation.result) &&
                          (invocation.result as Source[]).map(
                            (source, index) => (
                              <li
                                key={`${source.source ?? 'source'}-${source.page ?? 'unknown'}-${index}`}
                                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="text-sm font-semibold text-slate-800">
                                    {source.source ?? 'Unknown source'}
                                    {source.page != null
                                      ? ` · Page ${source.page}`
                                      : ''}
                                  </div>

                                  <span className="text-xs text-slate-500">
                                    {typeof source.score === 'number'
                                      ? `Score: ${source.score.toFixed(3)}`
                                      : 'Score unavailable'}
                                  </span>
                                </div>

                                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                                  {source.text ?? 'No excerpt available.'}
                                </p>
                              </li>
                            )
                          )}
                      </ul>
                    </details>
                  )
              )}
          </li>
        ))}

        {busy && (
          <li className="flex items-center gap-3 text-sm text-slate-500">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-cyan-600" />
            Searching your racing documents and preparing an answer…
          </li>
        )}

        {error && (
          <li className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <p className="font-semibold">Something went wrong.</p>
            <p className="mt-1">{error.message}</p>
          </li>
        )}
      </ul>

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 flex gap-2 border-t border-slate-200 bg-slate-50/95 py-4 backdrop-blur"
      >
        <input
          value={input}
          onChange={handleInputChange}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
          placeholder="Ask about braking, racing lines, or racecraft…"
          disabled={busy}
          aria-label="Ask Sim Racing Coach a question"
        />

        <button
          type="submit"
          disabled={!input.trim() || busy}
          className="rounded-xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? 'Thinking…' : 'Send'}
        </button>
      </form>

      <footer className="mt-3 text-center text-xs leading-5 text-slate-400">
        Answers are grounded in retrieved documents when available. Always
        verify driving advice in a safe practice environment.
      </footer>
    </main>
  );
}
