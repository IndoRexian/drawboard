<script lang="ts">
  import { onMount } from "svelte";
  import {
    Canvas,
    CircleBrush,
    Path,
    PencilBrush,
    Point,
    SprayBrush,
    type TBrushEventData,
  } from "fabric";

  import { Colord, colord, type RgbaColor } from "colord";
  import ColorPicker from "svelte-awesome-color-picker";
  import { Circle, Pipette, Wallpaper, X } from "@lucide/svelte";

  import { Slider } from "$lib/components/ui/slider/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Button } from "$lib/components/ui/button/index.js";

  import { getCursorSVG, handleBrush, initBrush, loadCanvas } from "$lib/utils";
  import { io, Socket } from "socket.io-client";
  import { goto } from "$app/navigation";
  import type { SprayPaintBrush } from "$lib/canvas";

  let canvasElement: HTMLCanvasElement;
  let canvas: Canvas;

  let strPaintBrush: "Spray" | "Pencil" | "Dotted" | "Circular" =
    $state("Pencil"); //Default Brush

  let colorPickerOpen: boolean = $state(false);
  let bgPickerOpen: boolean = $state(false);

  let rgb: RgbaColor = $state({ r: 0, g: 0, b: 0, a: 1 });
  let color: Colord = $derived(colord(rgb));

  let bg_rgb: RgbaColor = $state({ r: 255, g: 255, b: 255, a: 1 });
  let bg_color: Colord = $derived(colord(bg_rgb));

  let brushWidth: number = $state(1);

  let socket: Socket;
  let room_code: string = $state("");

  let ifMouseDown: boolean = $state(false);

  type playerData = {
    sid: string;
    brushType: "Spray" | "Pencil" | "Dotted" | "Circular";
    brushWidth: number;
    brushColor: Colord;
  };
  let players: Array<playerData> = $state([]);

  type playerBrush = {
    sid: string;
    brush: SprayPaintBrush | PencilBrush | SprayBrush | CircleBrush;
  };
  let playerBrushes: Array<playerBrush> = $state([]);

  onMount(() => {
    canvas = new Canvas(canvasElement, {
      width: 600,
      height: 600,
      //backgroundColor: "black",
      freeDrawingCursor: getCursorSVG(color.toRgbString(), brushWidth),
      isDrawingMode: true,
    });
    socket = io("http://127.0.0.1:8000/", {
      transports: ["websocket", "webtransport", "polling"],
      rejectUnauthorized: false,
    });
  });

  $effect(() => {
    socket.on("connect", () => {
      if (url.searchParams.get("room_code") == null) {
        //Creator of room
        console.log("Asking for a room");
        socket.emit("get_roomcode"); //asking for room_code
      } else {
        room_code = url.searchParams.get("room_code")!;
        socket.emit("join_room", room_code);
        console.log("Joined Room");
      }
      socket.emit("send_data", room_code);
      console.log("Connected from Frontend");
    });
    const url = new URL(window.location.toString());

    socket.on("send_roomcode", (data) => {
      //getting room_code
      room_code = data["room_code"];
      console.log(room_code);
      goto(`/?room_code=${room_code}`);
    });
    socket.on("user_join", (data) => {
      const player: playerData = {
        sid: data["sid"],
        brushType: "Pencil",
        brushWidth: 3,
        brushColor: colord({ r: 0, g: 0, b: 0, a: 1 }),
      };
      players.push(player);
      const playerBrush: playerBrush = {
        sid: data["sid"],
        brush: initBrush(canvas, player),
      };
      //this is basically the current users sending their brush configs to the new user
      socket.emit("draw:brush_change", room_code, {
        brushType: strPaintBrush,
        brushColor: color.toHex(),
        brushWidth: brushWidth,
      });
      playerBrushes.push(playerBrush);
    });

    socket.on("draw:started", (data) => {
      console.log(playerBrushes);
      const newPoint = new Point();
      newPoint.setXY(data.data.x, data.data.y);
      const brush = playerBrushes.find((value) => value.sid === data.sid);
      console.log(brush);
      brush?.brush.onMouseDown(newPoint, {
        e: {},
      } as TBrushEventData);
      canvas.requestRenderAll();
    });
    socket.on("draw:conted", (data) => {
      const newPoint = new Point();
      newPoint.setXY(data.data.x, data.data.y);
      const brush = playerBrushes.find(
        (value) => value.sid === data.sid,
      )?.brush;
      brush?.onMouseMove(newPoint, {
        e: {},
      } as TBrushEventData);

      console.log(data);
    });
    socket.on("draw:ended", (data) => {
      const brush = playerBrushes.find(
        (value) => value.sid === data.sid,
      )?.brush;
      brush?.onMouseUp({
        e: {},
      } as TBrushEventData);

      console.log(data);
    });

    socket.on("exit_room", (data: { sid: string }) => {
      players = players.filter((value) => {
        value.sid !== data.sid;
      });
    });
    socket.on("draw:brush_changed", (data) => {
      console.log("change found!");
      const playerIndex = players.findIndex((value) => value.sid === data.sid);
      const playerBrushIndex = playerBrushes.findIndex(
        (value) => value.sid === data.sid,
      );

      const player: playerData = {
        sid: data.sid,
        brushType: data.data.brushType,
        brushColor: colord(data.data.brushColor),
        brushWidth: data.data.brushWidth,
      };

      const playerBrush: playerBrush = {
        sid: data.sid,
        brush: initBrush(canvas, player),
      };
      if (playerIndex !== -1) {
        players[playerIndex] = player;
        playerBrushes[playerBrushIndex] = playerBrush;
      } else {
        players.push(player);
        playerBrushes.push(playerBrush);
      }
    });
    if (!canvas) return;

    canvas.on("mouse:down", (e) => {
      ifMouseDown = true;
      const point = canvas.getScenePoint(e.e);
      const data = {
        x: point.x,
        y: point.y,
        type: strPaintBrush,
        color: color.toHex(),
        width: brushWidth,
      };
      socket.emit("draw:start", room_code, data);
    });
    canvas.on("mouse:up", (e) => {
      ifMouseDown = false;

      const point = canvas.getScenePoint(e.e);
      const data = {
        x: point.x,
        y: point.y,
        type: strPaintBrush,
        color: color.toHex(),
        width: brushWidth,
      };
      socket.emit("draw:end", room_code, data);
    });
    canvas.on("mouse:move", (e) => {
      if (!ifMouseDown) return;

      const point = canvas.getScenePoint(e.e);
      const data = {
        x: point.x,
        y: point.y,
        type: strPaintBrush,
        color: color.toHex(),
        width: brushWidth,
      };
      socket.emit("draw:cont", room_code, data);
    });

    return () => socket.disconnect();
  });
  $effect(() => {
    canvas.backgroundColor = bg_color.toRgbString();
    const cursorSVG = getCursorSVG(color.toRgbString(), brushWidth);
    const hexString = color.toHex();

    socket.emit("draw:brush_change", room_code, {
      brushType: strPaintBrush,
      brushColor: color.toHex(),
      brushWidth: brushWidth,
    });
    handleBrush(canvas, strPaintBrush, brushWidth, color);
    if (!canvas || !canvas.freeDrawingBrush) return;
    canvas.requestRenderAll();
  });
  //bind accepts only HTML Elements,
  //         so gotta wrap JS elements into HTML ones like canvasElement onto canvas
