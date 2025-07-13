// backend/routes/auth.js
console.log('Cargando rutas de autenticación'); 

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Endpoint para login
router.post('/login', authController.login); 

// Endpoint para registro de usuario
router.post('/register', authController.register);

// NUEVA RUTA: Endpoint para refrescar el token de acceso
router.post('/refresh-token', authController.refreshToken); // <-- ¡Añade esta línea!

router.get('/prueba', (req, res) => {
    console.log('¡Se accedió a la ruta /api/auth/prueba!'); 
    res.json({ mensaje: 'Ruta de prueba OK (simplificada)' }); 
});

module.exports = router;