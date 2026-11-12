// Auto-Posts im Admin-Dashboard: Vorschläge (neue Spots, Shops, Events) anzeigen,
// daraus Beiträge erstellen oder verwerfen, erstellte Auto-Beiträge löschen.
// Online gehen die Beiträge über „Publish to Git“.
export const dynamic = 'force-dynamic';
export const maxDuration = 120;
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { isAdminKey } from "@/lib/adminAuth";
import { listCandidates, createPostFromCandidates, dismissCandidates, deleteAutoPost } from "@/lib/autoPosts.mjs";

const ROOT = process.cwd();
const POSTS_FILE = path.join(ROOT, 'src', 'data', 'posts.json');

/** IDs der Beiträge, die schon auf GitHub (origin/main) liegen, also online sind */
function onlineIds(): Set<string> | null {
    for (const ref of ['origin/main', 'HEAD']) {
        try {
            const raw = execFileSync('git', ['show', `${ref}:src/data/posts.json`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
            return new Set(JSON.parse(raw).map((p: any) => p.id));
        } catch { /* nächste Quelle versuchen */ }
    }
    return null;
}

function state() {
    const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
    const online = onlineIds();
    return {
        candidates: listCandidates(),
        posts: posts.filter((p: any) => p.auto).slice(0, 30).map((p: any) => ({
            id: p.id,
            title: p.title,
            image: p.media?.images?.[0] || p.content,
            kind: p.auto.kind,
            count: p.auto.refs?.length || 1,
            created: p.auto.created,
            online: online ? online.has(p.id) : false,
        })),
    };
}

export async function GET(request: Request) {
    const key = new URL(request.url).searchParams.get('key');
    if (!isAdminKey(key)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json(state());
}

export async function POST(request: Request) {
    const body = await request.json().catch(() => ({}));
    if (!isAdminKey(body.key)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const refs: string[] = Array.isArray(body.refs) ? body.refs.map(String) : [];

    try {
        switch (body.action) {
            case 'create': {
                const post = await createPostFromCandidates(body.kind === 'events' ? 'events' : 'map', refs);
                return NextResponse.json({ ...state(), created: { id: post.id, title: post.title } });
            }
            case 'dismiss':
                dismissCandidates(refs);
                break;
            case 'delete':
                if (!deleteAutoPost(String(body.id || ''))) throw new Error('Beitrag nicht gefunden');
                break;
            default:
                throw new Error('Unbekannte Aktion');
        }
        return NextResponse.json(state());
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
    }
}
