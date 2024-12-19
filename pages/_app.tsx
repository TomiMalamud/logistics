import { AppProps } from "next/app";
import "../styles/globals.css";
import { loadPersistentCache } from "@/lib/balanceCache";
import { useEffect } from "react";
import { Public_Sans } from "next/font/google";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/queryClient";

const publicSans = Public_Sans({ subsets: ["latin"] });

const App = ({ Component, pageProps }: AppProps) => {
  useEffect(() => {
    loadPersistentCache();
  }, []);

  return (
    <main className={publicSans.className}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
        {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
      </QueryClientProvider>
    </main>
  );
};

export default App;
