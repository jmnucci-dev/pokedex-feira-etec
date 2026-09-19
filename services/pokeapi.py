import os
import json
import requests

CACHE_DIR = "data/pokemon"
_all_loaded = False
_by_id = {}
_by_name = {}


def _load():
    global _all_loaded, _by_id, _by_name
    if _all_loaded:
        return
    _all_loaded = True
    if not os.path.exists(CACHE_DIR):
        return
    for f in os.listdir(CACHE_DIR):
        if f.endswith(".json"):
            path = os.path.join(CACHE_DIR, f)
            try:
                with open(path, "r", encoding="utf-8") as file:
                    data = json.load(file)
                    pid = str(data.get("id"))
                    name = str(data.get("name", "")).lower()
                    if pid:
                        _by_id[pid] = data
                    if name:
                        _by_name[name] = data
            except Exception:
                continue


def get_pokemon_data(pokemon_name: str) -> dict:
    _load()
    query = str(pokemon_name).strip().lower()
    if query in _by_id:
        return _by_id[query]
    if query in _by_name:
        return _by_name[query]
    url = f"https://pokeapi.co/api/v2/pokemon/{query}"
    try:
        resp = requests.get(url, timeout=2)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return None


def get_all_pokemon_data():
    _load()
    return list(_by_id.values())
