import random
import string

ALPHABETS = list(string.ascii_letters)

DIGITS = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
]

URL_SAFE_SPECIAL_CHARACTERS = ["-", ".", "!", "$"]


def create_roomcode() -> str:
    """Returns a 6 Digit Roomcode

    Returns
    -------
    string
        Roomcode
    """
    elements = random.choices(
        ALPHABETS + DIGITS + URL_SAFE_SPECIAL_CHARACTERS, k=random.choice([5, 6, 7])
    )

    code = "".join(elements)
    return code
