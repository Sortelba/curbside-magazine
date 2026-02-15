"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdminPage = pathname?.startsWith("/admin");

    if (isAdminPage) {
        return <>{children}</>;
    }

    return (
        <>
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
        </>
    );
}
