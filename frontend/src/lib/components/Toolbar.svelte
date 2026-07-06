<script lang="ts">
  import { colord, Colord, type RgbaColor } from "colord";
  import ColorPicker from "svelte-awesome-color-picker";
  import { Circle, Pipette, Wallpaper, TriangleAlert } from "@lucide/svelte";

  import { Slider } from "$lib/components/ui/slider/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Button } from "$lib/components/ui/button/index.js";

  interface toolbarProps {
    brushState: brushStateType;
  }
  type brushStateType = {
    strPaintBrush: "Spray" | "Pencil" | "Dotted" | "Circular"; //Default Brush
    rgb: RgbaColor;
    //color: colord(rgb),
    bg_rgb: RgbaColor;
    //bg_color: colord(bg_rgb),
    brushWidth: number;
  };
  // let {
  //   rgb = $bindable(),
  //   color = $bindable(),
  //   bg_color = $bindable(),
  //   bg_rgb = $bindable(),
  //   strPaintBrush = $bindable(),
  //   brushWidth = $bindable(),
  // }: toolbarProps = $props();
  let { brushState }: toolbarProps = $props();

  let colorPickerOpen: boolean = $state(false);
  let bgPickerOpen: boolean = $state(false);
  let color: Colord = $derived(colord(brushState.rgb));
  let bg_color: Colord = $derived(colord(brushState.bg_rgb));
</script>

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
        bind:rgb={brushState.bg_rgb}
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
        <DropdownMenu.RadioGroup bind:value={brushState.strPaintBrush}>
          <DropdownMenu.RadioItem
            value="Pencil"
            class="mb-1 p-1 border-2 border-black focus:text-white focus:bg-black"
            >Pencil Brush</DropdownMenu.RadioItem
          >
          <DropdownMenu.RadioItem
            value="Spray"
            class="mb-1 p-1 border-2 border-black focus:text-white focus:bg-black"
            title="BUGGED!"
          >
            Spray Brush
            <div class="basis-1/4 content-center">
              <TriangleAlert color="red"></TriangleAlert>
            </div>
          </DropdownMenu.RadioItem>
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
        bind:rgb={brushState.rgb}
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
      bind:value={brushState.brushWidth}
      step={3}
      min={3}
      max={30}
      class="min-w-30 max-w-30"
    ></Slider>
    <Separator orientation="vertical" class="bg-gray-600 mx-2" />
    <Circle
      color={color.toRgbString()}
      fill={color.toRgbString()}
      size={brushState.brushWidth}
      class="my-auto"
    ></Circle>
  </div>
</div>
