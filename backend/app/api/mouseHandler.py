from core.models import CursorData
from socketio import AsyncServer


class MouseHandler:
    def __init__(self, sio: AsyncServer):
        self.sio = sio

    async def mouse_location(self, sid: str, room_code: str, data: CursorData):
        """_summary_

        Parameters
        ----------
        sid : str
            _description_
        data : str
            _description_
        """

        await self.sio.emit(
            "mouse:locationed",
            {"sid": sid, "x": data["x"], "y": data["y"]},
            room=room_code,
            skip_sid=sid,
        )

    async def mouse_idle(self, sid: str, room_code: str):
        await self.sio.emit("mouse:idled", {"sid": sid}, room=room_code, skip_sid=sid)
