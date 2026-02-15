import PostCard from "@/components/PostCard";
import fs from 'fs';
import path from 'path';
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
    const filePath = path.join(process.cwd(), 'src', 'data', 'posts.json');
    if (!fs.existsSync(filePath)) return [];

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const allPosts = JSON.parse(fileContents);

    const slugs = new Set<string>();
    allPosts.forEach((post: any) => {
        if (!post.date) return;
        const d = new Date(post.date);
        if (isNaN(d.getTime())) return;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        slugs.add(`${year}-${month}`);
    });

    return Array.from(slugs).map(slug => ({ slug }));
}

async function getPostsForMonth(slug: string) {
    const filePath = path.join(process.cwd(), 'src', 'data', 'posts.json');
    if (!fs.existsSync(filePath)) return [];

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const allPosts = JSON.parse(fileContents);

    const [yearStr, monthStr] = slug.split('-');
    const targetYear = parseInt(yearStr);
    const targetMonth = parseInt(monthStr) - 1; // JS months are 0-indexed

    return allPosts.filter((post: any) => {
        const d = new Date(post.date);
        return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    });
}

function formatMonthSlug(slug: string) {
    const [year, month] = slug.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default async function ArchiveMonthPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const posts = await getPostsForMonth(slug);

    return (
        <div className="container mx-auto py-8 px-4 max-w-3xl">
            <Link href="/archive" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Archive
            </Link>

            <div className="mb-12 text-center">
                <h1 className="text-5xl font-black uppercase italic tracking-tighter mb-4">
                    {formatMonthSlug(slug)}
                </h1>
                <p className="text-xl text-muted-foreground">
                    {posts.length} posts from the past.
                </p>
            </div>

            <div className="space-y-8">
                {posts.map((post: any, index: number) => (
                    <PostCard key={index} {...post} />
                ))}

                {posts.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground italic">
                        Nothing found for this month.
                    </div>
                )}
            </div>
        </div>
    );
}
