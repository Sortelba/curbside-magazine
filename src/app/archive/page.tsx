import Link from "next/link";
import fs from 'fs';
import path from 'path';
import { ArrowLeft } from "lucide-react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

async function getMonths() {
    const filePath = path.join(process.cwd(), 'src', 'data', 'posts.json');
    if (!fs.existsSync(filePath)) return [];

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const posts = JSON.parse(fileContents);

    // Extract unique Year-Month combinations
    const monthsSet = new Set();
    posts.forEach((post: any) => {
        const date = new Date(post.date);
        if (!isNaN(date.getTime())) {
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthsSet.add(key);
        }
    });

    return Array.from(monthsSet).sort().reverse(); // Newest first
}

function formatMonth(key: unknown) {
    if (typeof key !== 'string') return '';
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default async function ArchiveIndex() {
    const months = await getMonths();

    return (
        <div className="container mx-auto py-8 px-4 max-w-3xl min-h-[60vh]">
            <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>

            <div className="mb-12 text-center">
                <h1 className="text-5xl font-black uppercase italic tracking-tighter mb-4">
                    Archive
                </h1>
                <p className="text-xl text-muted-foreground">
                    Digging through the crates.
                </p>
            </div>

            <div className="grid gap-4">
                {months.map((monthKey: any) => (
                    <Link key={monthKey} href={`/archive/${monthKey}`} className="group">
                        <div className="bg-card border border-border rounded-lg p-6 hover:bg-muted transition-colors flex justify-between items-center shadow-sm hover:shadow-md">
                            <span className="text-2xl font-bold uppercase tracking-tighter italic group-hover:underline">
                                {formatMonth(monthKey)}
                            </span>
                            <span className="text-muted-foreground text-sm font-mono">{monthKey}</span>
                        </div>
                    </Link>
                ))}

                {months.length === 0 && (
                    <div className="text-center text-muted-foreground py-12">
                        No archives found yet.
                    </div>
                )}
            </div>
        </div>
    );
}
