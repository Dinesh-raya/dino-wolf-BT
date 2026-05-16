import pytest
from pydantic import ValidationError

from schemas.room import RoomSettings


def test_room_settings_accept_valid_values():
    settings = RoomSettings(max_players=6, turn_timer_seconds=30, starting_cash=150000)
    assert settings.max_players == 6


def test_room_settings_reject_invalid_player_count():
    with pytest.raises(ValidationError):
        RoomSettings(max_players=8)
