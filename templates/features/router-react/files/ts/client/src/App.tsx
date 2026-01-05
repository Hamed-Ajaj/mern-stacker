import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'

function Home() {
  return (
    <section className="flex flex-col items-center gap-4">
      <span className="rounded-full border border-slate-800 bg-slate-900/60 px-4 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
        MERN Stacker
      </span>
      <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
        React Router ready
      </h1>
      <p className="text-pretty text-lg text-slate-300">
        Build navigation fast with a clean, declarative setup.
      </p>
    </section>
  )
}

function About() {
  return (
    <section className="flex flex-col items-center gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">About</h1>
      <p className="text-pretty text-lg text-slate-300">
        React Router keeps navigation clean and easy to extend.
      </p>
    </section>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
          <nav className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-300">
            <Link className="rounded-full border border-slate-800 px-4 py-2" to="/">
              Home
            </Link>
            <Link className="rounded-full border border-slate-800 px-4 py-2" to="/about">
              About
            </Link>
          </nav>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
