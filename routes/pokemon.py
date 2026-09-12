from flask import Blueprint, render_template, request, redirect, url_for
import json
from services.pokeapi import get_pokemon_data
pokemon_route = Blueprint('pokemon', __name__)
def build_evolution_levels(chain):
    """
    Achata a evolution_chain (que sempre vem a partir da espécie base,
    independente de qual pokémon da linha está sendo visto) em uma lista
    de "estágios". Cada estágio é uma lista de pokémons (pode ter mais de
    um em casos de ramificação, ex: Eevee).
    Isso garante que a aba de evolução sempre mostra a linha evolutiva
    inteira (pré-evoluções + evoluções), e não só o que vem "depois" do
    pokémon atual.
    """
    if not chain:
        return []
    levels = []
    current_stage = [chain]
    while current_stage:
        levels.append(current_stage)
        next_stage = []
        for node in current_stage:
            next_stage.extend(node.get('evolves_to') or [])
            next_stage.extend(node.get('next') or [])
        current_stage = next_stage
    return levels
@pokemon_route.route("/", methods=["GET"])
def search_pokemon():
    pokemon_name = request.args.get("pokemon")
    if not pokemon_name:
        return "Digite um Pokémon", 400
    return redirect(url_for(
        "pokemon.pokemon",
        pokemon_name=pokemon_name.lower().replace(" ", "-")
    ))
@pokemon_route.route("/<pokemon_name>", methods=["GET"])
def pokemon(pokemon_name):
    pokemon_data = get_pokemon_data(pokemon_name)
    if not pokemon_data:
        return "Pokémon não encontrado", 404
    regioes_data = []
    try:
        with open('data/regioes.json', 'r', encoding='utf-8') as f:
            regioes_data = json.load(f)
    except Exception:
        pass
    evolution_levels = build_evolution_levels(pokemon_data.get('evolution_chain'))
    return render_template(
        "pokemon.html",
        pokemonName=pokemon_name,
        data=pokemon_data,
        regioes=regioes_data,
        current_region='',
        evolution_levels=evolution_levels
    )
