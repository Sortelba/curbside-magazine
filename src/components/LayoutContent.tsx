"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactModal from "@/components/ContactModal";
import Analytics from "@/components/Analytics";

export default function LayoutContent({ children, showCommunity = false, showSkatemap = true, analyticsCode = "" }: { children: React.ReactNode; showCommunity?: boolean; showSkatemap?: boolean; analyticsCode?: string }) {
    const pathname = usePathname();
    const isAdminPage = pathname?.startsWith("/admin");

    if (isAdminPage) {
        return <>{children}</>;
    }

    return (
        <>
            <Navbar showCommunity={showCommunity} showSkatemap={showSkatemap} />
            <main className="flex-grow">{children}</main>
            <Footer />
            <ContactModal />
            <Analytics code={analyticsCode} />
        </>
    );
}
