<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { Canvas } from "fabric";

  import { Colord, colord } from "colord";

  import { getCursorSVG, handleBrush } from "$lib/utils";
  import { io, Socket } from "socket.io-client";
  import { Toaster } from "svelte-sonner";
  import Toolbar from "$lib/components/Toolbar.svelte";
  import { drawingController, lobbyController } from "$lib/socketControllers";
  import type { roomStateType, brushStateType } from "$lib/types";
  import { canvasController } from "$lib/canvasControllers";

  let canvasElement: HTMLCanvasElement;
  let canvas: Canvas;

  let socket: Socket;

  let roomState: roomStateType = $state({
    room_code: "",
    players: [],
    playerBrushes: [],
    ifMouseDown: false,
  });

  let brushState: brushStateType = $state({
    strPaintBrush: "Pencil", //Default Brush
    rgb: { r: 0, g: 0, b: 0, a: 1 },
    bg_rgb: { r: 255, g: 255, b: 255, a: 1 },
    brushWidth: 1,
    lastUsedBg: "",
  });
  let color: Colord = $derived(colord(brushState.rgb));
  let bg_color: Colord = $derived(colord(brushState.bg_rgb));

  onMount(() => {
    canvas = new Canvas(canvasElement, {
      width: 600,
      height: 600,
      //backgroundColor: "black",
      freeDrawingCursor: getCursorSVG(
        colord(brushState.rgb).toRgbString(),
        brushState.brushWidth,
      ),
      isDrawingMode: true,
    });
    socket = io("http://127.0.0.1:8000/", {
      transports: ["websocket", "webtransport", "polling"],
      rejectUnauthorized: false,
    });
  });

  $effect(() => {
    lobbyController(socket, canvas, roomState, brushState);
    drawingController(socket, canvas, roomState, brushState);

    if (!canvas) return;
    canvasController(canvas, socket, roomState, brushState);
    // canvas.on("mouse:down", (e) => {
    //   roomState.ifMouseDown = true;
    //   const point = canvas.getScenePoint(e.e);
    //   const data = {
    //     x: point.x,
    //     y: point.y,
    //     type: brushState.strPaintBrush,
    //     color: color.toHex(),
    //     width: brushState.brushWidth,
    //   };
    //   socket.emit("draw:start", roomState.room_code, data);
    // });
    // canvas.on("mouse:up", (e) => {
    //   roomState.ifMouseDown = false;

    //   const point = canvas.getScenePoint(e.e);
    //   const data = {
    //     x: point.x,
    //     y: point.y,
    //     type: brushState.strPaintBrush,
    //     color: color.toHex(),
    //     width: brushState.brushWidth,
    //   };
    //   socket.emit("draw:end", roomState.room_code, data);
    // });
    // canvas.on("mouse:move", (e) => {
    //   if (!roomState.ifMouseDown) return;

    //   const point = canvas.getScenePoint(e.e);
    //   const data = {
    //     x: point.x,
    //     y: point.y,
    //     type: brushState.strPaintBrush,
    //     color: color.toHex(),
    //     width: brushState.brushWidth,
    //   };
    //   socket.emit("draw:cont", roomState.room_code, data);
    // });

    return () => socket.disconnect();
  });
  $effect(() => {
    socket.emit("draw:brush_change", roomState.room_code, {
      brushType: brushState.strPaintBrush,
      brushColor: color.toHex(),
      brushWidth: brushState.brushWidth,
    });
    handleBrush(canvas, brushState.strPaintBrush, brushState.brushWidth, color);
    if (!canvas || !canvas.freeDrawingBrush) return;
    canvas.requestRenderAll();
  });
  $effect(() => {
    if (!canvas || !socket) return;

    canvas.backgroundColor = bg_color.toRgbString();
    const data = {
      bg_color: bg_color.rgba,
    };

    socket.emit("draw:bg_change", roomState.room_code, data);
    canvas.requestRenderAll();
  });
  //bind accepts only HTML Elements,
  //         so gotta wrap JS elements into HTML ones like canvasElement onto canvas
</script>

<div class="grid justify-center animate-in ease-in">
  <Toaster />
  <div class="flex flex-fill text-2xl justify-center mb-1">Drawboard</div>
  <div class="flex flex-row min-w-max">
    <div class=" basis-3/4">
      <canvas bind:this={canvasElement} class="mb-1 border-2 border-black"
      ></canvas>
      <Toolbar {brushState}></Toolbar>
    </div>
    <div class=" basis-1/4">
      <div class="users min-w-max"></div>
    </div>
  </div>
</div>

<style lang="postcss">
  @reference "tailwindcss";
</style>
