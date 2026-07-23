import { CircleBrush, PencilBrush, SprayBrush } from "fabric";

import { Colord, type RgbaColor } from "colord";

import type { SprayPaintBrush } from "$lib/canvas";

export type cursorData = {
  idle: boolean;
  x: number;
  y: number;
};

export type canvasMouseData = {
  x: number;
  y: number;
  type: "Spray" | "Pencil" | "Dotted" | "Circular";
  color: string;
  width: number;
  svgData: string;
};

export type playerData = {
  sid: string;
  local: boolean;
  brushType: "Spray" | "Pencil" | "Dotted" | "Circular";
  brushWidth: number;
  brushColor: Colord;
  cursor: cursorData;
};

export type playerBrush = {
  sid: string;
  brush: SprayPaintBrush | PencilBrush | SprayBrush | CircleBrush;
};

export type roomStateType = {
  room_code: string;
  players: Map<string, playerData>;
  playerBrushes: Map<string, playerBrush>;
  ifMouseDown: boolean;
  bg_rgb: RgbaColor;
  lastUsedBg: string;
};

export type brushStateType = {
  strPaintBrush: "Spray" | "Pencil" | "Dotted" | "Circular"; //Default Brush
  rgb: RgbaColor;
  brushWidth: number;
};
