"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface RandomizerData {
    beginner: string[];
    intermediate: string[];
    pro: string[];
}

export default function RandomizerSection({ randomizer }: { randomizer: RandomizerData }) {
    const { t } = useLanguage();
    const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "pro">("beginner");
    const [randomTrick, setRandomTrick] = useState<string | null>(null);

    const generateTrick = () => {
        const tricks = randomizer[difficulty];
        if (!tricks || tricks.length === 0) return;
        const newTrick = tricks[Math.floor(Math.random() * tricks.length)];
        setRandomTrick(newTrick);
    };

    return (
        <div className="flex flex-col items-center justify-center py-10 space-y-12">
            <div className="flex bg-muted p-1.5 rounded-2xl border border-border">
                {(["beginner", "intermediate", "pro"] as const).map(lvl => (
                    <button
                        key={lvl}
                        onClick={() => setDifficulty(lvl)}
                        className={cn(
                            "px-6 py-2 rounded-xl text-sm font-black uppercase italic transition-all",
                            difficulty === lvl ? "bg-foreground text-background shadow-lg" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {t(`nav.difficulty_${lvl}`) || lvl}
                    </button>
                ))}
            </div>

            <div className="relative flex flex-col items-center min-h-[150px] justify-center w-full">
                {randomTrick ? (
                    <motion.div
                        key={randomTrick}
                        initial={{ y: 20, opacity: 0, rotateX: -90 }}
                        animate={{ y: 0, opacity: 1, rotateX: 0 }}
                        className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-center py-8"
                    >
                        {randomTrick}
                    </motion.div>
                ) : (
                    <div className="text-muted-foreground italic text-xl">
                        Select difficulty & click generate
                    </div>
                )}

                <button
                    onClick={generateTrick}
                    className="mt-8 flex items-center gap-3 bg-foreground text-background px-10 py-5 rounded-full text-2xl font-black uppercase italic hover:scale-110 active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                >
                    <RefreshCw size={28} />
                    {t("nav.randomizer_generate") || "Generate"}
                </button>
            </div>
        </div>
    );
}
