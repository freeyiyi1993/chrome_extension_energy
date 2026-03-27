import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './finish.css'
import FinishApp from './FinishApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FinishApp />
  </StrictMode>,
)
