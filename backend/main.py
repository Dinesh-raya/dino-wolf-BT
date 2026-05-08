from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import socketio
import asyncio
import contextlib

from sockets.server import sio
# Import sockets to register events
import sockets.connection
import sockets.room_events
import sockets.game_events
import sockets.property_events
import sockets.auction_events
from persistence.db import init_db
from persistence.repository import save_snapshot, load_snapshot
from rooms.manager import room_manager
from engine.turn_manager import turn_manager

async def background_save_loop():
    while True:
        try:
            await asyncio.sleep(10) # Save every 10 seconds
            save_snapshot(room_manager.rooms, turn_manager.games, turn_manager.turn_states)
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"Background save error: {e}")

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    loaded_rooms, loaded_games, loaded_turns = load_snapshot()
    
    room_manager.rooms = loaded_rooms
    turn_manager.games = loaded_games
    turn_manager.turn_states = loaded_turns
    
    # Restore player_rooms mapping
    for room_code, room in loaded_rooms.items():
        for pid in room.players:
            room_manager.player_rooms[pid] = room_code
            
    print(f"Loaded {len(loaded_rooms)} rooms and {len(loaded_games)} games from DB.")
    
    task = asyncio.create_task(background_save_loop())
    
    yield
    
    # Shutdown
    task.cancel()
    save_snapshot(room_manager.rooms, turn_manager.games, turn_manager.turn_states)

app = FastAPI(title="DINO-RICHUP: PAN-INDIA EDITION API", lifespan=lifespan)

# Create ASGI application with socketio
socket_app = socketio.ASGIApp(sio, app)

# Endpoint for health check
@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Server is running"}

# Serve frontend statically in production
import os
frontend_dist = os.path.join(os.path.dirname(__file__), '../frontend/dist')
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Fallback to index.html for client-side routing
        potential_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(potential_path) and os.path.isfile(potential_path):
            return FileResponse(potential_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

# Note: For running locally with hot reload:
# uvicorn main:socket_app --host 0.0.0.0 --port 8000 --reload
