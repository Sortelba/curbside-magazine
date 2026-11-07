import fs from 'fs';
import path from 'path';
import HomeContent from "@/components/HomeContent";
import StructuredData from "@/components/StructuredData";

// Static rendering is required for GitHub Pages export.

const HOME_POST_LIMIT = 60;

async function getPosts() {
  const filePath = path.join(process.cwd(), 'src', 'data', 'posts.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

interface LearnData {
  basics: any[];
  coaches: any[];
  randomizer: any;
  channels: any[];
}

async function getLearnData() {
  const filePath = path.join(process.cwd(), 'src', 'data', 'learn.json');
  if (!fs.existsSync(filePath)) {
    return { basics: [], coaches: [], randomizer: { beginner: [], intermediate: [], pro: [] }, channels: [] };
  }
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

export default async function Home() {
  const allPosts = await getPosts();
  const learnData = await getLearnData();

  // Show newest posts first, independent of the current month. This keeps newly
  // created or scanned posts visible immediately after a successful publish.
  const posts = [...allPosts]
    .filter((post: any) => {
      const postDate = new Date(post.date);
      return !isNaN(postDate.getTime());
    })
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    // Nur die neuesten Beiträge in die Startseite packen (sonst ~1 MB HTML);
    // ältere gibt es im Archiv und auf den eigenen Beitragsseiten.
    .slice(0, HOME_POST_LIMIT);

  // Read settings
  const settingsPath = path.join(process.cwd(), 'src', 'data', 'settings.json');
  let settings = {
    showLearnBasics: false,
    showLearnCoaches: false,
    showLearnRandomizer: false,
    showLearnChannels: false,
    showCommunity: false
  };

  try {
    if (fs.existsSync(settingsPath)) {
      const loadedSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      settings = { ...settings, ...loadedSettings };
    }
  } catch (e) {
    console.error("Error reading settings", e);
  }

  let events: any[] = [];
  try {
    events = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'events.json'), 'utf8'));
  } catch {}

  return (
    <>
      <StructuredData posts={posts} events={events} />
      <HomeContent posts={posts} learnData={learnData} settings={settings} />
    </>
  );
}
