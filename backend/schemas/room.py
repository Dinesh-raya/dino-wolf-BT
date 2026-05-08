from pydantic import BaseModel, Field
from typing import Dict, Optional

from schemas.player import PlayerState

class RoomSettings(BaseModel):
    max_players: int = Field(6, description="Maximum players allowed (2-6)")
    starting_cash: int = Field(150000, description="Initial money for each player")
    auction_enabled: bool = Field(True, description="Whether auctions are enabled")
    double_rent_enabled: bool = Field(True, description="Whether double rent applies to monopolies")
    mortgage_enabled: bool = Field(True, description="Whether properties can be mortgaged")
    free_parking_jackpot: bool = Field(False, description="Whether free parking accumulates taxes")
    turn_timer_seconds: int = Field(60, description="Seconds per turn before timeout")

class RoomState(BaseModel):
    room_id: str = Field(..., description="Unique 4-6 character invite code")
    host_id: str = Field(..., description="Socket ID of the room host")
    settings: RoomSettings = Field(default_factory=RoomSettings)
    players: Dict[str, PlayerState] = Field(default_factory=dict, description="Map of socket IDs to PlayerState")
    status: str = Field("waiting", description="Room status: waiting, playing, finished")
