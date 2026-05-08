import json
import os
from sockets.server import sio
from rooms.manager import room_manager
from engine.turn_manager import turn_manager
from engine.property import buy_property, mortgage_property, unmortgage_property

events_path = os.path.join(os.path.dirname(__file__), '../../shared/events/socket_events.json')
with open(events_path, 'r') as f:
    SOCKET_EVENTS = json.load(f)

PROPERTY_EVENTS = SOCKET_EVENTS["PROPERTY"]
GAME_EVENTS = SOCKET_EVENTS["GAME"]

@sio.event
async def property_buy(sid, data):
    """
    Expects data: {"property_id": 1}
    """
    room_code = room_manager.get_player_room_code(sid)
    if not room_code:
        return {"status": "error", "message": "Not in a room"}
        
    turn = turn_manager.get_turn_state(room_code)
    if not turn or turn.active_player_id != sid or turn.phase != "buy":
        return {"status": "error", "message": "Not the time to buy"}
        
    property_id = data.get("property_id")
    game = turn_manager.get_game(room_code)
    
    # Ensure they are on this tile (unless we allow remote buying, but usually you must be on it)
    player = game.room.players[sid]
    if player.position != property_id:
        return {"status": "error", "message": "You must be on the property to buy it"}
    
    success, msg = buy_property(game, sid, property_id)
    if not success:
        return {"status": "error", "message": msg}
        
    turn.phase = "action"
    
    await sio.emit(
        GAME_EVENTS["STATE_UPDATE"],
        {"game": game.model_dump(), "turn": turn.model_dump()},
        room=room_code
    )
    return {"status": "success"}

@sio.event
async def property_mortgage(sid, data):
    room_code = room_manager.get_player_room_code(sid)
    if not room_code:
        return {"status": "error", "message": "Not in a room"}
        
    property_id = data.get("property_id")
    game = turn_manager.get_game(room_code)
    
    success, msg = mortgage_property(game, sid, property_id)
    if not success:
        return {"status": "error", "message": msg}
        
    await sio.emit(
        GAME_EVENTS["STATE_UPDATE"],
        {"game": game.model_dump(), "turn": turn_manager.get_turn_state(room_code).model_dump()},
        room=room_code
    )
    return {"status": "success"}

@sio.event
async def property_unmortgage(sid, data):
    room_code = room_manager.get_player_room_code(sid)
    if not room_code:
        return {"status": "error", "message": "Not in a room"}
        
    property_id = data.get("property_id")
    game = turn_manager.get_game(room_code)
    
    success, msg = unmortgage_property(game, sid, property_id)
    if not success:
        return {"status": "error", "message": msg}
        
    await sio.emit(
        GAME_EVENTS["STATE_UPDATE"],
        {"game": game.model_dump(), "turn": turn_manager.get_turn_state(room_code).model_dump()},
        room=room_code
    )
    return {"status": "success"}
