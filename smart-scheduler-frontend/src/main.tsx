import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { logger } from './lib/logger'

window.addEventListener('error', (event) => {
  logger.error('Unhandled window error', {
    message: event.message,
    source: event.filename,
    line: event.lineno,
    column: event.colno,
  })
})

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', event.reason)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
