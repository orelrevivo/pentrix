import React, { useEffect, useState } from "react";
import { ProjectSidebar } from "./ProjectSidebar";

interface PhoneOverlayProps {
  project: any;
  onClose: () => void;
}

export const PhoneOverlay: React.FC<PhoneOverlayProps> = ({ project, onClose }) => {
  const [isRaised, setIsRaised] = useState(false);

  useEffect(() => {
    // Trigger the slide-up animation slightly after mount
    const timer = setTimeout(() => {
      setIsRaised(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsRaised(false);
    setTimeout(onClose, 400);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-500 pointer-events-auto ${isRaised ? 'opacity-100' : 'opacity-0'
          }`}
        onClick={handleClose}
      />
      <div
        className={`relative w-[400px] h-[800px] max-h-[90vh] bg-zinc-950 rounded-[3rem] border-[12px] border-zinc-800 shadow-2xl pointer-events-auto overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isRaised
            ? 'translate-y-0 scale-100 rotate-0'
            : 'translate-y-[100vh] scale-75 rotate-12'
          }`}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-zinc-950 rounded-b-3xl z-50 flex justify-center items-end pb-1">
          <div className="w-16 h-1.5 rounded-full bg-zinc-800"></div>
        </div>
        <div className="absolute inset-0 rounded-[2.5rem] shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] pointer-events-none z-40" />

        <div className="w-full h-full overflow-y-auto bg-background relative z-10 pt-8 pb-4">
          {/* A mock phone status bar */}
          <div className="absolute top-2 left-6 right-6 flex justify-between items-center text-[10px] text-zinc-500 font-medium z-50">
            <span>9:41</span>
            <div className="flex gap-1.5 items-center">
              <span>LTE</span>
              <div className="w-5 h-2.5 rounded-sm border border-zinc-500 relative">
                <div className="absolute inset-0.5 bg-zinc-500 rounded-[1px] w-[80%]"></div>
              </div>
            </div>
          </div>

          <div className="h-full">
            <ProjectSidebar project={project} onClose={handleClose} />
          </div>
        </div>
      </div>
    </div>
  );
};
