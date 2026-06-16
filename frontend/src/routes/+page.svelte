<script lang="ts">
  import { onMount } from "svelte";
  import { Canvas, PencilBrush } from "fabric";
  import { colord, type Colord, type RgbaColor } from "colord";
  import ColorPicker from "svelte-awesome-color-picker";
  import { Pencil } from "@lucide/svelte";

  let canvasElement: HTMLCanvasElement;
  let canvas: Canvas;

  let ifDrawingMode: boolean = $state(false);
  let colorPickerOpen: boolean = $state(false);

  let rgb: RgbaColor = $state({ r: 255, g: 255, b: 255, a: 1 });
  let color: Colord = $state(colord(rgb));
  onMount(() => {
    canvas = new Canvas(canvasElement, {
      width: 600,
      height: 600,
      //backgroundColor: "black",

      isDrawingMode: false,
    });
  });
  $effect(() => {
    if (!canvas) return;
    canvas.on("mouse:over", () => {
      canvas.renderAll();
      console.log(color.toRgbString());
    });
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = color.toRgbString();
  });
  //bind accepts only HTML Elements,
  //         so gotta wrap JS elements into HTML ones like canvasElement onto canvas
</script>

<div class="grid justify-center">
  <div class="flex flex-fill text-2xl justify-center mb-1">Drawboard</div>
  <button
    class="border border-black rounded p-0.5 mb-1 m-auto"
    onclick={() => {
      ifDrawingMode = !ifDrawingMode;
      canvas.isDrawingMode = ifDrawingMode;
    }}>{!ifDrawingMode ? "Enable Drawing Mode" : "Disable Drawing Mode"}</button
  >
  <canvas bind:this={canvasElement} class="mb-1 border-2 border-black"></canvas>
  <div class="buttons p-1 m-1">
    <button
      class="border border-black p-1 rounded relative"
      color="black"
      style:background-color={color.toRgbString()}
      onclick={() => {
        colorPickerOpen = !colorPickerOpen;
        console.log(colorPickerOpen);
      }}
      title="Change Color"
    >
      <Pencil color={color.invert().toRgbString()}></Pencil>

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
  </div>
</div>

<style lang="postcss">
  @reference "tailwindcss";
</style>
