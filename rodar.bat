@echo off
setlocal

if not exist ".venv\Scripts\python.exe" (
    echo.
    echo [1/3] Criando ambiente virtual...
    python -m venv .venv

    if errorlevel 1 (
        echo ERRO: Nao foi possivel criar a venv.
        pause
        exit /b 1
    )
) else (
    echo [1/3] Ambiente virtual ja existe. Pulando...
)

call ".venv\Scripts\activate.bat"

if not exist "requirements.txt" (
    echo ERRO: requirements.txt nao encontrado.
    pause
    exit /b 1
)

echo.
echo [2/3] Verificando dependencias...
python -m pip install -r requirements.txt

if errorlevel 1 (
    echo ERRO: Falha ao instalar/verificar dependencias.
    pause
    exit /b 1
)

echo.
echo [3/3] Abrindo http://localhost:8080...

start "" "http://localhost:8080"

echo.
echo Iniciando app.py...
python app.py

pause
