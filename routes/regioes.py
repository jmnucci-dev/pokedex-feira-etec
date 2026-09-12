from flask import Blueprint, render_template
import json
regioes_route = Blueprint('regioes', __name__)
@regioes_route.route('/regioes')
def regioes():
    with open('data/regioes.json', 'r', encoding='utf-8') as f:
        regioes = json.load(f)
    return render_template('regioes.html', regioes=regioes, header_title='Regiões')
