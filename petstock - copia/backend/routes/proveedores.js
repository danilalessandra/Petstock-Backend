// backend/routes/proveedores.js
const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController'); // ¡IMPORTA EL CONTROLADOR CORRECTO!
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
// Elimina la importación de validarOrdenCompra si no la usas en estas rutas de proveedores
// const validarOrdenCompra = require('../middleware/validarOrdenCompra'); 
// También puedes crear un validarProveedor.js si necesitas validaciones específicas para proveedores.

// Rutas para Proveedores (ejemplos)
// Crear proveedor (solo administradores)
router.post('/', auth, roles(['administrador']), proveedorController.create); // Puedes añadir un validarProveedor aquí

// Consultar todos los proveedores (administradores y empleados)
router.get('/', auth, roles(['administrador', 'empleado']), proveedorController.getAll);

// Consultar un proveedor por ID (administradores y empleados)
router.get('/:id', auth, roles(['administrador', 'empleado']), proveedorController.getById);

// Actualizar un proveedor (solo administradores)
router.put('/:id', auth, roles(['administrador']), proveedorController.update); // Puedes añadir un validarProveedor aquí

// Eliminar un proveedor (solo administradores)
router.delete('/:id', auth, roles(['administrador']), proveedorController.delete);

module.exports = router;
