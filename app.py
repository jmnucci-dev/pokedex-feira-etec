from flask import Flask
from routes.home import home_route
from routes.pokemon import pokemon_route
from routes.regioes import regioes_route
from routes.pokemon_region import pokemon_region_route

app = Flask(__name__)
app.register_blueprint(home_route)
app.register_blueprint(pokemon_route, url_prefix='/pokemon')
app.register_blueprint(regioes_route)
app.register_blueprint(pokemon_region_route)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=67, debug=True)
