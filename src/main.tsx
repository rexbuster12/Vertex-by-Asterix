import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { clearAllPersistentProfiles } from './lib/tempStore.ts'

// Clear any past persisted Saddhamma Meshram profile and email on startup
clearAllPersistentProfiles()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