</script>

<div class="grid justify-center animate-in ease-in">
  <div class="flex flex-fill text-2xl justify-center mb-1">Drawboard</div>
  <canvas bind:this={canvasElement} class="mb-1 border-2 border-black"></canvas>
  <div class="buttons flex flex-row gap-2.5 pt-1 pb-1">
    <!--BG Selection Button-->
    <button
      class="border-2 border-black p-1 rounded relative cursor-pointer"
      style:background-color={bg_color.toRgbString()}
      onclick={() => {
        bgPickerOpen = !bgPickerOpen;
      }}
      title="Change Background Color"
    >
      <Wallpaper color={bg_color.invert().toRgbString()}></Wallpaper>

      <div class="absolute top-0 left-0">
        <ColorPicker
          isOpen={bgPickerOpen}
          label=""
          --input-size="0px"
          bind:rgb={bg_rgb}
          bind:color={bg_color}
        ></ColorPicker>
      </div>
    </button>

    <!--Brush selector-->
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button
          class="cursor-pointer bg-white text-black border-black border-2 hover:bg-black hover:text-white"
          >Brush Type</Button
        >
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content class="w-fit">
          <DropdownMenu.RadioGroup bind:value={strPaintBrush}>
            <DropdownMenu.RadioItem
              value="Pencil"
              class="mb-1 p-1 border-2 border-black focus:text-white focus:bg-black"
              >Pencil Brush</DropdownMenu.RadioItem
            >
            <DropdownMenu.RadioItem
              value="Spray"
              class="mb-1 p-1 border-2 border-black focus:text-white focus:bg-black"
              >Spray Brush</DropdownMenu.RadioItem
            >
            <DropdownMenu.RadioItem
              value="Dotted"
              class="mb-1 p-1 border-2 border-black focus:text-white focus:bg-black"
              >Dotted Brush</DropdownMenu.RadioItem
            >
            <DropdownMenu.RadioItem
              value="Circular"
              class="mb-1 p-1 border-2 border-black focus:text-white focus:bg-black"
              >Circular Brush</DropdownMenu.RadioItem
            >
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>

    <!--Color Selection Button-->
    <button
      class="border-2 border-black p-1 rounded relative cursor-pointer"
      style:background-color={color.toRgbString()}
      onclick={() => {
        colorPickerOpen = !colorPickerOpen;
      }}
      title="Change Color"
    >
      <Pipette color={color.invert().toRgbString()}></Pipette>

      <div class="absolute top-0 left-0">
        <ColorPicker
          isOpen={colorPickerOpen}
          label=""
          --input-size="0px"
          bind:rgb
          bind:color
        ></ColorPicker>
      </div>
    </button>

    <!--Slider for Brush Width-->
    <div
      class="flex border-2 border-black rounded p-1 content-center"
      title="Change Brush Width"
    >
      <Slider
        type="single"
        bind:value={brushWidth}
        step={3}
        min={3}
        max={30}
        class="min-w-30 max-w-30"
      ></Slider>
      <Separator orientation="vertical" class="bg-gray-600 mx-2" />
      <Circle
        color={color.toRgbString()}
        fill={color.toRgbString()}
        size={brushWidth}
        class="my-auto"
      ></Circle>
    </div>
  </div>
</div>

<style lang="postcss">
  @reference "tailwindcss";
</style>
