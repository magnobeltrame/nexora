import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { aplicarTema, lerPreferenciaTema } from './lib/tema'
import App from './App.jsx'

// Aplica o tema (claro/escuro) antes de desenhar a tela, para não piscar
aplicarTema(lerPreferenciaTema())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
