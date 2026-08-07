import { useEffect, useRef } from "react";

type V3 = { x: number; y: number; z: number };

function icosahedron(): { verts: V3[]; edges: [number, number][] } {
  const t = (1 + Math.sqrt(5)) / 2;
  const raw: [number, number, number][] = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ];
  const verts = raw.map(([x, y, z]) => {
    const l = Math.hypot(x, y, z);
    return { x: x / l, y: y / l, z: z / l };
  });
  const edges: [number, number][] = [];
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      const a = verts[i]!;
      const b = verts[j]!;
      if (Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < 1.2) edges.push([i, j]);
    }
  }
  return { verts, edges };
}

/**
 * Holographic AI Core — a rotating, glowing wireframe neural processor with an
 * orbiting particle field. Rendered on canvas with 3D projection (no WebGL cost).
 */
export function AICore({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { verts, edges } = icosahedron();
    const shells = [1, 0.62, 0.34];
    const particles = Array.from({ length: 220 }, () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      return {
        theta,
        phi,
        r: 1.18 + Math.random() * 0.55,
        speed: 0.002 + Math.random() * 0.006,
        size: Math.random() * 1.5 + 0.4,
      };
    });

    let w = 0;
    let h = 0;
    let raf = 0;
    let rx = 0;
    let ry = 0;
    let tx = 0;
    let ty = 0;
    let time = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      tx = ((e.clientY - rect.top) / rect.height - 0.5) * 0.7;
      ty = ((e.clientX - rect.left) / rect.width - 0.5) * 0.9;
    };

    const project = (p: V3, scale: number) => {
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      let { x, y, z } = p;
      let y2 = y * cosX - z * sinX;
      let z2 = y * sinX + z * cosX;
      let x2 = x * cosY + z2 * sinY;
      z2 = -x * sinY + z2 * cosY;
      const persp = 2.6 / (2.6 + z2);
      return { x: w / 2 + x2 * scale * persp, y: h / 2 + y2 * scale * persp, depth: persp };
    };

    const loop = () => {
      time += 1;
      rx += (tx - rx) * 0.05 + 0.0016;
      ry += (ty - ry) * 0.05 + 0.0042;
      ctx.clearRect(0, 0, w, h);
      const base = Math.min(w, h) * 0.3;
      const pulse = 1 + Math.sin(time / 42) * 0.035;

      // core glow
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, base * 1.9);
      g.addColorStop(0, "rgba(90,170,255,0.35)");
      g.addColorStop(0.35, "rgba(80,120,255,0.12)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // inner molten core
      const cg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, base * 0.34 * pulse);
      cg.addColorStop(0, "rgba(220,245,255,0.95)");
      cg.addColorStop(0.5, "rgba(110,190,255,0.55)");
      cg.addColorStop(1, "rgba(90,120,255,0)");
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, base * 0.34 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = cg;
      ctx.fill();

      // wireframe shells
      shells.forEach((s, si) => {
        const scale = base * s * pulse;
        const alpha = 0.55 - si * 0.13;
        edges.forEach(([i, j], ei) => {
          const a = project(verts[i]!, scale);
          const b = project(verts[j]!, scale);
          const flow = (Math.sin(time / 30 + ei + si * 2) + 1) / 2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle =
            si === 0
              ? `rgba(120,220,255,${alpha * (0.4 + flow * 0.6)})`
              : `rgba(140,140,255,${alpha * (0.3 + flow * 0.5)})`;
          ctx.lineWidth = si === 0 ? 1.1 : 0.7;
          ctx.stroke();
        });
        verts.forEach((v) => {
          const p = project(v, scale);
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.1 * p.depth, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(200,240,255,0.9)";
          ctx.shadowBlur = 12;
          ctx.shadowColor = "rgba(110,200,255,0.9)";
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      });

      // orbiting particles
      for (const p of particles) {
        p.theta += p.speed;
        const v = {
          x: Math.sin(p.phi) * Math.cos(p.theta) * p.r,
          y: Math.cos(p.phi) * p.r,
          z: Math.sin(p.phi) * Math.sin(p.theta) * p.r,
        };
        const pr = project(v, base);
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, p.size * pr.depth, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160,225,255,${0.25 + pr.depth * 0.5})`;
        ctx.fill();
      }

      // scanning ring
      const ringR = base * (1.35 + Math.sin(time / 90) * 0.06);
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, ringR, ringR * 0.3, Math.sin(time / 200) * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(120,200,255,0.28)";
      ctx.lineWidth = 1;
      ctx.stroke();

      raf = requestAnimationFrame(loop);
    };

    resize();
    loop();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return <canvas ref={ref} className={`h-full w-full ${className}`} aria-hidden />;
}
