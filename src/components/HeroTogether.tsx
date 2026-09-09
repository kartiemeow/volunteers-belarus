"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconPaw, IconOldMan, IconCompass, IconTree } from "./icons";
import styles from "./HeroTogether.module.css";

const DIRECTIONS = [
  { Icon: IconPaw, label: "Приюты", caption: "Вы + забота о животных.", x: 130, y: 128 },
  { Icon: IconOldMan, label: "Забота о пожилых", caption: "Вы + поддержка тех, кому она нужна.", x: 370, y: 128 },
  { Icon: IconCompass, label: "Поиск людей", caption: "Вы + те, кто помогает найти.", x: 130, y: 356 },
  { Icon: IconTree, label: "Город", caption: "Вы + место, в котором мы живём.", x: 370, y: 356 },
];
const CENTER = { x: 250, y: 242 };

function connection(x: number, y: number, px: number, py: number) {
  const side = px < x ? -1 : 1;
  return `M${x} ${y}C${x + side * 65} ${y} ${px - side * 60} ${py} ${px} ${py}`;
}

export default function HeroTogether() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<SVGGElement>(null);
  const drawingRef = useRef<SVGSVGElement>(null);
  const captionId = useId();
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const active = focused ?? hovered ?? selected;

  useEffect(() => {
    const scene = sceneRef.current;
    const hub = hubRef.current;
    const drawing = drawingRef.current;
    if (!scene || !hub || !drawing) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const paths = drawing.querySelectorAll<SVGPathElement>("path");
    let position = { ...CENTER };
    let target = { ...CENTER };
    let frame = 0;
    let previousTime = 0;

    function draw() {
      hub!.setAttribute("transform", `translate(${position.x} ${position.y})`);
      paths.forEach((path, index) => {
        const direction = DIRECTIONS[index % DIRECTIONS.length];
        path.setAttribute("d", connection(position.x, position.y, direction.x, direction.y));
      });
    }

    function tick(time: number) {
      frame = 0;
      const elapsed = Math.min(time - previousTime, 64);
      previousTime = time;
      const amount = 1 - Math.exp(-elapsed / 110);
      position.x += (target.x - position.x) * amount;
      position.y += (target.y - position.y) * amount;
      const settled = Math.abs(target.x - position.x) + Math.abs(target.y - position.y) < 0.08;
      if (settled) position = { ...target };
      draw();
      if (!settled) frame = requestAnimationFrame(tick);
    }

    function animate() {
      if (frame || motion.matches || document.hidden) return;
      previousTime = performance.now();
      frame = requestAnimationFrame(tick);
    }

    function move(event: PointerEvent) {
      if (event.pointerType === "touch" || motion.matches) return;
      const rect = scene!.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = ((event.clientX - rect.left) / rect.width) * 500;
      const y = ((event.clientY - rect.top) / rect.height) * 500;
      target = {
        x: CENTER.x + Math.max(-32, Math.min(32, (x - CENTER.x) * 0.17)),
        y: CENTER.y + Math.max(-32, Math.min(32, (y - CENTER.y) * 0.17)),
      };
      animate();
    }

    function leave() {
      target = { ...CENTER };
      animate();
    }

    function reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      position = { ...CENTER };
      target = { ...CENTER };
      draw();
    }

    const observer = new ResizeObserver(reset);
    observer.observe(scene);
    scene.addEventListener("pointermove", move);
    scene.addEventListener("pointerleave", leave);
    scene.addEventListener("pointercancel", leave);
    motion.addEventListener("change", reset);
    document.addEventListener("visibilitychange", reset);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      scene.removeEventListener("pointermove", move);
      scene.removeEventListener("pointerleave", leave);
      scene.removeEventListener("pointercancel", leave);
      motion.removeEventListener("change", reset);
      document.removeEventListener("visibilitychange", reset);
    };
  }, []);

  return (
    <div
      ref={sceneRef}
      className={styles.scene}
      role="group"
      aria-label="Вместе: направления помощи"
      aria-describedby={captionId}
      onPointerLeave={() => setHovered(null)}
      onPointerCancel={() => setHovered(null)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setSelected(null);
          setHovered(null);
          setFocused(null);
        }
      }}
    >
      <svg ref={drawingRef} className={styles.drawing} viewBox="0 0 500 500" fill="none" aria-hidden="true">
        <g className={styles.connections}>
          {DIRECTIONS.map(({ label, x, y }) => (
            <path key={label} d={connection(CENTER.x, CENTER.y, x, y)} />
          ))}
        </g>
        <g className={styles.highlights}>
          {DIRECTIONS.map(({ label, x, y }, index) => (
            <path key={label} d={connection(CENTER.x, CENTER.y, x, y)} pathLength="1" data-active={active === index} />
          ))}
        </g>
        <g ref={hubRef} transform={`translate(${CENTER.x} ${CENTER.y})`}>
          <circle r="40" fill="#f1fff7" />
          <text y="6" textAnchor="middle" fill="#007b59" fontSize="19" fontWeight="600">Вы</text>
        </g>
      </svg>
      {DIRECTIONS.map(({ Icon, label, x, y }, index) => (
        <button
          key={label}
          type="button"
          className={styles.anchor}
          style={{ left: `${x / 5}%`, top: `${y / 5}%` }}
          data-active={active === index}
          aria-pressed={selected === index}
          onPointerEnter={(event) => {
            if (event.pointerType !== "touch") setHovered(index);
          }}
          onPointerLeave={() => setHovered(null)}
          onFocus={(event) => {
            if (event.currentTarget.matches(":focus-visible")) setFocused(index);
          }}
          onBlur={() => setFocused(null)}
          onClick={() => setSelected((current) => current === index ? null : index)}
        >
          <span className={styles.disc}><Icon className={styles.icon} /></span>
          <span className={styles.label}>{label}</span>
        </button>
      ))}
      <p id={captionId} className={styles.caption} aria-live="polite" aria-atomic="true">
        {active === null ? "У каждого доброго дела есть вы." : DIRECTIONS[active].caption}
      </p>
      <p className={styles.hint}>Выберите направление</p>
    </div>
  );
}
