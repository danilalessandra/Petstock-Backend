const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');

// Ruta para obtener las sugerencias de reabastecimiento
router.get('/sugerencias-reabastecimiento', inventarioController.getSugerenciasReabastecimiento);

// Ruta para crear una orden de compra a partir de las sugerencias
router.post('/ordenes-compra/generar-desde-sugerencias', inventarioController.crearOrdenCompraDesdeSugerencias);

module.exports = router;