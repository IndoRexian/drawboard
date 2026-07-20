<script lang="ts">
  import { colord, Colord, type RgbaColor } from "colord";
  import ColorPicker from "svelte-awesome-color-picker";
  import { Circle, Pipette, Wallpaper, TriangleAlert } from "@lucide/svelte";
  import { Slider } from "$lib/components/ui/slider/index.js";
  import { Separator } from "$lib/components/ui/separator/index.js";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import type { brushStateType, roomStateType } from "$lib/types";
  import * as ContextMenu from "$lib/components/ui/context-menu/index.js";
  interface toolbarProps {
    brushState: brushStateType;
    roomState: roomStateType;
  }

  let { brushState, roomState }: toolbarProps = $props();

  let colorPickerOpen: boolean = $state(false);
  let bgPickerOpen: boolean = $state(false);
  let color: Colord = $derived(colord(brushState.rgb));
  let bg_color: Colord = $derived(colord(roomState.bg_rgb));
  let bg_preview: Colord = $derived(colord({ ...roomState.bg_rgb }));
</script>

<div class="buttons gap-2.5 pt-1 pb-1">
  <!--BG Selection Button-->
  <ContextMenu.Sub>
    <ContextMenu.SubTrigger>Change Background</ContextMenu.SubTrigger>
    <ContextMenu.SubContent
      class="max-w-fit min-w-0 m-0 p-0 border-2 border-black"
    >
      <ColorPicker
        isDialog={false}
        label=""
        --input-size="0px"
        bind:rgb={roomState.bg_rgb}
        bind:color={bg_color}
        --cp-border-color="transparent"
        --cp-text-color="black"
      ></ColorPicker>
    </ContextMenu.SubContent>
  </ContextMenu.Sub>

  <!--Brush selector-->
  <!-- <DropdownMenu.Root>
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
  </DropdownMenu.Root> -->

  <!--Color Selection Button-->
  <ContextMenu.Sub>
    <ContextMenu.SubTrigger>Change Brush Color</ContextMenu.SubTrigger>
    <ContextMenu.SubContent
      class="max-w-fit min-w-0 m-0 p-0 border-2 border-black"
    >
      <ColorPicker
        isDark={true}
        isDialog={false}
        label=""
        --input-size="0px"
        bind:rgb={brushState.rgb}
        bind:color
        --cp-border-color="transparent"
        --cp-text-color="black"
      ></ColorPicker>
    </ContextMenu.SubContent>
  </ContextMenu.Sub>

  <!--Slider for Brush Width-->
  <ContextMenu.Sub>
    <ContextMenu.SubTrigger>Change Brush Size</ContextMenu.SubTrigger>
    <ContextMenu.SubContent class="min-w-10 border-2 border-black">
      <Slider
        type="single"
        orientation="vertical"
        bind:value={brushState.brushWidth}
        step={3}
        min={3}
        max={30}
        color="#ff0000"
        class=" fill-black **:data-[slot=slider-track]:bg-gray-300"
      ></Slider>
    </ContextMenu.SubContent>
  </ContextMenu.Sub>

  <!-- <ContextMenu.Item
    ><div
      class="flex border-2 border-black rounded p-1 content-center"
      title="Change Brush Width"
    >
      <Slider
        type="single"
        bind:value={brushState.brushWidth}
        step={3}
        min={3}
        max={30}
        color="#ff0000"
        class="min-w-30 max-w-30 fill-black"
      ></Slider>
      <Separator orientation="vertical" class="bg-gray-600 mx-2" />
      <Circle
        color={color.toRgbString()}
        fill={color.toRgbString()}
        size={brushState.brushWidth}
        class="my-auto"
      ></Circle>
    </div></ContextMenu.Item
  > -->
</div>
