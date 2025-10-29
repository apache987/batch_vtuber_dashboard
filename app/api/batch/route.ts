// app/api/batch/route.ts（例）
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const youtubeRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${process.env.YT_CHANNEL_ID}&order=date&maxResults=50&key=${process.env.YOUTUBE_API_KEY}`
    );
    if (!youtubeRes.ok) throw new Error('YouTube API request failed');
    const { items } = await youtubeRes.json();

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const rows = items.map((item: any) => ({
      video_id: item.id.videoId,
      title: item.snippet.title,
      published_at: item.snippet.publishedAt,
    }));

    const { error } = await supabase.from('videos').upsert(rows, {
      onConflict: 'video_id',
    });
    if (error) throw error;

    return NextResponse.json({ inserted: rows.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'batch failed' }, { status: 500 });
  }
}
