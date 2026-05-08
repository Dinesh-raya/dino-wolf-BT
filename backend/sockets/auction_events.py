import json
import os
from sockets.server import sio
from rooms.manager import room_manager
from engine.turn_manager import turn_manager
from engine.auction import auction_manager

events_path = os.path.join(os.path.dirname(__file__), '../../shared/events/socket_events.json')
with open(events_path, 'r') as f:
    SOCKET_EVENTS = json.load(f)

AUCTION_EVENTS = SOCKET_EVENTS["AUCTION"]
GAME_EVENTS = SOCKET_EVENTS["GAME"]

@sio.event
async def auction_start(sid, data):
    room_code = room_manager.get_player_room_code(sid)
    if not room_code:
        return {"status": "error", "message": "Not in a room"}
        
    game = turn_manager.get_game(room_code)
    turn = turn_manager.get_turn_state(room_code)
    
    if turn.active_player_id != sid or turn.phase != "buy":
        return {"status": "error", "message": "Cannot start auction now"}
        
    property_id = data.get("property_id")
    
    participants = [p for p in game.turn_order if not game.room.players[p].is_bankrupt]
    
    auction = auction_manager.start_auction(room_code, property_id, participants)
    if not auction:
        return {"status": "error", "message": "Invalid property"}
        
    turn.phase = "auction"
    
    await sio.emit(
        AUCTION_EVENTS["START"],
        {"auction": auction.model_dump()},
        room=room_code
    )
    
    await sio.emit(
        GAME_EVENTS["STATE_UPDATE"],
        {"game": game.model_dump(), "turn": turn.model_dump()},
        room=room_code
    )
    return {"status": "success"}

@sio.event
async def auction_bid(sid, data):
    room_code = room_manager.get_player_room_code(sid)
    if not room_code:
        return {"status": "error", "message": "Not in a room"}
        
    bid_amount = data.get("amount", 0)
    game = turn_manager.get_game(room_code)
    player = game.room.players.get(sid)
    
    success, msg = auction_manager.place_bid(room_code, sid, bid_amount, player.money)
    if not success:
        return {"status": "error", "message": msg}
        
    auction = auction_manager.get_auction(room_code)
    
    await sio.emit(
        AUCTION_EVENTS["STATE_UPDATE"],
        {"auction": auction.model_dump()},
        room=room_code
    )
    return {"status": "success"}

@sio.event
async def auction_end(sid, data):
    room_code = room_manager.get_player_room_code(sid)
    if not room_code:
        return {"status": "error", "message": "Not in a room"}
        
    game = turn_manager.get_game(room_code)
    turn = turn_manager.get_turn_state(room_code)
    
    # Ideally, server timer handles this. For now, allowing active player or host to trigger end.
    success, msg = auction_manager.end_auction(room_code, game)
    if not success:
        return {"status": "error", "message": msg}
        
    turn.phase = "action"
    
    await sio.emit(
        AUCTION_EVENTS["END"],
        {"message": msg},
        room=room_code
    )
    
    await sio.emit(
        GAME_EVENTS["STATE_UPDATE"],
        {"game": game.model_dump(), "turn": turn.model_dump()},
        room=room_code
    )
    return {"status": "success"}
