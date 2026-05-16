import json
import os
from pydantic import ValidationError
from sockets.server import sio
from rooms.manager import room_manager
from engine.turn_manager import turn_manager
from engine.auction import auction_manager
from schemas.contracts import PropertyActionPayload, AuctionBidPayload
from services.rate_limiter import rate_limiter

events_path = os.path.join(os.path.dirname(__file__), '../../shared/events/socket_events.json')
with open(events_path, 'r') as f:
    SOCKET_EVENTS = json.load(f)

AUCTION_EVENTS = SOCKET_EVENTS["AUCTION"]
GAME_EVENTS = SOCKET_EVENTS["GAME"]

@sio.on("auction:start")
@sio.on("auction_start")
async def auction_start(sid, data):
    if not rate_limiter.allow(f"{sid}:auction_start"):
        return {"status": "error", "message": "Too many requests"}
    room_code = room_manager.get_player_room_code(sid)
    if not room_code:
        return {"status": "error", "message": "Not in a room"}
        
    game = turn_manager.get_game(room_code)
    turn = turn_manager.get_turn_state(room_code)
    
    if turn.active_player_id != sid or turn.phase != "buy":
        return {"status": "error", "message": "Cannot start auction now"}
        
    try:
        payload = PropertyActionPayload.model_validate(data or {})
    except ValidationError as exc:
        return {"status": "error", "message": exc.errors()[0]["msg"]}
    property_id = payload.property_id
    
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

@sio.on("auction:bid")
@sio.on("auction_bid")
async def auction_bid(sid, data):
    if not rate_limiter.allow(f"{sid}:auction_bid"):
        return {"status": "error", "message": "Too many requests"}
    room_code = room_manager.get_player_room_code(sid)
    if not room_code:
        return {"status": "error", "message": "Not in a room"}
        
    try:
        payload = AuctionBidPayload.model_validate(data or {})
    except ValidationError as exc:
        return {"status": "error", "message": exc.errors()[0]["msg"]}
    bid_amount = payload.amount
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

@sio.on("auction:end")
@sio.on("auction_end")
async def auction_end(sid, data):
    if not rate_limiter.allow(f"{sid}:auction_end"):
        return {"status": "error", "message": "Too many requests"}
    room_code = room_manager.get_player_room_code(sid)
    if not room_code:
        return {"status": "error", "message": "Not in a room"}
        
    game = turn_manager.get_game(room_code)
    turn = turn_manager.get_turn_state(room_code)
    
    room = room_manager.get_room(room_code)
    if not room:
        return {"status": "error", "message": "Room not found"}
    if sid not in {room.host_id, turn.active_player_id}:
        return {"status": "error", "message": "Not authorized to end auction"}

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
