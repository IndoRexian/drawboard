import type {
  Canvas,
  FabricObject,
  FabricObjectProps,
  ObjectEvents,
  SerializedObjectProps,
  TEvent,
} from "fabric";
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
    console.log("up");
    roomState.ifMouseDown = false;

    const point = canvas.getScenePoint(e.e);
    const data = {
      x: point.x,
      y: point.y,
      type: brushState.strPaintBrush,
      color: colord(brushState.rgb).toHex(),
      width: brushState.brushWidth,
    };
    canvas.fire("objectAdded:self", { target: e.target });
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

  let toAdd: boolean = false;
  canvas.on("objectAdded:self", () => {
    toAdd = true;
    console.log("own data");
  });
  canvas.on("objectAdded:recieved", () => {
    toAdd = false;
    console.log("data recieved from server");
  });
  canvas.on("object:added", (e) => {
    setTimeout(() => {
      if (toAdd) {
        const data = e.target.toJSON();
        console.log(data);
        socket.emit("recieve_data", roomState.room_code, data);
      }
    }, 1500);
  });
}
