import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const STORE_URL = "https://rohisommiers.com";
const VIDEO_URL =
  "https://wqtuxffimzzyjnnkxcla.supabase.co/storage/v1/object/public/video/video.mp4";

const DisplayController = () => {
  const [showingVideo, setShowingVideo] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (!showingVideo) {
      timeoutId = setTimeout(() => {
        setShowingVideo(true);
      }, TIMEOUT_DURATION);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showingVideo]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showingVideo) {
        event.preventDefault();
        setShowingVideo(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showingVideo]);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Controls */}
      <div className="absolute right-5 top-5 z-10 flex items-center gap-2.5">
        {showingVideo && (
          <Button
            variant="ghost"
            onClick={() => setShowingVideo(false)}
            className="h-8 w-8 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white hover:scale-[200%] transition-transform border border-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="h-full w-full bg-black">
        {showingVideo ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          >
            <source src={VIDEO_URL} type="video/mp4" />
            Tu navegador no soporta el elemento video.
          </video>
        ) : (
          <iframe
            src={STORE_URL}
            className="h-full w-full border-none"
            title="ROHI Sommiers Store"
          />
        )}
      </div>
    </div>
  );
};

export default DisplayController;
