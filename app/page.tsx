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
  kind: "message" | "stunt" | "finale";
};

const FLIRTY_MESSAGES = [
  "HEY CUTIE",
  "MY FAVORITE VIEW",
  "HOW ARE YOU THIS CUTE",
  "YOU MAKE ME BLUSH",
  "I WOULD ORBIT YOU",
  "STUCK ON YOU",
  "YOU ARE MY TYPE",
  "CUTEST IN THE GALAXY",
  "YOU MAKE ME SOAR",
  "COME FLY WITH ME",
  "LOOKING CUTE",
  "YOU GOT ME FLYING",
  "I LIKE YOUR FACE",
  "CRUSH ON BOARD",
  "YOU LOOK SO GOOD",
  "KINDA CRAZY ABOUT YOU",
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

function shuffle<T>(values: T[]) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function makeHeartPoints(center: Point, width: number) {
  const raw: Point[] = [];
  const steps = 150;

  for (let index = 0; index <= steps; index += 1) {
    const angle = (index / steps) * Math.PI * 2;
    raw.push({
      x: 16 * Math.sin(angle) ** 3,
      y:
        13 * Math.cos(angle) -
        5 * Math.cos(angle * 2) -
        2 * Math.cos(angle * 3) -
        Math.cos(angle * 4),
    });
  }

  const minX = Math.min(...raw.map((point) => point.x));
  const maxX = Math.max(...raw.map((point) => point.x));
  const minY = Math.min(...raw.map((point) => point.y));
  const maxY = Math.max(...raw.map((point) => point.y));
  const scale = width / (maxX - minX);
  const middleX = (minX + maxX) / 2;
  const middleY = (minY + maxY) / 2;

  return raw.map((point) => ({
    x: center.x + (point.x - middleX) * scale,
    y: center.y - (point.y - middleY) * scale,
  }));
}

function buildHeartRoute(
  viewportWidth: number,
  viewportHeight: number,
  kind: "intro" | "finale",
) {
  const heartWidth =
    kind === "intro"
      ? Math.min(viewportWidth * 0.28, viewportHeight * 0.26, 210)
      : Math.min(viewportWidth * 0.72, viewportHeight * 0.56, 520);
  const center = {
    x: viewportWidth * 0.5,
    y: viewportHeight * (kind === "intro" ? 0.38 : 0.42),
  };
  const heart = makeHeartPoints(center, heartWidth);
  const start = {
    x: -150,
    y: viewportHeight * (kind === "intro" ? 0.31 : 0.46),
  };
  const startTangent = { x: 1, y: kind === "intro" ? -0.08 : 0 };
  const firstTangent = tangentBetween(heart[0], heart[1]);
  const route: RoutePoint[] = [];

  addRoutePoints(route, [start], false);
  addRoutePoints(
    route,
    cubicConnector(start, startTangent, heart[0], firstTangent),
    false,
  );
  addRoutePoints(route, heart, true);

  if (kind === "intro") {
    const last = heart.at(-1) ?? heart[0];
    const lastTangent = tangentBetween(heart.at(-2) ?? last, last);
    const departure = { x: viewportWidth + 165, y: viewportHeight * 0.24 };
    addRoutePoints(
      route,
      cubicConnector(last, lastTangent, departure, { x: 1, y: -0.12 }),
      false,
    );
  }

  return { route, center, heartStart: heart[0], heartWidth };
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
      <div className="engine-glow" />
      <div className="rocket-exhaust">
        <span className="flame flame-outer" />
        <span className="flame flame-middle" />
        <span className="flame flame-inner" />
        <span className="exhaust-spark spark-a" />
        <span className="exhaust-spark spark-b" />
      </div>
      <div className="engine-nozzle">
        <span className="nozzle-ridge ridge-a" />
        <span className="nozzle-ridge ridge-b" />
      </div>
      <div className="fin fin-top"><span /></div>
      <div className="fin fin-bottom"><span /></div>
      <div className="winglet winglet-top" />
      <div className="winglet winglet-bottom" />
      <div className="rocket-shell">
        <span className="shell-belly" />
        <span className="shell-highlight" />
        <span className="side-stripe" />
        <span className="panel-seam seam-a" />
        <span className="panel-seam seam-b" />
        <span className="rocket-mark">R&ndash;02 <i>LOVECRAFT</i></span>
        <span className="rivet rivet-a" />
        <span className="rivet rivet-b" />
        <span className="rivet rivet-c" />
        <span className="rivet rivet-d" />
        <span className="porthole-ring">
          <span className="porthole">
            <span className="porthole-nebula" />
            <span className="porthole-shine" />
            <span className="porthole-star" />
          </span>
        </span>
        <span className="service-panel"><i /><i /><i /></span>
      </div>
      <div className="nose-cone"><span className="nose-glint" /></div>
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

    type Mode =
      | "intro"
      | "writing"
      | "clearing"
      | "finale"
      | "flythrough"
      | "pause";
    type NextAction = "message" | "finale" | "restart";

    const particles: SmokeParticle[] = [];
    let width = 0;
    let height = 0;
    let frameId = 0;
    let lastFrame = performance.now();
    let route: RoutePoint[] | null = null;
    let routeStartedAt = 0;
    let lastRouteTravel = 0;
    let smokeFadeStartedAt: number | null = null;
    let mode: Mode = "intro";
    let nextAction: NextAction = "message";
    let nextActionAt = Number.POSITIVE_INFINITY;
    let messageBag: number[] = [];
    let lastMessageIndex = -1;
    let showMessageCount = 0;
    let messagesThisShow = 3;
    let bank = 0;
    let previousHeading = 0;
    let finaleCenter: Point = { x: 0, y: 0 };
    let finaleStart: Point = { x: 0, y: 0 };
    let flythroughStartedAt = 0;
    const smokeHoldDuration = 950;
    const smokeFadeDuration = 2550;
    const clearSkyDuration = 900;
    const finaleHoldDuration = 1650;

    const smoothstep = (value: number) => {
      const amount = clamp(value, 0, 1);
      return amount * amount * (3 - 2 * amount);
    };

    const refillMessageBag = () => {
      messageBag = shuffle(
        Array.from({ length: FLIRTY_MESSAGES.length }, (_, index) => index),
      );
      if (messageBag[0] === lastMessageIndex && messageBag.length > 1) {
        [messageBag[0], messageBag[1]] = [messageBag[1], messageBag[0]];
      }
    };

    const takeMessage = () => {
      if (!messageBag.length) refillMessageBag();
      const index = messageBag.shift() ?? 0;
      lastMessageIndex = index;
      return FLIRTY_MESSAGES[index];
    };

    const emitSmoke = (
      point: Point,
      kind: SmokeParticle["kind"],
    ) => {
      const makeParticle = (wisp: boolean): SmokeParticle => {
        const isStunt = kind === "stunt";
        const isFinale = kind === "finale";
        const maxLife = isStunt
          ? 1700 + Math.random() * 850
          : 60000 + Math.random() * 8000;
        return {
          x: point.x + (Math.random() - 0.5) * (wisp ? 6 : 2.5),
          y: point.y + (Math.random() - 0.5) * (wisp ? 6 : 2.5),
          radius:
            (wisp ? 3.1 : 3.7) +
            Math.random() * (wisp ? 2.8 : isFinale ? 2.3 : 1.9),
          life: maxLife,
          maxLife,
          driftX: (Math.random() - 0.45) * (isStunt ? 0.0008 : 0.00042),
          driftY: -0.00022 - Math.random() * (isStunt ? 0.0005 : 0.00032),
          alpha: isStunt
            ? wisp
              ? 0.13
              : 0.34
            : isFinale
              ? wisp
                ? 0.26
                : 0.64
              : wisp
                ? 0.24
                : 0.62,
          kind,
        };
      };

      particles.push(makeParticle(false));
      if (Math.random() > (kind === "stunt" ? 0.72 : 0.64)) {
        particles.push(makeParticle(true));
      }
      if (particles.length > 5200) {
        particles.splice(0, particles.length - 5200);
      }
    };

    const traceRouteSmoke = (
      activeRoute: RoutePoint[],
      fromTravel: number,
      toTravel: number,
      kind: SmokeParticle["kind"],
    ) => {
      const spacing =
        kind === "stunt" ? 3.4 : width < 620 ? 2.15 : kind === "finale" ? 2.55 : 2.75;
      const gap = Math.max(0, toTravel - fromTravel);
      const steps = Math.max(1, Math.ceil(gap / spacing));
      for (let index = 1; index <= steps; index += 1) {
        const sampled = pointOnRoute(
          activeRoute,
          fromTravel + (gap * index) / steps,
        );
        if (sampled.draw) emitSmoke(sampled.point, kind);
      }
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
        layerOpacity = 1 - smoothstep(fadeProgress);
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
        particle.radius += elapsed * (particle.kind === "stunt" ? 0.00042 : 0.00017);
        const age = 1 - particle.life / particle.maxLife;
        const fadeIn = clamp(age / (particle.kind === "stunt" ? 0.035 : 0.009), 0, 1);
        const naturalFade =
          particle.kind === "stunt"
            ? clamp(particle.life / (particle.maxLife * 0.5), 0, 1)
            : 1;
        context.globalAlpha = particle.alpha * fadeIn * naturalFade * layerOpacity;
        const diameter = particle.radius * 3.9 * (1 + fadeProgress * 0.48);
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

    const startWriting = (now: number) => {
      const message = takeMessage();
      const startTail = { x: -150, y: height * 0.27 };
      route = buildMessageRoute(
        message,
        width,
        height,
        startTail,
        { x: 1, y: -0.04 },
      );
      routeStartedAt = now;
      mode = "writing";
      particles.length = 0;
      smokeFadeStartedAt = null;
      lastRouteTravel = 0;
      bank = 0;
      previousHeading = 0;
      setCurrentMessage(message);
    };

    const startFinale = (now: number) => {
      const finale = buildHeartRoute(width, height, "finale");
      route = finale.route;
      finaleCenter = finale.center;
      finaleStart = finale.heartStart;
      routeStartedAt = now;
      mode = "finale";
      particles.length = 0;
      smokeFadeStartedAt = null;
      lastRouteTravel = 0;
      bank = 0;
      previousHeading = 0;
      setCurrentMessage("A heart just for you");
    };

    const startShow = (now: number) => {
      const intro = buildHeartRoute(width, height, "intro");
      route = intro.route;
      routeStartedAt = now;
      mode = "intro";
      showMessageCount = 0;
      messagesThisShow = Math.random() > 0.58 ? 4 : 3;
      particles.length = 0;
      smokeFadeStartedAt = null;
      lastRouteTravel = 0;
      nextActionAt = Number.POSITIVE_INFINITY;
      bank = 0;
      previousHeading = 0;
      rocket.style.opacity = "1";
      setCurrentMessage("A little surprise is on the way");
    };

    const beginClearing = (now: number, action: NextAction) => {
      mode = "clearing";
      route = null;
      smokeFadeStartedAt = now + smokeHoldDuration;
      nextAction = action;
      nextActionAt =
        now + smokeHoldDuration + smokeFadeDuration + clearSkyDuration;
      rocket.style.opacity = "0";
    };

    const resize = () => {
      const bounds = scene.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const changed =
        Math.abs(width - bounds.width) > 3 ||
        Math.abs(height - bounds.height) > 3;
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      if (changed && width > 0 && height > 0) {
        startShow(performance.now());
      }
    };

    const animate = (now: number) => {
      const elapsed = clamp(now - lastFrame, 0, 42);
      lastFrame = now;
      const tailOffset = rocket.offsetWidth * 0.43;
      let rocketX = -170;
      let rocketY = height * 0.3;
      let heading = 0;
      let roll = bank;
      let rocketScale = 1;
      let visible = false;

      if (
        route &&
        route.length > 1 &&
        (mode === "intro" || mode === "writing" || mode === "finale")
      ) {
        const speed =
          mode === "writing"
            ? width < 620
              ? 91
              : 120
            : mode === "intro"
              ? width < 620
                ? 145
                : 186
              : width < 620
                ? 108
                : 142;
        const travelled = (now - routeStartedAt) * (speed / 1000);
        const routeLength = route.at(-1)?.travel ?? 1;
        const routeProgress = clamp(travelled / routeLength, 0, 1);
        const sampledTravel = Math.min(travelled, routeLength);
        const smokeKind: SmokeParticle["kind"] =
          mode === "intro" ? "stunt" : mode === "writing" ? "message" : "finale";
        traceRouteSmoke(route, lastRouteTravel, sampledTravel, smokeKind);
        lastRouteTravel = sampledTravel;

        if (travelled >= routeLength) {
          if (mode === "intro") {
            mode = "pause";
            route = null;
            nextAction = "message";
            nextActionAt = now + 1450;
            rocket.style.opacity = "0";
          } else if (mode === "writing") {
            showMessageCount += 1;
            beginClearing(
              now,
              showMessageCount >= messagesThisShow ? "finale" : "message",
            );
          } else {
            mode = "flythrough";
            route = null;
            flythroughStartedAt = now;
            setCurrentMessage("Just for you");
          }
        } else {
          const routeState = pointOnRoute(route, travelled);
          heading =
            (Math.atan2(routeState.tangent.y, routeState.tangent.x) * 180) /
            Math.PI;
          const headingChange = ((heading - previousHeading + 540) % 360) - 180;
          const targetBank = clamp(headingChange * 3.1, -42, 42);
          bank += (targetBank - bank) * clamp(elapsed * 0.009, 0, 1);
          previousHeading = heading;
          rocketX = routeState.point.x + routeState.tangent.x * tailOffset;
          rocketY = routeState.point.y + routeState.tangent.y * tailOffset;
          visible = true;

          if (mode === "intro") {
            const arrival = smoothstep(routeProgress / 0.16);
            rocketScale = 0.38 + arrival * 0.62;
            const rollProgress = smoothstep((routeProgress - 0.08) / 0.38);
            roll = bank + rollProgress * 360;
          } else if (mode === "writing") {
            roll = bank;
          } else {
            roll = bank;
            rocketScale = 1.04;
          }
        }
      } else if (mode === "flythrough") {
        const duration = 2050;
        const progress = clamp((now - flythroughStartedAt) / duration, 0, 1);
        const flightProgress = progress ** 1.35;
        const controlA = {
          x: finaleCenter.x,
          y: finaleCenter.y - height * 0.02,
        };
        const controlB = {
          x: finaleCenter.x + width * 0.08,
          y: height * 0.62,
        };
        const end = { x: width * 0.77, y: height * 0.84 };
        const inverse = 1 - flightProgress;
        rocketX =
          inverse ** 3 * finaleStart.x +
          3 * inverse * inverse * flightProgress * controlA.x +
          3 * inverse * flightProgress ** 2 * controlB.x +
          flightProgress ** 3 * end.x;
        rocketY =
          inverse ** 3 * finaleStart.y +
          3 * inverse * inverse * flightProgress * controlA.y +
          3 * inverse * flightProgress ** 2 * controlB.y +
          flightProgress ** 3 * end.y;
        const nextAmount = clamp(flightProgress + 0.008, 0, 1);
        const nextInverse = 1 - nextAmount;
        const nextX =
          nextInverse ** 3 * finaleStart.x +
          3 * nextInverse * nextInverse * nextAmount * controlA.x +
          3 * nextInverse * nextAmount ** 2 * controlB.x +
          nextAmount ** 3 * end.x;
        const nextY =
          nextInverse ** 3 * finaleStart.y +
          3 * nextInverse * nextInverse * nextAmount * controlA.y +
          3 * nextInverse * nextAmount ** 2 * controlB.y +
          nextAmount ** 3 * end.y;
        heading = (Math.atan2(nextY - rocketY, nextX - rocketX) * 180) / Math.PI;
        roll = progress * 210;
        rocketScale = 1.04 + smoothstep(progress) * 2.65;
        visible = progress < 1;
        rocket.style.opacity = `${1 - smoothstep((progress - 0.7) / 0.3)}`;

        if (progress >= 1) {
          mode = "pause";
          nextAction = "restart";
          smokeFadeStartedAt = now + finaleHoldDuration;
          nextActionAt =
            now +
            finaleHoldDuration +
            smokeFadeDuration +
            clearSkyDuration +
            900;
          rocket.style.opacity = "0";
        }
      } else if (
        (mode === "pause" || mode === "clearing") &&
        now >= nextActionAt
      ) {
        if (nextAction === "message") startWriting(now);
        else if (nextAction === "finale") startFinale(now);
        else startShow(now);
      }

      if (mode !== "flythrough") {
        rocket.style.opacity = visible ? "1" : "0";
      }
      rocket.style.transform = `translate3d(${rocketX}px, ${rocketY}px, 0) rotate(${heading}deg) scale(${rocketScale})`;
      rollElement.style.transform = `perspective(560px) rotateX(${roll}deg) rotateY(${bank * 0.12}deg)`;
      rollElement.style.setProperty(
        "--bank-light",
        `${clamp(50 + bank * 0.7, 22, 78)}%`,
      );

      if (visible && width > 0 && height > 0) {
        const cameraX = clamp((0.5 - rocketX / width) * 7, -5, 5);
        const cameraY = clamp((0.42 - rocketY / height) * 5, -3, 3);
        scene.style.setProperty("--camera-x", `${cameraX}px`);
        scene.style.setProperty("--camera-y", `${cameraY}px`);
        scene.style.setProperty("--camera-far-x", `${cameraX * 0.45}px`);
        scene.style.setProperty("--camera-far-y", `${cameraY * 0.45}px`);
        scene.style.setProperty("--camera-near-x", `${cameraX * -0.34}px`);
        scene.style.setProperty("--camera-near-y", `${cameraY * -0.2}px`);
      }

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
