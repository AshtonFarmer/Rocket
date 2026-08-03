"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };
type RawStroke = Array<[number, number]>;
type ScriptGlyph = { width: number; points: RawStroke };
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

const SCRIPT_LETTER_GAP = 0.065;
const SCRIPT_WORD_GAP = 0.58;

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

const SCRIPT_FONT: Record<string, ScriptGlyph> = {
  A: { width: 0.82, points: [[0, 0.82], [0.14, 0.7], [0.29, 0.49], [0.5, 0.43], [0.7, 0.55], [0.67, 0.77], [0.5, 0.85], [0.27, 0.78], [0.22, 0.61], [0.4, 0.47], [0.68, 0.52], [0.77, 0.82], [1, 0.82]] },
  B: { width: 0.76, points: [[0, 0.82], [0.15, 0.7], [0.28, 0.34], [0.34, 0.08], [0.25, 0.14], [0.23, 0.63], [0.28, 0.82], [0.45, 0.62], [0.66, 0.49], [0.84, 0.56], [0.78, 0.75], [0.58, 0.84], [0.4, 0.76], [0.61, 0.7], [0.84, 0.72], [1, 0.82]] },
  C: { width: 0.73, points: [[0, 0.82], [0.14, 0.73], [0.24, 0.57], [0.45, 0.45], [0.71, 0.46], [0.84, 0.57], [0.72, 0.74], [0.49, 0.84], [0.25, 0.81], [0.46, 0.78], [0.76, 0.79], [1, 0.82]] },
  D: { width: 0.8, points: [[0, 0.82], [0.13, 0.7], [0.26, 0.5], [0.48, 0.44], [0.67, 0.55], [0.64, 0.77], [0.46, 0.85], [0.24, 0.77], [0.28, 0.56], [0.59, 0.49], [0.73, 0.8], [0.73, 0.34], [0.68, 0.09], [0.61, 0.16], [0.75, 0.82], [1, 0.82]] },
  E: { width: 0.68, points: [[0, 0.82], [0.16, 0.71], [0.29, 0.54], [0.53, 0.49], [0.69, 0.58], [0.55, 0.69], [0.28, 0.68], [0.36, 0.82], [0.61, 0.85], [0.82, 0.76], [1, 0.82]] },
  F: { width: 0.68, points: [[0, 0.82], [0.15, 0.73], [0.28, 0.48], [0.41, 0.16], [0.58, 0.08], [0.71, 0.18], [0.58, 0.43], [0.38, 0.82], [0.39, 1.05], [0.53, 1.12], [0.69, 1], [0.62, 0.82], [1, 0.82]] },
  G: { width: 0.78, points: [[0, 0.82], [0.14, 0.7], [0.28, 0.5], [0.5, 0.44], [0.68, 0.55], [0.63, 0.78], [0.43, 0.85], [0.22, 0.76], [0.29, 0.55], [0.59, 0.5], [0.73, 0.82], [0.69, 1.02], [0.5, 1.13], [0.34, 1.03], [0.48, 0.89], [0.78, 0.82], [1, 0.82]] },
  H: { width: 0.73, points: [[0, 0.82], [0.14, 0.7], [0.28, 0.34], [0.34, 0.08], [0.25, 0.15], [0.24, 0.82], [0.43, 0.64], [0.59, 0.49], [0.76, 0.54], [0.8, 0.82], [1, 0.82]] },
  I: { width: 0.43, points: [[0, 0.82], [0.16, 0.72], [0.27, 0.5], [0.38, 0.47], [0.34, 0.82], [0.64, 0.82], [1, 0.82]] },
  J: { width: 0.52, points: [[0, 0.82], [0.14, 0.72], [0.25, 0.49], [0.37, 0.47], [0.33, 0.9], [0.24, 1.09], [0.1, 1.12], [0.03, 1.02], [0.18, 0.88], [0.53, 0.82], [1, 0.82]] },
  K: { width: 0.69, points: [[0, 0.82], [0.14, 0.7], [0.28, 0.34], [0.34, 0.08], [0.25, 0.15], [0.24, 0.82], [0.4, 0.65], [0.63, 0.48], [0.51, 0.66], [0.78, 0.82], [1, 0.82]] },
  L: { width: 0.57, points: [[0, 0.82], [0.15, 0.7], [0.31, 0.34], [0.41, 0.08], [0.58, 0.11], [0.52, 0.32], [0.31, 0.65], [0.28, 0.82], [0.57, 0.85], [1, 0.82]] },
  M: { width: 0.96, points: [[0, 0.82], [0.14, 0.72], [0.27, 0.5], [0.42, 0.49], [0.45, 0.82], [0.54, 0.62], [0.68, 0.48], [0.81, 0.52], [0.83, 0.82], [1, 0.82]] },
  N: { width: 0.77, points: [[0, 0.82], [0.16, 0.72], [0.3, 0.49], [0.47, 0.5], [0.5, 0.82], [0.62, 0.62], [0.77, 0.49], [0.89, 0.56], [0.87, 0.82], [1, 0.82]] },
  O: { width: 0.76, points: [[0, 0.82], [0.13, 0.7], [0.24, 0.52], [0.44, 0.45], [0.65, 0.52], [0.73, 0.7], [0.62, 0.82], [0.4, 0.86], [0.2, 0.75], [0.23, 0.55], [0.47, 0.48], [0.7, 0.65], [0.78, 0.82], [1, 0.82]] },
  P: { width: 0.7, points: [[0, 0.82], [0.14, 0.72], [0.24, 0.51], [0.29, 0.82], [0.27, 1.08], [0.39, 1.1], [0.37, 0.82], [0.46, 0.62], [0.62, 0.49], [0.79, 0.54], [0.83, 0.7], [0.72, 0.8], [0.53, 0.78], [0.73, 0.75], [1, 0.82]] },
  Q: { width: 0.78, points: [[0, 0.82], [0.13, 0.7], [0.24, 0.52], [0.44, 0.45], [0.65, 0.52], [0.73, 0.7], [0.62, 0.82], [0.4, 0.86], [0.2, 0.75], [0.23, 0.55], [0.47, 0.48], [0.7, 0.65], [0.77, 0.83], [0.83, 1.08], [0.69, 1.12], [0.67, 0.84], [1, 0.82]] },
  R: { width: 0.65, points: [[0, 0.82], [0.15, 0.72], [0.27, 0.51], [0.35, 0.49], [0.34, 0.82], [0.44, 0.65], [0.58, 0.5], [0.73, 0.54], [0.68, 0.68], [0.54, 0.72], [0.78, 0.82], [1, 0.82]] },
  S: { width: 0.65, points: [[0, 0.82], [0.13, 0.73], [0.26, 0.54], [0.46, 0.47], [0.65, 0.52], [0.6, 0.64], [0.36, 0.68], [0.27, 0.78], [0.45, 0.85], [0.7, 0.78], [0.83, 0.72], [1, 0.82]] },
  T: { width: 0.6, points: [[0, 0.82], [0.14, 0.72], [0.27, 0.48], [0.36, 0.16], [0.49, 0.08], [0.58, 0.18], [0.46, 0.44], [0.35, 0.82], [0.57, 0.85], [0.8, 0.78], [1, 0.82]] },
  U: { width: 0.74, points: [[0, 0.82], [0.14, 0.71], [0.25, 0.5], [0.33, 0.49], [0.3, 0.77], [0.45, 0.85], [0.65, 0.78], [0.75, 0.5], [0.84, 0.51], [0.82, 0.82], [1, 0.82]] },
  V: { width: 0.72, points: [[0, 0.82], [0.14, 0.71], [0.27, 0.49], [0.38, 0.5], [0.36, 0.76], [0.5, 0.86], [0.69, 0.74], [0.82, 0.5], [0.9, 0.52], [0.84, 0.82], [1, 0.82]] },
  W: { width: 0.98, points: [[0, 0.82], [0.12, 0.71], [0.22, 0.5], [0.31, 0.51], [0.29, 0.76], [0.41, 0.85], [0.54, 0.76], [0.63, 0.5], [0.72, 0.51], [0.7, 0.76], [0.82, 0.85], [0.92, 0.73], [1, 0.82]] },
  X: { width: 0.72, points: [[0, 0.82], [0.13, 0.72], [0.28, 0.51], [0.45, 0.5], [0.61, 0.78], [0.75, 0.84], [0.64, 0.65], [0.53, 0.56], [0.7, 0.49], [0.86, 0.55], [0.82, 0.82], [1, 0.82]] },
  Y: { width: 0.74, points: [[0, 0.82], [0.14, 0.71], [0.25, 0.5], [0.34, 0.49], [0.31, 0.77], [0.46, 0.85], [0.66, 0.76], [0.76, 0.5], [0.85, 0.52], [0.81, 0.92], [0.68, 1.11], [0.52, 1.08], [0.59, 0.91], [0.83, 0.82], [1, 0.82]] },
  Z: { width: 0.68, points: [[0, 0.82], [0.14, 0.72], [0.3, 0.51], [0.55, 0.48], [0.72, 0.55], [0.56, 0.68], [0.33, 0.81], [0.54, 0.85], [0.76, 0.77], [1, 0.82]] },
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

function smoothScriptStroke(points: Point[], samples = 7) {
  if (points.length < 3) return points;
  const result: Point[] = [points[0]];

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[Math.max(0, index - 1)];
    const current = points[index];
    const next = points[index + 1];
    const after = points[Math.min(points.length - 1, index + 2)];

    for (let step = 1; step <= samples; step += 1) {
      const amount = step / samples;
      const squared = amount * amount;
      const cubed = squared * amount;
      result.push({
        x:
          0.5 *
          (2 * current.x +
            (-previous.x + next.x) * amount +
            (2 * previous.x - 5 * current.x + 4 * next.x - after.x) * squared +
            (-previous.x + 3 * current.x - 3 * next.x + after.x) * cubed),
        y:
          0.5 *
          (2 * current.y +
            (-previous.y + next.y) * amount +
            (2 * previous.y - 5 * current.y + 4 * next.y - after.y) * squared +
            (-previous.y + 3 * current.y - 3 * next.y + after.y) * cubed),
      });
    }
  }

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
      total +
      (character === " "
        ? SCRIPT_WORD_GAP
        : (SCRIPT_FONT[character] ?? SCRIPT_FONT.X).width +
          SCRIPT_LETTER_GAP) +
      (index ? 0 : 0.1),
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
  const isPhone = viewportWidth < 620;
  const lines = wrapMessage(message, isPhone ? 11 : 18);
  const widestLine = Math.max(...lines.map(lineUnits));
  const verticalStretch = isPhone ? 1.38 : 1.18;
  const scale = Math.min(
    (viewportWidth * (isPhone ? 0.9 : 0.78)) / widestLine,
    isPhone ? 59 : 76,
    (viewportHeight * 0.39) /
      (verticalStretch * (1.12 + (lines.length - 1) * 1.5)),
  );
  const letterHeight = scale * verticalStretch;
  const lineGap = letterHeight * 1.5;
  const blockHeight = letterHeight * 1.12 + (lines.length - 1) * lineGap;
  const startY = clamp(
    viewportHeight * 0.23 - blockHeight * 0.12,
    viewportHeight * 0.145,
    viewportHeight * 0.28,
  );
  const strokes: Array<{ points: Point[]; line: number; word: number }> = [];

  lines.forEach((line, lineIndex) => {
    const width = lineUnits(line) * scale;
    let cursor = (viewportWidth - width) / 2;
    const baseline = startY + lineIndex * lineGap + letterHeight * 0.82;
    const words = line.split(" ");

    words.forEach((word, wordIndex) => {
      const wordPoints: Point[] = [
        { x: cursor - scale * 0.12, y: baseline + scale * 0.045 },
        { x: cursor, y: baseline },
      ];

      Array.from(word).forEach((character) => {
        const glyph = SCRIPT_FONT[character] ?? SCRIPT_FONT.X;
        const transformed = glyph.points.map(([x, y]) => ({
          x:
            cursor +
            x * glyph.width * scale +
            (0.82 - y) * scale * 0.1,
          y: startY + lineIndex * lineGap + y * letterHeight,
        }));
        const smoothed = smoothScriptStroke(transformed);
        const previous = wordPoints.at(-1) ?? transformed[0];
        const previousTangent = tangentBetween(
          wordPoints.at(-2) ?? previous,
          previous,
        );
        const nextTangent = tangentBetween(
          smoothed[0],
          smoothed[1] ?? smoothed[0],
        );
        wordPoints.push(
          ...cubicConnector(previous, previousTangent, smoothed[0], nextTangent).slice(1),
          ...smoothed.slice(1),
        );
        cursor += (glyph.width + SCRIPT_LETTER_GAP) * scale;
      });

      wordPoints.push({
        x: cursor + scale * 0.18,
        y: baseline - scale * 0.025,
      });
      strokes.push({
        points: wordPoints,
        line: lineIndex,
        word: wordIndex,
      });
      if (wordIndex < words.length - 1) cursor += scale * SCRIPT_WORD_GAP;
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
    let finaleGlowStartedAt: number | null = null;
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
                ? 0.12
                : 0.78,
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
        const fadeIn = clamp(age / (particle.kind === "stunt" ? 0.035 : 0.009), 0, 1);
        const naturalFade =
          particle.kind === "stunt"
            ? clamp(particle.life / (particle.maxLife * 0.5), 0, 1)
            : 1;
        const particleOpacity =
          particle.alpha * fadeIn * naturalFade * layerOpacity;
        const diameter =
          particle.radius *
          (particle.kind === "message" ? 3.35 : 3.9) *
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
        context.globalAlpha = particleOpacity;
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
      finaleGlowStartedAt = null;
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
      finaleGlowStartedAt = null;
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
      finaleGlowStartedAt = null;
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
      let cameraZoom = 1.025;
      let visible = false;

      if (
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
            showMessageCount += 1;
            beginClearing(
              now,
              showMessageCount >= messagesThisShow ? "finale" : "message",
            );
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
            style={{ "--shoot-top": "13%", "--shoot-delay": "-2s" } as CSSProperties}
          />
          <span
            className="shooting-star"
            style={{ "--shoot-top": "31%", "--shoot-delay": "-11s" } as CSSProperties}
          />
        </div>

        <div className="cloud cloud-a" aria-hidden="true" />
        <div className="cloud cloud-b" aria-hidden="true" />
        <div className="cloud cloud-c" aria-hidden="true" />
        <div className="cloud cloud-d" aria-hidden="true" />
        <div className="cloud cloud-e" aria-hidden="true" />
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
        <div className="cinematic-vignette" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
      </section>
    </main>
  );
}
