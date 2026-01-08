import { useState } from 'react'
import './App.css'

function App() {
  const [healthState, setHealthState] = useState("idle")
  const [healthMessage, setHealthMessage] = useState("")

  const checkHealth = async () => {
    setHealthState("loading")
    setHealthMessage("")
    try {
      const response = await fetch("/health")
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
      }
      const data = await response.json().catch(() => ({}))
      const statusLabel = data?.status ? `ok (${data.status})` : "ok"
      setHealthState("ok")
      setHealthMessage(statusLabel)
    } catch (error) {
      setHealthState("error")
      setHealthMessage(error?.message ?? "Health check failed")
    }
  }

  return (
    <div>
      <h1>MERN Stacker</h1>
      <p>Scaffold a React + Vite + Express stack fast.</p>
      <button
        type="button"
        onClick={checkHealth}
        disabled={healthState === "loading"}
      >
        {healthState === "loading" ? "Checking..." : "Check API health"}
      </button>
      {healthState !== "idle" && <p>API status: {healthMessage}</p>}
    </div>
  )
}

export default App
