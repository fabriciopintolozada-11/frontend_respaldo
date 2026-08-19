# Taller Front

Frontend del Taller Mecánico Los Fratelli. La primera funcionalidad implementada
es HU-01, registro del ingreso de un vehículo y creación de su Orden de Trabajo.

## Desarrollo

1. Copiar las variables de `.env.example` a `.env` y configurar el UUID del recepcionista.
2. Iniciar el backend en `http://localhost:3000`.
3. Ejecutar `npm install`.
4. Ejecutar `npm run dev`.

Vite redirige `/api` al backend durante el desarrollo porque el backend actual
no habilita CORS. El frontend usa los headers exigidos por el guard real:
`x-user-id` y `x-user-role: RECEPTIONIST`.

## Verificación

- `npm run lint`
- `npm test`
- `npm run build`
