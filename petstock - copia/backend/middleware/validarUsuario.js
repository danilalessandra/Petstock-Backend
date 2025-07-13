module.exports = function(req, res, next) {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password || !rol) {
        return res.status(400).json({ error: 'Todos los campos de usuario son obligatorios.' });
    }
    next();
};
