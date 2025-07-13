// routes/ordenesCompraRoutes.js
const express = require('express');
const router = express.Router();
const ordenCompraController = require('../controllers/ordenCompraController');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const validarOrdenCompra = require('../middleware/validarOrdenCompra'); // Si lo necesitas para la creación manual

// Ruta para generar una orden de compra a partir de sugerencias seleccionadas
// Esta es la ruta clave para tu botón de "generar orden de compra de seleccionados"
router.post('/generar-desde-sugerencias', auth, roles(['administrador','empleado']), ordenCompraController.generarOrdenCompraDesdeSugerencias);

// Ruta para crear una orden de compra (probablemente para creación manual/formulario)
// Puedes mantenerla si la usas en otra parte, o si tu frontend la llama con la estructura específica.
router.post('/', auth, roles(['administrador', 'empleado']), validarOrdenCompra, ordenCompraController.create);

// Rutas para obtener todas las órdenes de compra
router.get('/', auth, roles(['administrador', 'empleado']), ordenCompraController.getAll);

// Ruta para obtener una orden de compra por ID
router.get('/:id', auth, roles(['administrador', 'empleado']), ordenCompraController.getById);

// Ruta para actualizar una orden de compra existente
router.put('/:id', auth, roles(['administrador', 'empleado']), validarOrdenCompra, ordenCompraController.update);

// Ruta para confirmar la recepción de productos de una orden de compra
router.post('/:id/confirmar-recepcion', auth, roles(['administrador', 'empleado']), ordenCompraController.confirmarRecepcion);

// Ruta para eliminar una orden de compra por ID
router.delete('/:id', auth, roles(['administrador', 'empleado']), ordenCompraController.delete);

module.exports = router;