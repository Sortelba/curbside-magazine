"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="flex bg-muted rounded-md p-0.5 border border-border w-[90px] h-7 animate-pulse" />
        );
    }

    return (
        <div className="flex bg-muted rounded-md p-0.5 border border-border">
            <button
                onClick={() => setTheme("light")}
                className={cn(
                    "px-2 py-1 rounded transition-colors flex items-center justify-center",
                    theme === "light" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                title="Light Mode"
            >
                <Sun className="h-3 w-3" />
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={cn(
                    "px-2 py-1 rounded transition-colors flex items-center justify-center",
                    theme === "dark" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                title="Dark Mode"
            >
                <Moon className="h-3 w-3" />
            </button>
            <button
                onClick={() => setTheme("system")}
                className={cn(
                    "px-2 py-1 rounded transition-colors flex items-center justify-center",
                    theme === "system" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
                title="System Theme"
            >
                <Monitor className="h-3 w-3" />
            </button>
        </div>
    );
}
