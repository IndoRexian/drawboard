import json

from core.models import CanvasMouseData
from socketio import AsyncServer


class CanvasHandler:
    def __init__(self, sio: AsyncServer):
        self.sio = sio

    async def start_draw(self, sid: str, room_code: str, data: CanvasMouseData):
        """Triggers when the user has just started drawing.

        Parameters
        ----------
        sid : str
            The SID of the user.
        room_code : str
            The UUID Room Code.
        data : CanvasMouseData
        """

        edited_data = {"sid": sid, "data": data}
        await self.sio.emit(
            "draw:started",
            room=room_code,
            skip_sid=sid,
            data=edited_data,
        )

    async def draw_cont(self, sid: str, room_code: str, data: CanvasMouseData):
        """Triggers when the user is drawing.

        Parameters
        ----------
        sid : str
            The SID of the user.
        room_code : str
            The UUID Room Code.
        data : CanvasMouseData
        """
        edited_data = {"sid": sid, "data": data}
        await self.sio.emit(
            "draw:conted", room=room_code, skip_sid=sid, data=edited_data
        )

    async def draw_end(self, sid: str, room_code: str, data: CanvasMouseData):
        """Triggers when the user lifts their mouse after drawing. This data is obsolute for the most part however.

        Parameters
        ----------
        sid : str
            The SID of the user.
        room_code : str
            The UUID Room Code.
        data : CanvasMouseData
        """
        edited_data = {"sid": sid, "data": data}
        await self.sio.emit(
            "draw:ended",
            room=room_code,
            skip_sid=sid,
            data=edited_data,
        )

    async def brush_change(self, sid: str, room_code: str, data: str):
        """Triggers when anyone changes any property of their brush.

        Parameters
        ----------
        sid : str
            The SID of the user.
        room_code : str
            The UUID Room Code.
        data : str
            Stringified verself.sion of this
            {
            brushType: str,
            brushColor: str,
            brushWidth: int
            }
        """
        edited_data = {"sid": sid, "data": data}
        await self.sio.emit(
            "draw:brush_changed", room=room_code, skip_sid=sid, data=edited_data
        )

    async def bg_change(self, sid: str, room_code: str, data: str):
        """_summary_

        Parameters
        ----------
        sid : str
            _description_
        room_code : str
            _description_
        data : str
            _description_
        """
        if room_code != "":
            with open("./data/temp.json", "r") as f:
                json_data: dict = json.load(f)

                json_data[room_code]["background"] = data["bg_color_rgb"]
                json_data[room_code]["data"]["background"] = data["bg_color_rgb"]
            with open("./data/temp.json", "w") as f:
                json.dump(json_data, f, indent=4)
            edited_data = {"sid": sid, "data": data}
            await self.sio.emit(
                "draw:bg_changed", room=room_code, skip_sid=sid, data=edited_data
            )
