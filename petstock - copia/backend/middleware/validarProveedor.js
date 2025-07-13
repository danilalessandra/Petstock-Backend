module.exports = function(req, res, next) {
    const { nombre, contacto, direccion } = req.body;
    if (!nombre || !contacto || !direccion) {
        return res.status(400).json({ error: 'Todos los campos de proveedor son obligatorios.' });
    }
    next();
};
