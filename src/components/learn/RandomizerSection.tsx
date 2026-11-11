"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Check, RotateCcw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface RandomizerData {
    beginner: string[];
    intermediate: string[];
    pro: string[];
}

type Level = "beginner" | "intermediate" | "pro";
type Terrain = "flat" | "obstacle" | "ramp";

// Tricks werden im Admin als einfache Liste gepflegt – das Terrain ergibt sich aus dem Namen
const RAMP = /mini ramp|\bvert\b|transition|bowl|drop-in|acid drop|rock to fakie|rock.?n.?roll|disaster|axle stall|blunt stall|\bair\b|handplant|mctwist|invert|540|kickturn|carve|pumpen|tail stall|nose stall|hip\b/i;
const OBSTACLE = /grind|slide|stall|wallride|wallie|pole jam|curb|rail|gap|obstacle|bluntslide|lipslide|feeble|crook|tic-tac/i;
const FLAT_SLIDES = /powerslide|casper slide|bertslide/i;

function terrainOf(trick: string): Terrain {
    if (RAMP.test(trick)) return "ramp";
    if (OBSTACLE.test(trick) && !FLAT_SLIDES.test(trick)) return "obstacle";
    return "flat";
}

const STANCES: Record<Level, string[]> = {
    beginner: ["", "", "Fakie"],
    intermediate: ["", "", "Fakie", "Switch", "Nollie"],
    pro: ["", "Fakie", "Switch", "Nollie"],
};
// Schon mit Stance im Namen (Half Cab = fakie) → nichts davor setzen
const HAS_STANCE = /^(switch|fakie|nollie|half cab|full cab)\b/i;

type Entry = { id: number; trick: string; landed: boolean };

