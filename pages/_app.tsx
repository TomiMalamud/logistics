import { loadPersistentCache } from "@/lib/balanceCache";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AppProps } from "next/app";
import { Public_Sans } from "next/font/google";
import { useEffect } from "react";
import "../styles/globals.css";

const publicSans = Public_Sans({ subsets: ["latin"] });

const App = ({ Component, pageProps }: AppProps) => {
  useEffect(() => {
    loadPersistentCache();
  }, []);

  return (
    <main className={`${publicSans.className} antialiased`}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
        {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
      </QueryClientProvider>
    </main>
  );
};

export default App;
