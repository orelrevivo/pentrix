import React, { useRef, useState, useEffect } from "react";
import { ProjectTile } from "./ProjectTile";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Button } from "./ui";

interface Project {
  id: string;
  name: string;
  tagline: string;
  logoUrl: string;
  status: string;
  canvasX: number;
  canvasY: number;
  tileSize: string;
  plan: string;
}

interface CanvasBoardProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
  focusProject?: Project | null;
}

export const CanvasBoard: React.FC<CanvasBoardProps> = ({
  projects,
  selectedProject,
  onSelectProject,
  focusProject,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: -1000, y: -1150 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      setPan({
        x: -(1500 - width / 2),
        y: -(1500 - height / 2),
      });
    }
  }, []);

  useEffect(() => {
    if (focusProject && containerRef.current) {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      const size = parseInt(focusProject.tileSize) || 70;
      setPan({
        x: -(focusProject.canvasX + size / 2 - width / 2),
        y: -(focusProject.canvasY + size / 2 - height / 2),
      });
      setScale(1.2);
    }
  }, [focusProject]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey) {
        const zoomFactor = 0.05;
        const direction = e.deltaY < 0 ? 1 : -1;
        setScale((s) => Math.min(Math.max(s + direction * zoomFactor, 0.3), 2.0));
      } else {
        setPan((p) => ({
          x: p.x - e.deltaX,
          y: p.y - e.deltaY,
        }));
      }
    };

    container.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleNativeWheel);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".cursor-pointer") || (e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest(".cursor-pointer") || (e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
      className="relative w-full h-full overflow-hidden bg-canvas-bg border-y border-t-0 border-border-custom cursor-grab active:cursor-grabbing select-none"
      id="canvas"
    >
      <div
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
          transformOrigin: "center center",
          width: "3000px",
          height: "3000px",
        }}
        className="absolute bg-[radial-gradient(var(--dot-color)_1.5px,transparent_1.5px)] [background-size:24px_24px] transition-transform duration-75"
      >
        <div className="absolute top-[1500px] left-[1500px] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 rounded-full border border-primary-500/10 bg-primary-500/5 blur-3xl animate-pulse" />
          <div className="absolute text-center mt-36">
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary-500/40">Board Center</span>
          </div>
        </div>
        {projects.map((proj) => (
          <ProjectTile
            key={proj.id}
            project={proj}
            onClick={() => onSelectProject(proj)}
            isSelected={selectedProject?.id === proj.id}
          />
        ))}
      </div>
      <div className="absolute bottom-6 right-6 z-25 flex flex-col gap-2 bg-background/85 border border-border-custom p-2 rounded-xl shadow-xl backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setScale((s) => Math.min(s + 0.1, 2.0))}
          className="text-zinc-400 hover:text-foreground"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setScale((s) => Math.max(s - 0.1, 0.3))}
          className="text-zinc-400 hover:text-foreground"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setScale(1)}
          className="text-zinc-400 hover:text-foreground border-t border-border-custom mt-1 rounded-t-none"
        >
          <Maximize className="h-5 w-5" />
        </Button>
      </div>
      <div className="absolute bottom-6 left-6 z-25 bg-background/85 border border-border-custom px-3 py-1.5 rounded-lg shadow-xl backdrop-blur-md text-[10px] text-zinc-500">
        <span>Hold <kbd className="font-semibold text-foreground">Ctrl</kbd> + Scroll to Zoom. Drag to Pan.</span>
      </div>
    </div>
  );
};
