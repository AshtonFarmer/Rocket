"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";

type SmokeParticle = {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  driftX: number;
  driftY: number;
};

type FlightMode = "cruise" | "writing";

const FLIRTY_MESSAGES = [
  "YOU LOOK GOOD FROM UP HERE ♥",
  "ARE YOU ALWAYS THIS CUTE?",
  "YOU MAKE MY HEART TAKE OFF",
  "COME FLY AWAY WITH ME ♥",
  "I’D CROSS THE SKY FOR YOU",
  "YOU’RE MY FAVORITE VIEW ♥",
  "I THINK THE SKY IS JEALOUS",
  "YOU + ME ABOVE THE CLOUDS",
  "HOW ARE YOU THIS PRETTY?",
  "CAUTION: CRUSH ON BOARD",
  "MEET ME IN THE CLOUDS ♥",
  "YOU’VE GOT ME FLYING ♥",
] as const;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

function Rocket() {
  return (
    <div className="rocket" aria-hidden="true">
      <div className="rocket-exhaust">
        <span className="flame flame-outer" />
        <span className="flame flame-inner" />
      </div>
      <div className="tail-ring" />
      <div className="fin fin-top" />
      <div className="fin fin-bottom" />
      <div className="rocket-shell">
        <span className="shell-highlight" />
        <span className="rocket-mark">R&ndash;02</span>
        <span className="porthole">
          <span className="porthole-shine" />
        </span>
        <span className="nose-glint" />
      </div>
    </div>
  );
}

function MountainLine() {
  return (
    <div className="mountains" aria-hidden="true">
      <div className="mountain mountain-back" />
      <div className="mountain mountain-front" />
      <div className="horizon-haze" />
    </div>
  );
}

