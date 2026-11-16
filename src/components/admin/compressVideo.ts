/**
 * Make a clip small before it leaves the computer: 480p (the longer side at most
 * 854px), at most 30 frames a second, H.264 at about 0.75 Mbit/s and AAC sound
 * at 96 kbit/s. That is roughly 6 MB a minute whatever the camera recorded: a
 * phone filming at 50 or 60 frames a second would otherwise cost about double.
 * The stored file is this copy, and it is all a visitor downloads. Returns null
 * when this browser cannot encode video; the original is then uploaded and
 * Cloudinary makes the small copy instead.
 */
const VIDEO_BITRATE = 750_000;
const AUDIO_BITRATE = 96_000;
const MAX_FPS = 30;

export async function compressVideo(file: File, onProgress: (progress: number) => void): Promise<File | null> {
  const mb = await import("mediabunny");
  if (!(await mb.canEncodeVideo("avc")) || !(await mb.canEncodeAudio("aac"))) return null;

  const encode = async (bitrate: number, bitrateMode: "constant" | "variable") => {
    const input = new mb.Input({ formats: mb.ALL_FORMATS, source: new mb.BlobSource(file) });
    const track = await input.getPrimaryVideoTrack();
    if (!track) return null;
    const scale = Math.min(1, 854 / Math.max(track.displayWidth, track.displayHeight));
    const even = (n: number) => Math.max(2, Math.round((n * scale) / 2) * 2);
    // The first packets are enough to tell 24 frames a second from 60.
    const { averagePacketRate } = await track.computePacketStats(120);

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
        quality: new mb.Quality({ bitrate, bitrateMode }),
        ...(averagePacketRate > MAX_FPS + 1 ? { frameRate: MAX_FPS } : {}),
      },
      audio: { codec: "aac", quality: new mb.Quality({ bitrate: AUDIO_BITRATE }), forceTranscode: true },
    });
    if (!conversion.isValid) return null;
    conversion.onProgress = (progress) => onProgress(progress);
    await conversion.execute();
    const buffer = output.target.buffer;
    return buffer ? { buffer, seconds: await input.computeDuration() } : null;
  };

  // A constant bitrate keeps the size predictable; not every encoder offers one.
  let result =
    (await encode(VIDEO_BITRATE, "constant").catch(() => null)) ?? (await encode(VIDEO_BITRATE, "variable"));
  if (!result) return null;

  // Some encoders still overshoot. If this one did by more than a third, encode
  // once more at a rate scaled to land on the target, and keep the smaller file.
  const target = (result.seconds * (VIDEO_BITRATE + AUDIO_BITRATE)) / 8;
  if (result.buffer.byteLength > target * 1.35) {
    const scaled = Math.max(350_000, Math.round(VIDEO_BITRATE * (target / result.buffer.byteLength)));
    const again = await encode(scaled, "variable").catch(() => null);
    if (again && again.buffer.byteLength < result.buffer.byteLength) result = again;
  }

  return new File([result.buffer], `${file.name.replace(/\.[^.]+$/, "")}.mp4`, { type: "video/mp4" });
}
