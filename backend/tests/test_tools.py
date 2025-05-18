import pytest
from backend.tools.erbfolge import berechne_erbfolge
from backend.tools.miteigentum import berechne_miteigentum

def test_dummy_tools():
    assert True

def test_berechne_erbfolge():
    result = berechne_erbfolge("Max Mustermann", 100000)
    assert result["erblasser"] == "Max Mustermann"
    assert result["vermoegenswert"] == 100000
    assert "Erbanteil" in result["ergebnis"]

def test_berechne_miteigentum():
    result = berechne_miteigentum("Haus", 50)
    assert result["objekt"] == "Haus"
    assert result["anteil"] == 50
    assert "Anteil" in result["ergebnis"]
