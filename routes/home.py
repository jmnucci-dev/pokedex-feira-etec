from flask import Blueprint, render_template, redirect, url_for

home_route = Blueprint('home', __name__)


@home_route.route("/")
def home():
    return redirect(url_for('regioes.regioes'))
