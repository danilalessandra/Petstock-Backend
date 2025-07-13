module.exports = function(req, res, next) {
    const { proveedor_id, fecha, estado } = req.body;
    if (!proveedor_id || !fecha || !estado) {
        return res.status(400).json({ error: 'Todos los campos de orden de compra son obligatorios.' });
    }
    next();
};
