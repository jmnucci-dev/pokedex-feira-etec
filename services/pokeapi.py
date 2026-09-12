import os
import json
import requests
CACHE_DIR = "data/pokemon"
def get_pokemon_data(pokemon_name: str) -> dict:
    query = str(pokemon_name).strip().lower()
    if os.path.exists(CACHE_DIR):
        direct_path = os.path.join(CACHE_DIR, f"{query}.json")
        if os.path.exists(direct_path):
            try:
                with open(direct_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        for filename in os.listdir(CACHE_DIR):
            if filename.endswith(".json"):
                file_path = os.path.join(CACHE_DIR, filename)
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if str(data.get("id")) == query or str(data.get("name", "")).lower() == query:
                            return data
                except Exception:
                    continue
    url = f"https://pokeapi.co/api/v2/pokemon/{query}"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()
    except requests.RequestException:
        pass
    return None
