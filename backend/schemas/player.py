from pydantic import BaseModel, Field
from typing import Optional, List

class PlayerState(BaseModel):
    id: str = Field(..., description="Unique socket ID or session ID for the player")
    name: str = Field(..., description="Display name of the player")
    position: int = Field(0, description="Current tile index 0-39")
    money: int = Field(150000, description="Current balance in ₹")
    is_in_jail: bool = Field(False, description="Whether the player is currently in jail")
    jail_turns: int = Field(0, description="Number of turns spent in jail (max 3)")
    get_out_of_jail_cards: int = Field(0, description="Number of Get Out of Jail Free cards owned")
    is_bankrupt: bool = Field(False, description="Whether the player is bankrupt and eliminated")
    properties_owned: List[int] = Field(default_factory=list, description="List of tile IDs owned by the player")
    connected: bool = Field(True, description="Whether the player is currently connected")
    color: str = Field(..., description="Hex color or color name for the player's token")
