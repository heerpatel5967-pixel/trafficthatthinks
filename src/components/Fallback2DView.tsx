import React, { useEffect, useRef } from 'react';
import { SimulationEngine } from '../simulation/engine';
import { Approach, Vehicle } from '../types/traffic';
import { IntersectionGeometry } from '../simulation/intersection';

interface Fallback2DViewProps {
  engine: SimulationEngine;
}

export const Fallback2DView: React.FC<Fallback2DViewProps> = ({ engine }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const scale = width / 260; // 260m total span mapped to canvas

      // Clear dark background
      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, width, height);

      // Grid
      ctx.strokeStyle = '#101a2e';
      ctx.lineWidth = 1;
      const gridSize = 20 * scale;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Asphalt roads (16m wide)
      const roadWidthPx = 16 * scale;
      ctx.fillStyle = '#141c2c';
      // Vertical road
      ctx.fillRect(centerX - roadWidthPx / 2, 0, roadWidthPx, height);
      // Horizontal road
      ctx.fillRect(0, centerY - roadWidthPx / 2, width, roadWidthPx);

      // Yellow Center Medians
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      const stopLinePx = 14 * scale;

      // North median
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, centerY - stopLinePx);
      ctx.stroke();

      // South median
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + stopLinePx);
      ctx.lineTo(centerX, height);
      ctx.stroke();

      // West median
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(centerX - stopLinePx, centerY);
      ctx.stroke();

      // East median
      ctx.beginPath();
      ctx.moveTo(centerX + stopLinePx, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Dashed lane dividers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // N/S lane dividers
      const halfRoad = roadWidthPx / 2;
      const laneMid = halfRoad / 2;
      ctx.beginPath();
      ctx.moveTo(centerX - laneMid, 0);
      ctx.lineTo(centerX - laneMid, centerY - stopLinePx);
      ctx.moveTo(centerX + laneMid, 0);
      ctx.lineTo(centerX + laneMid, centerY - stopLinePx);
      ctx.moveTo(centerX - laneMid, centerY + stopLinePx);
      ctx.lineTo(centerX - laneMid, height);
      ctx.moveTo(centerX + laneMid, centerY + stopLinePx);
      ctx.lineTo(centerX + laneMid, height);

      // E/W lane dividers
      ctx.moveTo(0, centerY - laneMid);
      ctx.lineTo(centerX - stopLinePx, centerY - laneMid);
      ctx.moveTo(0, centerY + laneMid);
      ctx.lineTo(centerX - stopLinePx, centerY + laneMid);
      ctx.moveTo(centerX + stopLinePx, centerY - laneMid);
      ctx.lineTo(width, centerY - laneMid);
      ctx.moveTo(centerX + stopLinePx, centerY + laneMid);
      ctx.lineTo(width, centerY + laneMid);
      ctx.stroke();
      ctx.setLineDash([]);

      // Stop Lines (solid white)
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 3;
      // North (incoming is on left: centerX to centerX + halfRoad)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + stopLinePx);
      ctx.lineTo(centerX + halfRoad, centerY + stopLinePx);
      ctx.stroke();
      // South (incoming is -X: centerX - halfRoad to centerX)
      ctx.beginPath();
      ctx.moveTo(centerX - halfRoad, centerY - stopLinePx);
      ctx.lineTo(centerX, centerY - stopLinePx);
      ctx.stroke();
      // East (incoming is -Z: centerY - halfRoad to centerY)
      ctx.beginPath();
      ctx.moveTo(centerX + stopLinePx, centerY - halfRoad);
      ctx.lineTo(centerX + stopLinePx, centerY);
      ctx.stroke();
      // West (incoming is +Z: centerY to centerY + halfRoad)
      ctx.beginPath();
      ctx.moveTo(centerX - stopLinePx, centerY);
      ctx.lineTo(centerX - stopLinePx, centerY + halfRoad);
      ctx.stroke();

      // Signals indicator dots
      const signalState = engine.getSignalState();
      const drawSignal = (x: number, y: number, color: string) => {
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle =
          color === 'GREEN' ? '#10b981' : color === 'YELLOW' ? '#f59e0b' : '#ef4444';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      };

      drawSignal(centerX + 18, centerY + stopLinePx + 10, signalState.lights.North);
      drawSignal(centerX - 18, centerY - stopLinePx - 10, signalState.lights.South);
      drawSignal(centerX + stopLinePx + 10, centerY - 18, signalState.lights.East);
      drawSignal(centerX - stopLinePx - 10, centerY + 18, signalState.lights.West);

      // Upstream Detection Radar rings
      const detectDist = engine.getSettings().emergencyDetectionDistance * scale;
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(centerX + halfRoad / 2, centerY + stopLinePx + detectDist, 18, 0, Math.PI * 2);
      ctx.arc(centerX - halfRoad / 2, centerY - (stopLinePx + detectDist), 18, 0, Math.PI * 2);
      ctx.arc(centerX + stopLinePx + detectDist, centerY - halfRoad / 2, 18, 0, Math.PI * 2);
      ctx.arc(centerX - (stopLinePx + detectDist), centerY + halfRoad / 2, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Vehicles
      const vehicles = engine.getVehicles();
      const simTime = engine.getSimTime();

      for (const v of vehicles) {
        const tf = IntersectionGeometry.getVehicleWorldTransform(
          v.approach,
          v.laneIndex,
          v.position,
          v.inIntersection,
          v.intersectionProgress,
          v.turnDirection
        );

        // Convert world 3D (x, z) to canvas (X, Y)
        // In 3D: North is +Z, South is -Z, East is +X, West is -X
        const px = centerX + tf.x * scale;
        const py = centerY + tf.z * scale;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(-tf.rotationY + Math.PI);

        // Vehicle dimensions
        const vLen = (v.length || 4.2) * scale;
        const vWid = (v.width || 2.0) * scale;

        if (v.isEmergency) {
          // Flashing emergency glow
          const flash = Math.sin(simTime * 15) > 0;
          ctx.fillStyle = flash ? '#ef4444' : '#0066ff';
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 12;
        } else {
          ctx.fillStyle = v.color || '#38bdf8';
          ctx.shadowBlur = 0;
        }

        ctx.fillRect(-vWid / 2, -vLen / 2, vWid, vLen);
        ctx.restore();
      }

      // Compass label
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('N', centerX - 4, height - 12);
      ctx.fillText('S', centerX - 4, 20);
      ctx.fillText('E', width - 20, centerY + 4);
      ctx.fillText('W', 10, centerY + 4);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [engine]);

  return (
    <div className="relative w-full h-full bg-[#070b14] flex items-center justify-center p-2">
      <div className="absolute top-4 left-4 z-10 glass-panel px-3 py-1.5 rounded text-xs text-cyan-300 font-mono flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
        2D TELEMETRY OVERHEAD RADAR
      </div>
      <canvas
        ref={canvasRef}
        width={750}
        height={750}
        className="max-w-full max-h-full aspect-square rounded-xl border border-[#1f2f54] shadow-2xl"
      />
    </div>
  );
};
