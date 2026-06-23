/*
Originally created by Arjan Haverkamp, https://github.com/av01d/fabric-brushes
Had to change quite some stuff to make it work on FabricJS 7

DOESNT WORK 100% YET!!!
*/
import { Canvas, FabricImage, filters, Point, util, BaseBrush } from "fabric";

export class SprayPaintBrush extends BaseBrush {
  public opacity: number = 1;

  protected baseWidth: number = 20;
  protected inkAmount: number = 0;
  protected interval: number = 20;

  protected lastPoint: any = null;
  protected point: Point | null = null;
  protected _points: Array<Point> = [];

  protected brush: FabricImage | null = null;
  protected sprayBrushDataUrl: string = "/SprayTexture.png";
  protected size: number;

  protected isDrawing: boolean = false;
  protected timerId: any = null;
  protected lastRenderedPoint: Point | null = null;

  constructor(canvas: Canvas) {
    super(canvas);
    this.canvas = canvas;
    this.width = canvas.freeDrawingBrush?.width!; //|| 30;
    this.opacity = canvas.contextTop.globalAlpha || 1;
    this.color = canvas.freeDrawingBrush?.color!; //|| "#000";

    this.strokeLineCap = "round";
    this.strokeLineJoin = "round";

    this.size = this.width + this.baseWidth;

    this.reset();
  }
  public async loadBrush(): Promise<void> {
    const loadedBrush = await FabricImage.fromURL(this.sprayBrushDataUrl);
    this.brush = loadedBrush;
    this.brush.filters = [];
    this.setColor(this.color);
  }

  private reset(): void {
    this.point = null;
    this.lastPoint = null;
    this.canvas.contextTop.globalAlpha = 1;
  }

  public setColor(color: string) {
    this.color = color;

    this.brush!.filters[0] = new filters.BlendColor({
      color: color,
      alpha: 1,
      mode: "tint",
    });
    this.brush!.applyFilters();
    this.canvas.requestRenderAll();
  }

  public convertToImg() {
    const pixelRatio = this.canvas.getRetinaScaling(),
      copiedCanvasElement = util.copyCanvasElement(this.canvas.upperCanvasEl),
      xy = this.trimCanvas(copiedCanvasElement);
    //img = new FabricImage(copiedCanvasElement);
    const dataURL = copiedCanvasElement.toDataURL("image/png");

    FabricImage.fromURL(dataURL).then((img) => {
      img
        .set({
          left: xy.x / pixelRatio,
          top: xy.y / pixelRatio,
          scaleX: 1,
          scaleY: 1,
          width: xy.width / pixelRatio,
          height: xy.height / pixelRatio,
        })
        .setCoords();
      this.canvas.add(img);
    });
    const ctxTop = this.canvas.contextTop;
    ctxTop.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.requestRenderAll();
  }

  public trimCanvas(canvas: HTMLCanvasElement) {
    let ctx = canvas.getContext("2d");
    if (!ctx) return { x: 0, y: 0, width: 0, height: 0 };
    let w = canvas.width;
    let h = canvas.height;
    let pix: { x: number[]; y: number[] } = { x: [], y: [] };
    let n: number = 0;
    let imageData = ctx?.getImageData(0, 0, w, h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (imageData!.data[(y * w + x) * 4 + 3] > 0) {
          pix.x.push(x);
          pix.y.push(y);
        }
      }
    }
    if (pix.x.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const fn = function (a: number, b: number) {
      return a - b;
    };
    pix.x.sort(fn);
    pix.y.sort(fn);
    const minX = pix.x[0];
    const maxX = pix.x[pix.x.length - 1];
    const minY = pix.y[0];
    const maxY = pix.y[pix.y.length - 1];

    const croppedW = maxX - minX + 1;
    const croppedH = maxY - minY + 1;

    const cut = ctx?.getImageData(minX, minY, croppedW, croppedH);

    canvas.width = croppedW;
    canvas.height = croppedH;
    ctx?.putImageData(cut!, 0, 0);

    return { x: minX, y: minY, width: croppedW, height: croppedH };
  }

