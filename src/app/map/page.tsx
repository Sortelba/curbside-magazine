"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import the map component to avoid SSR issues with Leaflet
const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[70vh] rounded-3xl bg-muted/50 border-2 border-dashed border-border flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary/50" />
            <p className="text-sm font-black uppercase italic tracking-widest text-muted-foreground">Initializing Skatemap...</p>
        </div>
    )
});

export default function MapPage() {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-background">
            <div className="container mx-auto py-12 px-4 max-w-7xl">
                <header className="mb-12 relative">
                    <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary/5 rounded-full blur-3xl" />
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-foreground mb-4">
                                Skate <span className="text-muted-foreground/30">Map</span>
                            </h1>
                            <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-8">
                                <p className="text-2xl text-muted-foreground font-medium max-w-2xl leading-tight">
                                    Find local spots, parks, and shops. The ultimate guide for your next session.
                                </p>
                                <div className="px-4 py-1.5 bg-muted rounded-full border border-border flex items-center gap-2 w-fit">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Europe / Germany Coverage</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <section className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                    <LeafletMap />
                </section>

                <footer className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
                        <h3 className="font-black uppercase italic text-lg mb-2">Spots</h3>
                        <p className="text-sm text-muted-foreground">Discover local plazas, ledges, and transition spots shared by the community.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
                        <h3 className="font-black uppercase italic text-lg mb-2">Shops</h3>
                        <p className="text-sm text-muted-foreground">Support your local scene by visiting these specialized skate shops.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-muted/30 border border-border/50">
                        <h3 className="font-black uppercase italic text-lg mb-2">Contribute</h3>
                        <p className="text-sm text-muted-foreground">Found a new spot? Share it with the community through the button in our footer.</p>
                    </div>
                </footer>
            </div>
        </div>
    );
}
