import { useState } from "react";
import { Plus } from "lucide-react";

interface FloatingAddWagonButtonProps {
  onClick: () => void;
}

export function FloatingAddWagonButton({ onClick }: FloatingAddWagonButtonProps) {
  const [isRippling, setIsRippling] = useState(false);

  const handleClick = () => {
    setIsRippling(true);
    setTimeout(() => setIsRippling(false), 600);
    onClick();
  };

  return (
    <>
      {/* Ripple animation keyframes */}
      <style>{`
        @keyframes fab-ripple {
          0% {
            transform: scale(0);
            opacity: 0.5;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }
        .fab-ripple-effect::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.4);
          animation: fab-ripple 0.6s ease-out forwards;
        }
      `}</style>

      <button
        type="button"
        onClick={handleClick}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full
          bg-primary text-primary-foreground
          shadow-lg shadow-primary/25
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:scale-110 hover:shadow-xl hover:shadow-primary/30
          active:scale-95
          overflow-hidden
          group
          ${isRippling ? "fab-ripple-effect" : ""}
        `}
        aria-label="Add new wagon"
        title="Add Wagon"
      >
        <Plus className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90" />

        {/* Pulse ring behind the button */}
        <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20 pointer-events-none" style={{ animationDuration: "2s" }} />
      </button>
    </>
  );
}
