import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <section className="flex flex-col items-center gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">About</h1>
      <p className="text-pretty text-lg text-slate-300">
        TanStack Router keeps routes typed and scalable.
      </p>
    </section>
  )
}
