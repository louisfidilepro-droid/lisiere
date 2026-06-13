import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Beat } from "@/lib/types";
import VaultPlayer, { VaultTrack } from "@/components/VaultPlayer";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Écoute privée — Lisière", robots: { index: false, follow: false } };

const AUDIO = /\.(wav|mp3|m4a|flac|ogg|aac)$/i;

export default async function Listen({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();
  const { data: share } = await admin.from("shares").select("*").eq("token", token).single();
  if (!share) notFound();

  const ids: string[] = share.beat_ids || [];
  const { data: beatsData } = await admin.from("products")
    .select("*").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const beats = (beatsData ?? []) as Beat[];
  const ordered = ids.map((id) => beats.find((b) => b.id === id)).filter(Boolean) as Beat[];

  const pubPrev = (p: string | null) => p ? admin.storage.from("previews").getPublicUrl(p).data.publicUrl : null;

  const tracks: VaultTrack[] = await Promise.all(ordered.map(async (b) => {
    let stream = pubPrev(b.preview_path);
    if (share.full_quality && b.download_path && AUDIO.test(b.download_path)) {
      const { data } = await admin.storage.from("masters").createSignedUrl(b.download_path, 7200);
      if (data?.signedUrl) stream = data.signedUrl;
    }
    let download: string | null = null;
    if (share.allow_download) {
      if (b.download_url) download = b.download_url;
      else if (b.download_path) {
        const { data } = await admin.storage.from("masters").createSignedUrl(b.download_path, 7200, { download: true });
        download = data?.signedUrl ?? null;
      }
    }
    return {
      id: b.id, title: b.title, bpm: b.bpm, musicKey: b.music_key, genre: b.genre,
      cover: b.cover_url, stream, download, buy: `/product/${b.slug}`,
    };
  }));

  return <VaultPlayer title={share.title} fullQuality={share.full_quality} tracks={tracks} />;
}
