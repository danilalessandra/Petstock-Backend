// controllers/productoController.js
const { Producto, Proveedor } = require('../models'); // Asegúrate de importar Proveedor aquí

/**
 * Obtiene la lista de todos los productos.
 */
exports.getAll = async (req, res) => {
    try {
        const productos = await Producto.findAll({
            // Incluir el modelo Proveedor para traer sus datos
            include: [{
                model: Proveedor,
                as: 'Proveedor', // Este alias debe coincidir con el alias definido en tu modelo Producto.js
                                 // En tu index.js, Producto.belongsTo(Proveedor, { foreignKey: 'proveedor_id' }); NO tiene 'as'.
                                 // Por defecto, Sequelize usa el nombre del modelo singular, que es 'Proveedor'.
                                 // Si tuvieras `Producto.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'miProveedor' });`
                                 // entonces aquí usarías `as: 'miProveedor'`.
                                 // Basado en tu `index.js`, el alias por defecto es 'Proveedor'.
                attributes: ['nombre'] // Solo traer el nombre del proveedor
            }]
        });
        res.json(productos);
    } catch (error) {
        console.error('Error al obtener productos en getAll:', error);
        res.status(500).json({ error: 'Error al obtener productos.' });
    }
};

/**
 * Obtiene un producto por su ID.
 */
exports.getById = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id, {
            // También incluir el proveedor al obtener un producto por ID
            include: [{
                model: Proveedor,
                as: 'Proveedor', // Usar el mismo alias
                attributes: ['nombre']
            }]
        });
        if (!producto) {
            console.log('Producto no encontrado en getById con ID:', req.params.id);
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }
        res.json(producto);
    } catch (error) {
        console.error('Error al obtener el producto en getById:', error);
        res.status(500).json({ error: 'Error al obtener el producto.' });
    }
};

/**
 * Crea un nuevo producto.
 */
exports.create = async (req, res) => {
    console.log('ProductoController CREATE: Iniciado.');
    console.log('ProductoController CREATE: req.body recibido:', req.body);

    try {
        const nuevoProducto = await Producto.create(req.body);
        console.log('ProductoController CREATE: Producto creado con ID:', nuevoProducto.id);
        res.status(201).json(nuevoProducto);
    } catch (error) {
        console.error('ProductoController CREATE: Error al crear producto:', error);
        if (error.errors) {
            error.errors.forEach(err => console.error('   Error de validación:', err.message, 'Campo:', err.path));
        } else if (error.original?.detail) {
            console.error('   Detalle del error de DB:', error.original.detail);
        }

        res.status(400).json({
            error: 'Error al crear el producto.',
            details: error.message || error.original?.detail || 'Error desconocido al crear producto.'
        });
    }
};

/**
 * Actualiza un producto por su ID.
 */
exports.update = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) {
            console.log('Producto no encontrado en update con ID:', req.params.id);
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }

        await producto.update(req.body);
        res.json(producto);
    } catch (error) {
        console.error('Error al actualizar el producto en update:', error);
        res.status(400).json({ error: 'Error al actualizar el producto.' });
    }
};

/**
 * Elimina un producto por su ID.
 */
exports.delete = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) {
            console.log('Producto no encontrado en delete con ID:', req.params.id);
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }

        await producto.destroy();
        res.json({ message: 'Producto eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar el producto en delete:', error);
        res.status(500).json({ error: 'Error al eliminar el producto.' });
    }
};