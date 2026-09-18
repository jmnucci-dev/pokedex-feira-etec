from flask import Blueprint, render_template, request, redirect, url_for, jsonify
import json
import os
from services.pokeapi import get_pokemon_data

pokemon_route = Blueprint('pokemon', __name__)


def build_evolution_levels(chain):
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


@pokemon_route.route("/eron/<senha>")
def pokemon_eron(senha):
    if senha != 'sigmaboy':
        return "Acesso negado", 403
    pokemon_data = get_pokemon_data('1026')
    if not pokemon_data:
        pokemon_data = get_pokemon_data('eron')
    if not pokemon_data:
        return "Pokemon nao encontrado", 404
    return render_pokemon_secret(pokemon_data)

@pokemon_route.route("/1026/<senha>")
def pokemon_1026_senha(senha):
    if senha != 'sigmaboy':
        return "Acesso negado", 403
    pokemon_data = get_pokemon_data('1026')
    if not pokemon_data:
        pokemon_data = get_pokemon_data('eron')
    if not pokemon_data:
        return "Pokemon nao encontrado", 404
    return render_pokemon_secret(pokemon_data)

def render_pokemon_secret(pokemon_data):
    regioes_data = []
    try:
        with open('data/regioes.json', 'r', encoding='utf-8') as f:
            regioes_data = json.load(f)
    except Exception:
        pass
    evolution_levels = build_evolution_levels(pokemon_data.get('evolution_chain'))
    return render_template(
        "pokemon.html",
        pokemonName=pokemon_data.get('name'),
        data=pokemon_data,
        regioes=regioes_data,
        current_region='',
        evolution_levels=evolution_levels
    )

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

@pokemon_route.route("/api")
def pokemonApi():
    pokemon_list = all_pokemons()

    if pokemon_list is None:
        return jsonify({
            "error": "Não foi possível carregar os Pokémon"
        }), 500

    return jsonify(pokemon_list)

def all_pokemons():
    pokemon_list = []

    for id in range(1, 1026):
        path = f'data/pokemon/{id}.json'

        if not os.path.exists(path):
            continue

        with open(path, 'r', encoding='utf-8') as f:
            pokemon = json.load(f)

        pokemon_list.append({
            "id": pokemon.get("id"),
            "name": pokemon.get("name"),
            "types": pokemon.get("types", []),
            "sprite": pokemon.get("sprite")
        })

    return pokemon_list