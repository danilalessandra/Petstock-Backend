module.exports = function validarMovimientoInventario(req, res, next) {
  const { producto_id, tipo, cantidad } = req.body;

  if (!producto_id || !tipo || !cantidad) {
    return res.status(400).json({ error: 'producto_id, tipo y cantidad son obligatorios.' });
  }

  // Validar tipo
  const tiposValidos = ['entrada', 'salida'];
  if (!tiposValidos.includes(tipo)) {
    return res.status(400).json({ error: `Tipo inválido. Debe ser uno de: ${tiposValidos.join(', ')}` });
  }

  // Validar cantidad positiva
  if (typeof cantidad !== 'number' || cantidad <= 0) {
    return res.status(400).json({ error: 'Cantidad debe ser un número positivo.' });
  }

  next();
};
