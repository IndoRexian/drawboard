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

export function createCanvas(
  canvases: Map<string, Canvas>,
  canvasElements: Map<string, HTMLCanvasElement>,
  index: number,
  sid: string,
) {
  const positionCanvas = (
    targetCanvas: Canvas,
    zIndex: number,
    transparency: boolean,
  ) => {
    const wrapper = targetCanvas.wrapperEl;

    wrapper.style.position = "absolute";
    wrapper.style.top = "0";
    wrapper.style.left = "0";
    wrapper.style.zIndex = String(zIndex);

    const canvasElement = targetCanvas.getElement();
    if (canvasElement && transparency) {
      wrapper.style.backgroundColor = "transparent";
      canvasElement.style.backgroundColor = "transparent";
      canvasElement.style.background = "transparent";
      targetCanvas.backgroundColor = "rgba(0,0,0,0)";
    }
  };
  const container = document.getElementById("canvas-container");
  const canvasElement = document.createElement("canvas");
  canvasElement.id = sid;
  container?.append(canvasElement);
  const canvas = new Canvas(canvasElement, {
    width: 600,
    height: 600,
    isDrawingMode: false,
  });
  positionCanvas(canvas, index, true);
  canvases.set(sid, canvas);
  canvasElements.set(sid, canvasElement);
}

export function removeCanvas(
  canvases: Map<string, Canvas>,
  canvasElements: Map<string, HTMLCanvasElement>,
  sid: string,
) {
  canvasElements.get(sid)?.remove();
  canvasElements.delete(sid);
  canvases.get(sid)?.dispose();
  canvases.delete(sid);
}

export function checkMobile() {
  let status: boolean = false;
  (function (a) {
    if (
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
        a,
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
        a.substring(0, 4),
      )
    ) {
      status = true;
    }
    return status;
  })(navigator.userAgent || navigator.vendor);
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
