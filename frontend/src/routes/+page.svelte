<script lang="ts">
  import { onMount } from "svelte";
  import { Canvas } from "fabric";

  import { Colord, colord } from "colord";

  import { getCursorSVG, handleBrush } from "$lib/utils";
  import { io, Socket } from "socket.io-client";
  import { Toaster } from "svelte-sonner";
  import Toolbar from "$lib/components/Toolbar.svelte";
  import { drawingController, lobbyController } from "$lib/socketControllers";
  import type {
    roomStateType,
    brushStateType,
    playerData,
    playerBrush,
  } from "$lib/types";
  import { canvasController } from "$lib/canvasControllers";

  let localCanvasElement: HTMLCanvasElement;
  let baseCanvasElement: HTMLCanvasElement;
  let localCanvas: Canvas;
  let baseCanvas: Canvas;

  let socket: Socket;

  let roomState: roomStateType = $state({
    room_code: "",
    players: new Map<string, playerData>(),
    playerBrushes: new Map<string, playerBrush>(),
    ifMouseDown: false,
    bg_rgb: { r: 255, g: 255, b: 255, a: 1 },
    lastUsedBg: "",
  });

  let brushState: brushStateType = $state({
    strPaintBrush: "Pencil", //Default Brush
    rgb: { r: 0, g: 0, b: 0, a: 1 },
    brushWidth: 1,
  });
  let user_sid = $state("");
  let canvasElements = $state(new Map<string, HTMLCanvasElement>());
  let canvases = $state(new Map<string, Canvas>());
  let color: Colord = $derived(colord(brushState.rgb));
  let bg_color: Colord = $derived(colord(roomState.bg_rgb));
  let syncState = $state({ bgHydrated: false });
  onMount(() => {
    localCanvas = new Canvas(localCanvasElement, {
      width: 600,
      height: 600,
      backgroundColor: "transparent",
      freeDrawingCursor: getCursorSVG(
        colord(brushState.rgb).toRgbString(),
        brushState.brushWidth,
      ),
      isDrawingMode: true,
    });
    baseCanvas = new Canvas(baseCanvasElement, {
      width: 600,
      height: 600,
      backgroundColor: bg_color.toRgbString(),
      isDrawingMode: false,
    });
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

    positionCanvas(localCanvas, 50, true);
    positionCanvas(baseCanvas, 0, false);

    socket = io("/", {
      transports: ["websocket", "webtransport", "polling"],
      rejectUnauthorized: false,
    });
  });

  $effect(() => {
    lobbyController(
      socket,
      roomState,
      brushState,
      baseCanvas,
      canvases,
      canvasElements,
      user_sid,
      syncState,
    );
    drawingController(
      socket,
      localCanvas,
      roomState,
      brushState,
      baseCanvas,
      canvases,
      canvasElements,
      syncState,
    );

    if (!localCanvas) return;
    canvasController(localCanvas, socket, roomState, brushState);

    return () => socket.disconnect();
  });
  $effect(() => {
    if (socket && roomState.room_code) {
      socket.emit("draw:brush_change", roomState.room_code, {
        brushType: brushState.strPaintBrush,
        brushColor: color.toHex(),
        brushWidth: brushState.brushWidth,
      });
    }
    handleBrush(
      localCanvas,
      brushState.strPaintBrush,
      brushState.brushWidth,
      color,
    );

    if (!localCanvas || !localCanvas.freeDrawingBrush) return;
    localCanvas.requestRenderAll();
  });
  $effect(() => {
    if (!localCanvas || !socket || !baseCanvas) return;

    const currentBg = bg_color.toRgbString();
    baseCanvas.backgroundColor = currentBg;
    baseCanvas.requestRenderAll();

    if (
      !syncState.bgHydrated ||
      !roomState.room_code ||
      currentBg === roomState.lastUsedBg
    )
      return;

    roomState.lastUsedBg = currentBg;
    socket.emit("draw:bg_change", roomState.room_code, {
      bg_color: bg_color.rgba,
      bg_color_rgb: currentBg,
    });
  });
  //bind accepts only HTML Elements,
  //         so gotta wrap JS elements into HTML ones like canvasElement onto canvas
</script>

<div class="grid justify-center animate-in ease-in">
  <Toaster />
  <div class="flex flex-fill text-2xl justify-center mb-1">Drawboard</div>
  <div>{user_sid}</div>
  <div class="flex flex-row min-w-max">
    <div class="basis-3/4">
      <div class="relative w-150 h-150" id="canvas-container">
        <canvas
          bind:this={localCanvasElement}
          class="local-canvas border-2 border-black"

          // style="position: absolute; top:0; left:0;"
        ></canvas>
        <canvas
          bind:this={baseCanvasElement}
          class="base-canvas border-2 border-black"
        ></canvas>
      </div>
      <Toolbar {brushState} {roomState}></Toolbar>
    </div>
    <div class=" basis-1/4">
      <div class="users min-w-max"></div>
    </div>
  </div>
</div>

<style lang="postcss">
  @reference "tailwindcss";
</style>
