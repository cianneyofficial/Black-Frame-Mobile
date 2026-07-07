import { useRef, useState } from "react";
import { MediaItem } from "@/hooks/types";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";

interface MediaSliderProps {
  media: MediaItem[];
}

export function MediaSlider({ media }: MediaSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  if (!media || media.length === 0) return null;

  const scrollTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
    setActiveIndex(index);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  };

  const handlePlayVideo = (id: string) => {
    const video = videoRefs.current[id];
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlayingId(id);
    } else {
      video.pause();
      setPlayingId(null);
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black" data-testid="media-slider">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {media.map((item) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-full snap-start snap-always"
            style={{ aspectRatio: "16/9" }}
          >
            {item.type === "image" ? (
              <img
                src={item.src}
                alt={item.name ?? "Photo"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="relative w-full h-full bg-black">
                <video
                  ref={(el) => { videoRefs.current[item.id] = el; }}
                  src={item.src}
                  className="w-full h-full object-contain"
                  playsInline
                  preload="metadata"
                  onEnded={() => setPlayingId(null)}
                  onPause={() => setPlayingId(prev => prev === item.id ? null : prev)}
                  data-testid={`video-${item.id}`}
                />
                {playingId !== item.id && (
                  <button
                    type="button"
                    onClick={() => handlePlayVideo(item.id)}
                    className="absolute inset-0 flex items-center justify-center group"
                    aria-label="Lire la vidéo"
                    data-testid={`play-${item.id}`}
                  >
                    <div className="w-14 h-14 rounded-full bg-black/60 border border-white/20 flex items-center justify-center backdrop-blur-sm group-active:scale-95 transition-transform">
                      <Play className="w-6 h-6 text-white ml-1" fill="white" />
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {media.length > 1 && (
        <>
          {activeIndex > 0 && (
            <button
              type="button"
              onClick={() => scrollTo(activeIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white"
              aria-label="Précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {activeIndex < media.length - 1 && (
            <button
              type="button"
              onClick={() => scrollTo(activeIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white"
              aria-label="Suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {media.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollTo(i)}
                className={`rounded-full transition-all ${
                  i === activeIndex
                    ? "w-5 h-1.5 bg-primary"
                    : "w-1.5 h-1.5 bg-white/40"
                }`}
                aria-label={`Média ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
