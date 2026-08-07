import { useEffect, useRef } from "react";

type Node = { x: number; y: number; vx: number; vy: number; r: number };
type Packet = { a: number; b: number; t: number; speed: number };

/**
 * Layered ambient background: neural mesh + data packets + binary rain + aurora
 * + mouse-reactive glow. Single canvas, capped DPR, pauses when tab is hidden.
 */
export function NeuralBackground({ density = 1, showRadar = false }: { density?: number; showRadar?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let nodes: Node[] = [];
    let packets: Packet[] = [];
    let rain: { x: number; y: number; s: number; c: string }[] = [];
    const mouse = { x: -9999, y: -9999 };
    let raf = 0;
    let t = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(110, Math.round(((w * h) / 22000) * density));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.6 + 0.7,
      }));
      packets = Array.from({ length: Math.round(count / 4) }, () => ({
        a: Math.floor(Math.random() * count),
        b: Math.floor(Math.random() * count),
        t: Math.random(),
        speed: 0.002 + Math.random() * 0.004,
      }));
      rain = Array.from({ length: Math.round(w / 90) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        s: 0.3 + Math.random() * 0.8,
        c: Math.random() > 0.5 ? "1" : "0",
      }));
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const draw = () => {
      t += 1;
      ctx.clearRect(0, 0, w, h);

      // aurora / fog blobs
      const blobs = [
        { x: w * 0.18 + Math.sin(t / 420) * 60, y: h * 0.2, r: Math.max(w, h) * 0.34, c: "56,132,255" },
        { x: w * 0.82 + Math.cos(t / 380) * 70, y: h * 0.35, r: Math.max(w, h) * 0.3, c: "140,90,255" },
        { x: w * 0.5, y: h * 0.85 + Math.sin(t / 500) * 40, r: Math.max(w, h) * 0.3, c: "60,220,235" },
      ];
      for (const b of blobs) {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, `rgba(${b.c},0.13)`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      // binary rain
      ctx.font = "11px ui-monospace, monospace";
      for (const d of rain) {
        d.y += d.s;
        if (d.y > h + 20) {
          d.y = -20;
          d.x = Math.random() * w;
          d.c = Math.random() > 0.5 ? "1" : "0";
        }
        ctx.fillStyle = `rgba(120,190,255,${0.05 + d.s * 0.05})`;
        ctx.fillText(d.c, d.x, d.y);
      }

      // mouse glow
      if (mouse.x > -1000) {
        const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 240);
        g.addColorStop(0, "rgba(90,160,255,0.14)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      // nodes + links
      for (const n of nodes) {
        if (!reduce) {
          n.x += n.vx;
          n.y += n.vy;
        }
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const near = Math.hypot(dx, dy) < 160;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * (near ? 1.8 : 1), 0, Math.PI * 2);
        ctx.fillStyle = near ? "rgba(150,220,255,0.9)" : "rgba(140,180,235,0.5)";
        ctx.fill();
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          if (!a || !b) continue;
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 128) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(90,150,240,${(1 - dist / 128) * 0.22})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      // data packets travelling along links
      for (const p of packets) {
        const a = nodes[p.a];
        const b = nodes[p.b];
        if (!a || !b) continue;
        p.t += p.speed;
        if (p.t > 1) {
          p.t = 0;
          p.a = Math.floor(Math.random() * nodes.length);
          p.b = Math.floor(Math.random() * nodes.length);
        }
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        ctx.beginPath();
        ctx.arc(x, y, 1.7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(120,240,255,0.85)";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(120,240,255,0.9)";
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // radar sweep
      if (showRadar) {
        const cx = w * 0.5;
        const cy = h * 0.5;
        const R = Math.min(w, h) * 0.45;
        const ang = (t / 160) % (Math.PI * 2);
        const g = ctx.createConicGradient?.(ang, cx, cy);
        if (g) {
          g.addColorStop(0, "rgba(90,190,255,0.16)");
          g.addColorStop(0.08, "rgba(90,190,255,0)");
          g.addColorStop(1, "rgba(90,190,255,0)");
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, R, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [density, showRadar]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 grid-fade" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
