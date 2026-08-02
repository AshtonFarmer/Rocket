"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };
type RawStroke = Array<[number, number]>;
type RoutePoint = Point & { draw: boolean; travel: number };
type SmokeParticle = Point & {
  radius: number;
  life: number;
  maxLife: number;
  driftX: number;
  driftY: number;
  alpha: number;
};

const FLIRTY_MESSAGES = [
  "HEY CUTIE",
  "YOU LOOK GOOD",
  "MY FAVORITE VIEW",
  "CRUSH ON BOARD",
  "YOU MAKE ME SOAR",
  "COME FLY WITH ME",
  "LOOKING CUTE",
  "YOU GOT ME FLYING",
  "I LIKE YOUR FACE",
] as const;

const STROKE_FONT: Record<string, RawStroke[]> = {
  A: [
    [[0, 1], [0.5, 0], [1, 1]],
    [[0.2, 0.58], [0.8, 0.58]],
  ],
  B: [
    [[0, 1], [0, 0], [0.55, 0], [0.88, 0.12], [0.88, 0.36], [0.58, 0.5], [0, 0.5]],
    [[0.58, 0.5], [0.92, 0.63], [0.92, 0.86], [0.58, 1], [0, 1]],
  ],
  C: [[[1, 0.14], [0.78, 0.02], [0.28, 0.02], [0.04, 0.25], [0.04, 0.75], [0.28, 0.98], [0.78, 0.98], [1, 0.84]]],
  D: [[[0, 1], [0, 0], [0.5, 0], [0.9, 0.2], [0.9, 0.8], [0.5, 1], [0, 1]]],
  E: [
    [[0.95, 0], [0, 0], [0, 1], [0.95, 1]],
    [[0, 0.5], [0.73, 0.5]],
  ],
  F: [
    [[0, 1], [0, 0], [0.95, 0]],
    [[0, 0.5], [0.73, 0.5]],
  ],
  G: [[[1, 0.17], [0.78, 0.02], [0.28, 0.02], [0.04, 0.25], [0.04, 0.75], [0.28, 0.98], [0.8, 0.98], [1, 0.78], [1, 0.56], [0.58, 0.56]]],
  H: [
    [[0, 0], [0, 1]],
    [[1, 0], [1, 1]],
    [[0, 0.5], [1, 0.5]],
  ],
  I: [
    [[0.08, 0], [0.92, 0]],
    [[0.5, 0], [0.5, 1]],
    [[0.08, 1], [0.92, 1]],
  ],
  J: [[[0.08, 0], [1, 0], [1, 0.72], [0.82, 0.96], [0.38, 0.98], [0.08, 0.78]]],
  K: [
    [[0, 0], [0, 1]],
    [[0.95, 0], [0, 0.58], [1, 1]],
  ],
  L: [[[0, 0], [0, 1], [0.95, 1]]],
  M: [[[0, 1], [0, 0], [0.5, 0.6], [1, 0], [1, 1]]],
  N: [[[0, 1], [0, 0], [1, 1], [1, 0]]],
  O: [[[0.5, 0], [0.18, 0.06], [0.02, 0.3], [0.02, 0.7], [0.18, 0.94], [0.5, 1], [0.82, 0.94], [0.98, 0.7], [0.98, 0.3], [0.82, 0.06], [0.5, 0]]],
  P: [[[0, 1], [0, 0], [0.56, 0], [0.9, 0.14], [0.9, 0.38], [0.56, 0.52], [0, 0.52]]],
  Q: [
    [[0.5, 0], [0.18, 0.06], [0.02, 0.3], [0.02, 0.7], [0.18, 0.94], [0.5, 1], [0.82, 0.94], [0.98, 0.7], [0.98, 0.3], [0.82, 0.06], [0.5, 0]],
    [[0.6, 0.66], [1, 1]],
  ],
  R: [
    [[0, 1], [0, 0], [0.55, 0], [0.9, 0.14], [0.9, 0.38], [0.55, 0.52], [0, 0.52]],
    [[0.5, 0.52], [1, 1]],
  ],
  S: [[[0.94, 0.14], [0.72, 0.02], [0.28, 0.02], [0.06, 0.2], [0.14, 0.42], [0.78, 0.58], [0.94, 0.78], [0.72, 0.98], [0.25, 0.98], [0.04, 0.84]]],
  T: [
    [[0, 0], [1, 0]],
    [[0.5, 0], [0.5, 1]],
  ],
  U: [[[0, 0], [0, 0.7], [0.18, 0.94], [0.5, 1], [0.82, 0.94], [1, 0.7], [1, 0]]],
  V: [[[0, 0], [0.5, 1], [1, 0]]],
  W: [[[0, 0], [0.2, 1], [0.5, 0.48], [0.8, 1], [1, 0]]],
  X: [
    [[0, 0], [1, 1]],
    [[1, 0], [0, 1]],
  ],
  Y: [
    [[0, 0], [0.5, 0.5], [1, 0]],
    [[0.5, 0.5], [0.5, 1]],
  ],
  Z: [[[0, 0], [1, 0], [0, 1], [1, 1]]],
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

const lerpPoint = (a: Point, b: Point, amount: number): Point => ({
  x: a.x + (b.x - a.x) * amount,
  y: a.y + (b.y - a.y) * amount,
});

const normalize = (vector: Point): Point => {
  const length = Math.hypot(vector.x, vector.y) || 1;
  return { x: vector.x / length, y: vector.y / length };
};

const tangentBetween = (a: Point, b: Point) =>
  normalize({ x: b.x - a.x, y: b.y - a.y });

function roundedStroke(points: Point[]) {
  if (points.length < 3) return points;
  const result: Point[] = [points[0]];

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const corner = points[index];
    const next = points[index + 1];
    const entry = lerpPoint(previous, corner, 0.82);
    const exit = lerpPoint(corner, next, 0.18);
    result.push(entry);
    for (let step = 1; step <= 6; step += 1) {
      const amount = step / 6;
      const inverse = 1 - amount;
      result.push({
        x: inverse * inverse * entry.x + 2 * inverse * amount * corner.x + amount * amount * exit.x,
        y: inverse * inverse * entry.y + 2 * inverse * amount * corner.y + amount * amount * exit.y,
      });
    }
  }

  result.push(points[points.length - 1]);
  return result;
}

