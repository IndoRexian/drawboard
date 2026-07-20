import json

from core.utils import create_roomcode
from socketio import AsyncServer


class RoomHandler:
    def __init__(self, sio: AsyncServer):
        self.sio = sio

    async def connect(self, sid: str, environ: dict, auth):
        """Triggered when the user connects.

        Parameters
        ----------
        sid : str
            The SID of the user who left the room.
        """

        print(f"Connected '{sid}' to Webserver")

    async def get_roomcode(self, sid: str):
        """Emits the roomcode to the user.

        Parameters
        ----------
        sid : str
            The SID of the user.
        """
        new_user = True
        pre_data = {
            "players": [sid],
            "data": {
                "version": "7.4.0",
                "objects": [],
                "background": "rgb(255, 255, 255)",
            },
        }
        room_code = create_roomcode()
        with open("./data/temp.json", "r") as f:
            json_data: dict = json.load(f)
            if room_code not in json_data.keys():
                print("Creating New Room")
                json_data[room_code] = pre_data
                new_user = False

        with open("./data/temp.json", "w") as f:
            json.dump(json_data, f, indent=4)
        await self.sio.enter_room(sid, room_code)
        await self.sio.emit(
            "send_roomcode", {"room_code": room_code, "sid": sid}, to=sid
        )

    async def join_room(self, sid: str, room_code: str):
        """Allows the user to join the room whose `room_code` has been provided.

        Parameters
        ----------
        sid : str
            The SID of the user.
        room_code : str
            The UUID Room Code.
        """

        await self.sio.enter_room(sid, room_code)
        with open("./data/temp.json", "rt") as f:
            json_data: dict = json.load(f)
        json_data[room_code]["players"].append(sid)
        with open("./data/temp.json", "w") as f:
            json.dump(json_data, f, indent=4)
        await self.sio.emit("user_join", {"sid": sid}, skip_sid=sid)

    async def send_data(self, sid: str, room_code: str):
        with open("./data/temp.json", "rt") as f:
            json_data: dict = json.load(f)
        await self.sio.emit("get_data", json_data[room_code], room=room_code)

    async def recieve_data(self, sid: str, room_code: str, data: str):

        with open("./data/temp.json", "r") as f:
            json_data: dict = json.load(f)

            json_data[room_code]["data"]["objects"].append(data)

        with open("./data/temp.json", "w") as f:
            json.dump(json_data, f, indent=4)

    async def disconnect(self, sid: str):
        """Triggered when the user disconnects. Also emits `exit_room` to let the other users know.

        Parameters
        ----------
        sid : str
            The SID of the user who left the room.
        """
        try:
            target_room = [
                room for room in self.sio.manager.get_rooms(sid, "/") if room != sid
            ][0]
            with open("./data/temp.json", "rt") as f:
                json_data: dict = json.load(f)
            json_data[target_room]["players"].remove(sid)
            with open("./data/temp.json", "w") as f:
                json.dump(json_data, f, indent=4)
            await self.sio.emit("user_leave", {"sid": sid}, room=target_room)
        except:
            pass
        print(f"Disconnected '{sid}' from Webserver")
