// backend/routes/ventas.js
const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController'); // ¡IMPORTA EL CONTROLADOR CORRECTO!
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const validarVenta = require('../middleware/validarVenta');

// Rutas para Ventas
// Registrar Venta (solo administradores y empleados)
router.post('/', auth, roles(['administrador', 'empleado']), ventaController.create); // Puedes añadir validarVenta aquí

// Consultar Historial de Ventas (ambos roles)
router.get('/', auth, roles(['administrador', 'empleado']), ventaController.getAll);
router.get('/:id', auth, roles(['administrador', 'empleado']), ventaController.getById);

// Si necesitas actualizar o eliminar ventas, añade las rutas
router.put('/:id', auth, roles(['administrador', 'empleado']), ventaController.update);
router.delete('/:id', auth, roles(['administrador', 'empleado']), ventaController.delete);

module.exports = router;
