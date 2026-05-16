from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import socketio
import asyncio
import contextlib
import os
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

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
from engine.auction import auction_manager

async def background_save_loop():
    tick_count = 0
    while True:
        try:
            await asyncio.sleep(1)
            tick_count += 1
            for room_code in list(turn_manager.games.keys()):
                turn = turn_manager.tick_turn_timer(room_code)
                game = turn_manager.get_game(room_code)
                if turn and game:
                    await sio.emit(
                        "game:state_update",
                        {"game": game.model_dump(), "turn": turn.model_dump()},
                        room=room_code,
                    )

                auction = auction_manager.tick(room_code)
                if not auction:
                    continue
                if auction.time_remaining == 0 and auction.active:
                    auction_manager.end_auction(room_code, game)
                    await sio.emit("auction:end", {"message": "Auction ended by timer"}, room=room_code)
                    if turn:
                        turn.phase = "action"
                    await sio.emit(
                        "game:state_update",
                        {"game": game.model_dump(), "turn": turn.model_dump() if turn else None},
                        room=room_code,
                    )
                else:
                    await sio.emit("auction:state_update", {"auction": auction.model_dump()}, room=room_code)

            if tick_count % 10 == 0:
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
# Mount Socket.IO at /socket.io path
socket_app = socketio.ASGIApp(sio, other_asgi_app=None)
app.mount("/socket.io", socket_app)

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
        # Skip Socket.IO paths - let socketio.ASGIApp handle them
        print(f"SERVE_FRONTEND CALLED: full_path='{full_path}'")
        if full_path.startswith("socket.io/"):
            print(f"SKIPPING SOCKET.IO PATH")
            raise HTTPException(status_code=404, detail="Not found")
        
        # Fallback to index.html for client-side routing, but keep strict directory containment.
        normalized = os.path.realpath(os.path.join(frontend_dist, full_path))
        root = os.path.realpath(frontend_dist)
        if not normalized.startswith(root):
            raise HTTPException(status_code=400, detail="Invalid asset path")
        if os.path.exists(normalized) and os.path.isfile(normalized):
            print(f"Serving file: {normalized}")
            return FileResponse(normalized)
        print(f"Falling back to index.html")
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    async def root_info():
        return {
            "status": "ok",
            "message": "Backend is running. Start frontend dev server at http://localhost:5173 or build frontend for static serving.",
        }

# Note: For running locally with hot reload:
# uvicorn main:socket_app --host 0.0.0.0 --port 8000 --reload
