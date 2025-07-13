module.exports = function(req, res, next) {
    const { fecha, usuario_id } = req.body;
    if (!fecha || !usuario_id) {
        return res.status(400).json({ error: 'Fecha y usuario_id son obligatorios.' });
    }
    next();
};
