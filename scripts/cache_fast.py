import os
import json
import requests
import concurrent.futures
DATA_DIR = "data/pokemon"
SPRITE_DIR = "static/sprites/pokemon"
TOTAL_POKEMON = 1025


def get_pokemon_id_from_url(url):
    if not url:
        return None
    try:
        return int(url.rstrip("/").split("/")[-1])
    except (ValueError, IndexError):
        return None


def get_local_sprite(pokemon_id):
    if pokemon_id is None:
        return None
    gif_path = os.path.join(
        SPRITE_DIR,
        f"{pokemon_id}.gif"
    )
    png_path = os.path.join(
        SPRITE_DIR,
        f"{pokemon_id}.png"
    )
    if os.path.exists(gif_path):
        return f"/{SPRITE_DIR}/{pokemon_id}.gif"
    if os.path.exists(png_path):
        return f"/{SPRITE_DIR}/{pokemon_id}.png"
    return None


def build_evolution_node(node):
    species = node.get("species", {})
    species_name = species.get("name")
    species_url = species.get("url")
    pokemon_id = get_pokemon_id_from_url(species_url)
    sprite = get_local_sprite(pokemon_id)
    details = []
    for detail in node.get("evolution_details", []):
        trigger = detail.get("trigger", {}).get("name")
        min_level = detail.get("min_level")
        item = detail.get("item")
        item_name = item.get("name") if item else None
        details.append({
            "trigger": trigger,
            "min_level": min_level,
            "item": item_name
        })
    next_evolutions = []
    for next_node in node.get("evolves_to", []):
        next_evolutions.append(
            build_evolution_node(next_node)
        )
    return {
        "species": species_name,
        "id": pokemon_id,
        "sprite": sprite,
        "details": details,
        "next": next_evolutions
    }


def get_evolution_chain(evolution_url):
    if not evolution_url:
        return None
    response = requests.get(
        evolution_url,
        timeout=15
    )
    if response.status_code != 200:
        raise Exception(
            f"Evolution Chain status {response.status_code}"
        )
    data = response.json()
    root = data.get("chain", {})
    species = root.get("species", {})
    species_name = species.get("name")
    species_url = species.get("url")
    pokemon_id = get_pokemon_id_from_url(species_url)
    sprite = get_local_sprite(pokemon_id)
    evolutions = []
    for node in root.get("evolves_to", []):
        evolutions.append(
            build_evolution_node(node)
        )
    return {
        "species": species_name,
        "id": pokemon_id,
        "sprite": sprite,
        "evolves_to": evolutions
    }


def process_pokemon(pokemon_id):
    json_path = os.path.join(
        DATA_DIR,
        f"{pokemon_id}.json"
    )
    if not os.path.exists(json_path):
        return (
            pokemon_id,
            False,
            "JSON não encontrado"
        )
    try:
        with open(
            json_path,
            "r",
            encoding="utf-8"
        ) as f:
            pokemon_info = json.load(f)
        species_url = (
            f"https://pokeapi.co/api/v2/"
            f"pokemon-species/{pokemon_id}"
        )
        response = requests.get(
            species_url,
            timeout=15
        )
        if response.status_code != 200:
            return (
                pokemon_id,
                False,
                f"Species status {response.status_code}"
            )
        species_data = response.json()
        evolution_url = (
            species_data
            .get("evolution_chain", {})
            .get("url")
        )
        if not evolution_url:
            pokemon_info["evolution_chain"] = None
        else:
            pokemon_info["evolution_chain"] = (
                get_evolution_chain(
                    evolution_url
                )
            )
        local_sprite = get_local_sprite(pokemon_id)
        if local_sprite:
            pokemon_info["sprite"] = local_sprite
        with open(
            json_path,
            "w",
            encoding="utf-8"
        ) as f:
            json.dump(
                pokemon_info,
                f,
                indent=4,
                ensure_ascii=False
            )
        name = pokemon_info.get(
            "name",
            f"ID {pokemon_id}"
        )
        print(
            f"[OK] {name.capitalize()}"
        )
        return (
            pokemon_id,
            True,
            None
        )
    except Exception as e:
        return (
            pokemon_id,
            False,
            str(e)
        )


def main():
    print("=" * 60)
    print(
        "ATUALIZANDO EVOLUTION CHAINS"
    )
    print("=" * 60)
    print(
        f"Pokémon: {TOTAL_POKEMON}"
    )
    print(
        "Sprites: NÃO serão baixados"
    )
    print("=" * 60)
    sucessos = 0
    falhas = []
    with concurrent.futures.ThreadPoolExecutor(
        max_workers=20
    ) as executor:
        resultados = executor.map(
            process_pokemon,
            range(1, TOTAL_POKEMON + 1)
        )
        for (
            pokemon_id,
            success,
            error
        ) in resultados:
            if success:
                sucessos += 1
            else:
                falhas.append(
                    f"#{pokemon_id:04d}: {error}"
                )
                print(
                    f"[ERRO] {error}"
                )
    print("\n" + "=" * 60)
    print(
        "ATUALIZAÇÃO CONCLUÍDA"
    )
    print(
        f"Sucessos: {sucessos}/{TOTAL_POKEMON}"
    )
    if falhas:
        print(
            f"Falhas: {len(falhas)}"
        )
        print("\nRelatório:")
        for erro in falhas:
            print(f"  - {erro}")
    else:
        print(
            "Todos os JSONs foram atualizados!"
        )
    print("=" * 60)
if __name__ == "__main__":
    main()
