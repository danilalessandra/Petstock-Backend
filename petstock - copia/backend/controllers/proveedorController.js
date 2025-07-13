// controllers/proveedorController.js
const { Proveedor } = require('../models'); // Importar desde el índice que exporta todos los modelos

/**
 * Listar todos los proveedores.
 */
exports.getAll = async (req, res) => {
    try {
        const proveedores = await Proveedor.findAll();
        res.json(proveedores);
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        res.status(500).json({ error: 'Error al obtener los proveedores.' });
    }
};

/**
 * Obtener un proveedor por ID.
 */
exports.getById = async (req, res) => {
    try {
        const proveedor = await Proveedor.findByPk(req.params.id);
        if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado.' });
        res.json(proveedor);
    } catch (error) {
        console.error('Error al obtener proveedor por ID:', error);
        res.status(500).json({ error: 'Error al obtener el proveedor.' });
    }
};

/**
 * Crear un proveedor nuevo.
 */
exports.create = async (req, res) => {
    try {
        const nuevoProveedor = await Proveedor.create(req.body);
        res.status(201).json(nuevoProveedor);
    } catch (error) {
        console.error('Error al crear proveedor:', error);
        res.status(400).json({ error: 'Error al crear el proveedor.' });
    }
};

/**
 * Actualizar un proveedor existente.
 */
exports.update = async (req, res) => {
    try {
        const proveedor = await Proveedor.findByPk(req.params.id);
        if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado.' });

        await proveedor.update(req.body);
        res.json(proveedor);
    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        res.status(400).json({ error: 'Error al actualizar el proveedor.' });
    }
};

/**
 * Eliminar un proveedor.
 */
exports.delete = async (req, res) => {
    try {
        const proveedor = await Proveedor.findByPk(req.params.id);
        if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado.' });

        await proveedor.destroy();
        res.json({ message: 'Proveedor eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        res.status(500).json({ error: 'Error al eliminar el proveedor.' });
    }
};