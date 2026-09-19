from pathlib import Path


def agrupar_sequencias(lista_ids):
    if not lista_ids:
        return []
    try:
        ids_ordenados = sorted(list(set(map(int, lista_ids))))
    except ValueError:
        ids_ordenados = sorted(list(set(lista_ids)))
        return ", ".join(ids_ordenados)
    intervalos = []
    inicio = ids_ordenados[0]
    fim = ids_ordenados[0]
    for i in range(1, len(ids_ordenados)):
        if ids_ordenados[i] == fim + 1:
            fim = ids_ordenados[i]
        else:
            if inicio == fim:
                intervalos.append(str(inicio))
            else:
                intervalos.append(f"{inicio}-{fim}")
            inicio = ids_ordenados[i]
            fim = ids_ordenados[i]
    if inicio == fim:
        intervalos.append(str(inicio))
    else:
        intervalos.append(f"{inicio}-{fim}")
    return ", ".join(intervalos)


def encontrar_faltantes():
    pasta = Path("static/sprites/pokemon")
    if not pasta.exists() or not pasta.is_dir():
        print(f"A pasta '{pasta}' não foi encontrada.")
        return
    pngs = {f.stem for f in pasta.glob("*.[pP][nN][gG]")}
    gifs = {f.stem for f in pasta.glob("*.[gG][iI][fF]")}
    faltam_gif = list(pngs - gifs)
    resultado_agrupado = agrupar_sequencias(faltam_gif)
    print(
        f"Total de Pokémon com PNG mas sem GIF: {len(faltam_gif)}"
    )
    print("\nIDs agrupados:")
    print(resultado_agrupado)


if __name__ == "__main__":
    encontrar_faltantes()
