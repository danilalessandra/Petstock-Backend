const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticación.
 * Verifica que el usuario tenga un token JWT válido en el header Authorization.
 * Si es válido, agrega los datos del usuario a req.user.
 * Si no, responde con error 401.
 */
module.exports = function(req, res, next) {
    // El token se espera en el header Authorization como: Bearer <token>
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. No hay token.' });
    }

    try {
        // Verifica el token y agrega los datos decodificados al request
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};
