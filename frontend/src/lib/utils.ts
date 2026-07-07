import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Canvas, PencilBrush, CircleBrush, SprayBrush } from "fabric";
import { SprayPaintBrush } from "$lib/canvas";
import { type Colord } from "colord";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCursorSVG(fill: string, size: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" id="circleSVG" width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    class="lucide lucide-circle-icon lucide-circle">
    <circle id="circle" cx="12" cy="12" r="10" fill="black" />
</svg>`;
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svg, "image/svg+xml");

  const svgEl = svgDoc.getElementById("circleSVG");
  svgDoc.getElementById("circle")?.setAttribute("fill", fill);
  svgEl?.setAttribute("fill", fill);
  svgEl?.setAttribute("stroke", fill);
  svgEl?.setAttribute("width", size.toString());
  svgEl?.setAttribute("height", size.toString());
  //svgEl?.setAttribute("viewBox", `0 0 ${size} ${size}`);
  const hotspot = Math.round(size / 2);

  // 3. Serialize the XML element back into a text string
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgEl!);

  // 4. Return the fully formed CSS cursor format string
  // Use encodeURIComponent to safely escape any special characters (#, <, >) in the SVG code
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svgString)}") ${hotspot} ${hotspot}, auto`;
}
type playerData = {
  sid: string;
  brushType: "Spray" | "Pencil" | "Dotted" | "Circular";
  brushWidth: number;
  brushColor: Colord;
};

export function initBrush(canvas: Canvas, data: playerData) {
  let brush: SprayPaintBrush | PencilBrush | SprayBrush | CircleBrush;

  if (data.brushType == "Spray") {
    brush = new SprayPaintBrush(canvas);
    brush.loadBrush().then(() => {
      (brush as SprayPaintBrush).setColor(data.brushColor.toHex());
    });
  } else {
    if (data.brushType == "Circular") {
      brush = new CircleBrush(canvas);
    } else if (data.brushType == "Dotted") {
      brush = new SprayBrush(canvas);
    } else if (data.brushType == "Pencil") {
      brush = new PencilBrush(canvas);
    }
    brush!.color = data.brushColor.toRgbString();
    brush!.width = data.brushWidth;
  }
  return brush!;
}

export function handleBrush(
  canvas: Canvas,
  brushType: "Spray" | "Pencil" | "Dotted" | "Circular",
  brushWidth: number,
  color: Colord,
) {
  let currentPaintBrush:
    | SprayPaintBrush
    | PencilBrush
    | SprayBrush
    | CircleBrush;
  if (!canvas) return;
  if (brushType == "Spray") {
    currentPaintBrush = new SprayPaintBrush(canvas);
    currentPaintBrush.loadBrush().then(() => {
      (currentPaintBrush as SprayPaintBrush).setColor(color.toHex());
      canvas.freeDrawingBrush = currentPaintBrush;
      // canvas.freeDrawingBrush.width = brushWidth;
    });
    // console.log("Spray");
  } else {
    if (brushType == "Circular") {
      currentPaintBrush = new CircleBrush(canvas);
      canvas.freeDrawingBrush = currentPaintBrush;
      // canvas.freeDrawingBrush.width = brushWidth;
      // console.log("Circle");
    } else if (brushType == "Dotted") {
      currentPaintBrush = new SprayBrush(canvas);
      canvas.freeDrawingBrush = currentPaintBrush;
      // canvas.freeDrawingBrush.width = brushWidth;
      // console.log("Dotted");
    } else if (brushType == "Pencil") {
      currentPaintBrush = new PencilBrush(canvas);
      currentPaintBrush.decimate = 2.5;
      canvas.freeDrawingBrush = currentPaintBrush;

      // canvas.freeDrawingBrush.width = brushWidth;
      // console.log("Pencil");
    }
  }
  canvas.freeDrawingBrush!.color = color.toRgbString();
  canvas.freeDrawingBrush!.width = brushWidth;
  //canvas.freeDrawingBrush
  canvas.freeDrawingCursor = getCursorSVG(color.toRgbString(), brushWidth);
}

export async function loadCanvas(canvas: Canvas, data: any) {
  await canvas.loadFromJSON(data, () => {
    console.log("loaded");
    canvas.requestRenderAll();
  });
  console.log("done");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any }
  ? Omit<T, "children">
  : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
  ref?: U | null;
};
