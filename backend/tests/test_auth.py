import pytest
from backend.auth.users import get_password_hash, verify_password

def test_dummy_auth():
    assert True

def test_password_hash_and_verify():
    password = "testpass123"
    hash_ = get_password_hash(password)
    assert verify_password(password, hash_)
    assert not verify_password("falsch", hash_)
