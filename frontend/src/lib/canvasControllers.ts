import type { Canvas } from "fabric";
import type { brushStateType, roomStateType } from "./types";
import type { Socket } from "socket.io-client";
import { colord } from "colord";

export function canvasController(
  canvas: Canvas,
  socket: Socket,
  roomState: roomStateType,
  brushState: brushStateType,
) {
  canvas.on("mouse:down", (e) => {
    roomState.ifMouseDown = true;
    const point = canvas.getScenePoint(e.e);
    const data = {
      x: point.x,
      y: point.y,
      type: brushState.strPaintBrush,
      color: colord(brushState.rgb).toHex(),
      width: brushState.brushWidth,
    };
    socket.emit("draw:start", roomState.room_code, data);
  });
  canvas.on("mouse:up", (e) => {
    roomState.ifMouseDown = false;

    const point = canvas.getScenePoint(e.e);
    const data = {
      x: point.x,
      y: point.y,
      type: brushState.strPaintBrush,
      color: colord(brushState.rgb).toHex(),
      width: brushState.brushWidth,
    };
    socket.emit("draw:end", roomState.room_code, data);
  });
  canvas.on("mouse:move", (e) => {
    if (!roomState.ifMouseDown) return;

    const point = canvas.getScenePoint(e.e);
    const data = {
      x: point.x,
      y: point.y,
      type: brushState.strPaintBrush,
      color: colord(brushState.rgb).toHex(),
      width: brushState.brushWidth,
    };
    socket.emit("draw:cont", roomState.room_code, data);
  });
}
