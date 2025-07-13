const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const autenticar = require('../middleware/auth');
const permitirRoles = require('../middleware/roles');

// Proteger todas las rutas para que solo 'administrador' pueda acceder
router.use(autenticar); // Aplica autenticación a todas
router.use(permitirRoles(['administrador'])); // Aplica verificación de rol a todas

router.get('/', usuarioController.getAll);
router.get('/:id', usuarioController.getById);
router.post('/', usuarioController.create);
router.put('/:id', usuarioController.update);
router.delete('/:id', usuarioController.delete);

module.exports = router;
