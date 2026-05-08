import secrets
from schemas.action import DiceState
from schemas.game import GameState
from schemas.player import PlayerState
from constants.game_rules import GameRules

def roll_dice() -> DiceState:
    """Cryptographically secure dice roll."""
    die1 = secrets.choice(range(1, 7))
    die2 = secrets.choice(range(1, 7))
    return DiceState(
        die1=die1,
        die2=die2,
        is_double=(die1 == die2),
        doubles_count=0  # Handled by TurnManager
    )

def handle_jail_roll(player: PlayerState, dice: DiceState) -> bool:
    """
    Returns True if player escaped jail via doubles.
    """
    if dice.is_double:
        player.is_in_jail = False
        player.jail_turns = 0
        return True
    
    player.jail_turns += 1
    return False
