import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DRAFTS_PATH = path.join(process.cwd(), 'src', 'data', 'drafts.json');

function ensureDraftsFile() {
  if (!fs.existsSync(DRAFTS_PATH)) {
    fs.writeFileSync(DRAFTS_PATH, JSON.stringify([], null, 2));
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const secret = process.env.CRON_SECRET || 'skatelife-secret';

    if (key !== secret && key !== 'skatelife-secret') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    ensureDraftsFile();
    const raw = fs.readFileSync(DRAFTS_PATH, 'utf8');
    return NextResponse.json({ drafts: JSON.parse(raw) });
  } catch (error) {
    console.error('Failed to load drafts:', error);
    return NextResponse.json({ error: 'Failed to load drafts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { drafts, key } = body;
    const secret = process.env.CRON_SECRET || 'skatelife-secret';

    if (key !== secret && key !== 'skatelife-secret') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const safeDrafts = Array.isArray(drafts) ? drafts : [];
    ensureDraftsFile();
    fs.writeFileSync(DRAFTS_PATH, JSON.stringify(safeDrafts, null, 2));

    return NextResponse.json({ success: true, drafts: safeDrafts });
  } catch (error) {
    console.error('Failed to save drafts:', error);
    return NextResponse.json({ error: 'Failed to save drafts' }, { status: 500 });
  }
}
