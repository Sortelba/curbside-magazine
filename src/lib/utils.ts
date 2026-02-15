import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getYoutubeEmbedUrl(url: string) {
  if (!url) return "";

  // Already an embed URL
  if (url.includes('/embed/')) return url;

  let videoId = "";

  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
  } else if (url.includes('youtube.com/shorts/')) {
    videoId = url.split('youtube.com/shorts/')[1].split(/[?#]/)[0];
  } else if (url.includes('v=')) {
    videoId = url.split('v=')[1].split('&')[0].split('#')[0];
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  return url;
}
