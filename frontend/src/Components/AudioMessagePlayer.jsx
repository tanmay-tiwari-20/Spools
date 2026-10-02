import { useEffect, useMemo, useRef, useState } from "react";
import { FiDownload, FiPause, FiPlay } from "react-icons/fi";

const formatTime = (seconds = 0) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, "0")}`;
};

const AudioMessagePlayer = ({
  src,
  duration = 0,
  waveform = [],
  ownMessage = false,
  preview = false,
  onDiscard,
  downloadName = "voice-message.webm",
}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(duration);
  const [playbackRate, setPlaybackRate] = useState(1);
  const waveformBars = useMemo(() => {
    if (Array.isArray(waveform) && waveform.length) return waveform.slice(0, 40);
    return Array.from({ length: 32 }, (_, index) => 0.2 + (Math.sin(index * 9.17) * 0.5 + 0.5) * 0.75);
  }, [waveform]);

  useEffect(() => {
    setCurrentTime(0);
    setMediaDuration(duration || 0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [src, duration]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
    } else {
      audio.pause();
    }
  };

  const seekTo = (event) => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextTime = Number(event.target.value);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const cyclePlaybackRate = () => {
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) audioRef.current.playbackRate = nextRate;
  };

  const progress = mediaDuration > 0 ? currentTime / mediaDuration : 0;
  const downloadUrl = src?.includes("res.cloudinary.com")
    ? src.replace("/upload/", "/upload/fl_attachment/")
    : src;
  const shellClass = preview
    ? "border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
    : ownMessage
      ? "bg-zinc-900 text-white shadow-sm dark:bg-indigo-600"
      : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100";
  const activeWaveClass = preview
    ? "bg-indigo-600 dark:bg-indigo-300"
    : ownMessage ? "bg-white" : "bg-indigo-500 dark:bg-indigo-400";
  const mutedWaveClass = preview
    ? "bg-zinc-300 dark:bg-zinc-700"
    : ownMessage ? "bg-white/45" : "bg-zinc-300 dark:bg-zinc-600";

  return (
    <div className={`group/audio flex ${preview ? "w-full" : "w-[min(340px,74vw)]"} max-w-full min-w-0 items-center gap-3 rounded-2xl p-3 transition-shadow ${shellClass}`}>
      <button
        type="button"
        onClick={togglePlayback}
        aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full shadow-sm transition duration-200 hover:scale-[1.04] active:scale-95 ${preview ? "bg-indigo-600 text-white shadow-indigo-900/15 hover:bg-indigo-500" : ownMessage ? "bg-white/10 text-white hover:bg-white/20" : "bg-white text-indigo-600 hover:bg-indigo-50 dark:bg-zinc-700 dark:text-indigo-300 dark:hover:bg-zinc-600"}`}
      >
        {isPlaying ? <FiPause size={17} /> : <FiPlay className="translate-x-px" size={17} />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex h-8 items-center gap-2 overflow-hidden" aria-hidden="true">
          {waveformBars.map((level, index) => (
            <span
              key={`${index}-${level}`}
              className={`w-[3px] shrink-0 rounded-full transition-colors duration-150 ${index / waveformBars.length <= progress ? activeWaveClass : mutedWaveClass}`}
              style={{ height: `${Math.max(4, Math.min(28, Number(level) * 28))}px` }}
            />
          ))}
          {isPlaying && <span className="sr-only">Playing</span>}
        </div>
        <input
          type="range"
          min="0"
          max={mediaDuration || 1}
          step="0.1"
          value={Math.min(currentTime, mediaDuration || 0)}
          onChange={seekTo}
          aria-label="Seek through voice message"
          className={`mt-1 block h-1 w-full cursor-pointer rounded-full ${ownMessage ? "accent-white" : "accent-indigo-600 dark:accent-indigo-400"}`}
        />
        <div className={`mt-1.5 flex items-center justify-between gap-2 text-[10px] font-medium tabular-nums ${preview ? "text-zinc-500 dark:text-zinc-400" : ownMessage ? "text-white/75" : "text-zinc-500 dark:text-zinc-400"}`}>
          <span>{formatTime(currentTime)} / {formatTime(mediaDuration)}</span>
          <span className="ml-auto flex items-center gap-1.5">
            <button type="button" onClick={cyclePlaybackRate} className={`rounded-md px-1.5 py-0.5 font-bold ${ownMessage ? "hover:bg-white/10" : "hover:bg-black/5 dark:hover:bg-white/10"}`} aria-label={`Playback speed ${playbackRate} times`}>{playbackRate}×</button>
            {preview ? (
              <button type="button" onClick={onDiscard} aria-label="Discard voice message" className="rounded-md px-1.5 py-0.5 font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40">Discard</button>
            ) : (
              <a href={downloadUrl} download={downloadName} aria-label="Save voice message" title="Save voice message" className="grid h-6 w-6 place-items-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"><FiDownload size={13} /></a>
            )}
          </span>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => {
          if (Number.isFinite(event.currentTarget.duration)) setMediaDuration(event.currentTarget.duration);
        }}
        onDurationChange={(event) => {
          if (Number.isFinite(event.currentTarget.duration)) setMediaDuration(event.currentTarget.duration);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          if (audioRef.current) audioRef.current.currentTime = 0;
        }}
        className="hidden"
      />
    </div>
  );
};

export default AudioMessagePlayer;
