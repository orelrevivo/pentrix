export interface CanvasPosition {
  x: number;
  y: number;
}

export function getTileSize(plan: string): number {
  switch (plan) {
    case "premium":
      return 180;
    case "featured":
      return 140;
    case "builder":
      return 100;
    default:
      return 70;
  }
}

export function findCanvasPosition(
  plan: string,
  existingProjects: Array<{ canvasX: number; canvasY: number; plan: string }>
): CanvasPosition {
  const size = getTileSize(plan);
  const boardSize = 3000;
  const center = boardSize / 2;

  let minRadius = 0;
  let maxRadius = boardSize / 2 - 100;

  if (plan === "premium" || plan === "featured") {
    maxRadius = 400;
  } else {
    minRadius = 400;
    maxRadius = 1200;
  }

  for (let attempt = 0; attempt < 100; attempt++) {
    const angle = Math.random() * 2 * Math.PI;
    const r = minRadius + Math.random() * (maxRadius - minRadius);
    const x = Math.round(center + r * Math.cos(angle) - size / 2);
    const y = Math.round(center + r * Math.sin(angle) - size / 2);

    let overlaps = false;
    for (const p of existingProjects) {
      const pSize = getTileSize(p.plan);
      const margin = 20;

      const left1 = x;
      const right1 = x + size;
      const top1 = y;
      const bottom1 = y + size;

      const left2 = p.canvasX;
      const right2 = p.canvasX + pSize;
      const top2 = p.canvasY;
      const bottom2 = p.canvasY + pSize;

      if (
        left1 - margin < right2 &&
        right1 + margin > left2 &&
        top1 - margin < bottom2 &&
        bottom1 + margin > top2
      ) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      return { x, y };
    }
  }

  const angle = Math.random() * 2 * Math.PI;
  const r = minRadius + Math.random() * (maxRadius - minRadius);
  return {
    x: Math.round(center + r * Math.cos(angle) - size / 2),
    y: Math.round(center + r * Math.sin(angle) - size / 2),
  };
}
