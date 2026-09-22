const barraPesquisa = document.querySelector(".search");
const inputPesquisa = document.querySelector(".search input");
const resultados = document.getElementById("search-results");
const template = document.getElementById("pokemon-search-template");
let todosOsDados = [];

document.addEventListener('DOMContentLoaded', () => {
    buscarDadosDaAPI();
    if (inputPesquisa) {
        inputPesquisa.addEventListener('input', filtrarResultados);
        inputPesquisa.addEventListener('focus', () => {
            if (inputPesquisa.value.trim().length > 0) {
                resultados.classList.add('active');
            }
        });
        document.addEventListener('click', (e) => {
            if (!barraPesquisa.contains(e.target)) {
                resultados.classList.remove('active');
            }
        });
    }
});

async function buscarDadosDaAPI() {
    try {
        const response = await fetch('/pokemon/api');
        todosOsDados = await response.json();
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        todosOsDados = [];
    }
}


function filtrarResultados() {
    const texto = inputPesquisa.value.trim().toLowerCase();
    resultados.innerHTML = '';

    if (texto.length === 0) {
        resultados.classList.remove('active');
        return;
    }

    const filtrados = todosOsDados.filter(p => {
        const nome = (p.name || '').toLowerCase();
        const idStr = String(p.id || '');
        return nome.includes(texto) || idStr.includes(texto);
    });

    if (filtrados.length === 0) {
        resultados.innerHTML = '<div class="search-no-results">Nenhum Pokémon encontrado.</div>';
        resultados.classList.add('active');
        return;
    }

    filtrados.forEach(p => {
        const clone = template.content.cloneNode(true);
        const link = clone.querySelector('.search-pokemon-card');
        const img = clone.querySelector('.search-pokemon-image');
        const nome = clone.querySelector('.search-pokemon-name');
        const idSpan = clone.querySelector('.search-pokemon-id');
        const tiposDiv = clone.querySelector('.search-pokemon-types');

        link.href = `/pokemon/${p.name}`;
        img.src = p.sprite || '';
        img.alt = p.name || '';
        nome.textContent = p.name ? p.name.charAt(0).toUpperCase() + p.name.slice(1) : '';
        idSpan.textContent = '#' + String(p.id || '').padStart(3, '0');

        tiposDiv.innerHTML = '';
        (p.types || []).forEach(t => {
            const span = document.createElement('span');
            span.className = 'search-type t-' + (t ? t.toLowerCase() : '');
            span.textContent = t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
            tiposDiv.appendChild(span);
        });

        resultados.appendChild(clone);
    });

    resultados.classList.add('active');
}
