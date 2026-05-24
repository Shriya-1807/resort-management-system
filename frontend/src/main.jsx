import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: "'Jost', sans-serif",
            background: '#FDFAF5',
            color: '#4A3828',
            border: '1px solid #EDE3D0',
            borderRadius: '2px',
            boxShadow: '0 6px 24px rgba(120,70,20,0.12)',
          },
          success: { iconTheme: { primary: '#4A8A50', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#C84040', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)