export default function RandomizerSection({ randomizer }: { randomizer: RandomizerData }) {
    const { t } = useLanguage();
    const [difficulty, setDifficulty] = useState<Level | "all">("beginner");
    const [terrain, setTerrain] = useState<Terrain | "all">("all");
    const [randomStance, setRandomStance] = useState(false);
    const [current, setCurrent] = useState<Entry | null>(null);
    const [history, setHistory] = useState<Entry[]>([]);

    const levels: Level[] = difficulty === "all" ? ["beginner", "intermediate", "pro"] : [difficulty];
    const pool = useMemo(
        () => levels.flatMap((lvl) => (randomizer[lvl] || []).map((trick) => ({ trick, lvl })))
            .filter((x) => terrain === "all" || terrainOf(x.trick) === terrain),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [randomizer, difficulty, terrain]
    );

    const generateTrick = () => {
        if (pool.length === 0) return;
        let pick = pool[Math.floor(Math.random() * pool.length)];
        // Nicht zweimal hintereinander derselbe Trick
        for (let i = 0; i < 6 && pool.length > 1 && current && current.trick.endsWith(pick.trick); i++) {
            pick = pool[Math.floor(Math.random() * pool.length)];
        }
        let trick = pick.trick;
        if (randomStance && !HAS_STANCE.test(trick) && terrainOf(trick) !== "ramp") {
            const options = STANCES[pick.lvl];
            const stance = options[Math.floor(Math.random() * options.length)];
            if (stance) trick = `${stance} ${trick}`;
        }
        const entry = { id: Date.now(), trick, landed: false };
        if (current) setHistory((h) => [current, ...h].slice(0, 9));
        setCurrent(entry);
    };

    const toggleLanded = (id: number) => {
        if (current?.id === id) setCurrent({ ...current, landed: !current.landed });
        setHistory((h) => h.map((e) => (e.id === id ? { ...e, landed: !e.landed } : e)));
    };
    const all = [...(current ? [current] : []), ...history];
    const landedCount = all.filter((e) => e.landed).length;
    const reset = () => { setCurrent(null); setHistory([]); };

    const chip = (active: boolean) => cn(
        "px-4 py-1.5 rounded-full border-2 text-xs font-black uppercase italic tracking-wide transition-all",
        active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
    );

    return (
        <div className="flex flex-col items-center justify-center py-10 space-y-8">
            {/* Level */}
            <div className="flex flex-wrap justify-center bg-muted p-1.5 rounded-2xl border border-border">
                {(["beginner", "intermediate", "pro", "all"] as const).map((lvl) => (
                    <button
                        key={lvl}
                        onClick={() => setDifficulty(lvl)}
                        className={cn(
                            "px-5 py-2 rounded-xl text-sm font-black uppercase italic transition-all",
                            difficulty === lvl ? "bg-foreground text-background shadow-lg" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {lvl === "all" ? t("learn.rand_all") : t(`nav.difficulty_${lvl}`) || lvl}
                    </button>
                ))}
            </div>

            {/* Terrain + Stance */}
            <div className="flex flex-wrap items-center justify-center gap-2">
                {(["all", "flat", "obstacle", "ramp"] as const).map((x) => (
                    <button key={x} type="button" onClick={() => setTerrain(x)} className={chip(terrain === x)}>
                        {t(`learn.rand_terrain_${x}`)}
                    </button>
                ))}
                <span className="w-px h-6 bg-border mx-1 hidden sm:block" />
                <button
                    type="button"
                    onClick={() => setRandomStance((v) => !v)}
                    aria-pressed={randomStance}
                    title={t("learn.rand_stance_hint")}
                    className={chip(randomStance)}
                >
                    🎲 {t("learn.rand_stance")}
                </button>
            </div>

            <div className="relative flex flex-col items-center min-h-[150px] justify-center w-full">
                {current ? (
                    <div className="flex flex-col items-center">
                        <motion.div
                            key={current.id}
                            initial={{ y: 20, opacity: 0, rotateX: -90 }}
                            animate={{ y: 0, opacity: 1, rotateX: 0 }}
                            className={cn("font-black uppercase italic tracking-tighter text-center py-6 leading-[0.95]", current.trick.length > 16 ? "text-4xl md:text-6xl" : "text-5xl md:text-8xl")}
                        >
                            {current.trick}
                        </motion.div>
                        <button
                            type="button"
                            onClick={() => toggleLanded(current.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-black uppercase italic transition-all",
                                current.landed ? "border-green-600 bg-green-600 text-white" : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                            )}
                        >
                            <Check size={16} /> {current.landed ? t("learn.rand_landed") : t("learn.rand_landed_q")}
                        </button>
                    </div>
                ) : (
                    <div className="text-muted-foreground italic text-xl text-center">
                        {pool.length === 0 ? t("learn.rand_none") : t("learn.randomizer_hint")}
                    </div>
                )}

                <button
                    onClick={generateTrick}
                    disabled={pool.length === 0}
                    className="mt-8 flex items-center gap-3 bg-foreground text-background px-10 py-5 rounded-full text-2xl font-black uppercase italic hover:scale-110 active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] disabled:opacity-40 disabled:hover:scale-100"
                >
                    <RefreshCw size={28} />
                    {t("nav.randomizer_generate") || "Generate"}
                </button>
                <p className="mt-3 text-xs text-muted-foreground">{pool.length} Tricks</p>
            </div>

            {/* Session-Verlauf */}
            {all.length > 1 && (
                <div className="w-full max-w-2xl space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase italic tracking-wider">
                            {t("learn.rand_history")} · {landedCount}/{all.length} {t("learn.rand_landed")}
                        </h3>
                        <button type="button" onClick={reset} className="flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground hover:text-foreground">
                            <RotateCcw size={14} /> {t("learn.rand_reset")}
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {history.map((e) => (
                            <button
                                key={e.id}
                                type="button"
                                onClick={() => toggleLanded(e.id)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold uppercase transition-all",
                                    e.landed ? "border-green-600 text-green-700 dark:text-green-400" : "border-border text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {e.landed && <Check size={12} />} {e.trick}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
