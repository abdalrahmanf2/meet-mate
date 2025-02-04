import Navbar from "@/components/navbar";
import { MeetingStoreProvider } from "@/providers/meeting-store-provider";
import QueryProvider from "@/providers/query-provider";
import { SessionProvider } from "next-auth/react";
import { PropsWithChildren } from "react";

const MeetingLayout = ({ children }: PropsWithChildren) => {
  return (
    <>
      <header className="p-4">
        <Navbar />
      </header>
      <main className="p-4">
        <QueryProvider>
          <MeetingStoreProvider>
            <SessionProvider>{children}</SessionProvider>
          </MeetingStoreProvider>
        </QueryProvider>
      </main>
    </>
  );
};

export default MeetingLayout;
