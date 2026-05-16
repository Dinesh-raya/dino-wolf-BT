from engine.dice import roll_dice


def test_roll_dice_bounds():
    for _ in range(250):
        result = roll_dice()
        assert 1 <= result.die1 <= 6
        assert 1 <= result.die2 <= 6
        assert result.is_double == (result.die1 == result.die2)
