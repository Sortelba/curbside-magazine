import { rewriteNews, isRewritten } from "../src/lib/gemini.ts";
const arts = [
  { title: "Zero's \"After Forever\" Full-Length Video", text: "Zero Skateboards released their new full-length video After Forever, featuring parts from Jamie Thomas, Tommy Sandoval, Windsor James and the whole squad. The video premiered in Carlsbad during the brand's 30 year anniversary and is now online for free.", source: "Test" },
  { title: "Barker Barrett Guest Pro for THERE Skateboards", text: "Barker Barrett has been announced as a guest pro for THERE Skateboards with a new board graphic and a short clip released on Instagram.", source: "Test" },
];
for (const a of arts) { const t = Date.now(); const r: any = await rewriteNews(a); console.log(((Date.now()-t)/1000).toFixed(1)+"s", isRewritten(r) ? "OK: " + r.de.title : "FEHLER " + r.error); }
