import pytest
from backend.tools.erbfolge import berechne_erbfolge
from backend.tools.miteigentum import berechne_miteigentum
from backend.tools.erbpachtzins import berechne_erbpachtzins
from backend.tools.gnotkg import berechne_gnotkg

def test_dummy_tools():
    assert True

def test_berechne_erbfolge():
    erben = [
        {"id": "1", "beziehung": "ehepartner"},
        {"id": "2", "beziehung": "kind"}
    ]
    result = berechne_erbfolge("Max Mustermann", 100000, erben)
    assert result["erblasser"] == "Max Mustermann"
    assert result["vermoegenswert"] == 100000
    assert "ergebnisse" in result

def test_berechne_erbfolge_kinder_ehepartner():
    erben = [
        {"id": "1", "beziehung": "ehepartner"},
        {"id": "2", "beziehung": "kind"},
        {"id": "3", "beziehung": "kind"}
    ]
    result = berechne_erbfolge("Max", 100000, erben)
    assert abs(result["ergebnisse"]["1"] - 50) < 0.01
    assert abs(result["ergebnisse"]["2"] - 25) < 0.01
    assert abs(result["ergebnisse"]["3"] - 25) < 0.01

def test_berechne_miteigentum():
    result = berechne_miteigentum("Haus", 50)
    assert result["objekt"] == "Haus"
    assert result["anteil"] == 50

def test_berechne_erbpachtzins():
    result = berechne_erbpachtzins(1000, 100, 120)
    assert abs(result["neuer_zins"] - 1200) < 0.01

def test_berechne_gnotkg():
    result = berechne_gnotkg(30000, "Beurkundung")
    assert result["gebuehr"] > 0
    result2 = berechne_gnotkg(30000, "Beglaubigung")
    assert result2["gebuehr"] < result["gebuehr"]
