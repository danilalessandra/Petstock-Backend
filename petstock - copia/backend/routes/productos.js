const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const validarProducto = require('../middleware/validarProducto');

// Solo administradores pueden gestionar productos
router.get('/', auth, roles(['administrador', 'empleado']), productoController.getAll);
router.get('/:id', auth, roles(['administrador', 'empleado']), productoController.getById);
router.post('/', auth, roles(['administrador']), validarProducto, productoController.create);
router.put('/:id', auth, roles(['administrador']), validarProducto, productoController.update);
router.delete('/:id', auth, roles(['administrador']), productoController.delete);

module.exports = router;
