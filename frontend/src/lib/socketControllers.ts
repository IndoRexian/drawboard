import { goto } from "$app/navigation";
import { Socket } from "socket.io-client";
import { colord } from "colord";
import { createCanvas, initBrush } from "./utils";
import { Canvas, Point, type TBrushEventData } from "fabric";
import { toast } from "svelte-sonner";
import { CircleUserRound, LogOut } from "@lucide/svelte";
import type {
  playerData,
  playerBrush,
  roomStateType,
  brushStateType,
} from "$lib/types";

export function lobbyController(
  socket: Socket,
  roomState: roomStateType,
  brushState: brushStateType,
  baseCanvas: Canvas,
  canvases: Map<string, Canvas>,
  canvasElements: Map<string, HTMLCanvasElement>,
  user_sid: string,
  syncState: { bgHydrated: boolean },
) {
  const url = new URL(window.location.toString());

  socket.on("connect", () => {
    if (url.searchParams.get("room_code") == null) {
      //Creator of room
      socket.emit("get_roomcode"); //asking for room_code
    } else {
      roomState.room_code = url.searchParams.get("room_code")!;
      socket.emit("join_room", roomState.room_code);
      //this is for each player who joined before this particular user
      roomState.players.forEach((value, sid) => {
        createCanvas(
          canvases,
          canvasElements,
          Array.from(roomState.players.keys()).indexOf(sid) + 2,
          value.sid,
        );
      });
    }
    socket.emit("send_data", roomState.room_code);
  });

  socket.on("send_roomcode", (data) => {
    //getting room_code
    roomState.room_code = data["room_code"];
    console.log(roomState.room_code);
    goto(`/?room_code=${roomState.room_code}`);
    user_sid = data.sid;
  });

  socket.on("get_data", (data) => {
    baseCanvas.loadFromJSON(data["data"], () => {});
    const backgroundColor = colord(
      (baseCanvas.backgroundColor ?? "rgb(255,255,255)") as string,
    );
    roomState.bg_rgb = backgroundColor.rgba;
    roomState.lastUsedBg = backgroundColor.toRgbString();
    syncState.bgHydrated = true;
    baseCanvas.requestRenderAll();
    console.log("data: ", roomState.players);
    //this is creation/propagation of players and playerBrushes
    for (let index = 0; index < data["players"].length; index++) {
      const sid = data["players"][index];
      const player: playerData = {
        sid: sid,
        brushType: "Pencil",
        brushWidth: 3,
        brushColor: colord({ r: 0, g: 0, b: 0, a: 1 }),
      };
      const playerBrush: playerBrush = {
        sid: sid,
        brush: initBrush(canvases.get(data["sid"])!, player),
      };
      roomState.players.set(sid, player);

      createCanvas(canvases, canvasElements, roomState.players.size + 2, sid);
      roomState.playerBrushes.set(sid, playerBrush);
    }
  });

  socket.on("user_join", (data) => {
    const player: playerData = {
      sid: data["sid"],
      brushType: "Pencil",
      brushWidth: 3,
      brushColor: colord({ r: 0, g: 0, b: 0, a: 1 }),
    };
    roomState.players.set(data["sid"], player);
    const playerBrush: playerBrush = {
      sid: data["sid"],
      brush: initBrush(canvases.get(data["sid"])!, player),
    };
    roomState.playerBrushes.set(data["sid"], playerBrush);
    toast("New User Joined", {
      classes: {
        toast: "!border-2 !border-green-500",
      },
      description: `SID: ${data["sid"]}`,
      icon: CircleUserRound,
      position: "top-right",
    });
    createCanvas(
      canvases,
      canvasElements,
      roomState.players.size + 2,
      data["sid"],
    );
    //this is basically the current users sending their brush configs to the new user
    socket.emit("draw:brush_change", roomState.room_code, {
      brushType: brushState.strPaintBrush,
      brushColor: colord(brushState.rgb).toHex(),
      brushWidth: brushState.brushWidth,
    });
  });

  socket.on("user_leave", (data) => {
    console.log("LEFT");
    roomState.players.delete(data["sid"]);
    // removeCanvas(canvases, canvasElements, data.sid);
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
  baseCanvas: Canvas,
  canvases: Map<string, Canvas>,
  canvasElements: Map<string, HTMLCanvasElement>,
  syncState: { bgHydrated: boolean },
) {
  socket.on("draw:started", (data) => {
    const newPoint = new Point();
    newPoint.setXY(data.data.x, data.data.y);
    const brush = roomState.playerBrushes.get(data["sid"])?.brush;

    console.log(brush);
    brush?.onMouseDown(newPoint, {
      e: {},
    } as TBrushEventData);
    baseCanvas.requestRenderAll();
  });

  socket.on("draw:conted", (data) => {
    const newPoint = new Point();
    newPoint.setXY(data.data.x, data.data.y);
    const brush = roomState.playerBrushes.get(data["sid"])?.brush;
    brush?.onMouseMove(newPoint, {
      e: {},
    } as TBrushEventData);

    baseCanvas.requestRenderAll();
  });

  socket.on("draw:ended", (data) => {
    const brush = roomState.playerBrushes.get(data["sid"])?.brush;
    brush?.onMouseUp({
      e: {},
    } as TBrushEventData);
    localCanvas.fire("objectAdded:recieved");
  });

  socket.on("draw:brush_changed", (data) => {
    const player: playerData = {
      sid: data.sid,
      brushType: data.data.brushType,
      brushColor: colord(data.data.brushColor),
      brushWidth: data.data.brushWidth,
    };

    const playerBrush: playerBrush = {
      sid: data.sid,
      brush: initBrush(canvases.get(data.sid)!, player),
    };
    roomState.players.set(data.sid, player);
    roomState.playerBrushes.set(data.sid, playerBrush);
  });

  socket.on("draw:bg_changed", (data) => {
    const bg_color = colord(data.data.bg_color);
    if (bg_color.toRgbString() === roomState.lastUsedBg) return; //js to make sure changing bg doesnt loop
    roomState.lastUsedBg = bg_color.toRgbString(); //already comes as rgb string
    baseCanvas.backgroundColor = bg_color.toRgbString();
    roomState.bg_rgb = bg_color.rgba;
    syncState.bgHydrated = true;
    baseCanvas.requestRenderAll();
  });
}
