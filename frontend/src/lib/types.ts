import { onMount } from "svelte";
import {
  Canvas,
  CircleBrush,
  PencilBrush,
  Point,
  SprayBrush,
  type TBrushEventData,
} from "fabric";

import { Colord, colord, type RgbaColor } from "colord";
import { CircleUserRound, LogOut } from "@lucide/svelte";

import { getCursorSVG, handleBrush, initBrush } from "$lib/utils";
import { io, Socket } from "socket.io-client";
import { goto } from "$app/navigation";
import type { SprayPaintBrush } from "$lib/canvas";
import { toast, Toaster } from "svelte-sonner";
import Toolbar from "$lib/components/Toolbar.svelte";
import { drawingController, lobbyController } from "$lib/socketControllers";

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
