"use client";

import { ChevronRight } from "lucide-react";

interface Channel {
    id: string;
    name: string;
    description: string;
    url: string;
}

export default function ChannelsSection({ channels }: { channels: Channel[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {channels.map(chan => (
                <a
                    key={chan.id}
                    href={chan.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-muted p-8 rounded-3xl border border-border hover:border-foreground transition-all flex items-center justify-between"
                >
                    <div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tight group-hover:text-blue-500 transition-colors">{chan.name}</h3>
                        <p className="text-muted-foreground mt-1">{chan.description}</p>
                    </div>
                    <ChevronRight className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" size={32} />
                </a>
            ))}
            {channels.length === 0 && (
                <div className="col-span-full text-center py-10 text-muted-foreground italic">
                    No channels available.
                </div>
            )}
        </div>
    );
}
