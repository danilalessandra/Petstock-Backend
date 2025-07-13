const express = require('express');
const router = express.Router();
const detalleVentaController = require('../controllers/detalleVentaController');

router.get('/', detalleVentaController.getAll);
router.get('/:id', detalleVentaController.getById);
router.post('/', detalleVentaController.create);
router.put('/:id', detalleVentaController.update);
router.delete('/:id', detalleVentaController.delete);

module.exports = router;
