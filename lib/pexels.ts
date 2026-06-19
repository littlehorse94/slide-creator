const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";

export interface PexelsPhoto {
  url: string;
  photographer: string;
  alt: string;
}

export async function fetchPexelsPhoto(query: string): Promise<PexelsPhoto | null> {
  if (!PEXELS_API_KEY || !query) return null;

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const photos = data.photos ?? [];
    if (photos.length === 0) return null;

    // Pick a random photo from the top 5 for variety
    const photo = photos[Math.floor(Math.random() * photos.length)];
    return {
      url: photo.src.large,
      photographer: photo.photographer,
      alt: photo.alt || query,
    };
  } catch {
    return null;
  }
}

export async function downloadImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = res.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}
