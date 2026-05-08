class GameRules:
    MIN_PLAYERS = 1
    MAX_PLAYERS = 6
    INITIAL_BALANCE = 150000
    BOARD_SIZE = 40
    
    # Jail rules
    MAX_JAIL_TURNS = 3
    JAIL_FINE = 5000
    GO_TO_JAIL_TILE = 30
    JAIL_TILE = 10
    
    # Passing GO
    GO_REWARD = 20000
    
    # Timing (seconds)
    DEFAULT_TURN_TIMER = 60
    AUCTION_TIMER = 15
    DISCONNECT_TIMEOUT = 120
    
    # Dice
    MAX_DOUBLES = 3  # Third double sends to jail
