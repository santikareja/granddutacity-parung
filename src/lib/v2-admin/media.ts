// Query & tulis media untuk CMS kustom. Server-side only.

import { desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { media } from "@/db/schema";

export type MediaItem = {
  id: number;
  name: string | null;
  alt: string;
  caption: string | null;
  url: string | null;
  width: number | null;
  height: number | null;
  source: "upload" | "unsplash" | "pexels" | null;
  createdAt: Date;
};

const toNumber = (value: string | null): number | null => {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const listMedia = async (limit = 60): Promise<MediaItem[]> => {
  const rows = await db
    .select({
      id: media.id,
      name: media.name,
      alt: media.alt,
      caption: media.caption,
      url: media.url,
      width: media.width,
      height: media.height,
      source: media.source,
      createdAt: media.createdAt,
    })
    .from(media)
    .orderBy(desc(media.createdAt))
    .limit(limit);

  // Kolom width/height bertipe numeric di Postgres → dikembalikan sebagai string.
  return rows.map((row) => ({
    ...row,
    width: toNumber(row.width),
    height: toNumber(row.height),
  }));
};

export const getMediaById = async (id: number): Promise<MediaItem | null> => {
  const rows = await db
    .select({
      id: media.id,
      name: media.name,
      alt: media.alt,
      caption: media.caption,
      url: media.url,
      width: media.width,
      height: media.height,
      source: media.source,
      createdAt: media.createdAt,
    })
    .from(media)
    .where(eq(media.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return { ...row, width: toNumber(row.width), height: toNumber(row.height) };
};
