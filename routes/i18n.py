TRANSLATIONS = {
    'pt': {
        'region_title': 'Região',
        'all': 'Todos',
        'filter_by_type': 'Filtrar por tipo',
        'go_to_page': 'Ir para página',
        'prev': '‹',
        'next': '›',
        'choose_region': 'Escolha uma região para explorar',
        'region_description': 'Cada região possui Pokémons únicos e histórias incríveis',
        'no_region': 'Não sei a região',
        'all_pokemon': 'Todos pokemons',
        'description': 'Descrição da região vai aqui.',
    },
    'en': {
        'region_title': 'Region',
        'all': 'All',
        'filter_by_type': 'Filter by type',
        'go_to_page': 'Go to page',
        'prev': '‹',
        'next': '›',
        'choose_region': 'Choose a region to explore',
        'region_description': 'Each region has unique Pokémon and incredible stories',
        'no_region': "Don't know the region",
        'all_pokemon': 'All pokemons',
        'description': 'Region description goes here.',
    }
}


def t(key, lang='pt'):
    return TRANSLATIONS.get(lang, TRANSLATIONS['pt']).get(key, key)
