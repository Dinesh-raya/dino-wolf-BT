#!/usr/bin/env python3
"""
Test script for house/hotel building system in DINO-RICHUP
"""

import sys
import os

# Add the backend directory to the Python path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

from schemas.game import GameState, PropertyState
from schemas.room import RoomState, RoomSettings
from schemas.player import PlayerState
from engine.property import can_build_house, build_house, can_build_hotel, build_hotel, calculate_rent

def create_test_game_state():
    """Create a minimal game state for testing"""
    # Create room settings
    settings = RoomSettings()
    
    # Create a room with 2 players
    room = RoomState(
        room_id="test-room",
        host_id="player1",
        players={
            "player1": PlayerState(
                id="player1",
                name="Player 1",
                position=0,
                money=1000000,  # 1 million rupees
                is_in_jail=False,
                is_bankrupt=False,
                properties_owned=[],
                connected=True,
                color="#ff0000"
            ),
            "player2": PlayerState(
                id="player2",
                name="Player 2",
                position=0,
                money=1000000,
                is_in_jail=False,
                is_bankrupt=False,
                properties_owned=[],
                connected=True,
                color="#0000ff"
            )
        },
        status="playing",
        settings=settings
    )
    
    # Create game state
    game_state = GameState(
        room=room,
        properties={},
        turn_order=["player1", "player2"],
        current_turn_index=0,
        free_parking_pool=0,
        history_log=[]
    )
    
    # Add some properties (brown color group - properties 1 and 3)
    # Property IDs 1 and 3 are brown properties in board_config.json
    game_state.properties[1] = PropertyState(
        tile_id=1,
        owner_id="player1",
        is_mortgaged=False,
        houses=0,
        hotels=0
    )
    game_state.properties[3] = PropertyState(
        tile_id=3,
        owner_id="player1",
        is_mortgaged=False,
        houses=0,
        hotels=0
    )
    
    # Add player1's ownership
    game_state.room.players["player1"].properties_owned = [1, 3]
    
    return game_state

def test_house_building():
    """Test house building functionality"""
    print("=== Testing House Building ===")
    game_state = create_test_game_state()
    
    # Test 1: Player should be able to build a house on property 1
    can_build, message = can_build_house(game_state, "player1", 1)
    print(f"Test 1 - Can build house on property 1: {can_build} - {message}")
    
    if can_build:
        success, msg = build_house(game_state, "player1", 1)
        print(f"  Building house: {success} - {msg}")
        print(f"  Player money after: {game_state.room.players['player1'].money}")
        print(f"  Houses on property 1: {game_state.properties[1].houses}")
    else:
        print("  ERROR: Should have been able to build house")
        
    # Test 2: Player 2 should NOT be able to build (doesn't own property)
    can_build2, message2 = can_build_house(game_state, "player2", 1)
    print(f"\nTest 2 - Player 2 can build house on property 1: {can_build2} - {message2}")
    
    # Test 3: Test even building rule
    print("\nTest 3 - Testing even building rule...")
    # Build 2 houses on property 1
    game_state.properties[1].houses = 2
    can_build3, message3 = can_build_house(game_state, "player1", 3)
    print(f"  Can build house on property 3 (property 1 has 2 houses): {can_build3} - {message3}")
    
    # Build 1 house on property 3 to make it even
    if can_build3:
        build_house(game_state, "player1", 3)
        print(f"  Built house on property 3")
    
    # Now try to build 3rd house on property 1 (should fail due to even building rule)
    can_build4, message4 = can_build_house(game_state, "player1", 1)
    print(f"  Can build 3rd house on property 1 (property 3 has 1 house): {can_build4} - {message4}")
    
    return game_state

def test_hotel_building():
    """Test hotel building functionality"""
    print("\n\n=== Testing Hotel Building ===")
    game_state = create_test_game_state()
    
    # Give player1 monopoly on brown properties (already done)
    # Set both properties to have 4 houses
    game_state.properties[1].houses = 4
    game_state.properties[3].houses = 4
    
    # Give player enough money
    game_state.room.players["player1"].money = 10000000
    
    # Test hotel building
    can_build, message = can_build_hotel(game_state, "player1", 1)
    print(f"Test 1 - Can build hotel on property 1: {can_build} - {message}")
    
    if can_build:
        success, msg = build_hotel(game_state, "player1", 1)
        print(f"  Building hotel: {success} - {msg}")
        print(f"  Player money after: {game_state.room.players['player1'].money}")
        print(f"  Houses on property 1: {game_state.properties[1].houses}")
        print(f"  Hotels on property 1: {game_state.properties[1].hotels}")
    else:
        print("  ERROR: Should have been able to build hotel")

def test_rent_calculation():
    """Test that rent calculation works with houses/hotels"""
    print("\n\n=== Testing Rent Calculation ===")
    from engine.property import calculate_rent
    
    game_state = create_test_game_state()
    
    # Test base rent (no houses)
    rent = calculate_rent(game_state, 1)
    print(f"Base rent for property 1: Rs.{rent}")
    
    # Add 1 house
    game_state.properties[1].houses = 1
    rent_with_house = calculate_rent(game_state, 1)
    print(f"Rent with 1 house: Rs.{rent_with_house}")
    
    # Add hotel
    game_state.properties[1].houses = 0
    game_state.properties[1].hotels = 1
    rent_with_hotel = calculate_rent(game_state, 1)
    print(f"Rent with hotel: Rs.{rent_with_hotel}")

def main():
    """Run all tests"""
    print("Testing House/Hotel Building System in DINO-RICHUP")
    print("=" * 60)
    
    try:
        test_house_building()
        test_hotel_building()
        test_rent_calculation()
        print("\n" + "=" * 60)
        print("All tests completed!")
    except Exception as e:
        print(f"\nERROR during testing: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())