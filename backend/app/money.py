"""Money lives as integer satang in the DB; the API speaks baht."""


def to_satang(baht: float) -> int:
    return int(round(baht * 100))


def to_baht(satang: int) -> float:
    return round(satang / 100, 2)
