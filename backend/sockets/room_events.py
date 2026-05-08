import json
import os
from sockets.server import sio
from rooms.manager import room_manager

# Load socket events constants (handling path relative to backend root)
events_path = os.path.join(os.path.dirname(__file__), '../../shared/events/socket_events.json')
with open(events_path, 'r') as f:
    SOCKET_EVENTS = json.load(f)

ROOM_EVENTS = SOCKET_EVENTS["ROOM"]

@sio.on('room:create')
async def room_create(sid, data):
    """
    Expects data: {"name": "PlayerName", "color": "blue"}
    """
    player_name = data.get("name", f"Player_{sid[:4]}")
    player_color = data.get("color", "cyan-400")
    
    room_code = room_manager.create_room(
        host_id=sid,
        host_name=player_name,
        host_color=player_color
    )
    
    await sio.enter_room(sid, room_code)
    room = room_manager.get_room(room_code)
    
    return {"status": "success", "room": room.model_dump()}

@sio.on('room:join')
async def room_join(sid, data):
    """
    Expects data: {"room_code": "ABCD", "name": "PlayerName", "color": "purple"}
    """
    room_code = data.get("room_code", "").upper()
    player_name = data.get("name", f"Player_{sid[:4]}")
    player_color = data.get("color", "cyan-400")
    
    room = room_manager.get_room(room_code)
    if not room:
        return {"status": "error", "message": "Room not found"}
        
    # Reconnect logic
    if room.status == "playing":
        for pid, player in list(room.players.items()):
            if player.name == player_name and not player.connected:
                # Reconnect player
                player.connected = True
                player.id = sid
                
                # Update keys mapping
                room.players[sid] = room.players.pop(pid)
                room_manager.player_rooms[sid] = room_code
                if pid in room_manager.player_rooms:
                    del room_manager.player_rooms[pid]
                    
                await sio.enter_room(sid, room_code)
                
                # If game exists, update turn orders
                from engine.turn_manager import turn_manager
                game = turn_manager.get_game(room_code)
                if game:
                    if pid in game.turn_order:
                        game.turn_order = [sid if p == pid else p for p in game.turn_order]
                    turn = turn_manager.get_turn_state(room_code)
                    if turn and turn.active_player_id == pid:
                        turn.active_player_id = sid
                        
                    await sio.emit(
                        SOCKET_EVENTS["GAME"]["STATE_UPDATE"],
                        {"game": game.model_dump(), "turn": turn.model_dump()},
                        room=room_code
                    )
                
                return {"status": "success", "room": room.model_dump()}
        return {"status": "error", "message": "Cannot join a game already in progress"}
    
    # Normal join
    room = room_manager.join_room(
        room_code=room_code,
        player_id=sid,
        player_name=player_name,
        player_color=player_color
    )
    
    if not room:
        return {"status": "error", "message": "Failed to join room. Room may be full."}
        
    await sio.enter_room(sid, room_code)
    
    # Broadcast updated room state to all in room
    await sio.emit(
        ROOM_EVENTS["STATE_UPDATE"],
        room.model_dump(),
        room=room_code
    )
    
    return {"status": "success", "room": room.model_dump()}

@sio.on('room:leave')
async def room_leave(sid):
    room_code = room_manager.get_player_room_code(sid)
    if not room_code:
        return {"status": "error", "message": "Not in a room"}
        
    await sio.leave_room(sid, room_code)
    updated_room = room_manager.leave_room(sid)
    
    if updated_room:
        await sio.emit(
            ROOM_EVENTS["STATE_UPDATE"],
            updated_room.model_dump(),
            room=room_code
        )
        
    return {"status": "success"}

@sio.on('room:update_settings')
async def room_update_settings(sid, data):
    """
    Expects data: {"settings": {"max_players": 4, "auction_enabled": false}}
    """
    room_code = room_manager.get_player_room_code(sid)
    if not room_code:
        return {"status": "error", "message": "Not in a room"}
        
    settings = data.get("settings", {})
    updated_room = room_manager.update_settings(room_code, sid, settings)
    
    if not updated_room:
        return {"status": "error", "message": "Failed to update settings. Must be host and room must be waiting."}
        
    await sio.emit(
        ROOM_EVENTS["STATE_UPDATE"],
        updated_room.model_dump(),
        room=room_code
    )
    
    return {"status": "success"}
