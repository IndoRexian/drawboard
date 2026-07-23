import { goto } from "$app/navigation";
import { Socket } from "socket.io-client";
import { colord } from "colord";
import {
  changeCursorLoc,
  createCursor,
  deleteCursor,
  DrawStroke,
  hideCursor,
  initBrush,
} from "./utils";
import { Canvas, Point } from "fabric";
import { toast } from "svelte-sonner";
import { CircleUserRound, LogOut } from "@lucide/svelte";
import type {
  playerData,
  playerBrush,
  roomStateType,
  brushStateType,
  cursorData,
} from "$lib/types";

export function lobbyController(
  socket: Socket,
  roomState: roomStateType,
  brushState: brushStateType,
  localCanvas: Canvas,
  user_sid: any,
  syncState: { bgHydrated: boolean },
) {
  const url = new URL(window.location.toString());

  //event handler for when the player connects(local event)
  socket.on("connect", () => {
    user_sid.sid = socket.id!;

    if (url.searchParams.get("room_code") == null) {
      //Creator of room
      socket.emit("get_roomcode"); //asking for room_code
    } else {
      roomState.room_code = url.searchParams.get("room_code")!;
      socket.emit("join_room", roomState.room_code);
    }
    socket.emit("send_data", roomState.room_code);
  });

  //event handler for when the user gets the room code from the server
  socket.on("send_roomcode", (data) => {
    //getting room_code
    roomState.room_code = data["room_code"];
    console.log(roomState.room_code);
    goto(`/?room_code=${roomState.room_code}`);
    console.log(data.sid);

    const creator = roomState.players.get(data.sid);
    if (creator) {
      creator.local = true;
    }
  });

  //event handler for when the user gets some canvas data from the server
  socket.on("get_data", (data) => {
    localCanvas.loadFromJSON(data["data"], () => {});
    const backgroundColor = colord(
      (localCanvas.backgroundColor ?? "rgb(255,255,255)") as string,
    );
    roomState.bg_rgb = backgroundColor.rgba;
    roomState.lastUsedBg = backgroundColor.toRgbString();
    syncState.bgHydrated = true;
    localCanvas.requestRenderAll();

    //this is creation/propagation of players and playerBrushes
    for (let index = 0; index < data["players"].length; index++) {
      const sid = data["players"][index];
      const player: playerData = {
        sid: sid,
        local: sid === user_sid.sid,
        brushType: "Pencil",
        brushWidth: 3,
        brushColor: colord({ r: 0, g: 0, b: 0, a: 1 }),
        cursor: { idle: true, x: 0, y: 0 },
      };
      const playerBrush: playerBrush = {
        sid: sid,
        brush: initBrush(localCanvas, player),
      };
      roomState.players.set(sid, player);
      roomState.playerBrushes.set(sid, playerBrush);
      if (sid!==user_sid.sid){
      createCursor(sid, roomState.players);}
    }
  });

  //event handler for when a user joins(remote event)
  socket.on("user_join", (data) => {
    //setting player data
    const player: playerData = {
      sid: data["sid"],
      local: data["sid"] === user_sid.sid,
      brushType: "Pencil",
      brushWidth: 3,
      brushColor: colord({ r: 0, g: 0, b: 0, a: 1 }),
      cursor: { idle: true, x: 0, y: 0 },
    };
    roomState.players.set(data["sid"], player);

    //setting player brush
    const playerBrush: playerBrush = {
      sid: data["sid"],
      brush: initBrush(localCanvas, player),
    };
    roomState.playerBrushes.set(data["sid"], playerBrush);

    //creating cursor div
    createCursor(data["sid"], roomState.players);

    //join toast
    toast("New User Joined", {
      classes: {
        toast: "!border-2 !border-green-500",
      },
      description: `SID: ${data["sid"]}`,
      icon: CircleUserRound,
      position: "top-right",
    });

    //this is basically the current users sending their brush configs to the new user
    socket.emit("draw:brush_change", roomState.room_code, {
      brushType: brushState.strPaintBrush,
      brushColor: colord(brushState.rgb).toHex(),
      brushWidth: brushState.brushWidth,
    });
  });

  //event handler for when user leaves
  socket.on("user_leave", (data) => {
    roomState.players.delete(data["sid"]);

    //delete cursor div for that user
    deleteCursor(data["sid"]);

    //leave toast
    toast("User Left!", {
      classes: {
        toast: "!border-2 !border-red-500",
      },
      description: `SID: ${data["sid"]}`,
      icon: LogOut,
      position: "top-right",
    });
  });
}

export function drawingController(
  socket: Socket,
  localCanvas: Canvas,
  roomState: roomStateType,
  brushState: brushStateType,
  user_sid: { sid: string },
  syncState: { bgHydrated: boolean },
) {
  const strokeDrawer = new DrawStroke(localCanvas);

  socket.on("draw:started", (data) => {
    //mouse down event
    const newPoint = new Point();
    newPoint.setXY(data.data.x, data.data.y);
    const brush = roomState.playerBrushes.get(data["sid"])?.brush;

    strokeDrawer.drawPreviewStroke(data.data.svgData, data.data.color);
    // brush?.onMouseDown(newPoint, {
    //   e: {},
    // } as TBrushEventData);
    // baseCanvas.requestRenderAll();
  });

  socket.on("draw:conted", (data) => {
    //mouse move event
    const newPoint = new Point();
    newPoint.setXY(data.data.x, data.data.y);
    const brush = roomState.playerBrushes.get(data["sid"])?.brush;
    strokeDrawer.drawPreviewStroke(data.data.svgData, data.data.color);
    // brush?.onMouseMove(newPoint, {
    //   e: {},
    // } as TBrushEventData);

    // baseCanvas.requestRenderAll();
  });

  socket.on("draw:ended", (data) => {
    const brush = roomState.playerBrushes.get(data["sid"])?.brush;
    strokeDrawer.commitStroke(data.data.svgData, data.data.color);
    // brush?.onMouseUp({
    //   e: {},
    // } as TBrushEventData);
    localCanvas.fire("objectAdded:recieved");
  });

  socket.on("draw:brush_changed", (data) => {
    const player: playerData = {
      sid: data.sid,
      local: data.sid === user_sid.sid,
      brushType: data.data.brushType,
      brushColor: colord(data.data.brushColor),
      brushWidth: data.data.brushWidth,
      cursor: { idle: true, x: 0, y: 0 },
    };

    const playerBrush: playerBrush = {
      sid: data.sid,
      brush: initBrush(localCanvas, player),
    };
    roomState.players.set(data.sid, player);
    roomState.playerBrushes.set(data.sid, playerBrush);
    
  });

  socket.on("draw:bg_changed", (data) => {
    const bg_color = colord(data.data.bg_color);
    if (bg_color.toRgbString() === roomState.lastUsedBg) return; //js to make sure changing bg doesnt loop
    roomState.lastUsedBg = bg_color.toRgbString(); //already comes as rgb string
    localCanvas.backgroundColor = bg_color.toRgbString();
    roomState.bg_rgb = bg_color.rgba;
    syncState.bgHydrated = true;
    localCanvas.requestRenderAll();

  });
}

export function cursorController(socket: Socket, roomState: roomStateType) {
  socket.on(
    "mouse:locationed",
    (data: { sid: string; x: number; y: number }) => {
      const cursor: cursorData = { x: data.x, y: data.y, idle: false };

      changeCursorLoc(data.sid, roomState.players, cursor);
    },
  );

  socket.on("mouse:idled", (data: { sid: string }) => {
    hideCursor(data.sid, roomState.players)
  });
}
