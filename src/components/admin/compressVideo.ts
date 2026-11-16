/**
 * Make a clip small before it leaves the computer: 480p (the longer side at most
 * 854px), H.264 at about 0.75 Mbit/s, with AAC sound. A 45-second phone clip of
 * 60-200 MB comes out at roughly 5 MB, and that is all that is stored and all a
 * visitor downloads. Returns null when this browser cannot encode video; the
 * original is then uploaded and Cloudinary makes the small copy instead.
 */
export async function compressVideo(file: File, onProgress: (progress: number) => void): Promise<File | null> {
  const mb = await import("mediabunny");
  if (!(await mb.canEncodeVideo("avc")) || !(await mb.canEncodeAudio("aac"))) return null;

  const input = new mb.Input({ formats: mb.ALL_FORMATS, source: new mb.BlobSource(file) });
  const track = await input.getPrimaryVideoTrack();
  if (!track) return null;
  const scale = Math.min(1, 854 / Math.max(track.displayWidth, track.displayHeight));
  const even = (n: number) => Math.max(2, Math.round((n * scale) / 2) * 2);

  const output = new mb.Output({
    format: new mb.Mp4OutputFormat({ fastStart: "in-memory" }),
    target: new mb.BufferTarget(),
  });
  const conversion = await mb.Conversion.init({
    input,
    output,
    video: {
      width: even(track.displayWidth),
      height: even(track.displayHeight),
      fit: "fill",
      codec: "avc",
      bitrate: 750_000,
    },
    audio: { codec: "aac", bitrate: 96_000 },
  });
  if (!conversion.isValid) return null;
  conversion.onProgress = (progress) => onProgress(progress);
  await conversion.execute();

  const buffer = output.target.buffer;
  if (!buffer) return null;
  return new File([buffer], `${file.name.replace(/\.[^.]+$/, "")}.mp4`, { type: "video/mp4" });
}
