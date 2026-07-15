import type { Canvas, TEvent } from "fabric";
import type { brushStateType, roomStateType } from "./types";
import type { Socket } from "socket.io-client";
import { colord } from "colord";
declare module "fabric" {
  interface CanvasEvents {
    "objectAdded:self": Partial<TEvent> & {
      target: any;
    };
    "objectAdded:recieved": Partial<TEvent> & {
      target: any;
    };
  }
}
export function canvasController(
  localCanvas: Canvas,
  socket: Socket,
  roomState: roomStateType,
  brushState: brushStateType,
) {
  localCanvas.on("mouse:down", (e) => {
    roomState.ifMouseDown = true;
    const point = localCanvas.getScenePoint(e.e);
    const data = {
      x: point.x,
      y: point.y,
      type: brushState.strPaintBrush,
      color: colord(brushState.rgb).toHex(),
      width: brushState.brushWidth,
    };
    socket.emit("draw:start", roomState.room_code, data);
  });
  localCanvas.on("mouse:up", (e) => {
    console.log("up");
    roomState.ifMouseDown = false;

    const point = localCanvas.getScenePoint(e.e);
    const data = {
      x: point.x,
      y: point.y,
      type: brushState.strPaintBrush,
      color: colord(brushState.rgb).toHex(),
      width: brushState.brushWidth,
    };
    localCanvas.fire("objectAdded:self", { target: e.target });
    socket.emit("draw:end", roomState.room_code, data);
  });
  localCanvas.on("mouse:move", (e) => {
    if (!roomState.ifMouseDown) return;

    const point = localCanvas.getScenePoint(e.e);
    const data = {
      x: point.x,
      y: point.y,
      type: brushState.strPaintBrush,
      color: colord(brushState.rgb).toHex(),
      width: brushState.brushWidth,
    };
    socket.emit("draw:cont", roomState.room_code, data);
  });

  let toAdd: boolean = false;
  localCanvas.on("objectAdded:self", () => {
    toAdd = true;
    console.log("own data");
  });
  localCanvas.on("objectAdded:recieved", () => {
    toAdd = false;
    console.log("data recieved from server");
  });
  localCanvas.on("object:added", (e) => {
    setTimeout(() => {
      if (toAdd) {
        const data = e.target.toJSON();
        console.log(data);
        socket.emit("recieve_data", roomState.room_code, data);
      }
    }, 1500);
  });
}
