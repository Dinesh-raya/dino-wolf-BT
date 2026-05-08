from schemas.game import GameState
from engine.game_initializer import load_board_config

_BOARD_CONFIG_CACHE = None

def get_board_config():
    global _BOARD_CONFIG_CACHE
    if _BOARD_CONFIG_CACHE is None:
        _BOARD_CONFIG_CACHE = {t["id"]: t for t in load_board_config()}
    return _BOARD_CONFIG_CACHE

def buy_property(game_state: GameState, player_id: str, property_id: int) -> tuple[bool, str]:
    """Attempts to buy a property for a player. Returns (success, message)."""
    if property_id not in game_state.properties:
        return False, "Not a buyable property"
        
    prop_state = game_state.properties[property_id]
    if prop_state.owner_id is not None:
        return False, "Property is already owned"
        
    config = get_board_config().get(property_id)
    if not config:
        return False, "Invalid property config"
        
    price = config.get("price", 0)
    player = game_state.room.players[player_id]
    
    if player.money < price:
        return False, "Not enough money"
        
    player.money -= price
    prop_state.owner_id = player_id
    player.properties_owned.append(property_id)
    
    game_state.history_log.append(f"{player.name} bought {config['name']} for ₹{price}")
    return True, "Property bought successfully"

def calculate_rent(game_state: GameState, property_id: int) -> int:
    prop_state = game_state.properties.get(property_id)
    if not prop_state or prop_state.owner_id is None or prop_state.is_mortgaged:
        return 0
        
    config = get_board_config().get(property_id)
    if not config:
        return 0
        
    owner_id = prop_state.owner_id
    owner = game_state.room.players[owner_id]
    
    # Calculate rent based on type
    if config["type"] == "property":
        # Check monopoly
        color = config["color"]
        color_group_ids = [k for k, v in get_board_config().items() if v.get("color") == color]
        has_monopoly = all(game_state.properties[k].owner_id == owner_id for k in color_group_ids)
        
        if prop_state.houses == 0 and prop_state.hotels == 0:
            base_rent = config["rent"][0]
            if has_monopoly and game_state.room.settings.double_rent_enabled:
                return base_rent * 2
            return base_rent
        else:
            rent_index = prop_state.houses
            if prop_state.hotels > 0:
                rent_index = 5
            return config["rent"][rent_index]
            
    elif config["type"] == "airport":
        owned_airports = sum(1 for p in owner.properties_owned if get_board_config()[p]["type"] == "airport")
        # Standard: 25k, 50k, 100k, 200k
        return 25000 * (2 ** (owned_airports - 1))
        
    elif config["type"] == "utility":
        # Utility rent depends on dice roll. Handled slightly differently, we'll return a multiplier here.
        # Or just standard calculation if we track last dice roll.
        # For simplicity, returning 0 here and handling it specifically in turn_manager if needed.
        owned_utilities = sum(1 for p in owner.properties_owned if get_board_config()[p]["type"] == "utility")
        # Assuming last dice roll is tracked in turn state or we pass it in.
        return 0 # We'll handle this in pay_rent directly
        
    return 0

def pay_rent(game_state: GameState, payer_id: str, property_id: int, dice_roll: int = 0) -> int:
    """Pays rent from payer to owner. Returns amount paid."""
    prop_state = game_state.properties.get(property_id)
    if not prop_state or prop_state.owner_id is None or prop_state.owner_id == payer_id or prop_state.is_mortgaged:
        return 0
        
    config = get_board_config().get(property_id)
    owner = game_state.room.players[prop_state.owner_id]
    payer = game_state.room.players[payer_id]
    
    rent = 0
    if config["type"] == "utility":
        owned_utilities = sum(1 for p in owner.properties_owned if get_board_config()[p]["type"] == "utility")
        multiplier = 10000 if owned_utilities > 1 else 4000
        rent = dice_roll * multiplier
    else:
        rent = calculate_rent(game_state, property_id)
        
    if rent > 0:
        payer.money -= rent
        owner.money += rent
        game_state.history_log.append(f"{payer.name} paid ₹{rent} rent to {owner.name} for {config['name']}")
        
    return rent

def mortgage_property(game_state: GameState, player_id: str, property_id: int) -> tuple[bool, str]:
    if not game_state.room.settings.mortgage_enabled:
        return False, "Mortgages are disabled in this room"
        
    prop_state = game_state.properties.get(property_id)
    if not prop_state or prop_state.owner_id != player_id:
        return False, "You do not own this property"
        
    if prop_state.is_mortgaged:
        return False, "Already mortgaged"
        
    if prop_state.houses > 0 or prop_state.hotels > 0:
        return False, "Must sell buildings first"
        
    config = get_board_config().get(property_id)
    mortgage_value = config.get("mortgage", 0)
    
    prop_state.is_mortgaged = True
    game_state.room.players[player_id].money += mortgage_value
    
    game_state.history_log.append(f"{game_state.room.players[player_id].name} mortgaged {config['name']} for ₹{mortgage_value}")
    return True, "Mortgaged successfully"

def unmortgage_property(game_state: GameState, player_id: str, property_id: int) -> tuple[bool, str]:
    prop_state = game_state.properties.get(property_id)
    if not prop_state or prop_state.owner_id != player_id:
        return False, "You do not own this property"
        
    if not prop_state.is_mortgaged:
        return False, "Not mortgaged"
        
    config = get_board_config().get(property_id)
    unmortgage_cost = int(config.get("mortgage", 0) * 1.1) # 10% interest
    
    player = game_state.room.players[player_id]
    if player.money < unmortgage_cost:
        return False, "Not enough money"
        
    player.money -= unmortgage_cost
    prop_state.is_mortgaged = False
    
    game_state.history_log.append(f"{player.name} unmortgaged {config['name']} for ₹{unmortgage_cost}")
    return True, "Unmortgaged successfully"
