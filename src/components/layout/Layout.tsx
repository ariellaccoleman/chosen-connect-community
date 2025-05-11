
import { ReactNode } from "react";
import BaseLayout from "@/components/layout/BaseLayout";

interface LayoutProps {
  children: ReactNode;
  includeNavbar?: boolean;
}

const Layout = ({ children, includeNavbar = true }: LayoutProps) => {
  return (
    <BaseLayout includeNavbar={includeNavbar}>
      {children}
    </BaseLayout>
  );
};

export default Layout;
