"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };
type RawStroke = Array<[number, number]>;
type PrintGlyph = { width: number; strokes: RawStroke[] };
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

const PRINT_LETTER_GAP = 0.12;
const PRINT_WORD_GAP = 0.58;

const FLIRTY_MESSAGES = [
  "HEY CUTIE",
  "FAVORITE VIEW",
  "SO DAMN CUTE",
  "YOU MAKE ME BLUSH",
  "ORBITING YOU",
  "STUCK ON YOU",
  "JUST MY TYPE",
  "GALAXY CUTIE",
  "YOU MAKE ME SOAR",
  "FLY WITH ME",
  "LOOKING CUTE",
  "GOT ME FLYING",
  "I LIKE YOUR FACE",
  "CRUSH ON BOARD",
  "YOU LOOK GOOD",
  "CRAZY ABOUT YOU",
] as const;

const PRINT_FONT: Record<string, PrintGlyph> = {
  A: { width: 0.82, strokes: [[[0.04, 1], [0.5, 0], [0.96, 1]], [[0.24, 0.62], [0.76, 0.62]]] },
  B: { width: 0.78, strokes: [[[0.04, 1], [0.04, 0], [0.5, 0], [0.82, 0.08], [0.94, 0.25], [0.84, 0.43], [0.5, 0.5], [0.04, 0.5], [0.5, 0.5], [0.88, 0.58], [0.98, 0.76], [0.86, 0.94], [0.5, 1], [0.04, 1]]] },
  C: { width: 0.8, strokes: [[[0.96, 0.16], [0.78, 0.04], [0.42, 0], [0.14, 0.15], [0.03, 0.5], [0.14, 0.85], [0.42, 1], [0.78, 0.96], [0.96, 0.84]]] },
  D: { width: 0.82, strokes: [[[0.04, 1], [0.04, 0], [0.46, 0], [0.76, 0.1], [0.95, 0.5], [0.76, 0.9], [0.46, 1], [0.04, 1]]] },
  E: { width: 0.7, strokes: [[[0.96, 0], [0.04, 0], [0.04, 1], [0.96, 1]], [[0.04, 0.5], [0.76, 0.5]]] },
  F: { width: 0.7, strokes: [[[0.04, 1], [0.04, 0], [0.96, 0]], [[0.04, 0.5], [0.76, 0.5]]] },
  G: { width: 0.84, strokes: [[[0.96, 0.16], [0.78, 0.04], [0.42, 0], [0.14, 0.15], [0.03, 0.5], [0.14, 0.85], [0.42, 1], [0.78, 0.96], [0.96, 0.8], [0.96, 0.56], [0.58, 0.56]]] },
  H: { width: 0.8, strokes: [[[0.04, 0], [0.04, 1]], [[0.96, 0], [0.96, 1]], [[0.04, 0.5], [0.96, 0.5]]] },
  I: { width: 0.46, strokes: [[[0.08, 0], [0.92, 0]], [[0.5, 0], [0.5, 1]], [[0.08, 1], [0.92, 1]]] },
  J: { width: 0.64, strokes: [[[0.08, 0], [0.94, 0], [0.94, 0.68], [0.84, 0.88], [0.64, 1], [0.36, 0.98], [0.14, 0.84], [0.06, 0.67]]] },
  K: { width: 0.78, strokes: [[[0.04, 0], [0.04, 1]], [[0.96, 0], [0.04, 0.56], [0.98, 1]]] },
  L: { width: 0.68, strokes: [[[0.04, 0], [0.04, 1], [0.96, 1]]] },
  M: { width: 0.98, strokes: [[[0.04, 1], [0.04, 0], [0.5, 0.56], [0.96, 0], [0.96, 1]]] },
  N: { width: 0.88, strokes: [[[0.04, 1], [0.04, 0], [0.96, 1], [0.96, 0]]] },
  O: { width: 0.84, strokes: [[[0.5, 0], [0.22, 0.05], [0.05, 0.28], [0.05, 0.72], [0.22, 0.95], [0.5, 1], [0.78, 0.95], [0.95, 0.72], [0.95, 0.28], [0.78, 0.05], [0.5, 0]]] },
  P: { width: 0.74, strokes: [[[0.04, 1], [0.04, 0], [0.5, 0], [0.84, 0.09], [0.94, 0.27], [0.84, 0.45], [0.5, 0.52], [0.04, 0.52]]] },
  Q: { width: 0.86, strokes: [[[0.5, 0], [0.22, 0.05], [0.05, 0.28], [0.05, 0.72], [0.22, 0.95], [0.5, 1], [0.78, 0.95], [0.95, 0.72], [0.95, 0.28], [0.78, 0.05], [0.5, 0]], [[0.6, 0.66], [1, 1]]] },
  R: { width: 0.78, strokes: [[[0.04, 1], [0.04, 0], [0.5, 0], [0.84, 0.09], [0.94, 0.27], [0.84, 0.44], [0.5, 0.5], [0.04, 0.5], [0.5, 0.5], [0.98, 1]]] },
  S: { width: 0.76, strokes: [[[0.94, 0.15], [0.76, 0.03], [0.4, 0], [0.12, 0.14], [0.12, 0.37], [0.34, 0.49], [0.72, 0.55], [0.94, 0.68], [0.92, 0.88], [0.66, 1], [0.3, 0.98], [0.06, 0.84]]] },
  T: { width: 0.74, strokes: [[[0.03, 0], [0.97, 0]], [[0.5, 0], [0.5, 1]]] },
  U: { width: 0.82, strokes: [[[0.04, 0], [0.04, 0.68], [0.14, 0.88], [0.36, 1], [0.64, 1], [0.86, 0.88], [0.96, 0.68], [0.96, 0]]] },
  V: { width: 0.8, strokes: [[[0.03, 0], [0.5, 1], [0.97, 0]]] },
  W: { width: 1.02, strokes: [[[0.02, 0], [0.22, 1], [0.5, 0.55], [0.78, 1], [0.98, 0]]] },
  X: { width: 0.8, strokes: [[[0.04, 0], [0.96, 1]], [[0.96, 0], [0.04, 1]]] },
  Y: { width: 0.8, strokes: [[[0.04, 0], [0.5, 0.5], [0.96, 0]], [[0.5, 0.5], [0.5, 1]]] },
  Z: { width: 0.78, strokes: [[[0.04, 0], [0.96, 0], [0.04, 1], [0.96, 1]]] },
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

function roundPrintStroke(points: Point[]) {
  if (points.length < 3) return points;
  const result: Point[] = [points[0]];

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const corner = points[index];
    const next = points[index + 1];
    const entry = lerpPoint(previous, corner, 0.78);
    const exit = lerpPoint(corner, next, 0.22);
    result.push(entry);

    for (let step = 1; step <= 5; step += 1) {
      const amount = step / 5;
      const inverse = 1 - amount;
      result.push({
        x:
          inverse * inverse * entry.x +
          2 * inverse * amount * corner.x +
          amount * amount * exit.x,
        y:
          inverse * inverse * entry.y +
          2 * inverse * amount * corner.y +
          amount * amount * exit.y,
      });
    }
  }

  result.push(points.at(-1) ?? points[0]);
  return result;
}

