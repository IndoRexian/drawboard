import { type Canvas, type TEvent } from "fabric";
import type { brushStateType, canvasMouseData, roomStateType } from "./types";
import type { Socket } from "socket.io-client";
import { colord } from "colord";

import { getStroke } from "perfect-freehand";
import { DrawStroke } from "./utils";

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
  let points: Array<[number, number]> = [];

  const strokeDrawer = new DrawStroke(localCanvas);

  localCanvas.on("mouse:down", (e) => {
    roomState.ifMouseDown = true;
    points = [];
    const point = localCanvas.getScenePoint(e.e);

    points.push([point.x, point.y]);
    const outlinePoints = getStroke(points, {
      size: brushState.brushWidth,
    });
    const svgData = strokeDrawer.getSvgPathFromStroke(outlinePoints);
    const data: canvasMouseData = {
      x: point.x,
      y: point.y,
      type: brushState.strPaintBrush,
      color: colord(brushState.rgb).toHex(),
      width: brushState.brushWidth,
      svgData: svgData,
    };
    strokeDrawer.drawPreviewStroke(svgData, data.color);
    // localCanvas.requestRenderAll();
    socket.emit("draw:start", roomState.room_code, data);
  });

  localCanvas.on("mouse:move", (e) => {
    if (!roomState.ifMouseDown) return;

    const point = localCanvas.getScenePoint(e.e);

    points.push([point.x, point.y]);
    const outlinePoints = getStroke(points, {
      size: brushState.brushWidth,
    });
    const svgData = strokeDrawer.getSvgPathFromStroke(outlinePoints, false);
    const data: canvasMouseData = {
      x: point.x,
      y: point.y,
      type: brushState.strPaintBrush,
      color: colord(brushState.rgb).toHex(),
      width: brushState.brushWidth,
      svgData: svgData,
    };
    strokeDrawer.drawPreviewStroke(svgData, data.color);

    // localCanvas.requestRenderAll();
    socket.emit("draw:cont", roomState.room_code, data);
  });
  localCanvas.on("mouse:up", (e) => {
    roomState.ifMouseDown = false;

    const point = localCanvas.getScenePoint(e.e);

    points.push([point.x, point.y]);
    const outlinePoints = getStroke(points, {
      size: brushState.brushWidth,
    });
    const svgData = strokeDrawer.getSvgPathFromStroke(outlinePoints);
    const data: canvasMouseData = {
      x: point.x,
      y: point.y,
      type: brushState.strPaintBrush,
      color: colord(brushState.rgb).toHex(),
      width: brushState.brushWidth,
      svgData: svgData,
    };
    const path = strokeDrawer.commitStroke(svgData, data.color);
    localCanvas.fire("objectAdded:self", { target: path });
    points = [];
    socket.emit("draw:end", roomState.room_code, data);
  });

  let toAdd: boolean = false;
  localCanvas.on("objectAdded:self", () => {
    toAdd = true;
    //console.log("own data");
  });
  localCanvas.on("objectAdded:recieved", () => {
    toAdd = false;
    //console.log("data recieved from server");
  });
  localCanvas.on("object:added", (e) => {
    setTimeout(() => {
      if (toAdd) {
        const data = e.target.toJSON();
        //console.log(data);
        socket.emit("recieve_data", roomState.room_code, data);
      }
    }, 1500);
  });
}
