import type { Socket } from "socket.io-client";
import type { roomStateType } from "./types";

export function addMouseListener(
  canvasContainer: HTMLElement,
  socket: Socket,
  roomState: roomStateType,
) {
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let rafPending = false;
  let x = 0;
  let y = 0;
  const rect = canvasContainer.getBoundingClientRect();
  const setIdle = () => {
    console.log("idle");
    socket.emit("mouse:idle", roomState.room_code);
  };

  const onMouseMove = (e: MouseEvent) => {
    x = e.clientX-rect.left;
    y = e.clientY-rect.top;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(setIdle, 10000);
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      
      socket.emit("mouse:location", roomState.room_code, { x: x, y: y });

      rafPending = false;
    });
  };

  canvasContainer.addEventListener("pointermove", onMouseMove);
  canvasContainer.addEventListener("mouseleave", setIdle);
  return () => {
    clearTimeout(idleTimer);
    canvasContainer.removeEventListener("mousemove", onMouseMove);
    canvasContainer.removeEventListener("mouseleave", setIdle);
  };
}
