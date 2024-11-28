import { AppProps } from "next/app";
import '../styles/globals.css'
import { loadPersistentCache } from '@/lib/balanceCache'; 
import { useEffect } from 'react';

const App = ({ Component, pageProps }: AppProps) => {
  useEffect(() => {
    loadPersistentCache();
  }, []);

  return (
    <Component {...pageProps} />
  );
};

export default App;