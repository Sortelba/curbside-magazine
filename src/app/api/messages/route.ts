export const dynamic = 'force-static';
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ADMIN_KEY = "skatelife-secret";

export async function GET(req: Request) {
    if (process.env.GITHUB_ACTIONS === 'true') return NextResponse.json({ messages: [] });
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (key !== ADMIN_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const filePath = path.join(process.cwd(), "src/data/messages.json");
        const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));
        return NextResponse.json(fileData);
    } catch (error) {
        return NextResponse.json({ messages: [] });
    }
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const id = searchParams.get("id");

    if (key !== ADMIN_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const filePath = path.join(process.cwd(), "src/data/messages.json");
        const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));

        fileData.messages = fileData.messages.filter((m: any) => m.id !== id);
        fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
