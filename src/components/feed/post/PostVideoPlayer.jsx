// PostVideoPlayer.jsx — inline video player with autoplay muted on scroll, click to unmute
import React, { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX, Maximize, Play, Pause } from 'lucide-react';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';

export default function PostVideoPlayer({ url, thumbnail }) {
  const videoRef = useRef(null);
  const [observerRef, isVisible] = useIntersectionObserver({ threshold: 0.5 });
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef(null);

  // Auto-play/pause on visibility
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVisible) {
      video.play().catch(() => {});
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }, [isVisible]);

  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setMuted(video.muted);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && video.duration) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (video) {
      video.currentTime = ratio * video.duration;
    }
  };

  const handleFullscreen = (e) => {
    e.stopPropagation();
    videoRef.current?.requestFullscreen?.();
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  };

  return (
    <div
      ref={observerRef}
      className="relative rounded-xl overflow-hidden bg-black mb-3 group cursor-pointer"
      onClick={togglePlay}
      onMouseMove={handleMouseMove}
    >
      <video
        ref={videoRef}
        src={url}
        poster={thumbnail}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        className="w-full max-h-[420px] object-contain"
      />

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-200 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Play/pause center indicator */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center">
              <Play className="w-6 h-6 text-white ml-1" />
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
          {/* Progress bar */}
          <div
            className="h-1 w-full bg-white/30 rounded-full mb-2 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); handleSeek(e); }}
          >
            <div
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={toggleMute}
              className="p-1 rounded text-white/80 hover:text-white transition-colors focus-visible:outline-none"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={handleFullscreen}
              className="p-1 rounded text-white/80 hover:text-white transition-colors focus-visible:outline-none"
              aria-label="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