function cubicConnector(
  start: Point,
  startTangent: Point,
  end: Point,
  endTangent: Point,
) {
  const gap = distance(start, end);
  const reach = clamp(gap * 0.38, 24, 130);
  const controlA = {
    x: start.x + startTangent.x * reach,
    y: start.y + startTangent.y * reach,
  };
  const controlB = {
    x: end.x - endTangent.x * reach,
    y: end.y - endTangent.y * reach,
  };
  const steps = Math.max(10, Math.ceil(gap / 12));
  const result: Point[] = [];

  for (let index = 0; index <= steps; index += 1) {
    const amount = index / steps;
    const inverse = 1 - amount;
    result.push({
      x:
        inverse ** 3 * start.x +
        3 * inverse * inverse * amount * controlA.x +
        3 * inverse * amount * amount * controlB.x +
        amount ** 3 * end.x,
      y:
        inverse ** 3 * start.y +
        3 * inverse * inverse * amount * controlA.y +
        3 * inverse * amount * amount * controlB.y +
        amount ** 3 * end.y,
    });
  }
  return result;
}

function addRoutePoints(route: RoutePoint[], points: Point[], draw: boolean) {
  points.forEach((point) => {
    const previous = route.at(-1);
    if (!previous) {
      route.push({ ...point, draw, travel: 0 });
      return;
    }

    const gap = distance(previous, point);
    if (gap < 0.01) {
      if (previous.draw !== draw) {
        route.push({ ...point, draw, travel: previous.travel + 0.0001 });
      }
      return;
    }

    const drawsSegment = previous.draw && draw;
    route.push({
      ...point,
      draw,
      travel: previous.travel + gap * (drawsSegment ? 1 : 0.42),
    });
  });
}

