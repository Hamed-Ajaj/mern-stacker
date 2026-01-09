import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
        <nav className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-300">
          <Link className="rounded-full border border-slate-800 px-4 py-2" to="/">
            Home
          </Link>
          <Link
            className="rounded-full border border-slate-800 px-4 py-2"
            to="/about"
          >
            About
          </Link>
        </nav>
        <Outlet />
      </div>
    </div>
  )
}
