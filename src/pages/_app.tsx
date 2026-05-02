import type { AppProps } from 'next/app';
import UnifiedDataProvider from '../contexts/UnifiedDataContext';
import { AuthProvider } from '../contexts/AuthContext';
import ErrorBoundary from '../components/common/ErrorBoundary';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <UnifiedDataProvider>
          <Component {...pageProps} />
        </UnifiedDataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default MyApp;