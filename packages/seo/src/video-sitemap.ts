export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface VideoSitemapEntry {
  /** Absolute URL of the page embedding the video. */
  pageUrl: string;
  /** Absolute URL of the thumbnail image. */
  thumbnailUrl: string;
  title: string;
  description: string;
  /** Direct media file URL, when the video is self-hosted. */
  contentUrl?: string;
  /** Player page URL (embeds allowed), for hosted videos. */
  playerUrl?: string;
  /** Publication date, `YYYY-MM-DD`. */
  publicationDate?: string;
  familyFriendly?: boolean;
}

export interface BuildVideoSitemapOptions {
  videos: VideoSitemapEntry[];
}

/** Google video sitemap XML (`sitemap-video/1.1` namespace). */
export function buildVideoSitemap(options: BuildVideoSitemapOptions): string {
  const urls = options.videos.map((video) => {
    const tags = [
      `      <video:thumbnail_loc>${escapeXml(video.thumbnailUrl)}</video:thumbnail_loc>`,
      `      <video:title>${escapeXml(video.title)}</video:title>`,
      `      <video:description>${escapeXml(video.description)}</video:description>`,
    ];
    if (video.contentUrl !== undefined) {
      tags.push(`      <video:content_loc>${escapeXml(video.contentUrl)}</video:content_loc>`);
    }
    if (video.playerUrl !== undefined) {
      tags.push(
        `      <video:player_loc allow_embed="yes">${escapeXml(video.playerUrl)}</video:player_loc>`,
      );
    }
    if (video.publicationDate !== undefined) {
      tags.push(`      <video:publication_date>${escapeXml(video.publicationDate)}</video:publication_date>`);
    }
    tags.push(`      <video:family_friendly>${video.familyFriendly === false ? "no" : "yes"}</video:family_friendly>`);
    return `  <url>\n    <loc>${escapeXml(video.pageUrl)}</loc>\n    <video:video>\n${tags.join("\n")}\n    </video:video>\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset\n  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"\n>\n${urls.join("\n")}\n</urlset>`;
}
