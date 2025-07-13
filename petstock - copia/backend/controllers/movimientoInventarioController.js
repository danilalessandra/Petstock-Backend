const { MovimientoInventario, Producto, Usuario } = require('../models');

/**
 * Listar todos los movimientos de inventario con sus productos y usuarios asociados.
 * Solo retorna movimientos que tengan producto y usuario válidos (INNER JOIN).
 */
exports.getAll = async (req, res) => {
  try {
    const movimientos = await MovimientoInventario.findAll({
      include: [
        { model: Producto, as: 'producto', required: true },
        { model: Usuario, as: 'usuario', required: true }
      ]
    });
    // Log para inspeccionar datos antes de enviar
    console.log('Movimientos obtenidos:', movimientos.map(mov => mov.toJSON()));
    res.json(movimientos);
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ error: 'Error al obtener los movimientos de inventario.' });
  }
};

/**
 * Obtener un movimiento de inventario por ID con su producto y usuario asociados.
 */
exports.getById = async (req, res) => {
  try {
    const movimiento = await MovimientoInventario.findByPk(req.params.id, {
      include: [
        { model: Producto, as: 'producto' },
        { model: Usuario, as: 'usuario' }
      ]
    });
    if (!movimiento) {
      return res.status(404).json({ error: 'Movimiento de inventario no encontrado.' });
    }
    res.json(movimiento);
  } catch (error) {
    console.error('Error al obtener movimiento por ID:', error);
    res.status(500).json({ error: 'Error al obtener el movimiento de inventario.' });
  }
};

/**
 * Crear un nuevo movimiento de inventario.
 */
exports.create = async (req, res) => {
  try {
    const nuevo = await MovimientoInventario.create(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    console.error('Error al crear movimiento:', error);
    res.status(400).json({ error: 'Error al crear el movimiento de inventario.' });
  }
};

/**
 * Actualizar un movimiento de inventario existente.
 */
exports.update = async (req, res) => {
  try {
    const movimiento = await MovimientoInventario.findByPk(req.params.id);
    if (!movimiento) {
      return res.status(404).json({ error: 'Movimiento de inventario no encontrado.' });
    }
    await movimiento.update(req.body);
    res.json(movimiento);
  } catch (error) {
    console.error('Error al actualizar movimiento:', error);
    res.status(400).json({ error: 'Error al actualizar el movimiento de inventario.' });
  }
};

/**
 * Eliminar un movimiento de inventario.
 */
exports.delete = async (req, res) => {
  try {
    const movimiento = await MovimientoInventario.findByPk(req.params.id);
    if (!movimiento) {
      return res.status(404).json({ error: 'Movimiento de inventario no encontrado.' });
    }
    await movimiento.destroy();
    res.json({ message: 'Movimiento de inventario eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar movimiento:', error);
    res.status(500).json({ error: 'Error al eliminar el movimiento de inventario.' });
  }
};
