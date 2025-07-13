// controllers/detalleVentaController.js

const { DetalleVenta, Producto, Venta } = require('../models'); // ✅ Importación centralizada

/**
 * Listar todos los detalles de venta.
 */
exports.getAll = async (req, res) => {
    try {
        const detalles = await DetalleVenta.findAll({
            include: [
                { model: Producto, as: 'producto' },
                { model: Venta }
            ]
        });
        res.json(detalles);
    } catch (error) {
        console.error('Error al obtener detalles de venta:', error);
        res.status(500).json({ error: 'Error al obtener los detalles de venta.' });
    }
};

/**
 * Obtener un detalle de venta por ID.
 */
exports.getById = async (req, res) => {
    try {
        const detalle = await DetalleVenta.findByPk(req.params.id, {
            include: [
                { model: Producto, as: 'producto' },
                { model: Venta }
            ]
        });
        if (!detalle) return res.status(404).json({ error: 'Detalle de venta no encontrado.' });
        res.json(detalle);
    } catch (error) {
        console.error('Error al obtener detalle de venta por ID:', error);
        res.status(500).json({ error: 'Error al obtener el detalle de venta.' });
    }
};

/**
 * Crear un detalle de venta nuevo.
 */
exports.create = async (req, res) => {
    try {
        const nuevo = await DetalleVenta.create(req.body);
        res.status(201).json(nuevo);
    } catch (error) {
        console.error('Error al crear detalle de venta:', error);
        res.status(400).json({ error: 'Error al crear el detalle de venta.' });
    }
};

/**
 * Actualizar un detalle de venta existente.
 */
exports.update = async (req, res) => {
    try {
        const detalle = await DetalleVenta.findByPk(req.params.id);
        if (!detalle) return res.status(404).json({ error: 'Detalle de venta no encontrado.' });
        await detalle.update(req.body);
        res.json(detalle);
    } catch (error) {
        console.error('Error al actualizar detalle de venta:', error);
        res.status(400).json({ error: 'Error al actualizar el detalle de venta.' });
    }
};

/**
 * Eliminar un detalle de venta.
 */
exports.delete = async (req, res) => {
    try {
        const detalle = await DetalleVenta.findByPk(req.params.id);
        if (!detalle) return res.status(404).json({ error: 'Detalle de venta no encontrado.' });
        await detalle.destroy();
        res.json({ message: 'Detalle de venta eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar detalle de venta:', error);
        res.status(500).json({ error: 'Error al eliminar el detalle de venta.' });
    }
};