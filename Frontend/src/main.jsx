import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './Context/AuthContext.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Provider } from 'react-redux'
import { store } from './Redux/store.js'
createRoot(document.getElementById('root')).render(
  <StrictMode>
   <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Provider store={store}>
             <App />
        </Provider>
      
      </AuthProvider>
    </GoogleOAuthProvider>
    
  </StrictMode>,
)
