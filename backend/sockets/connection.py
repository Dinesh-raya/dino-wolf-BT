from sockets.server import sio
from rooms.manager import room_manager
import json
import asyncio

# Load socket events constants
with open('../shared/events/socket_events.json', 'r') as f:
    SOCKET_EVENTS = json.load(f)

CONNECTION_EVENTS = SOCKET_EVENTS["CONNECTION"]

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")
    # Connection logic (e.g. auth) can go here

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")
    
    # Check if player is in a room and remove them
    room_code = room_manager.get_player_room_code(sid)
    if room_code:
        room = room_manager.get_room(room_code)
        if room:
            if room.status == "waiting":
                # If waiting, just remove them
                updated_room = room_manager.leave_room(sid)
                if updated_room:
                    # Notify remaining players
                    await sio.emit(
                        SOCKET_EVENTS["ROOM"]["STATE_UPDATE"],
                        updated_room.model_dump(),
                        room=room_code
                    )
            else:
                # If playing, trigger disconnect handling (120s reconnect timeout - Phase 6)
                if sid in room.players:
                    room.players[sid].connected = False
                    await sio.emit(
                        SOCKET_EVENTS["ROOM"]["STATE_UPDATE"],
                        room.model_dump(),
                        room=room_code
                    )
                    
                    # Start 120s timeout task
                    asyncio.create_task(handle_disconnect_timeout(sid, room_code))

async def handle_disconnect_timeout(sid: str, room_code: str):
    await asyncio.sleep(120)
    room = room_manager.get_room(room_code)
    if room and sid in room.players and not room.players[sid].connected:
        # If still disconnected after 120s, they are effectively out or bankrupt
        from engine.turn_manager import turn_manager
        from engine.bankruptcy import declare_bankruptcy
        
        game = turn_manager.get_game(room_code)
        if game and not room.players[sid].is_bankrupt:
            declare_bankruptcy(game, sid)
            await sio.emit(
                SOCKET_EVENTS["GAME"]["STATE_UPDATE"],
                {"game": game.model_dump(), "turn": turn_manager.get_turn_state(room_code).model_dump()},
                room=room_code
            )
