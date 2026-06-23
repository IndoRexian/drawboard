<script lang="ts">
  import { onMount } from "svelte";
  import { Canvas } from "fabric";

  import { colord, type Colord, type RgbaColor } from "colord";
  import ColorPicker from "svelte-awesome-color-picker";
  import { Circle, Pipette, Wallpaper } from "@lucide/svelte";

  import { Slider } from "$lib/components/ui/slider/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Button } from "$lib/components/ui/button/index.js";

  import { getCursorSVG, handleBrush } from "$lib/utils";

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

  onMount(() => {
    canvas = new Canvas(canvasElement, {
      width: 600,
      height: 600,
      //backgroundColor: "black",
      freeDrawingCursor: getCursorSVG(color.toRgbString(), brushWidth),
      isDrawingMode: true,
    });
  });
  $effect(() => {
    if (!canvas) return;
    canvas.on("mouse:over", () => {
      canvas.renderAll();
    });
  });
  $effect(() => {
    console.log(strPaintBrush);
    canvas.backgroundColor = bg_color.toRgbString();
    const cursorSVG = getCursorSVG(color.toRgbString(), brushWidth);
    const hexString = color.toHex();
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
