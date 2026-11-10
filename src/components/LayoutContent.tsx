"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactModal from "@/components/ContactModal";
import Analytics from "@/components/Analytics";

export default function LayoutContent({ children, showCommunity = false, analyticsCode = "" }: { children: React.ReactNode; showCommunity?: boolean; analyticsCode?: string }) {
    const pathname = usePathname();
    const isAdminPage = pathname?.startsWith("/admin");

    if (isAdminPage) {
        return <>{children}</>;
    }

    return (
        <>
            <Navbar showCommunity={showCommunity} />
            <main className="flex-grow">{children}</main>
            <Footer />
            <ContactModal />
            <Analytics code={analyticsCode} />
        </>
    );
}
