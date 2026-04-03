import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { seedDatabase } from './lib/db/seed'

// Demo login logic for specification requirement
const initializeApp = async () => {
  const accountType = localStorage.getItem('kratos_account_type');
  
  if (!accountType) {
    // For this prototype, we default to demo if not set
    localStorage.setItem('kratos_account_type', 'demo');
  }

  await seedDatabase();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
};

initializeApp();
