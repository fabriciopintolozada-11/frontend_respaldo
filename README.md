# Taller Front

Frontend del Taller Mecánico Los Fratelli. La primera funcionalidad implementada
es HU-01, registro del ingreso de un vehículo y creación de su Orden de Trabajo.

## Desarrollo

1. Ejecutar `npm install`.
2. Ejecutar `npm run dev`.

El comando inicia Vite y JSON Server en paralelo. La HU-01 consume únicamente
el mock disponible en `http://localhost:3001`, con los datos de `mock/db.json`
y las rutas definidas en `mock/routes.json`. `VITE_MOCK_API_URL` permite cambiar
la ubicación del mock si el puerto predeterminado no está disponible.

## Verificación

- `npm run lint`
- `npm test`
- `npm run build`
