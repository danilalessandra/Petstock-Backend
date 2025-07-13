    // backend/routes/movimientosInventario.js
    const express = require('express');
    const router = express.Router();
    // Aquí, la variable que importas debe coincidir con el nombre de tu archivo controlador.
    // Si tu controlador es 'movimientoInventarioController.js', usa 'movimientoInventarioController'.
    // Si tu controlador es 'movimientosInventarioController.js', usa 'movimientosInventarioController'.
    // Asumiendo que tu controlador es 'movimientoInventarioController.js' (singular):
    const movimientoInventarioController = require('../controllers/movimientoInventarioController');
    const auth = require('../middleware/auth');
    const roles = require('../middleware/roles');
    const validarMovimientoInventario = require('../middleware/validarMovimientoInventario'); // Importa el middleware de validación

    // Rutas para Movimientos de Inventario

    router.post('/', auth, roles(['administrador', 'empleado']), validarMovimientoInventario, movimientoInventarioController.create);
    router.get('/', auth, roles(['administrador', 'empleado']), movimientoInventarioController.getAll);
    router.get('/:id', auth, roles(['administrador', 'empleado']), movimientoInventarioController.getById);
    router.put('/:id', auth, roles(['administrador', 'empleado']), validarMovimientoInventario, movimientoInventarioController.update);
    router.delete('/:id', auth, roles(['administrador', 'empleado']), movimientoInventarioController.delete);

    module.exports = router;
    