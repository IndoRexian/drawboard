import { goto } from "$app/navigation";
import { Socket } from "socket.io-client";
import { colord } from "colord";
import { initBrush } from "./utils";
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
  canvas: Canvas,
  roomState: roomStateType,
  brushState: brushStateType,
) {
  const url = new URL(window.location.toString());

  socket.on("connect", () => {
    if (url.searchParams.get("room_code") == null) {
      //Creator of room
      console.log("Asking for a room");
      socket.emit("get_roomcode"); //asking for room_code
    } else {
      roomState.room_code = url.searchParams.get("room_code")!;
      socket.emit("join_room", roomState.room_code);
      console.log("Joined Room");
    }
    socket.emit("send_data", roomState.room_code);
    console.log("Connected from Frontend");
  });

  socket.on("send_roomcode", (data) => {
    //getting room_code
    roomState.room_code = data["room_code"];
    console.log(roomState.room_code);
    goto(`/?room_code=${roomState.room_code}`);
  });

  socket.on("user_join", (data) => {
    const player: playerData = {
      sid: data["sid"],
      brushType: "Pencil",
      brushWidth: 3,
      brushColor: colord({ r: 0, g: 0, b: 0, a: 1 }),
    };
    roomState.players.push(player);
    const playerBrush: playerBrush = {
      sid: data["sid"],
      brush: initBrush(canvas, player),
    };
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
    roomState.playerBrushes.push(playerBrush);
  });

  socket.on("user_leave", (data) => {
    console.log("LEFT");
    roomState.players.splice(
      roomState.players.findIndex((value) => value.sid !== data["sid"]),
      1,
    );

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
  canvas: Canvas,
  roomState: roomStateType,
) {
  socket.on("draw:started", (data) => {
    console.log(roomState.playerBrushes);
    const newPoint = new Point();
    newPoint.setXY(data.data.x, data.data.y);
    const brush = roomState.playerBrushes.find(
      (value) => value.sid === data.sid,
    );
    console.log(brush);
    brush?.brush.onMouseDown(newPoint, {
      e: {},
    } as TBrushEventData);
    canvas.requestRenderAll();
  });

  socket.on("draw:conted", (data) => {
    const newPoint = new Point();
    newPoint.setXY(data.data.x, data.data.y);
    const brush = roomState.playerBrushes.find(
      (value) => value.sid === data.sid,
    )?.brush;
    brush?.onMouseMove(newPoint, {
      e: {},
    } as TBrushEventData);

    console.log(data);
  });

  socket.on("draw:ended", (data) => {
    const brush = roomState.playerBrushes.find(
      (value) => value.sid === data.sid,
    )?.brush;
    brush?.onMouseUp({
      e: {},
    } as TBrushEventData);

    console.log(data);
  });

  socket.on("draw:brush_changed", (data) => {
    console.log("change found!");
    const playerIndex = roomState.players.findIndex(
      (value) => value.sid === data.sid,
    );
    const playerBrushIndex = roomState.playerBrushes.findIndex(
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
      roomState.players[playerIndex] = player;
      roomState.playerBrushes[playerBrushIndex] = playerBrush;
    } else {
      roomState.players.push(player);
      roomState.playerBrushes.push(playerBrush);
    }
  });
}
