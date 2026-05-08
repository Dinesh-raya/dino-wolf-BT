import json
import random
import os
from typing import Dict, List
from schemas.game import GameState, PropertyState
from schemas.room import RoomState

def load_board_config() -> List[dict]:
    config_path = os.path.join(os.path.dirname(__file__), '../../shared/configs/board_config.json')
    with open(config_path, 'r') as f:
        return json.load(f)["tiles"]

def init_game_state(room: RoomState) -> GameState:
    """Converts a RoomState into a new GameState."""
    board_tiles = load_board_config()
    properties: Dict[int, PropertyState] = {}
    
    # Initialize all buyable properties
    for tile in board_tiles:
        if tile["type"] in ["property", "airport", "utility"]:
            properties[tile["id"]] = PropertyState(tile_id=tile["id"])
            
    # Randomize turn order
    player_ids = list(room.players.keys())
    random.shuffle(player_ids)
    
    # Set initial money from room settings
    for pid in player_ids:
        room.players[pid].money = room.settings.starting_cash
        room.players[pid].position = 0
        room.players[pid].is_in_jail = False
        room.players[pid].jail_turns = 0
        room.players[pid].is_bankrupt = False
        room.players[pid].properties_owned = []
        
    game_state = GameState(
        room=room,
        properties=properties,
        turn_order=player_ids,
        current_turn_index=0,
        free_parking_pool=0,
        history_log=["Game started!"]
    )
    
    return game_state
