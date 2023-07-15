import React, { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

const Layout: React.FC<Props> = (props) => (
  <html lang="en" className="h-full bg-gray-50">
  <div>
    {props.children}
  </div>
  </html>
);

export default Layout;
