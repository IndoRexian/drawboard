from api.canvashandler import CanvasHandler
from api.mouseHandler import MouseHandler
from api.roomhandler import RoomHandler
from socketio import AsyncServer


def register_handlers(sio: AsyncServer):

    room = RoomHandler(sio)
    canvas = CanvasHandler(sio)
    mouse = MouseHandler(sio)
    # Room Events
    sio.on("connect")(room.connect)
    sio.on("disconnect")(room.disconnect)

    sio.on("get_roomcode")(room.get_roomcode)
    sio.on("join_room")(room.join_room)
    sio.on("send_data")(room.send_data)
    sio.on("recieve_data")(room.recieve_data)

    # Canvas Events
    sio.on("draw:start")(canvas.start_draw)
    sio.on("draw:cont")(canvas.draw_cont)
    sio.on("draw:end")(canvas.draw_end)
    sio.on("draw:brush_change")(canvas.brush_change)
    sio.on("draw:bg_change")(canvas.bg_change)

    # Mouse Events
    sio.on("mouse:location")(mouse.mouse_location)
    sio.on("mouse:idle")(mouse.mouse_idle)
