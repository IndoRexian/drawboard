<script lang="ts">
  import { onMount } from "svelte";
  import { Canvas } from "fabric";

  import { Colord, colord } from "colord";

  import { getCursorSVG } from "$lib/utils";
  import { io, Socket } from "socket.io-client";
  import { Toaster } from "svelte-sonner";
  import Toolbar from "$lib/components/Toolbar.svelte";
  import {
    cursorController,
    drawingController,
    lobbyController,
  } from "$lib/socketControllers";
  import type {
    roomStateType,
    brushStateType,
    playerData,
    playerBrush,
  } from "$lib/types";
  import { canvasController } from "$lib/canvasControllers";
  import * as ContextMenu from "$lib/components/ui/context-menu/index.js";
  import { addMouseListener } from "$lib/mouseListener";
  let localCanvasElement: HTMLCanvasElement;
  let localCanvas: Canvas;

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
    brushWidth: 3,
  });
  let user_sid = $state({ sid: "" });
  let color: Colord = $derived(colord(brushState.rgb));
  let bg_color: Colord = $derived(colord(roomState.bg_rgb));
  let syncState = $state({ bgHydrated: false });
  onMount(() => {
    const canvasContainer = document.getElementById("canvas-container");
    const initialWidth = canvasContainer?.clientWidth ?? 600;
    const initialHeight = canvasContainer?.clientHeight ?? 600;

    localCanvas = new Canvas(localCanvasElement, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "transparent",
      // defaultCursor: "cell",
      defaultCursor: getCursorSVG(
        color.toRgbString(),
        color.invert().toRgbString(),
        brushState.brushWidth,
      ),
      isDrawingMode: false,
      fireRightClick: false,
      stopContextMenu: false,
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

    // positionCanvas(localCanvas, 50, true);

    socket = io("/", {
      transports: ["websocket", "webtransport", "polling"],
      rejectUnauthorized: false,
    });
    addMouseListener(canvasContainer!, socket!, roomState);
  });

  $effect(() => {
    lobbyController(
      socket,
      roomState,
      brushState,
      localCanvas,
      user_sid,
      syncState,
    );
    drawingController(socket, localCanvas, roomState, brushState, syncState);

    if (!localCanvas) return;
    canvasController(localCanvas, socket, roomState, brushState);

    //Haven't fixed all of it's bugs yet!
    // cursorController(socket, roomState);

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

    //commented until i find a good cursor
    if (localCanvas) {
      localCanvas.defaultCursor = getCursorSVG(
        colord(brushState.rgb).toRgbString(),
        colord(brushState.rgb).invert().toRgbString(),
        brushState.brushWidth,
      );
    }

    localCanvas.requestRenderAll();
  });
  $effect(() => {
    if (!localCanvas || !socket) return;
    const currentBg = bg_color.toRgbString();
    localCanvas.backgroundColor = currentBg;
    localCanvas.requestRenderAll();
    if (
      !syncState.bgHydrated ||
      !roomState.room_code ||
      currentBg === roomState.lastUsedBg
    )
      return;
    console.log(brushState.brushWidth);
    roomState.lastUsedBg = currentBg;
    socket.emit("draw:bg_change", roomState.room_code, {
      bg_color: bg_color.rgba,
      bg_color_rgb: currentBg,
    });
  });
  //bind accepts only HTML Elements,
  //         so gotta wrap JS elements into HTML ones like canvasElement onto canvas
</script>

<div class="grid w-full animate-in ease-in">
  <Toaster />
  <div class="flex flex-fill text-2xl justify-center mb-1">Drawboard</div>
  <div class="flex w-full h-full flex-row min-w-0 min-h-0">
    <div class="flex-1 min-w-0">
      <ContextMenu.Root>
        <ContextMenu.Trigger>
          <div
            class="relative h-full min-h-0 w-full min-w-0"
            id="canvas-container"
          >
            <div
              class="absolute inset-0 z-10 min-w-full min-h-full pointer-events-none"
              id="cursors"
            ></div>
            <canvas
              bind:this={localCanvasElement}
              class="local-canvas block w-full h-full border-2 border-black"
            ></canvas>
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Content>
          <Toolbar {brushState} {roomState}></Toolbar>
        </ContextMenu.Content>
      </ContextMenu.Root>
    </div>
    <!-- <div class=" basis-1/4">
      <div class="users min-w-max"></div>
    </div> -->
  </div>
</div>

<style lang="postcss">
  @reference "tailwindcss";
</style>