function cubicConnector(
  start: Point,
  startTangent: Point,
  end: Point,
  endTangent: Point,
) {
  const gap = distance(start, end);
  const reach = clamp(gap * 0.34, 7, 130);
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
  return (
    0.08 +
    Array.from(line).reduce(
      (total, character) =>
        total +
        (character === " "
          ? PRINT_WORD_GAP
          : (PRINT_FONT[character] ?? PRINT_FONT.X).width +
            PRINT_LETTER_GAP),
      0,
    )
  );
}

function buildMessageRoute(
  message: string,
  viewportWidth: number,
  viewportHeight: number,
  startTail: Point,
  startTangent: Point,
) {
  const isPhone = viewportWidth < 620;
  const lines = wrapMessage(message, isPhone ? 10 : 18);
  const widestLine = Math.max(...lines.map(lineUnits));
  const verticalStretch = isPhone ? 1.16 : 1.08;
  const scale = Math.min(
    (viewportWidth * (isPhone ? 0.9 : 0.78)) / widestLine,
    isPhone ? 60 : 78,
    (viewportHeight * 0.42) /
      (verticalStretch * (1.08 + (lines.length - 1) * 1.46)),
  );
  const letterHeight = scale * verticalStretch;
  const lineGap = letterHeight * 1.46;
  const blockHeight = letterHeight * 1.08 + (lines.length - 1) * lineGap;
  const startY = clamp(
    viewportHeight * 0.22 - blockHeight * 0.1,
    viewportHeight * 0.14,
    viewportHeight * 0.27,
  );
  const strokes: Array<{ points: Point[]; line: number }> = [];

  lines.forEach((line, lineIndex) => {
    const width = lineUnits(line) * scale;
    let cursor = (viewportWidth - width) / 2;
    Array.from(line).forEach((character, characterIndex) => {
      if (character === " ") {
        cursor += scale * PRINT_WORD_GAP;
        return;
      }

      const glyph = PRINT_FONT[character] ?? PRINT_FONT.X;
      glyph.strokes.forEach((stroke, strokeIndex) => {
        const wobble = scale * (isPhone ? 0.012 : 0.009);
        const transformed = stroke.map(([x, y], pointIndex) => {
          const seed =
            (lineIndex + 1) * 19 +
            (characterIndex + 1) * 11 +
            (strokeIndex + 1) * 7 +
            (pointIndex + 1) * 3;
          return {
            x:
              cursor +
              x * glyph.width * scale +
              Math.sin(seed * 1.37) * wobble,
            y:
              startY +
              lineIndex * lineGap +
              y * letterHeight +
              Math.cos(seed * 1.11) * wobble,
          };
        });
        strokes.push({
          points: roundPrintStroke(transformed),
          line: lineIndex,
        });
      });
      cursor += (glyph.width + PRINT_LETTER_GAP) * scale;
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
    x: -190,
    y: viewportHeight * (kind === "intro" ? 0.57 : 0.46),
  };
  const startTangent = { x: 1, y: kind === "intro" ? 0.08 : 0 };
  const firstTangent = tangentBetween(heart[0], heart[1]);
  const route: RoutePoint[] = [];

  addRoutePoints(route, [start], false);
  if (kind === "intro") {
    const closeFlyby = {
      x: viewportWidth * 0.34,
      y: viewportHeight * 0.58,
    };
    const climb = {
      x: viewportWidth * 0.77,
      y: viewportHeight * 0.23,
    };
    addRoutePoints(
      route,
      cubicConnector(start, startTangent, closeFlyby, { x: 1, y: -0.03 }),
      false,
    );
    addRoutePoints(
      route,
      cubicConnector(closeFlyby, { x: 1, y: -0.15 }, climb, { x: 0.62, y: -0.78 }),
      false,
    );
    addRoutePoints(
      route,
      cubicConnector(climb, { x: -0.2, y: 0.98 }, heart[0], firstTangent),
      false,
    );
  } else {
    addRoutePoints(
      route,
      cubicConnector(start, startTangent, heart[0], firstTangent),
      false,
    );
  }
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
  const [currentMessage, setCurrentMessage] = useState("Ready to launch");
  const [launchState, setLaunchState] = useState<
    "ready" | "launching" | "complete"
  >("ready");

  const stars = Array.from({ length: 38 }, (_, index) => ({
    left: (index * 37 + 11) % 100,
    top: (index * 53 + 7) % 67,
    size: 1 + ((index * 7) % 3),
    delay: -((index * 0.31) % 4),
  }));

  const windStreams = Array.from({ length: 18 }, (_, index) => ({
    left: (index * 29 + 7) % 100,
    delay: -((index * 0.17) % 0.92),
    duration: 0.58 + ((index * 11) % 28) / 100,
    length: 58 + ((index * 17) % 92),
    drift: -18 + ((index * 13) % 37),
  }));

  const handleLaunch = () => {
    if (launchState !== "ready") return;
    setLaunchState("launching");
    sceneRef.current?.dispatchEvent(new Event("rocket-launch"));
  };

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

    const messageSprite = document.createElement("canvas");
    messageSprite.width = 64;
    messageSprite.height = 64;
    const messageSpriteContext = messageSprite.getContext("2d");
    if (messageSpriteContext) {
      const messageGradient = messageSpriteContext.createRadialGradient(
        32,
        32,
        1,
        32,
        32,
        31,
      );
      messageGradient.addColorStop(0, "rgba(255,255,255,1)");
      messageGradient.addColorStop(0.42, "rgba(252,253,255,0.88)");
      messageGradient.addColorStop(0.72, "rgba(232,240,252,0.3)");
      messageGradient.addColorStop(1, "rgba(220,231,250,0)");
      messageSpriteContext.fillStyle = messageGradient;
      messageSpriteContext.fillRect(0, 0, 64, 64);
    }

    const glowSprite = document.createElement("canvas");
    glowSprite.width = 96;
    glowSprite.height = 96;
    const glowContext = glowSprite.getContext("2d");
    if (glowContext) {
      const glow = glowContext.createRadialGradient(48, 48, 2, 48, 48, 47);
      glow.addColorStop(0, "rgba(255,244,225,0.72)");
      glow.addColorStop(0.24, "rgba(255,171,128,0.34)");
      glow.addColorStop(0.68, "rgba(255,112,92,0.1)");
      glow.addColorStop(1, "rgba(255,93,85,0)");
      glowContext.fillStyle = glow;
      glowContext.fillRect(0, 0, 96, 96);
    }

    type Mode =
      | "waiting"
      | "launch"
      | "intro"
      | "writing"
      | "clearing"
      | "finale"
      | "flythrough"
      | "pause";
    type NextAction = "message" | "finale" | "finalMessage" | "restart";

    const particles: SmokeParticle[] = [];
    let width = 0;
    let height = 0;
    let frameId = 0;
    let lastFrame = performance.now();
    let route: RoutePoint[] | null = null;
    let routeStartedAt = 0;
    let lastRouteTravel = 0;
    let smokeFadeStartedAt: number | null = null;
    let mode: Mode = "waiting";
    let nextAction: NextAction = "message";
    let nextActionAt = Number.POSITIVE_INFINITY;
    let messageBag: number[] = [];
    let lastMessageIndex = -1;
    let showMessageCount = 0;
    let writingFinalMessage = false;
    let bank = 0;
    let previousHeading = 0;
    let finaleCenter: Point = { x: 0, y: 0 };
    let finaleStart: Point = { x: 0, y: 0 };
    let flythroughStartedAt = 0;
    let launchStartedAt = 0;
    let finaleGlowStartedAt: number | null = null;
    let messageGlowStartedAt: number | null = null;
    const messagesPerShow = 3;
    const smokeHoldDuration = 2300;
    const smokeFadeDuration = 1350;
    const clearSkyDuration = 650;
    const finaleHoldDuration = 2200;

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
        const isMessage = kind === "message";
        const maxLife = isStunt
          ? 1700 + Math.random() * 850
          : 60000 + Math.random() * 8000;
        const jitter = isMessage
          ? wisp
            ? 2.2
            : 0.9
          : wisp
            ? 6
            : 2.5;
        const radius = isMessage
          ? (wisp ? 1.55 : 1.45) + Math.random() * (wisp ? 0.75 : 0.55)
          : (wisp ? 3.1 : 3.7) +
            Math.random() * (wisp ? 2.8 : isFinale ? 2.3 : 1.9);
        return {
          x: point.x + (Math.random() - 0.5) * jitter,
          y: point.y + (Math.random() - 0.5) * jitter,
          radius,
          life: maxLife,
          maxLife,
          driftX:
            (Math.random() - 0.45) *
            (isStunt ? 0.0008 : isMessage ? 0.0002 : 0.00042),
          driftY:
            -0.00012 -
            Math.random() *
              (isStunt ? 0.0005 : isMessage ? 0.00016 : 0.00032),
          alpha: isStunt
            ? wisp
              ? 0.13
              : 0.34
            : isFinale
              ? wisp
                ? 0.26
                : 0.64
              : wisp
                ? 0.15
                : 0.92,
          kind,
        };
      };

      particles.push(makeParticle(false));
      if (
        Math.random() >
        (kind === "stunt" ? 0.72 : kind === "message" ? 0.88 : 0.64)
      ) {
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
      const glowProgress =
        finaleGlowStartedAt === null
          ? 0
          : clamp((now - finaleGlowStartedAt) / 1850, 0, 1);
      const finaleGlow = Math.sin(glowProgress * Math.PI);
      const messageGlowProgress =
        messageGlowStartedAt === null
          ? 0
          : clamp((now - messageGlowStartedAt) / 1600, 0, 1);
      const messageGlow = Math.sin(messageGlowProgress * Math.PI);
      scene.style.setProperty(
        "--message-sparkle",
        `${Math.max(0, messageGlow).toFixed(3)}`,
      );

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
        particle.radius +=
          elapsed *
          (particle.kind === "stunt"
            ? 0.00042
            : particle.kind === "message"
              ? 0.000055
              : 0.00017);
        const age = 1 - particle.life / particle.maxLife;
        const fadeInWindow =
          particle.kind === "stunt"
            ? 0.035
            : particle.kind === "message"
              ? 0.0045
              : 0.009;
        const fadeIn = clamp(age / fadeInWindow, 0, 1);
        const naturalFade =
          particle.kind === "stunt"
            ? clamp(particle.life / (particle.maxLife * 0.5), 0, 1)
            : 1;
        const particleOpacity =
          particle.alpha * fadeIn * naturalFade * layerOpacity;
        const diameter =
          particle.radius *
          (particle.kind === "message" ? 3.55 : 3.9) *
          (1 + fadeProgress * 0.48);
        if (particle.kind === "finale" && finaleGlow > 0.01) {
          const glowDiameter = diameter * (2.1 + finaleGlow * 1.2);
          context.globalAlpha = particleOpacity * finaleGlow * 0.26;
          context.drawImage(
            glowSprite,
            particle.x - glowDiameter / 2,
            particle.y - glowDiameter / 2,
            glowDiameter,
            glowDiameter,
          );
        }
        if (particle.kind === "message" && messageGlow > 0.01) {
          const messageGlowDiameter =
            diameter * (2.15 + messageGlow * 0.72);
          context.globalAlpha = particleOpacity * messageGlow * 0.13;
          context.drawImage(
            glowSprite,
            particle.x - messageGlowDiameter / 2,
            particle.y - messageGlowDiameter / 2,
            messageGlowDiameter,
            messageGlowDiameter,
          );
        }
        context.globalAlpha = particleOpacity;
        context.drawImage(
          particle.kind === "message" ? messageSprite : sprite,
          particle.x - diameter / 2,
          particle.y - diameter / 2,
          diameter,
          diameter,
        );
      }
      context.restore();
    };

    const startMessageRoute = (
      now: number,
      message: string,
      isFinalMessage: boolean,
    ) => {
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
      writingFinalMessage = isFinalMessage;
      particles.length = 0;
      smokeFadeStartedAt = null;
      finaleGlowStartedAt = null;
      messageGlowStartedAt = null;
      lastRouteTravel = 0;
      bank = 0;
      previousHeading = 0;
      setCurrentMessage(message);
    };

    const startWriting = (now: number) => {
      startMessageRoute(now, takeMessage(), false);
    };

    const startFinalMessage = (now: number) => {
      startMessageRoute(now, "JUST FOR YOU", true);
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
      finaleGlowStartedAt = null;
      messageGlowStartedAt = null;
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
      writingFinalMessage = false;
      particles.length = 0;
      smokeFadeStartedAt = null;
      finaleGlowStartedAt = null;
      messageGlowStartedAt = null;
      lastRouteTravel = 0;
      nextActionAt = Number.POSITIVE_INFINITY;
      bank = 0;
      previousHeading = 0;
      rocket.style.opacity = "1";
      setCurrentMessage("A little surprise is on the way");
    };

    const beginLaunch = (now: number) => {
      if (mode !== "waiting") return;
      mode = "launch";
      launchStartedAt = now;
      route = null;
      particles.length = 0;
      smokeFadeStartedAt = null;
      finaleGlowStartedAt = null;
      messageGlowStartedAt = null;
      showMessageCount = 0;
      bank = 0;
      previousHeading = -90;
      rocket.style.opacity = "1";
      setCurrentMessage("Engines ignited. Lifting off");
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
        if (mode !== "waiting" && mode !== "launch") {
          startShow(performance.now());
        }
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
      let cameraZoom = 1.025;
      let visible = false;

      if (mode === "waiting") {
        rocketX = width * 0.5;
        rocketY = height * (width < 620 ? 0.79 : 0.77);
        heading = -90;
        roll = 0;
        rocketScale = width < 620 ? 1.3 : 1.2;
        cameraZoom = 1.052;
        visible = true;
      } else if (mode === "launch") {
        const duration = 4550;
        const progress = clamp((now - launchStartedAt) / duration, 0, 1);
        const ignition = smoothstep(progress / 0.17);
        const climb = smoothstep((progress - 0.13) / 0.87);
        const launchY = height * (width < 620 ? 0.79 : 0.77);
        const rumbleStrength =
          (1 - smoothstep((progress - 0.1) / 0.28)) * ignition * 2.2;
        const rumbleX = Math.sin(now * 0.082) * rumbleStrength;
        const rumbleY = Math.cos(now * 0.104) * rumbleStrength * 0.62;
        const sway = Math.sin(climb * Math.PI * 2.15) * width * 0.018 * climb;

        rocketX = width * 0.5 + sway + rumbleX;
        rocketY = launchY - height * 1.13 * climb + rumbleY;
        heading = -90 + Math.sin(climb * Math.PI * 1.65) * 4.2;
        roll = Math.sin(now * 0.017) * ignition * (1 - climb) * 5;
        rocketScale =
          (width < 620 ? 1.3 : 1.2) * (1 - smoothstep(climb) * 0.48);
        cameraZoom = 1.052 + ignition * 0.018 - climb * 0.035;
        visible = progress < 1;

        const shakeFade = (1 - climb) * ignition;
        scene.style.setProperty(
          "--launch-shake-x",
          `${Math.sin(now * 0.091) * shakeFade * 2.1}px`,
        );
        scene.style.setProperty(
          "--launch-shake-y",
          `${Math.cos(now * 0.113) * shakeFade * 1.25}px`,
        );

        if (progress >= 1) {
          mode = "pause";
          nextAction = "message";
          nextActionAt = now + 700;
          rocket.style.opacity = "0";
          scene.style.setProperty("--launch-shake-x", "0px");
          scene.style.setProperty("--launch-shake-y", "0px");
          setLaunchState("complete");
          setCurrentMessage("The rocket reached the open sky");
        }
      } else if (
        route &&
        route.length > 1 &&
        (mode === "intro" || mode === "writing" || mode === "finale")
      ) {
        const speed =
          mode === "writing"
            ? width < 620
              ? 104
              : 128
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
            messageGlowStartedAt = now;
            if (writingFinalMessage) {
              beginClearing(now, "restart");
            } else {
              showMessageCount += 1;
              beginClearing(
                now,
                showMessageCount >= messagesPerShow ? "finale" : "message",
              );
            }
          } else {
            mode = "flythrough";
            route = null;
            flythroughStartedAt = now;
            finaleGlowStartedAt = now;
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
          visible = true;

          if (mode === "intro") {
            const arrival = smoothstep(routeProgress / 0.19);
            const pullback = smoothstep((routeProgress - 0.28) / 0.25);
            rocketScale = 0.46 + arrival * 0.9 - pullback * 0.3;
            cameraZoom = 1.058 - pullback * 0.03;
            const rollProgress = smoothstep((routeProgress - 0.08) / 0.38);
            roll = bank + rollProgress * 360;
          } else if (mode === "writing") {
            roll = bank;
            rocketScale = width < 620 ? 0.78 : 0.86;
            cameraZoom = 1.016;
          } else {
            roll = bank;
            rocketScale = 1.08;
            cameraZoom = 1.038;
          }

          const scaledTailOffset = tailOffset * rocketScale;
          rocketX =
            routeState.point.x + routeState.tangent.x * scaledTailOffset;
          rocketY =
            routeState.point.y + routeState.tangent.y * scaledTailOffset;
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
        rocketScale = 1.08 + smoothstep(progress) * 2.7;
        cameraZoom = 1.035 + smoothstep(progress) * 0.045;
        visible = progress < 1;
        rocket.style.opacity = `${1 - smoothstep((progress - 0.7) / 0.3)}`;

        if (progress >= 1) {
          mode = "pause";
          nextAction = "finalMessage";
          smokeFadeStartedAt = now + finaleHoldDuration;
          nextActionAt =
            now +
            finaleHoldDuration +
            smokeFadeDuration +
            clearSkyDuration +
            350;
          rocket.style.opacity = "0";
        }
      } else if (
        (mode === "pause" || mode === "clearing") &&
        now >= nextActionAt
      ) {
        if (nextAction === "message") startWriting(now);
        else if (nextAction === "finale") startFinale(now);
        else if (nextAction === "finalMessage") startFinalMessage(now);
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
      const sunGlint = clamp(
        74 - (rocketX / Math.max(width, 1)) * 46 + bank * 0.16,
        18,
        84,
      );
      const sunsetWarmth = clamp(
        0.34 + (rocketY / Math.max(height, 1)) * 0.5,
        0.32,
        0.82,
      );
      rollElement.style.setProperty("--sun-glint", `${sunGlint}%`);
      rollElement.style.setProperty("--sun-warmth", `${sunsetWarmth}`);
      rollElement.style.setProperty(
        "--reflection-shift",
        `${clamp(bank * 0.09, -4, 4)}px`,
      );
      scene.style.setProperty("--sky-scale", `${cameraZoom}`);

      if (visible && width > 0 && height > 0) {
        const cameraStrength = mode === "intro" ? 12 : mode === "finale" ? 9 : 7;
        const cameraX = clamp(
          (0.5 - rocketX / width) * cameraStrength,
          -cameraStrength * 0.74,
          cameraStrength * 0.74,
        );
        const cameraY = clamp((0.42 - rocketY / height) * 7, -4.5, 4.5);
        scene.style.setProperty("--camera-x", `${cameraX}px`);
        scene.style.setProperty("--camera-y", `${cameraY}px`);
        scene.style.setProperty("--camera-far-x", `${cameraX * 0.45}px`);
        scene.style.setProperty("--camera-far-y", `${cameraY * 0.45}px`);
        scene.style.setProperty("--camera-mid-x", `${cameraX * -0.6}px`);
        scene.style.setProperty("--camera-mid-y", `${cameraY * -0.38}px`);
        scene.style.setProperty("--camera-near-x", `${cameraX * -0.34}px`);
        scene.style.setProperty("--camera-near-y", `${cameraY * -0.2}px`);
      }

      drawSmoke(elapsed, now);
      frameId = requestAnimationFrame(animate);
    };

    resize();
    const handleLaunchEvent = () => beginLaunch(performance.now());
    scene.addEventListener("rocket-launch", handleLaunchEvent);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(scene);
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      scene.removeEventListener("rocket-launch", handleLaunchEvent);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <main className="sky-page">
      <section
        className={`flight-scene launch-${launchState}`}
        ref={sceneRef}
        aria-label="A rocket launching and writing flirty messages in the sky"
      >
        <div className="sky-gradient" aria-hidden="true" />
        <div className="atmospheric-haze" aria-hidden="true" />
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
          <span
            className="shooting-star"
            style={{ "--shoot-top": "13%", "--shoot-delay": "-4s" } as CSSProperties}
          />
          <span
            className="shooting-star"
            style={{ "--shoot-top": "31%", "--shoot-delay": "-18s" } as CSSProperties}
          />
        </div>

        <div className="cloud cloud-a" aria-hidden="true" />
        <div className="cloud cloud-b" aria-hidden="true" />
        <div className="cloud cloud-c" aria-hidden="true" />
        <div className="cloud cloud-d" aria-hidden="true" />
        <div className="cloud cloud-e" aria-hidden="true" />
        <MountainLine />

        {launchState !== "complete" && (
          <div className="launch-sequence">
            <div className="launch-wind" aria-hidden="true">
              {windStreams.map((stream, index) => (
                <i
                  key={index}
                  style={
                    {
                      "--wind-left": `${stream.left}%`,
                      "--wind-delay": `${stream.delay}s`,
                      "--wind-duration": `${stream.duration}s`,
                      "--wind-length": `${stream.length}px`,
                      "--wind-drift": `${stream.drift}px`,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
            <div className="launch-pad" aria-hidden="true">
              <i className="pad-ring pad-ring-outer" />
              <i className="pad-ring pad-ring-inner" />
              <span className="launch-clamp clamp-left" />
              <span className="launch-clamp clamp-right" />
            </div>
            <div className="launch-dust" aria-hidden="true">
              <i /><i /><i /><i /><i />
            </div>
            <div className="launch-controls">
              <p>A LITTLE SOMETHING FOR YOU</p>
              <button
                className="launch-button"
                type="button"
                onClick={handleLaunch}
                disabled={launchState === "launching"}
                aria-label="Launch the rocket"
              >
                <span className="launch-button-gloss" aria-hidden="true" />
                <strong>{launchState === "launching" ? "LIFTOFF" : "LAUNCH"}</strong>
              </button>
              <span className="launch-hint">
                {launchState === "launching" ? "ENGINES IGNITED" : "PRESS TO BEGIN"}
              </span>
            </div>
          </div>
        )}

        <canvas className="smoke-canvas" ref={canvasRef} aria-hidden="true" />
        <div className="completion-sparkles" aria-hidden="true">
          <i className="completion-sparkle sparkle-one" />
          <i className="completion-sparkle sparkle-two" />
          <i className="completion-sparkle sparkle-three" />
        </div>

        <div className="rocket-motion" ref={rocketRef}>
          <div className="rocket-roll" ref={rollRef}>
            <div className="launch-plume" aria-hidden="true"><i /><i /><i /></div>
            <Rocket />
          </div>
        </div>

        <header className="flight-header">
          <p className="for-you"><span aria-hidden="true">♥</span> JUST FOR YOU</p>
        </header>

        <p className="sr-only" aria-live="polite">Rocket status: {currentMessage}</p>
        <div className="cinematic-vignette" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
      </section>
    </main>
  );
}
