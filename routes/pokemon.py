from flask import Blueprint, render_template, request, redirect, url_for, jsonify
import json
import os
from services.pokeapi import get_pokemon_data, get_all_pokemon_data

pokemon_route = Blueprint('pokemon', __name__)
_regioes_cache = None


def get_regioes():
    global _regioes_cache
    if _regioes_cache is None:
        try:
            with open('data/regioes.json', 'r', encoding='utf-8') as f:
                _regioes_cache = json.load(f)
        except Exception:
            _regioes_cache = []
    return _regioes_cache


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
    if senha != SECRET_SENHA:
        return "Acesso negado", 403
    pokemon_data = get_pokemon_data('1026')
    if not pokemon_data:
        pokemon_data = get_pokemon_data('eron')
    if not pokemon_data:
        return "Pokemon nao encontrado", 404
    return render_pokemon_secret(pokemon_data, senha='sigmaboy')

@pokemon_route.route("/1026/<senha>")


def pokemon_1026_senha(senha):
    if senha != SECRET_SENHA:
        return "Acesso negado", 403
    pokemon_data = get_pokemon_data('1026')
    if not pokemon_data:
        pokemon_data = get_pokemon_data('eron')
    if not pokemon_data:
        return "Pokemon nao encontrado", 404
    return render_pokemon_secret(pokemon_data, senha='sigmaboy')

@pokemon_route.route("/1027/<senha>")


def pokemon_1027_senha(senha):
    if senha != SECRET_SENHA:
        return "Acesso negado", 403
    pokemon_data = get_pokemon_data('1027')
    if not pokemon_data:
        pokemon_data = get_pokemon_data('eron jr')
    if not pokemon_data:
        return "Pokemon nao encontrado", 404
    return render_pokemon_secret(pokemon_data, senha='sigmaboy')

@pokemon_route.route("/1028/<senha>")


def pokemon_1028_senha(senha):
    if senha != SECRET_SENHA:
        return "Acesso negado", 403
    pokemon_data = get_pokemon_data('1028')
    if not pokemon_data:
        pokemon_data = get_pokemon_data('eron alpha')
    if not pokemon_data:
        return "Pokemon nao encontrado", 404
    return render_pokemon_secret(pokemon_data, senha='sigmaboy')

@pokemon_route.route("/1029/<senha>")


def pokemon_1029_senha(senha):
    if senha != SECRET_SENHA:
        return "Acesso negado", 403
    pokemon_data = get_pokemon_data('1029')
    if not pokemon_data:
        pokemon_data = get_pokemon_data('eron beta')
    if not pokemon_data:
        return "Pokemon nao encontrado", 404
    return render_pokemon_secret(pokemon_data, senha='sigmaboy')

@pokemon_route.route("/eron-jr/<senha>")


def pokemon_eronjr_senha(senha):
    if senha != SECRET_SENHA:
        return "Acesso negado", 403
    pokemon_data = get_pokemon_data('1027')
    if not pokemon_data:
        pokemon_data = get_pokemon_data('eron jr')
    if not pokemon_data:
        return "Pokemon nao encontrado", 404
    return render_pokemon_secret(pokemon_data, senha='sigmaboy')

@pokemon_route.route("/eron-alpha/<senha>")


def pokemon_eronalpha_senha(senha):
    if senha != SECRET_SENHA:
        return "Acesso negado", 403
    pokemon_data = get_pokemon_data('1028')
    if not pokemon_data:
        pokemon_data = get_pokemon_data('eron alpha')
    if not pokemon_data:
        return "Pokemon nao encontrado", 404
    return render_pokemon_secret(pokemon_data, senha='sigmaboy')

@pokemon_route.route("/eron-beta/<senha>")


def pokemon_eronbeta_senha(senha):
    if senha != SECRET_SENHA:
        return "Acesso negado", 403
    pokemon_data = get_pokemon_data('1029')
    if not pokemon_data:
        pokemon_data = get_pokemon_data('eron beta')
    if not pokemon_data:
        return "Pokemon nao encontrado", 404
    return render_pokemon_secret(pokemon_data, senha='sigmaboy')


def render_pokemon_secret(pokemon_data, senha=None):
    regioes_data = get_regioes()
    evolution_levels = build_evolution_levels(pokemon_data.get('evolution_chain'))
    return render_template(
        "pokemon.html",
        pokemonName=pokemon_data.get('name'),
        data=pokemon_data,
        regioes=regioes_data,
        current_region='',
        evolution_levels=evolution_levels,
        senha=senha,
        secret_ids={1026, 1027, 1028, 1029}
    )

SECRET_IDS = {1026, 1027, 1028, 1029}
SECRET_NAMES = {'eron', 'eron-jr', 'eron-alpha', 'eron-beta'}
SECRET_SENHA = 'sigmaboy'

@pokemon_route.route("/<pokemon_name>", methods=["GET"])


def pokemon(pokemon_name):
    nome = pokemon_name.lower().replace('-', ' ')
    if nome in SECRET_NAMES or (nome.isdigit() and int(nome) in SECRET_IDS):
        return "Pokemon nao encontrado", 404
    pokemon_data = get_pokemon_data(pokemon_name)
    if not pokemon_data:
        return "Pokémon não encontrado", 404
    regioes_data = get_regioes()
    evolution_levels = build_evolution_levels(pokemon_data.get('evolution_chain'))
    return render_template(
        "pokemon.html",
        pokemonName=pokemon_name,
        data=pokemon_data,
        regioes=regioes_data,
        current_region='',
        evolution_levels=evolution_levels,
        senha=None,
        secret_ids={1026, 1027, 1028, 1029}
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
    for pokemon in get_all_pokemon_data():
        pid = pokemon.get("id")
        if pid in SECRET_IDS:
            continue
        pokemon_list.append({
            "id": pid,
            "name": pokemon.get("name"),
            "types": pokemon.get("types", []),
            "sprite": pokemon.get("sprite")
        })
    return pokemon_list