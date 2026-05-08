from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from schemas.room import RoomState

class PropertyState(BaseModel):
    tile_id: int = Field(..., description="The ID of the tile")
    owner_id: Optional[str] = Field(None, description="Socket ID of the owner")
    is_mortgaged: bool = Field(False, description="Whether the property is currently mortgaged")
    houses: int = Field(0, description="Number of houses built (future-proofing)")
    hotels: int = Field(0, description="Number of hotels built (future-proofing)")

class GameState(BaseModel):
    room: RoomState
    properties: Dict[int, PropertyState] = Field(default_factory=dict, description="State of all buyable properties")
    turn_order: List[str] = Field(default_factory=list, description="Ordered list of player IDs")
    current_turn_index: int = Field(0, description="Index in turn_order of the active player")
    free_parking_pool: int = Field(0, description="Accumulated taxes for free parking jackpot")
    history_log: List[str] = Field(default_factory=list, description="Chronological log of game events")
