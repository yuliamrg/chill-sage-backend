# Git Rules

Estas reglas aplican al trabajo diario en este repositorio.

## Flujo base

1. Actualiza tu rama local antes de empezar a cambiar codigo.
2. Trabaja en una rama corta y descriptiva para cada tarea.
3. Haz cambios pequenos y coherentes por commit.
4. Antes de abrir PR o fusionar, revisa el diff completo.

## Nombres de ramas

Usa prefijos simples:

- `feat/<descripcion-corta>`
- `fix/<descripcion-corta>`
- `docs/<descripcion-corta>`
- `refactor/<descripcion-corta>`

Ejemplos:

- `docs/backend-readme`
- `fix/profile-delete`

## Commits

Reglas:

- Un commit debe representar una sola intencion.
- El mensaje debe explicar que cambia, no solo que archivo se toco.
- Evita commits mezclados de codigo, formato y documentacion si no dependen entre si.

Formato sugerido:

```text
tipo: cambio breve en imperativo
```

Tipos recomendados:

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`

Ejemplos:

- `docs: add backend usage and review docs`
- `fix: repair request delete handler`

## Antes de commitear

- Verifica `git status`.
- Revisa `git diff --staged`.
- Confirma que no incluyes secretos, credenciales ni archivos locales.
- Si hiciste cambios funcionales, ejecuta las validaciones disponibles.

## Archivos sensibles

- No commitear `.env`.
- No commitear dumps de base de datos ni archivos temporales.
- Si se requiere una configuracion compartida, usar ejemplos como `.env.example`.

## Reglas de seguridad

- No usar `git push --force` sobre `main`.
- No reescribir historia compartida sin coordinacion previa.
- No mezclar cambios propios con cambios no entendidos de otra persona.

## Pull requests

- El titulo debe resumir el cambio principal.
- La descripcion debe incluir alcance, riesgo y forma de probar.
- Si hay limitaciones o deuda tecnica conocida, dejarlas explicitas.
