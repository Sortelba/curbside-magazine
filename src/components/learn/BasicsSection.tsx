"use client";

import { Play } from "lucide-react";

interface BasicVideo {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
}

export default function BasicsSection({ basics }: { basics: BasicVideo[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {basics.map(basic => (
                <div key={basic.id} className="group bg-muted rounded-2xl overflow-hidden border border-border">
                    <div className="aspect-video bg-black flex items-center justify-center">
                        {basic.videoUrl.includes("youtube") ? (
                            <iframe
                                src={basic.videoUrl}
                                className="w-full h-full"
                                allowFullScreen
                                title={basic.title}
                            />
                        ) : (
                            <span className="text-muted-foreground italic">Video Preview</span>
                        )}
                    </div>
                    <div className="p-6">
                        <h3 className="text-xl font-bold uppercase mb-2">{basic.title}</h3>
                        <p className="text-muted-foreground">{basic.description}</p>
                    </div>
                </div>
            ))}
            {basics.length === 0 && (
                <div className="col-span-full text-center py-10 text-muted-foreground italic">
                    No basics videos available yet.
                </div>
            )}
        </div>
    );
}
