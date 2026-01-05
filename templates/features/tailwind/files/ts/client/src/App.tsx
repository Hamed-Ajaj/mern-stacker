function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1 text-sm uppercase tracking-[0.2em] text-slate-300">
          MERN Stacker
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          React + Vite + Express, now with Tailwind
        </h1>
        <p className="text-pretty text-lg text-slate-300">
          Start building fast with a styled baseline and utility-first CSS baked in.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-300">
          <span className="rounded-md border border-slate-800 px-3 py-1">pnpm dev</span>
          <span className="rounded-md border border-slate-800 px-3 py-1">npm run dev</span>
          <span className="rounded-md border border-slate-800 px-3 py-1">yarn dev</span>
        </div>
      </div>
    </div>
  );
}

export default App;