export default function Home() {
  const sceneRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rocketRef = useRef<HTMLDivElement>(null);
  const rollRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const smokeRef = useRef(false);
  const autoFlirtRef = useRef(true);
  const flightModeRef = useRef<FlightMode>("cruise");
  const writingStartedAt = useRef(0);
  const nextAutoWriteAt = useRef(Number.POSITIVE_INFINITY);
  const lastFlirtIndex = useRef(-1);
  const manualRollStartedAt = useRef<number | null>(null);
  const lastSmokeAt = useRef(0);
  const timersRef = useRef<number[]>([]);
  const [smokeOn, setSmokeOn] = useState(false);
  const [autoFlirt, setAutoFlirt] = useState(true);
  const [status, setStatus] = useState("AUTO FLIRT ARMED");
  const [rollCount, setRollCount] = useState(0);
  const [skyMessage, setSkyMessage] = useState("YOU’RE MY FAVORITE VIEW ♥");
  const [messageShown, setMessageShown] = useState(false);
  const [isWriting, setIsWriting] = useState(false);

  const stars = Array.from({ length: 38 }, (_, index) => {
    const left = (index * 37 + 11) % 100;
    const top = (index * 53 + 7) % 67;
    const size = 1 + ((index * 7) % 3);
    const delay = -((index * 0.31) % 4);
    return { left, top, size, delay };
  });

  useEffect(() => {
    smokeRef.current = smokeOn;
  }, [smokeOn]);

  useEffect(() => {
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    const rocket = rocketRef.current;
    const rollElement = rollRef.current;
    if (!scene || !canvas || !rocket || !rollElement) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const particles: SmokeParticle[] = [];
    let frameId = 0;
    let width = 0;
    let height = 0;
    let lastFrame = performance.now();
    let cruiseStartedAt = performance.now();
    let cruisePhaseOffset = 0;
    let resumeAt = 0;
    nextAutoWriteAt.current = performance.now() + 4200;

    const resize = () => {
      const bounds = scene.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const addSmoke = (x: number, y: number, heading: number, now: number) => {
      const isSkywriting = flightModeRef.current === "writing";
      const interval = isSkywriting ? 20 : 34;
      if (!smokeRef.current || now - lastSmokeAt.current < interval) return;
      lastSmokeAt.current = now;

      const rocketLength = rocket.offsetWidth * 0.43;
      const angle = (heading * Math.PI) / 180;
      const tailX = x - Math.cos(angle) * rocketLength;
      const tailY = y - Math.sin(angle) * rocketLength;

      for (let index = 0; index < (isSkywriting ? 3 : 2); index += 1) {
        const maxLife = (isSkywriting ? 2200 : 1700) + Math.random() * 900;
        particles.push({
          x: tailX + (Math.random() - 0.5) * 7,
          y: tailY + (Math.random() - 0.5) * 7,
          radius: 3.5 + Math.random() * 4,
          life: maxLife,
          maxLife,
          driftX: -0.018 - Math.random() * 0.015,
          driftY: -0.008 - Math.random() * 0.018,
        });
      }
    };

    const drawSmoke = (elapsed: number) => {
      context.clearRect(0, 0, width, height);
      context.save();
      context.globalCompositeOperation = "screen";

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.life -= elapsed;
        if (particle.life <= 0) {
          particles.splice(index, 1);
          continue;
        }

        particle.x += particle.driftX * elapsed;
        particle.y += particle.driftY * elapsed;
        particle.radius += elapsed * 0.004;
        const progress = particle.life / particle.maxLife;
        const opacity = Math.sin(progress * Math.PI) * 0.42;
        const gradient = context.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius,
        );
        gradient.addColorStop(0, `rgba(255,255,255,${opacity})`);
        gradient.addColorStop(0.5, `rgba(236,242,255,${opacity * 0.72})`);
        gradient.addColorStop(1, "rgba(222,232,255,0)");
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    };

    const animate = (now: number) => {
      const elapsed = clamp(now - lastFrame, 0, 40);
      lastFrame = now;

      if (
        autoFlirtRef.current &&
        flightModeRef.current === "cruise" &&
        now >= nextAutoWriteAt.current
      ) {
        let nextIndex = Math.floor(Math.random() * FLIRTY_MESSAGES.length);
        if (nextIndex === lastFlirtIndex.current) {
          nextIndex = (nextIndex + 1) % FLIRTY_MESSAGES.length;
        }
        lastFlirtIndex.current = nextIndex;
        timersRef.current.forEach((timer) => window.clearTimeout(timer));
        timersRef.current = [];
        smokeRef.current = true;
        setSmokeOn(true);
        setSkyMessage(FLIRTY_MESSAGES[nextIndex]);
        setMessageShown(true);
        setIsWriting(true);
        setStatus("AUTO FLIRT");
        if (revealRef.current) revealRef.current.style.width = "0%";
        writingStartedAt.current = now + 350;
        flightModeRef.current = "writing";
        nextAutoWriteAt.current = Number.POSITIVE_INFINITY;
      }

      let x: number;
      let y: number;
      let dx: number;
      let dy: number;
      let heading: number;
      let writingProgress = 0;

      if (flightModeRef.current === "writing") {
        writingProgress = clamp((now - writingStartedAt.current) / 9000, 0, 1);
        const eased = 0.5 - Math.cos(writingProgress * Math.PI) / 2;
        x = -120 + (width + 240) * eased;
        y = height * (0.355 + 0.035 * Math.sin(writingProgress * Math.PI * 6));
        dx = (width + 240) * Math.sin(writingProgress * Math.PI) + 1;
        dy = height * 0.66 * Math.PI * Math.cos(writingProgress * Math.PI * 6);
        heading = clamp((Math.atan2(dy, dx) * 180) / Math.PI, -18, 18);
        if (revealRef.current) {
          const revealProgress = clamp((eased - 0.04) / 0.88, 0, 1);
          revealRef.current.style.width = `${revealProgress * 100}%`;
        }

        if (writingProgress >= 1) {
          flightModeRef.current = "cruise";
          setIsWriting(false);
          setStatus("MESSAGE DELIVERED");
          resumeAt = now + 620;
          cruiseStartedAt = resumeAt;
          cruisePhaseOffset = -Math.PI / 2;

          timersRef.current.push(
            window.setTimeout(() => {
              setStatus(
                autoFlirtRef.current
                  ? "AUTO FLIRT ARMED"
                  : smokeRef.current
                    ? "SMOKE ARMED"
                    : "FREE FLIGHT",
              );
            }, 2300),
            window.setTimeout(() => {
              setMessageShown(false);
            }, 7200),
          );
          nextAutoWriteAt.current = autoFlirtRef.current
            ? now + 10500
            : Number.POSITIVE_INFINITY;
        }
      } else {
        const time = (now - cruiseStartedAt) * 0.00019 + cruisePhaseOffset;
        x = width * 0.5 + width * 0.42 * Math.sin(time);
        y = height * 0.39 + height * 0.19 * Math.sin(time * 2 + 0.72);
        dx = width * 0.42 * Math.cos(time);
        dy = height * 0.38 * Math.cos(time * 2 + 0.72);
        heading = (Math.atan2(dy, dx) * 180) / Math.PI;
      }

      const liningUp =
        flightModeRef.current === "writing" && now < writingStartedAt.current;
      if (now < resumeAt || liningUp) {
        rocket.style.opacity = "0";
      } else {
        rocket.style.opacity = "1";
      }

      let roll = 0;
      const autoPhase = ((now - cruiseStartedAt) / 1000) % 11;
      if (flightModeRef.current === "cruise" && autoPhase > 6.9 && autoPhase < 8.2) {
        roll = ((autoPhase - 6.9) / 1.3) * 360;
      }

      if (manualRollStartedAt.current !== null) {
        const rollProgress = (now - manualRollStartedAt.current) / 1000;
        if (rollProgress < 1) {
          roll = rollProgress * 360;
        } else {
          manualRollStartedAt.current = null;
          setStatus(smokeRef.current ? "SMOKE ARMED" : "FREE FLIGHT");
        }
      }

      rocket.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${heading}deg)`;
      rollElement.style.transform = `perspective(420px) rotateX(${roll}deg)`;
      if (now >= resumeAt && !liningUp) addSmoke(x, y, heading, now);
      drawSmoke(elapsed);
      frameId = requestAnimationFrame(animate);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(scene);
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const triggerRoll = () => {
    if (flightModeRef.current === "writing") return;
    manualRollStartedAt.current = performance.now();
    setRollCount((count) => count + 1);
    setStatus("BARREL ROLL");
  };

  const toggleSmoke = () => {
    if (flightModeRef.current === "writing") return;
    const next = !smokeOn;
    smokeRef.current = next;
    setSmokeOn(next);
    setStatus(next ? "SMOKE ARMED" : "FREE FLIGHT");
  };

  const toggleAutoFlirt = () => {
    const next = !autoFlirt;
    autoFlirtRef.current = next;
    setAutoFlirt(next);
    nextAutoWriteAt.current = next
      ? performance.now() + 1600
      : Number.POSITIVE_INFINITY;
    setStatus(
      next
        ? "AUTO FLIRT ARMED"
        : smokeRef.current
          ? "SMOKE ARMED"
          : "FREE FLIGHT",
    );
  };

  const triggerNextFlirt = () => {
    if (flightModeRef.current === "writing") return;
    if (!autoFlirtRef.current) {
      autoFlirtRef.current = true;
      setAutoFlirt(true);
    }
    nextAutoWriteAt.current = performance.now() + 220;
    setStatus("NEW FLIRT INBOUND");
  };

  return (
    <main className="sky-page">
      <section
        className={`flight-scene ${messageShown ? "message-active" : ""} ${isWriting ? "is-writing" : ""}`}
        ref={sceneRef}
        aria-label="Interactive rocket flight"
      >
        <div className="sky-gradient" aria-hidden="true" />
        <div className="sun-glow" aria-hidden="true" />
        <div className="stars" aria-hidden="true">
          {stars.map((star, index) => (
            <i
              key={index}
              style={
                {
                  "--left": `${star.left}%`,
                  "--top": `${star.top}%`,
                  "--size": `${star.size}px`,
                  "--delay": `${star.delay}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>

        <div className="cloud cloud-a" aria-hidden="true" />
        <div className="cloud cloud-b" aria-hidden="true" />
        <div className="cloud cloud-c" aria-hidden="true" />
        <MountainLine />
        <canvas className="smoke-canvas" ref={canvasRef} aria-hidden="true" />

        <div className="sky-message-stage" aria-live="polite">
          <div className="sky-message-reveal" ref={revealRef}>
            <p className="sky-message-text">{skyMessage}</p>
          </div>
        </div>

        <div className="rocket-motion" ref={rocketRef}>
          <div className="rocket-roll" ref={rollRef}>
            <Rocket />
          </div>
        </div>

        <header className="flight-header">
          <a className="brand" href="#top" aria-label="Love, launched home">
            <span className="brand-orbit" aria-hidden="true"><i /></span>
            <span>LOVE, LAUNCHED.</span>
          </a>
          <div className="flight-status" role="status" aria-live="polite">
            <span className="status-light" />
            {status}
          </div>
          <button className="roll-button top-roll" type="button" onClick={triggerRoll} disabled={isWriting}>
            <span aria-hidden="true">↻</span>
            BARREL ROLL
          </button>
        </header>

        <div className="hero-copy" id="top">
          <p className="eyebrow">A RANDOM FLIRT. A VERY BIG SKY.</p>
          <h1>
            Some feelings
            <em>need more airspace.</em>
          </h1>
          <p className="hero-note">Let the rocket do the flirting.</p>
        </div>

        <div className="flight-controls" aria-label="Flight controls">
          <button
            className={`auto-toggle ${autoFlirt ? "is-on" : ""}`}
            type="button"
            role="switch"
            aria-checked={autoFlirt}
            onClick={toggleAutoFlirt}
          >
            <span className="step-number">01</span>
            <span className="step-copy">
              <small>FLIGHT MODE</small>
              <strong>AUTO FLIRT {autoFlirt ? "ON" : "OFF"}</strong>
            </span>
            <span className="auto-spark" aria-hidden="true"><i>✦</i><i>✦</i></span>
          </button>

          <button
            className={`smoke-toggle ${smokeOn ? "is-on" : ""}`}
            type="button"
            role="switch"
            aria-checked={smokeOn}
            onClick={toggleSmoke}
            disabled={isWriting}
          >
            <span className="step-number">02</span>
            <span className="step-copy">
              <small>SKYWRITER</small>
              <strong>SMOKE {smokeOn ? "ON" : "OFF"}</strong>
            </span>
            <span className="switch-track" aria-hidden="true"><i /></span>
          </button>

          <button className="roll-button mobile-roll" type="button" onClick={triggerRoll} disabled={isWriting}>
            <span aria-hidden="true">↻</span>
            ROLL IT{rollCount > 0 ? ` · ${rollCount}` : ""}
          </button>

          <button
            className="next-flirt-button"
            type="button"
            onClick={triggerNextFlirt}
            disabled={isWriting}
          >
            <span className="step-number">03</span>
            <span className="step-copy">
              <small>SKY MESSAGE</small>
              <strong>{isWriting ? "WRITING…" : "NEXT FLIRT"}</strong>
            </span>
            <i aria-hidden="true">↗</i>
          </button>
        </div>

        <div className="scroll-note" aria-hidden="true">
          <span />
          FLIGHT 01 / GOLDEN HOUR
        </div>
        <div className="grain" aria-hidden="true" />
      </section>
    </main>
  );
}
