import { useEffect, useRef, useState } from "react";
import {
  FastForward,
  Pause,
  Play,
  Repeat,
  Rewind,
  Volume2,
  VolumeX,
} from "lucide-react";

type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoData(): { title?: string; author?: string };
  mute(): void;
  unMute(): void;
  destroy(): void;
};

type YTNamespace = {
  Player: new (element: HTMLElement, options: unknown) => YTPlayer;
  PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (!apiPromise) {
    apiPromise = new Promise<void>((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve();
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.onerror = () => {
        apiPromise = null;
        reject(new Error("Pemutar YouTube gagal dimuat."));
      };
      document.head.appendChild(script);
    });
  }
  return apiPromise;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = String(total % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

// Lagu resmi di YouTube Music biasanya bernama kanal "Nama Artis - Topic".
function cleanArtist(author: string): string {
  return author.replace(/\s*-\s*Topic$/i, "").trim();
}

export default function ProfileMusicPlayer({ videoId }: { videoId: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const loopRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [muted, setMuted] = useState(false);
  const [loop, setLoop] = useState(false);
  const [error, setError] = useState("");
  const [thumbFailed, setThumbFailed] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    setReady(false);
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    setTitle("");
    setArtist("");
    setMuted(false);
    setError("");
    setThumbFailed(false);

    // YouTube mengganti elemen ini dengan iframe, jadi dibuat di luar kendali React.
    const mount = document.createElement("div");
    host.appendChild(mount);

    function readMeta(player: YTPlayer) {
      const data = player.getVideoData();
      if (data.title) setTitle(data.title);
      if (data.author) setArtist(cleanArtist(data.author));
      const total = player.getDuration();
      if (total > 0) setDuration(total);
    }

    loadYouTubeApi()
      .then(() => {
        if (cancelled || !window.YT) return;
        const YT = window.YT;
        playerRef.current = new YT.Player(mount, {
          videoId,
          playerVars: {
            controls: 0,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: { target: YTPlayer }) => {
              if (cancelled) return;
              readMeta(event.target);
              setReady(true);
            },
            onStateChange: (event: { data: number; target: YTPlayer }) => {
              if (cancelled) return;
              const state = YT.PlayerState;
              readMeta(event.target);
              if (event.data === state.PLAYING) setPlaying(true);
              if (event.data === state.PAUSED) setPlaying(false);
              if (event.data === state.ENDED) {
                if (loopRef.current) {
                  event.target.seekTo(0, true);
                  event.target.playVideo();
                } else {
                  setPlaying(false);
                  setCurrent(0);
                }
              }
            },
            onError: () => {
              if (cancelled) return;
              setError("Lagu ini tidak bisa diputar di sini.");
            },
          },
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Pemutar belum bisa dimuat.",
        );
      });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
      host.replaceChildren();
    };
  }, [videoId]);

  // Perbarui posisi lagu selama diputar.
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      setCurrent(player.getCurrentTime());
      const total = player.getDuration();
      if (total > 0) setDuration(total);
    }, 500);
    return () => window.clearInterval(timer);
  }, [playing]);

  function togglePlay() {
    const player = playerRef.current;
    if (!player || !ready) return;
    if (playing) player.pauseVideo();
    else player.playVideo();
  }

  function seek(seconds: number) {
    const player = playerRef.current;
    if (!player || !ready) return;
    const max = duration > 0 ? duration : seconds;
    const next = Math.max(0, Math.min(max, seconds));
    player.seekTo(next, true);
    setCurrent(next);
  }

  function toggleMute() {
    const player = playerRef.current;
    if (!player || !ready) return;
    if (muted) player.unMute();
    else player.mute();
    setMuted(!muted);
  }

  function toggleLoop() {
    loopRef.current = !loop;
    setLoop(!loop);
  }

  const progress = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;
  const musicUrl = `https://music.youtube.com/watch?v=${videoId}`;

  return (
    <div className="music-card">
      <div className="music-main">
        <a
          className="music-dots"
          href={musicUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Buka lagu di YouTube Music"
        >
          <span />
          <span />
          <span />
        </a>

        <div className="music-info">
          <span className="music-source">YOUTUBE MUSIC</span>
          <h3 className="music-artist">
            {artist || (ready ? "Lagu profil" : "Memuat lagu...")}
          </h3>
          <p className="music-song">{title || "\u00A0"}</p>
        </div>

        <div className="music-progress">
          <input
            type="range"
            min={0}
            max={duration > 0 ? duration : 1}
            step={0.5}
            value={Math.min(current, duration > 0 ? duration : 1)}
            disabled={!ready || duration <= 0}
            style={
              { "--music-progress": `${progress}%` } as React.CSSProperties
            }
            onChange={(event) => seek(Number(event.target.value))}
            aria-label="Posisi lagu"
          />
          <div className="music-time">
            <span>{formatTime(current)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="music-controls">
          <button
            type="button"
            className={muted ? "music-small is-active" : "music-small"}
            onClick={toggleMute}
            disabled={!ready}
            aria-label={muted ? "Nyalakan suara" : "Bisukan suara"}
            aria-pressed={muted}
          >
            {muted ? <VolumeX size={22} /> : <Volume2 size={22} />}
          </button>
          <button
            type="button"
            className="music-round"
            onClick={() => seek(current - 10)}
            disabled={!ready}
            aria-label="Mundur 10 detik"
          >
            <Rewind size={22} fill="currentColor" />
          </button>
          <button
            type="button"
            className="music-round music-play"
            onClick={togglePlay}
            disabled={!ready}
            aria-label={playing ? "Jeda" : "Putar"}
          >
            {playing ? (
              <Pause size={34} fill="currentColor" />
            ) : (
              <Play size={34} fill="currentColor" />
            )}
          </button>
          <button
            type="button"
            className="music-round"
            onClick={() => seek(current + 10)}
            disabled={!ready}
            aria-label="Maju 10 detik"
          >
            <FastForward size={22} fill="currentColor" />
          </button>
          <button
            type="button"
            className={loop ? "music-small is-active" : "music-small"}
            onClick={toggleLoop}
            aria-label={loop ? "Matikan ulang lagu" : "Ulangi lagu"}
            aria-pressed={loop}
          >
            <Repeat size={22} />
          </button>
        </div>

        {error && (
          <p className="music-error" role="alert">
            {error}{" "}
            <a href={musicUrl} target="_blank" rel="noreferrer">
              Buka di YouTube Music
            </a>
          </p>
        )}
      </div>

      <div className="music-cover">
        {/* Pemutar YouTube tetap dipasang di belakang gambar supaya audio bisa jalan. */}
        <div className="music-cover-video" ref={hostRef} />
        {!thumbFailed && (
          <img
            className="music-cover-img"
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            draggable={false}
            onError={() => setThumbFailed(true)}
          />
        )}
      </div>
    </div>
  );
}
