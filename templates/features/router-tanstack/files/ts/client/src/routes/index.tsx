import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <section className="flex flex-col items-center gap-4">
      <span className="rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
        MERN Stacker
      </span>
      <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
        TanStack Router ready
      </h1>
      <p className="text-pretty text-lg text-slate-300">
        File-based routing with fast type-safe navigation.
      </p>
    </section>
  )
}
