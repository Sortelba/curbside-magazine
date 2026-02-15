import fs from 'fs';
import path from 'path';
import HomeContent from "@/components/HomeContent";

// Static rendering is used for GitHub Pages
// export const dynamic = 'force-dynamic';

async function getPosts() {
  const filePath = path.join(process.cwd(), 'src', 'data', 'posts.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

export default async function Home() {
  const allPosts = await getPosts();

  // Filter for current month only
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const posts = allPosts.filter((post: any) => {
    const postDate = new Date(post.date);
    return postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear;
  });

  return <HomeContent posts={posts} />;
}
