# Publicar a GitHub

## Pasos para publicar

1. **Configurar Git** (si no lo has hecho):
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

2. **Hacer commit inicial**:
```bash
git add .
git commit -m "Initial commit: Sistema de monitoreo de incendios forestales para Patagonia"
```

3. **Crear repositorio en GitHub**:
   - Ve a https://github.com/new
   - Nombre sugerido: `incendios-patagonia` o `monitoreo-incendios-patagonia`
   - Descripción: "Sistema de monitoreo en tiempo real de incendios forestales para Patagonia Argentina usando datos NASA FIRMS"
   - Elige público o privado
   - NO inicialices con README (ya tenemos uno)

4. **Conectar y publicar**:
```bash
git remote add origin https://github.com/TU-USUARIO/incendios-patagonia.git
git branch -M main
git push -u origin main
```

## Nombre sugerido del repositorio

- `incendios-patagonia` (recomendado)
- `monitoreo-incendios-patagonia`
- `firewatch-patagonia`
- `sistema-incendios-patagonia`
