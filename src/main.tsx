import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

console.log('main.tsx: script start')

const root = document.getElementById('root')
if (!root) {
  console.error('Missing #root div in index.html')
} else {
  console.log('main.tsx: rendering App')
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
