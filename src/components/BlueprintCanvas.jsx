import { useRef, useEffect } from 'react';

const W = 600;
const H = 400;

export default function BlueprintCanvas({ points, onDraw, disabled }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, W, H);
    if (!points || points.length === 0) return;

    //Lineas
    ctx.beginPath();
    ctx.strokeStyle = '#685f4a';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    //Puntos
    ctx.fillStyle = '#3182ce'; 
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [points]);

  const handlePointerDown = (e) => {
    if (disabled) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#3182ce';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    onDraw(x, y);
  };

  return (
    <div style={{ display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={handlePointerDown}
        style={{
          border: '2px solid #e2e8f0',
          borderRadius: '12px',
          cursor: disabled ? 'not-allowed' : 'crosshair',
          opacity: disabled ? 0.5 : 1,
          display: 'block',
          background: '#ffffff',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          touchAction: 'none'
        }}
      />
    </div>
  );
}