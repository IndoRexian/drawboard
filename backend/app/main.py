import json

import socketio
from api.handlers import register_handlers
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
    "https://francesca-overpopulous-nonbrutally.ngrok-free.dev",
    "https://drawboard.indorexian.me",
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
register_handlers(sio)


@app.get("/")
async def home():
    return {"message": "Server Running"}
