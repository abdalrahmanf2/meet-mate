import DashboardSidebar from "@/components/dashboard-sidebar";
import MaxWidthWrapper from "@/components/max-width-wrapper";
import Navbar from "@/components/navbar";
import { PropsWithChildren } from "react";

const DashboardLayout = ({ children }: PropsWithChildren) => {
  return (
    <MaxWidthWrapper className="flex flex-col gap-8">
      <header className="p-4 border-b">
        <Navbar />
      </header>
      <main className="sm:max-h-[calc(100vh-8rem-1px)] grid md:grid-cols-8 gap-8">
        <DashboardSidebar className="md:col-span-2" />
        <section
          className="px-2 pb-2 overflow-y-scroll overflow-x-hidden md:col-span-6"
          style={{ scrollbarWidth: "none" }}
        >
          {children}
        </section>
      </main>
    </MaxWidthWrapper>
  );
};

export default DashboardLayout;