  override onMouseDown(pointer: Point) {
    this.size = this.width + this.baseWidth;
    this.inkAmount = 0;

    this.isDrawing = true;
    //this._points = [];
    this.lastRenderedPoint = new Point(pointer.x, pointer.y);

    this.executeTextureLoop();
    //super.onMouseDown(pointer, options);
    // this.canvas.contextTop.globalAlpha = this.opacity;
    // const startPoint = new Point(pointer.x, pointer.y);
    // //this.point = new Point(pointer.x, pointer.y);
    // this._points.push(startPoint);
    // //this.lastPoint = this.point;

    // const ctx = this.canvas.contextTop;
    // ctx.lineCap = this.strokeLineCap;
    // ctx.lineJoin = this.strokeLineJoin;

    // this.size = this.width + this.baseWidth;
    // this.inkAmount = 0;

    this.setColor(this.color);
    // this._render();
  }

  override onMouseMove(pointer: Point) {
    const movePoint = new Point(pointer.x, pointer.y);
    this._points.push(movePoint);

    const ctx = this.canvas.contextTop;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width;
    if (this._points.length > 1) {
      // const p1 = this._points[this._points.length - 2];
      // const p2 = this._points[this._points.length - 1];

      // ctx.beginPath();
      // ctx.moveTo(p1.x, p1.y);
      // ctx.lineTo(p2.x, p2.y);
      //ctx.stroke();
      this.executeTextureLoop();
    }
    this.lastPoint = this.point;
    this.point = new Point(pointer.x, pointer.y);
  }

  onMouseUp(options: any) {
    this.isDrawing = false;

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    setTimeout(() => {
      this.convertToImg();
      this.reset();
    }, this.interval);
  }

  protected executeTextureLoop() {
    if (!this.isDrawing || !this.point || !this.lastPoint || !this.brush)
      return;
    const ctxTop = this.canvas.contextTop;
    const currentPoint = this._points[this._points.length - 1];
    const lastPoint = this.lastRenderedPoint || currentPoint;
    const distance = currentPoint.distanceFrom(lastPoint);
    let angle = 0;
    if (distance > 0.1) {
      angle = Math.atan2(
        currentPoint.x - lastPoint.x,
        currentPoint.y - lastPoint.y,
      );
    }
    const amount = 100 / this.size / (Math.pow(distance, 2) + 1);
    this.inkAmount += amount;
    this.inkAmount = Math.max(this.inkAmount - distance / 10, 0);
    const x = lastPoint.x + Math.sin(angle) - this.size / 2;
    const y = lastPoint.y + Math.cos(angle) - this.size / 2;
    ctxTop.save();
    ctxTop.globalAlpha = this.opacity;

    // Draw cached HTMLImage element reference safely
    ctxTop.drawImage(this.brush.getElement(), x, y, this.size, this.size);
    ctxTop.restore();
    this.lastRenderedPoint = currentPoint;
    this.timerId = setTimeout(this.executeTextureLoop, this.interval);
  }
  override _render(): void {
    this.executeTextureLoop();
    this._render();
  }
  // _render() {
  //   const draw = (): void => {
  //     if (!this.isDrawing || !this.point || !this.lastPoint || !this.brush)
  //       return;

  //     const ctxTop = this.canvas.contextTop;

  //     // Calculate real delta parameters
  //     const distance = this.point.distanceFrom(this.lastPoint);

  //     // FIX: If the mouse isn't moving, reuse current location to prevent (0,0) snapping
  //     let angle = 0;
  //     if (distance > 0.1) {
  //       angle = Math.atan2(
  //         this.point.x - this.lastPoint.x,
  //         this.point.y - this.lastPoint.y,
  //       );
  //     }

  //     const amount = 100 / this.size / (Math.pow(distance, 2) + 1);
  //     this.inkAmount += amount;
  //     this.inkAmount = Math.max(this.inkAmount - distance / 10, 0);

  //     // Interpolate offsets
  //     const x = this.lastPoint.x + Math.sin(angle) - this.size / 2;
  //     const y = this.lastPoint.y + Math.cos(angle) - this.size / 2;

  //     ctxTop.save();
  //     ctxTop.globalAlpha = this.opacity;

  //     // Draw cached HTMLImage element reference safely
  //     ctxTop.drawImage(this.brush.getElement(), x, y, this.size, this.size);
  //     ctxTop.restore();

  //     // Explicitly update trailing tracker coordinate bounds
  //     this.lastPoint = this.point;

  //     if (this.isDrawing) {
  //       this.timerId = setTimeout(draw, this.interval);
  //     } else {
  //       this.reset();
  //     }
  //   };

  //   draw();
  // }
}
