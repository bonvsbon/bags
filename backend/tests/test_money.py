from app.money import to_baht, to_satang


def test_baht_to_satang():
    assert to_satang(0) == 0
    assert to_satang(1) == 100
    assert to_satang(125.50) == 12550
    assert to_satang(0.1) == 10
    assert to_satang(0.01) == 1


def test_satang_to_baht():
    assert to_baht(0) == 0.0
    assert to_baht(100) == 1.0
    assert to_baht(12550) == 125.5
    assert to_baht(1) == 0.01
    assert to_baht(99) == 0.99


def test_round_trip():
    for baht in (0, 1, 12.34, 45000, 999999.99):
        assert to_baht(to_satang(baht)) == round(baht, 2)
