import React, { ReactNode } from "react";
import Head from "next/head";

type Props = {
  children: ReactNode;
};

const Layout: React.FC<Props> = (props) => (
  <html lang="es" className="h-full bg-gray-50">
  <Head>
        <title>Entregas ROHI Sommiers</title>
  </Head>
  <div>
    {props.children}
  </div>
  </html>
);

export default Layout;

