import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PostBody from "@/components/PostBody";
import { T } from "@/components/LanguageToggle";
import { sortedPosts, plainExcerpt } from "@/lib/posts";
import { SITE_URL, SITE_NAME } from "@/lib/site";

// Eigene Seite pro Beitrag – wird beim Build für jeden Beitrag statisch erzeugt
export const dynamicParams = false;

export async function generateStaticParams() {
    return sortedPosts().map((p: any) => ({ id: String(p.id) }));
}

function findPost(id: string) {
    return sortedPosts().find((p: any) => String(p.id) === id);
}

const abs = (u?: string) => (!u ? undefined : u.startsWith("http") ? u : `${SITE_URL}${u.startsWith("/") ? "" : "/"}${u}`);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const post = findPost(id);
    if (!post) return {};
    const title = String(post.translations?.de?.title || post.title).replace(/^\[News\]\s*/, "");
    const description = plainExcerpt(post.translations?.de?.content || post.description || title);
    const image = abs(post.media?.images?.[0] || (post.type === "image" ? post.content : undefined)) || `${SITE_URL}/og-image.png`;
    const published = new Date(post.date).toISOString();
    return {
        title,
        description,
        alternates: { canonical: `/news/${id}/` },
        openGraph: { type: "article", url: `/news/${id}/`, title, description, siteName: SITE_NAME, locale: "de_DE", publishedTime: published, images: [{ url: image }] },
        twitter: { card: "summary_large_image", title, description, images: [image] },
    };
}

export default async function NewsPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const post = findPost(id)!;
    const title = String(post.translations?.de?.title || post.title).replace(/^\[News\]\s*/, "");
    const image = abs(post.media?.images?.[0] || (post.type === "image" ? post.content : undefined));
    const ld = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: title.slice(0, 110),
        description: plainExcerpt(post.translations?.de?.content || post.description || title, 200),
        datePublished: new Date(post.date).toISOString(),
        image: image ? [image] : undefined,
        mainEntityOfPage: `${SITE_URL}/news/${id}/`,
        inLanguage: "de-DE",
        isBasedOn: post.originalUrl || undefined,
        publisher: { "@type": "Organization", name: SITE_NAME, url: `${SITE_URL}/`, logo: { "@type": "ImageObject", url: `${SITE_URL}/og-image.png` } },
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-3xl">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
            <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
                <ArrowLeft className="h-4 w-4" /> <T k="archive.back_home" />
            </Link>
            <article className="bg-card border border-border rounded-2xl overflow-hidden">
                <PostBody post={post} />
            </article>
        </div>
    );
}
