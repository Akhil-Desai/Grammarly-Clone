import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/tokens.css'
import './styles/global.css'

const container = document.getElementById('root')!
createRoot(container).render(<App />)


