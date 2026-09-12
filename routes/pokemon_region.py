from flask import Blueprint, render_template, request, url_for
import json
import os
pokemon_region_route = Blueprint('pokemon_region', __name__)
_regioes_cache = None
def get_regioes():
    global _regioes_cache
    if _regioes_cache is None:
        with open('data/regioes.json', 'r', encoding='utf-8') as f:
            _regioes_cache = json.load(f)
    return _regioes_cache
def get_pokemon_by_id(pokemon_id):
    path = f'data/pokemon/{pokemon_id}.json'
    if not os.path.exists(path):
        return None
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)
def parse_range(range_str):
    parts = range_str.split('-')
    start = int(parts[0])
    end = int(parts[1])
    return start, end
def get_sprite_path(pokemon_id):
    gif_path = f'static/sprites/pokemon/{pokemon_id}.gif'
    png_path = f'static/sprites/pokemon/{pokemon_id}.png'
    if os.path.exists(gif_path):
        return f'sprites/pokemon/{pokemon_id}.gif'
    if os.path.exists(png_path):
        return f'sprites/pokemon/{pokemon_id}.png'
    return f'sprites/pokemon/{pokemon_id}.png'
@pokemon_region_route.route('/pokemons')
@pokemon_region_route.route('/region/<nome>')
def region_pokemons(nome='Todas'):
    if nome.lower() in ('todas', 'todos', 'all') or nome == 'Não sei a região':
        nome = 'Não sei a região'
    regioes = get_regioes()
    regiao = None
    for r in regioes:
        if r['nome'].lower() == nome.lower():
            regiao = r
            break
    filter_type = request.args.get('type', '').lower()
    page = request.args.get('page', 1, type=int)
    if page < 1:
        page = 1
    per_page = 12
    if regiao:
        start, end = parse_range(regiao['range'])
        pokemon_ids = list(range(start, end + 1))
        region_name = regiao['nome']
        region_range = regiao['range']
        region_desc = regiao['descricao']
        region_thumb = regiao.get('logo', '')
        region_destaque = regiao.get('destaque', '')
        region_bg = regiao.get('bg', '')
        region_cor = regiao.get('cor', '#e3352e')
    else:
        if nome.lower() in ('todas', 'todos', 'all', 'não sei a região', 'nao sei a regiao'):
            pokemon_ids = [int(f.replace('.json','')) for f in os.listdir('data/pokemon') if f.endswith('.json')]
            pokemon_ids.sort()
            region_name = 'Não sei a região'
            region_range = 'Todos pokemons'
            region_desc = 'Explore todos os Pokémons de todas as regiões.'
            region_thumb = ''
            region_destaque = ''
            region_bg = ''
            region_cor = '#e3352e'
        else:
            region_name = nome
            region_range = ''
            region_desc = 'Região não encontrada.'
            region_thumb = ''
            region_bg = ''
            region_cor = '#e3352e'
            pokemon_ids = []
    pokemon_list = []
    for pid in pokemon_ids:
        data = get_pokemon_by_id(pid)
        if data:
            if filter_type:
                types = [t.lower() for t in data.get('types', [])]
                if filter_type not in types:
                    continue
            pokemon_list.append({
                'id': data.get('id'),
                'name': data.get('name', '').capitalize(),
                'types': data.get('types', []),
                'sprite_file': get_sprite_path(data.get('id')),
                'sprite_url': url_for('static', filename=get_sprite_path(data.get('id')))
            })
    total = len(pokemon_list)
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated = pokemon_list[start_idx:end_idx]
    total_pages = (total + per_page - 1) // per_page if total > 0 else 1
    return render_template('pokemons.html',
        regioes=regioes,
        region_name=region_name,
        region_range=region_range,
        region_desc=region_desc,
        region_thumb=region_thumb,
        region_destaque=region_destaque,
        region_bg=region_bg,
        region_cor=region_cor,
        pokemon_list=paginated,
        filter_type=filter_type,
        current_region=nome,
        page=page,
        total_pages=total_pages,
        total=total,
        header_title='Pokémon')
