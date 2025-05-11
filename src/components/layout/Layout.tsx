
import { ReactNode } from "react";
import BaseLayout from "@/components/layout/BaseLayout";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <BaseLayout>
      {children}
    </BaseLayout>
  );
};

export default Layout;
