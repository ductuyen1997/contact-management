// Entry point: renders the React app into <div id="root"> in index.html.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  // StrictMode is a development-only helper: it runs some code twice to reveal bugs early.
  // It has no effect in the production build.
  <StrictMode>
    <App />
  </StrictMode>,
)
