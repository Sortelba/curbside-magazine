export const dynamic = 'force-static';
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, subject, message } = body;

        const filePath = path.join(process.cwd(), "src/data/messages.json");
        const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));

        const newMessage = {
            id: `msg_${Date.now()}`,
            timestamp: new Date().toISOString(),
            name,
            email,
            subject,
            message,
            status: "unread"
        };

        fileData.messages.push(newMessage);
        fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));

        return NextResponse.json({ success: true, message: "Message sent!" });
    } catch (error) {
        console.error("Error saving message:", error);
        return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 });
    }
}
