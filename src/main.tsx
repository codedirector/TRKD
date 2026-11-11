import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary
      variant="page"
      componentContext="Root Application"
      fallbackTitle="Application Rendering Interrupted"
      fallbackMessage="Trackd encountered an unexpected runtime failure while rendering the application. Your documents and version records remain intact."
      onReset={() => window.location.reload()}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);


