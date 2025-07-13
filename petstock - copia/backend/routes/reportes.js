const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');

// Solo administradores pueden generar reportes
router.get('/ventas', auth, roles(['administrador']), reportesController.reporteVentas);
router.get('/inventario', auth, roles(['administrador']), reportesController.reporteInventario);

// NUEVAS RUTAS A AGREGAR:
router.get('/ventas-mensuales', auth, roles(['administrador']), reportesController.reporteVentasMensuales); // Ruta para ventas mensuales
router.get('/proveedores', auth, roles(['administrador']), reportesController.reporteProveedores);     // Ruta para reportes de proveedores
router.get('/ordenes', auth, roles(['administrador']), reportesController.reporteOrdenes);         // Ruta para reportes de órdenes

module.exports = router;
