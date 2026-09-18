const barraPesquisa = document.querySelector(".search");
const pokemons = []

document.addEventListener('DOMContentLoaded', () => {
    buscarDadosDaAPI();
});

async function buscarDadosDaAPI() {
    try {
        const response = await fetch('pokemon/api');
        todosOsDados = await response.json();
        
        exibirResultados(todosOsDados);
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
    }
}

const exibirResultados = (resultados) => {
    console.log(resultados);
};