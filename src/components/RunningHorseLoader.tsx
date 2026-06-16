import React, { useEffect, useState } from "react";

interface RunningHorseLoaderProps {
  onComplete: () => void;
}

export const RunningHorseLoader: React.FC<RunningHorseLoaderProps> = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // 4 seconds loading duration as specified
    const timer = setTimeout(() => {
      setFadeOut(true);
      const completionTimer = setTimeout(() => {
        onComplete();
      }, 500); // 500ms fade-out transition
      return () => clearTimeout(completionTimer);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-tr from-[#FF2E93] via-[#FF5E8C] to-[#FF85B8] text-white transition-opacity duration-500 ease-in-out ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="relative flex flex-col items-center space-y-6">
        {/* White Minimalist Running Horse Silhouette */}
        <div className="w-48 h-32 relative overflow-hidden flex items-center justify-center">
          {/* Custom animated horse silhouette SVG using keyframe animations for gallop motion */}
          <svg
            viewBox="0 0 120 80"
            className="w-full h-full fill-white animate-[gallop_0.8s_infinite_linear]"
          >
            <path d="M 110 25 C 105 21, 102 18, 98 16 C 94 14, 90 12, 85 14 C 82 15, 80 18, 77 15 C 73 12, 68 8, 63 10 C 58 11, 54 18, 52 23 C 50 28, 44 32, 38 34 C 33 35, 27 34, 21 32 C 16 30, 9 28, 6 33 C 4 37, 7 42, 11 44 C 15 47, 21 46, 26 50 C 31 53, 33 58, 36 62 C 38 65, 41 68, 45 68 C 49 68, 51 63, 53 59 C 55 54, 58 48, 63 46 C 68 44, 75 44, 80 47 C 84 49, 87 53, 90 57 C 92 60, 95 64, 99 64 C 102 63, 103 59, 103 55 C 103 49, 101 44, 99 39 C 97 34, 102 32, 105 31 C 109 30, 111 28, 110 25 Z" />
            
            {/* Multi-joint minimalist leg strokes executing running offsets */}
            <g className="animate-[frontLeg_0.4s_infinite_alternate_ease-in-out]">
              <path d="M 85 45L 90 65 L 102 70" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
            <g className="animate-[rearLeg_0.4s_infinite_alternate_ease-in-out_0.2s]">
              <path d="M 36 50 C 34 58, 31 66, 24 72 L 15 76" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
          </svg>
        </div>

        {/* Minimalist Calibration Info text */}
        <div className="text-center font-display space-y-1 select-none">
          <h1 className="text-lg font-bold tracking-[0.4em] text-white uppercase animate-pulse">
            SONATRACH
          </h1>
          <p className="text-[10px] font-mono text-white/80 uppercase tracking-widest">
            ENGINE CALIBRATION &bull; RUNNING SYSTEMS
          </p>
        </div>

        {/* Loading progress bar */}
        <div className="w-48 h-[2px] bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white animate-[loadingProgress_4s_linear]" />
        </div>
      </div>

      {/* Styled inject for custom gallop keyframes without requiring separate css files */}
      <style>{`
        @keyframes gallop {
          0% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-5px) rotate(1deg); }
          50% { transform: translateY(2px) rotate(-1deg); }
          75% { transform: translateY(-3px) rotate(0deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes frontLeg {
          0% { transform: rotate(-20deg) translate(-10px, 0px); }
          100% { transform: rotate(15deg) translate(5px, -5px); }
        }
        @keyframes rearLeg {
          0% { transform: rotate(15deg) translate(5px, -2px); }
          100% { transform: rotate(-25deg) translate(-12px, 2px); }
        }
        @keyframes loadingProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};
