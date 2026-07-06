import { CircleBrush, PencilBrush, SprayBrush } from "fabric";

import { Colord, type RgbaColor } from "colord";

import type { SprayPaintBrush } from "$lib/canvas";

export type playerData = {
  sid: string;
  brushType: "Spray" | "Pencil" | "Dotted" | "Circular";
  brushWidth: number;
  brushColor: Colord;
};

export type playerBrush = {
  sid: string;
  brush: SprayPaintBrush | PencilBrush | SprayBrush | CircleBrush;
};
export type roomStateType = {
  room_code: string;
  players: Array<playerData>;
  playerBrushes: Array<playerBrush>;
  ifMouseDown: boolean;
};
export type brushStateType = {
  strPaintBrush: "Spray" | "Pencil" | "Dotted" | "Circular"; //Default Brush
  rgb: RgbaColor;
  bg_rgb: RgbaColor;
  brushWidth: number;
};
