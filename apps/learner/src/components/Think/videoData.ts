/**
 * Sample video data for Think mode exercises
 *
 * @module components/Think/videoData
 */

export interface ThinkVideo {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  transcript: string;
  duration: string;
  category: 'business' | 'academic' | 'daily' | 'story';
}

export const THINK_VIDEOS: ThinkVideo[] = [
  {
    id: 'think-video-1',
    title: 'Daily Greeting',
    description: 'A casual greeting between friends',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    transcript: `Hey! How's it going? It's been a while since we last met. I've been really busy with work lately, but things are finally starting to calm down. We should definitely catch up sometime soon. Maybe grab a coffee this weekend? Let me know what you think!`,
    duration: '0:30',
    category: 'daily',
  },
  {
    id: 'think-video-2',
    title: 'Business Meeting',
    description: 'A professional business discussion',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    transcript: `Good morning everyone. Thank you for joining this meeting on such short notice. I wanted to discuss our quarterly results and outline our strategy for the next quarter. As you can see from the charts, we've made significant progress in several key areas. However, there are still some challenges we need to address. I'd like to hear your thoughts on how we can improve.`,
    duration: '0:45',
    category: 'business',
  },
  {
    id: 'think-video-3',
    title: 'Academic Presentation',
    description: 'A short academic explanation',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    transcript: `Today, I'd like to talk about the concept of climate change and its impact on biodiversity. Research has shown that rising temperatures are affecting ecosystems worldwide. Species are migrating to cooler areas, and some are even facing extinction. It's crucial that we understand these patterns to develop effective conservation strategies.`,
    duration: '0:40',
    category: 'academic',
  },
  {
    id: 'think-video-4',
    title: 'Story Time',
    description: 'An interesting short story',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    transcript: `Last weekend, something really funny happened to me. I was walking in the park when I suddenly saw a squirrel running towards me. It was holding a nut in its tiny paws. The squirrel stopped right in front of me, looked up, and then just ran away! I couldn't stop laughing. It was such a cute and unexpected moment.`,
    duration: '0:35',
    category: 'story',
  },
  {
    id: 'think-video-5',
    title: 'Travel Experience',
    description: 'Sharing a travel story',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    transcript: `I recently visited Japan, and it was an incredible experience. The food was amazing, especially the sushi in Tokyo. I also had the chance to visit several temples in Kyoto, which were absolutely beautiful. The people were so friendly and helpful everywhere I went. I highly recommend visiting Japan if you ever get the chance.`,
    duration: '0:38',
    category: 'daily',
  },
];
