import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './design-system.css'
import './business.css'
import App from './App.jsx'
import ResetPassword from './components/ResetPassword.jsx'

// Read token from fragment only; remove it immediately from browser history. Never persist it.
const resetMatch=window.location.hash.match(/^#password-reset=([a-f0-9]{64})$/);
const resetToken=resetMatch?.[1];
if(resetMatch)window.history.replaceState(null,'',window.location.pathname+window.location.search);
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <>{resetToken?<main className="auth-modal glass-panel" style={{maxWidth:520,margin:"10vh auto",padding:32}}><ResetPassword token={resetToken} onDone={()=>window.location.reload()}/></main>:<App />}</>
  </StrictMode>,
)