function wrapMessage(message: string, maxCharacters: number) {
  const words = message.split(" ");
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharacters || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function lineUnits(line: string) {
  return Array.from(line).reduce(
    (total, character, index) =>
      total + (character === " " ? 0.62 : 1) + (index ? 0.16 : 0),
    0,
  );
}

function buildMessageRoute(
  message: string,
  viewportWidth: number,
  viewportHeight: number,
  startTail: Point,
  startTangent: Point,
) {
  const lines = wrapMessage(message, viewportWidth < 620 ? 12 : 18);
  const widestLine = Math.max(...lines.map(lineUnits));
  const scale = Math.min(
    (viewportWidth * (viewportWidth < 620 ? 0.82 : 0.72)) / widestLine,
    viewportWidth < 620 ? 34 : 62,
    (viewportHeight * 0.34) / (lines.length * 1.62),
  );
  const lineGap = scale * 1.62;
  const blockHeight = scale + (lines.length - 1) * lineGap;
  const startY = clamp(
    viewportHeight * 0.28 - blockHeight * 0.18,
    viewportHeight * 0.18,
    viewportHeight * 0.34,
  );
  const strokes: Array<{ points: Point[]; line: number }> = [];

  lines.forEach((line, lineIndex) => {
    const width = lineUnits(line) * scale;
    let cursor = (viewportWidth - width) / 2;

    Array.from(line).forEach((character) => {
      if (character === " ") {
        cursor += scale * 0.78;
        return;
      }
      const glyph = STROKE_FONT[character] ?? STROKE_FONT.X;
      glyph.forEach((stroke) => {
        const transformed = stroke.map(([x, y]) => ({
          x: cursor + x * scale,
          y: startY + lineIndex * lineGap + y * scale,
        }));
        strokes.push({ points: roundedStroke(transformed), line: lineIndex });
      });
      cursor += scale * 1.16;
    });
  });

  const route: RoutePoint[] = [];
  let previousPoint = startTail;
  let previousTangent = startTangent;
  let previousLine = strokes[0]?.line ?? 0;

  strokes.forEach((stroke) => {
    const first = stroke.points[0];
    const firstTangent = tangentBetween(stroke.points[0], stroke.points[1] ?? stroke.points[0]);

    if (stroke.line !== previousLine) {
      const exitRight = { x: viewportWidth + 90, y: previousPoint.y - scale * 0.35 };
      const aboveRight = { x: viewportWidth + 110, y: -70 };
      const aboveLeft = { x: -110, y: -70 };
      const enterLeft = { x: -70, y: first.y - scale * 0.25 };
      addRoutePoints(route, cubicConnector(previousPoint, previousTangent, exitRight, { x: 1, y: 0 }), false);
      addRoutePoints(route, cubicConnector(exitRight, { x: 1, y: 0 }, aboveRight, { x: 0, y: -1 }), false);
      addRoutePoints(route, cubicConnector(aboveRight, { x: -1, y: 0 }, aboveLeft, { x: -1, y: 0 }), false);
      addRoutePoints(route, cubicConnector(aboveLeft, { x: 0, y: 1 }, enterLeft, { x: 1, y: 0 }), false);
      addRoutePoints(route, cubicConnector(enterLeft, { x: 1, y: 0 }, first, firstTangent), false);
    } else {
      addRoutePoints(route, cubicConnector(previousPoint, previousTangent, first, firstTangent), false);
    }

    addRoutePoints(route, stroke.points, true);
    previousPoint = stroke.points.at(-1) ?? first;
    previousTangent = tangentBetween(
      stroke.points.at(-2) ?? previousPoint,
      previousPoint,
    );
    previousLine = stroke.line;
  });

  const departure = {
    x: viewportWidth + 150,
    y: clamp(previousPoint.y - viewportHeight * 0.08, 80, viewportHeight * 0.48),
  };
  addRoutePoints(
    route,
    cubicConnector(previousPoint, previousTangent, departure, { x: 1, y: -0.08 }),
    false,
  );

  return route;
}

function pointOnRoute(route: RoutePoint[], travel: number) {
  let low = 0;
  let high = route.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (route[middle].travel < travel) low = middle + 1;
    else high = middle;
  }

  const upperIndex = clamp(low, 1, route.length - 1);
  const lower = route[upperIndex - 1];
  const upper = route[upperIndex];
  const span = upper.travel - lower.travel || 1;
  const amount = clamp((travel - lower.travel) / span, 0, 1);
  const point = lerpPoint(lower, upper, amount);
  const tangent = tangentBetween(lower, upper);
  return { point, tangent, draw: lower.draw && upper.draw };
}

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
        <span className="porthole"><span className="porthole-shine" /></span>
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
  const [currentMessage, setCurrentMessage] = useState("A little surprise is on the way");

  const stars = Array.from({ length: 38 }, (_, index) => ({
    left: (index * 37 + 11) % 100,
    top: (index * 53 + 7) % 67,
    size: 1 + ((index * 7) % 3),
    delay: -((index * 0.31) % 4),
  }));

  useEffect(() => {
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    const rocket = rocketRef.current;
    const rollElement = rollRef.current;
    if (!scene || !canvas || !rocket || !rollElement) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const sprite = document.createElement("canvas");
    sprite.width = 64;
    sprite.height = 64;
    const spriteContext = sprite.getContext("2d");
    if (spriteContext) {
      const gradient = spriteContext.createRadialGradient(32, 32, 1, 32, 32, 31);
      gradient.addColorStop(0, "rgba(255,255,255,0.98)");
      gradient.addColorStop(0.28, "rgba(249,251,255,0.78)");
      gradient.addColorStop(0.68, "rgba(231,239,252,0.28)");
      gradient.addColorStop(1, "rgba(220,231,250,0)");
      spriteContext.fillStyle = gradient;
      spriteContext.fillRect(0, 0, 64, 64);
    }

    const particles: SmokeParticle[] = [];
    let width = 0;
    let height = 0;
    let frameId = 0;
    let lastFrame = performance.now();
    let cruiseStartedAt = performance.now();
    let nextMessageAt = performance.now() + 4300;
    let lastMessageIndex = -1;
    let route: RoutePoint[] | null = null;
    let routeStartedAt = 0;
    let lastSmokePoint: Point | null = null;
    let smokeFadeStartedAt: number | null = null;
    let mode: "cruise" | "writing" = "cruise";
    const smokeHoldDuration = 1000;
    const smokeFadeDuration = 2600;

    const resize = () => {
      const bounds = scene.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const changed = Math.abs(width - bounds.width) > 3 || Math.abs(height - bounds.height) > 3;
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      if (changed && mode === "writing") {
        const now = performance.now();
        mode = "cruise";
        route = null;
        cruiseStartedAt = now;
        smokeFadeStartedAt = now;
        nextMessageAt = now + smokeFadeDuration + 800;
        lastSmokePoint = null;
      }
    };

    const emitSmoke = (point: Point) => {
      const makeParticle = (wisp: boolean): SmokeParticle => {
        const maxLife = 60000 + Math.random() * 8000;
        return {
          x: point.x + (Math.random() - 0.5) * (wisp ? 6 : 2.6),
          y: point.y + (Math.random() - 0.5) * (wisp ? 6 : 2.6),
          radius: (wisp ? 3 : 3.2) + Math.random() * (wisp ? 3 : 1.8),
          life: maxLife,
          maxLife,
          driftX: (Math.random() - 0.45) * 0.00045,
          driftY: -0.00025 - Math.random() * 0.00035,
          alpha: wisp ? 0.18 : 0.46,
        };
      };
      particles.push(makeParticle(false));
      if (Math.random() > 0.63) particles.push(makeParticle(true));
      if (particles.length > 1800) particles.splice(0, particles.length - 1800);
    };

    const extendSmokeTrail = (point: Point, draw: boolean) => {
      if (!draw) {
        lastSmokePoint = null;
        return;
      }
      if (!lastSmokePoint || distance(lastSmokePoint, point) > 36) {
        lastSmokePoint = point;
        emitSmoke(point);
        return;
      }

      const gap = distance(lastSmokePoint, point);
      const spacing = width < 620 ? 2.2 : 2.8;
      const steps = Math.max(1, Math.ceil(gap / spacing));
      for (let index = 1; index <= steps; index += 1) {
        emitSmoke(lerpPoint(lastSmokePoint, point, index / steps));
      }
      lastSmokePoint = point;
    };

    const drawSmoke = (elapsed: number, now: number) => {
      context.clearRect(0, 0, width, height);
      let layerOpacity = 1;
      let fadeProgress = 0;
      if (smokeFadeStartedAt !== null && now >= smokeFadeStartedAt) {
        fadeProgress = clamp(
          (now - smokeFadeStartedAt) / smokeFadeDuration,
          0,
          1,
        );
        layerOpacity = 1 - fadeProgress * fadeProgress * (3 - 2 * fadeProgress);
        if (fadeProgress >= 1) {
          particles.length = 0;
          smokeFadeStartedAt = null;
        }
      }
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
        particle.radius += elapsed * 0.00018;
        const age = 1 - particle.life / particle.maxLife;
        const fadeIn = clamp(age / 0.035, 0, 1);
        context.globalAlpha = particle.alpha * fadeIn * layerOpacity;
        const diameter = particle.radius * 3.4 * (1 + fadeProgress * 0.55);
        context.drawImage(
          sprite,
          particle.x - diameter / 2,
          particle.y - diameter / 2,
          diameter,
          diameter,
        );
      }
      context.restore();
    };

    const startWriting = (
      now: number,
      rocketX: number,
      rocketY: number,
      heading: number,
    ) => {
      let messageIndex = Math.floor(Math.random() * FLIRTY_MESSAGES.length);
      if (messageIndex === lastMessageIndex) {
        messageIndex = (messageIndex + 1) % FLIRTY_MESSAGES.length;
      }
      lastMessageIndex = messageIndex;
      const message = FLIRTY_MESSAGES[messageIndex];
      const radians = (heading * Math.PI) / 180;
      const tailOffset = rocket.offsetWidth * 0.43;
      const startTangent = { x: Math.cos(radians), y: Math.sin(radians) };
      const startTail = {
        x: rocketX - startTangent.x * tailOffset,
        y: rocketY - startTangent.y * tailOffset,
      };
      route = buildMessageRoute(message, width, height, startTail, startTangent);
      routeStartedAt = now;
      mode = "writing";
      nextMessageAt = Number.POSITIVE_INFINITY;
      particles.length = 0;
      smokeFadeStartedAt = null;
      lastSmokePoint = null;
      setCurrentMessage(message);
    };

    const animate = (now: number) => {
      const elapsed = clamp(now - lastFrame, 0, 42);
      lastFrame = now;
      const tailOffset = rocket.offsetWidth * 0.43;
      let rocketX = -130;
      let rocketY = height * 0.3;
      let heading = 0;
      let roll = 0;

      if (mode === "writing" && route && route.length > 1) {
        const speed = width < 620 ? 90 : 118;
        const travelled = (now - routeStartedAt) * (speed / 1000);
        const routeLength = route.at(-1)?.travel ?? 0;

        if (travelled >= routeLength) {
          mode = "cruise";
          route = null;
          cruiseStartedAt = now;
          smokeFadeStartedAt = now + smokeHoldDuration;
          nextMessageAt =
            now + smokeHoldDuration + smokeFadeDuration + 1000;
          lastSmokePoint = null;
          rocket.style.opacity = "0";
        } else {
          const routeState = pointOnRoute(route, travelled);
          heading = (Math.atan2(routeState.tangent.y, routeState.tangent.x) * 180) / Math.PI;
          rocketX = routeState.point.x + routeState.tangent.x * tailOffset;
          rocketY = routeState.point.y + routeState.tangent.y * tailOffset;
          extendSmokeTrail(routeState.point, routeState.draw);
          rocket.style.opacity = "1";
        }
      } else {
        const cycleDuration = 9800 + width * 1.35;
        const phase = ((now - cruiseStartedAt) % cycleDuration) / cycleDuration;
        const eased = phase * phase * (3 - 2 * phase);
        rocketX = -130 + (width + 260) * eased;
        rocketY = height * (0.31 + 0.055 * Math.sin(phase * Math.PI * 2 + 0.35));
        const dx = (width + 260) * (6 * phase * (1 - phase)) + 1;
        const dy = height * 0.11 * Math.PI * Math.cos(phase * Math.PI * 2 + 0.35);
        heading = clamp((Math.atan2(dy, dx) * 180) / Math.PI, -12, 12);
        if (phase > 0.54 && phase < 0.72) {
          const rollProgress = (phase - 0.54) / 0.18;
          roll = (0.5 - Math.cos(rollProgress * Math.PI) / 2) * 360;
        }
        lastSmokePoint = null;
        rocket.style.opacity = "1";

        if (now >= nextMessageAt) {
          startWriting(now, rocketX, rocketY, heading);
        }
      }

      rocket.style.transform = `translate3d(${rocketX}px, ${rocketY}px, 0) rotate(${heading}deg)`;
      rollElement.style.transform = `perspective(420px) rotateX(${roll}deg)`;
      drawSmoke(elapsed, now);
      frameId = requestAnimationFrame(animate);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(scene);
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <main className="sky-page">
      <section className="flight-scene" ref={sceneRef} aria-label="A rocket writing flirty messages in the sky">
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

        <div className="rocket-motion" ref={rocketRef}>
          <div className="rocket-roll" ref={rollRef}><Rocket /></div>
        </div>

        <header className="flight-header">
          <div className="brand" aria-label="Love, launched">
            <span className="brand-orbit" aria-hidden="true"><i /></span>
            <span>LOVE, LAUNCHED.</span>
          </div>
          <p className="for-you"><span aria-hidden="true">♥</span> JUST FOR YOU</p>
        </header>

        <p className="sr-only" aria-live="polite">The rocket is writing: {currentMessage}</p>
        <div className="grain" aria-hidden="true" />
      </section>
    </main>
  );
}
