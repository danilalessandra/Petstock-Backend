module.exports = function(req, res, next) {
    const { venta_id, producto_id, cantidad, precio_unitario } = req.body;
    if (!venta_id || !producto_id || !cantidad || !precio_unitario) {
        return res.status(400).json({ error: 'Todos los campos de detalle de venta son obligatorios.' });
    }
    next();
};
