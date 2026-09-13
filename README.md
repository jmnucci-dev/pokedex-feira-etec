# Pokédex | Feira ETEC

> **Projeto colaborativo** desenvolvido por 4 pessoas para a **Feira Tecnológica da ETEC** na disciplina de *Programação Web*.

---

## Sobre

Esta é uma **Pokédex interativa** que consome a [PokeAPI](https://pokeapi.co/) e exibe informações de Pokémon por região, tipo e evolução.

- **Front-end:** elaborado e modificado pelo grupo, cada um contribuiu com ideias, layout e ajustes visuais. O design foi feito por mim.
- **Back-end:** implementado por mim, aproveitando experiência previa com servidores e APIs. Foi o desafio perfeito para unir interface e lógica de dados.

---

## Técnicas

| Camada | Stack |
|--------|-------|
| **Back-end** | Python • Flask • Jinja2 |
| **Front-end** | HTML5 • CSS3 • Bulma / custom |
| **Dados** | PokeAPI + cache local (`data/pokemon`) |
| **Deploy** | Local / Flask dev server |

---

## Como rodar

```bash
# 1. Clonar
 git clone https://github.com/SEU_USUARIO/pokedex-feira-etec.git
 cd pokedex-feira-etec

# 2. Ambiente virtual (recomendado)
 python -m venv .venv
 source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 3. Dependências
 pip install -r requirements.txt

# 4. Rodar
 python app.py
```

Abra http://localhost:5000 🚀

---

## Quem fez

| Nome | Função no projeto |
|------|-------------------|
| **Eu** | Back-end (Flask, rotas, consumo da API) / Front / UI |
| **Bernardo** | Front / UI |
| **Eron** | Front / UI |
| **Ana Volpe** | Front / UI |

> *Projeto acadêmico, Feira Tecnológica ETEC.*

---

## Estrutura

```
├── app.py                  # Entry point / Flask app
├── routes/                 # Blueprints (home, pokemon, regioes)
├── services/               # PokeAPI wrapper + cache
├── scripts/                # Utilitários (contar, cache_fast)
├── static/                 # CSS / imagens / sprites
├── templates/              # Jinja2 (base, pokemon, regioes)
└── data/                   # JSONs em cache
```

---

## Contexto

- **Disciplina:** Programação Web
- **Evento:** Feira Tecnológica da ETEC
- **Grupo:** 4 pessoas (co-criação front + back por quem tinha experiência)

---

*Feito com carinho.*
