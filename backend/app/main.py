import json
import uuid

import socketio
from core.config import Config
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

config = Config()
app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
sio = socketio.AsyncServer(cors_allowed_origins=origins, async_mode="asgi")
socket_app = socketio.ASGIApp(sio)
app.mount("/", socket_app)


@app.get("/")
async def home():
    return {"message": "Server Running"}


@sio.event
async def connect(sid: str, environ: dict, auth):
    """Triggered when the user connects.

    Parameters
    ----------
    sid : str
        The SID of the user who left the room.
    """

    print(f"Connected '{sid}' to Webserver")


@sio.on("get_roomcode")
async def get_roomcode(sid: str):
    """Emits the roomcode to the user.

    Parameters
    ----------
    sid : str
        The SID of the user.
    """

    room_code = str(uuid.uuid4())
    await sio.enter_room(sid, room_code)
    await sio.emit("send_roomcode", {"room_code": room_code}, to=sid)


@sio.on("join_room")
async def join_room(sid: str, room_code: str):
    """Allows the user to join the room whose `room_code` has been provided.

    Parameters
    ----------
    sid : str
        The SID of the user.
    room_code : str
        The UUID Room Code.
    """
    print(room_code)
    with open("./data/temp.json", "r") as f:
        json_data: dict = json.load(f)

        json_data[room_code] = {}

    with open("./data/temp.json", "w") as f:
        json.dump(json_data, f, indent=4)
    await sio.enter_room(sid, room_code)
    await sio.emit("user_join", {"sid": sid}, skip_sid=sid)


# Old Methods
@sio.on("send_data")
async def send_data(sid: str, room_code: str):
    with open("./data/temp.json", "rt") as f:
        json_data: dict = json.load(f)
    await sio.emit("get_data", json_data, room=room_code)


@sio.on("recieve_data")
async def recieve_data(sid: str, room_code: str, data: str):

    with open("./data/temp.json", "r") as f:
        json_data: dict = json.load(f)

        json_data[room_code] = json.loads(data)

    with open("./data/temp.json", "w") as f:
        json.dump(json_data, f, indent=4)
    await sio.emit("get_data", json_data, room=room_code, skip_sid=sid)


# New Methods
@sio.on("draw:start")
async def start_draw(sid: str, room_code: str, data: str):
    """Triggers when the user has just started drawing.

    Parameters
    ----------
    sid : str
        The SID of the user.
    room_code : str
        The UUID Room Code.
    data : str
        Stringified version of this
        {
        x: float,
        y: float,
        type: str,
        color: str,
        width: int
        }
    """
    edited_data = {"sid": sid, "data": data}
    await sio.emit(
        "draw:started",
        room=room_code,
        skip_sid=sid,
        data=edited_data,
    )


@sio.on("draw:cont")
async def draw_cont(sid: str, room_code: str, data: str):
    """Triggers when the user is drawing.

    Parameters
    ----------
    sid : str
        The SID of the user.
    room_code : str
        The UUID Room Code.
    data : str
        Stringified version of this
        {
        x: float,
        y: float,
        type: str,
        color: str,
        width: int
        }
    """
    edited_data = {"sid": sid, "data": data}
    await sio.emit("draw:conted", room=room_code, skip_sid=sid, data=edited_data)


@sio.on("draw:end")
async def draw_end(sid: str, room_code: str, data: str):
    """Triggers when the user lifts their mouse after drawing. This data is obsolute for the most part however.

    Parameters
    ----------
    sid : str
        The SID of the user.
    room_code : str
        The UUID Room Code.
    data : str
        Stringified version of this
        {
        x: float,
        y: float,
        type: str,
        color: str,
        width: int
        }
    """
    edited_data = {"sid": sid, "data": data}
    await sio.emit(
        "draw:ended",
        room=room_code,
        skip_sid=sid,
        data=edited_data,
    )


@sio.on("draw:brush_change")
async def brush_change(sid: str, room_code: str, data: str):
    """Triggers when anyone changes any property of their brush.

    Parameters
    ----------
    sid : str
        The SID of the user.
    room_code : str
        The UUID Room Code.
    data : str
        Stringified version of this
        {
        brushType: str,
        brushColor: str,
        brushWidth: int
        }
    """
    edited_data = {"sid": sid, "data": data}
    await sio.emit("draw:brush_changed", room=room_code, skip_sid=sid, data=edited_data)


@sio.on("draw:bg_change")
async def bg_change(sid: str, room_code: str, data: str):
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
    edited_data = {"sid": sid, "data": data}
    await sio.emit("draw:bg_changed", room=room_code, skip_sid=sid, data=edited_data)


@sio.event
async def disconnect(sid: str):
    """Triggered when the user disconnects. Also emits `exit_room` to let the other users know.

    Parameters
    ----------
    sid : str
        The SID of the user who left the room.
    """
    print("this", sio.manager.get_rooms(sid, "/"))
    target_room = [room for room in sio.manager.get_rooms(sid, "/") if room != sid][0]
    await sio.emit("user_leave", {"sid": sid}, room=target_room)
    print(f"Disconnected '{sid}' from Webserver")
