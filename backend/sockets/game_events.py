import json
import os
from sockets.server import sio
from rooms.manager import room_manager
from engine.game_initializer import init_game_state
from engine.turn_manager import turn_manager
from services.rate_limiter import rate_limiter

# Load socket events constants
events_path = os.path.join(os.path.dirname(__file__), '../../shared/events/socket_events.json')
with open(events_path, 'r') as f:
    SOCKET_EVENTS = json.load(f)

GAME_EVENTS = SOCKET_EVENTS["GAME"]
ROOM_EVENTS = SOCKET_EVENTS["ROOM"]

@sio.on("game:start")
@sio.on("game_start")
async def game_start(sid, data):
    if not rate_limiter.allow(f"{sid}:game_start"):
        return {"status": "error", "message": "Too many requests"}
    room_code = room_manager.get_player_room_code(sid)
    if not room_code:
        return {"status": "error", "message": "Not in a room"}
        
    room = room_manager.get_room(room_code)
    if not room or room.host_id != sid:
        return {"status": "error", "message": "Only host can start game"}
        
    if room.status != "waiting":
        return {"status": "error", "message": "Game already started"}
        
    room.status = "playing"
    
    # Initialize Game State
    game_state = init_game_state(room)
    turn_manager.start_game(room_code, game_state)
    
    turn_state = turn_manager.get_turn_state(room_code)
    
    # Broadcast game start and initial state
    await sio.emit(
        GAME_EVENTS["START"],
        {"game": game_state.model_dump(), "turn": turn_state.model_dump()},
        room=room_code
    )
    return {"status": "success"}

@sio.on("game:dice_roll")
@sio.on("game_dice_roll")
async def game_dice_roll(sid, data):
    if not rate_limiter.allow(f"{sid}:game_dice_roll"):
        return {"status": "error", "message": "Too many requests"}
    room_code = room_manager.get_player_room_code(sid)
    if not room_code:
        return {"status": "error", "message": "Not in a room"}
        
    result = turn_manager.process_roll(room_code, sid)
    if not result:
        return {"status": "error", "message": "Not your turn or cannot roll"}
        
    # Broadcast roll result and new state
    await sio.emit(
        GAME_EVENTS["DICE_RESULT"],
        result["dice"],
        room=room_code
    )
    
    await sio.emit(
        GAME_EVENTS["STATE_UPDATE"],
        {"game": result["game"].model_dump(), "turn": result["turn"].model_dump()},
        room=room_code
    )
    
    return {"status": "success"}

@sio.on("game:end_turn")
@sio.on("game_end_turn")
async def game_end_turn(sid, data):
    if not rate_limiter.allow(f"{sid}:game_end_turn"):
        return {"status": "error", "message": "Too many requests"}
    room_code = room_manager.get_player_room_code(sid)
    if not room_code:
        return {"status": "error", "message": "Not in a room"}
        
    turn = turn_manager.get_turn_state(room_code)
    if not turn or turn.active_player_id != sid or not turn.can_end_turn:
        return {"status": "error", "message": "Cannot end turn right now"}
        
    # Proceed to next turn
    new_turn = turn_manager.next_turn(room_code)
    game = turn_manager.get_game(room_code)
    
    await sio.emit(
        GAME_EVENTS["STATE_UPDATE"],
        {"game": game.model_dump(), "turn": new_turn.model_dump()},
        room=room_code
    )
    
    return {"status": "success"}
