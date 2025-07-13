// backend/controllers/ventaController.js
const { Venta, DetalleVenta, Producto, Usuario, sequelize } = require('../models');
const { enviarAlertaStock, enviarAlertaVencimiento } = require('../utils/notificaciones'); // Asegúrate de importar ambas si vas a usar la de vencimiento también

/**
 * Registra una nueva venta con sus detalles de productos.
 */
exports.create = async (req, res) => {
    console.log('VentaController CREATE: Iniciado.');
    console.log('VentaController CREATE: req.body recibido:', req.body);

    const { usuario_id, detalles } = req.body;
    const fechaActualDelServidor = new Date();

    if (!usuario_id || !Array.isArray(detalles) || detalles.length === 0) {
        return res.status(400).json({ error: 'Faltan datos necesarios para registrar la venta.' });
    }

    const transaction = await sequelize.transaction();

    try {
        let totalVenta = 0;
        for (const detalle of detalles) {
            if (
                !detalle.producto_id ||
                typeof detalle.cantidad !== 'number' || detalle.cantidad <= 0 ||
                typeof detalle.precio_unitario !== 'number' || detalle.precio_unitario < 0
            ) {
                throw new Error('Detalles inválidos en la venta.');
            }
            totalVenta += detalle.cantidad * detalle.precio_unitario;
        }

        const nuevaVenta = await Venta.create({
            fecha: fechaActualDelServidor,
            usuario_id,
            total: totalVenta
        }, { transaction });
        console.log('Venta creada en DB con ID:', nuevaVenta.id);

        // Obtener la instancia de socket.io del Express app
        const io = req.app.get('socketio'); // <-- ¡CLAVE! Obtiene 'io' aquí

        for (const detalle of detalles) {
            const { producto_id, cantidad, precio_unitario } = detalle;

            const producto = await Producto.findByPk(producto_id, { transaction });
            if (!producto) {
                throw new Error(`Producto con ID ${producto_id} no encontrado.`);
            }
            if (producto.stock < cantidad) {
                throw new Error(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}, solicitado: ${cantidad}.`);
            }

            await DetalleVenta.create({
                venta_id: nuevaVenta.id,
                producto_id,
                cantidad,
                precio_unitario,
            }, { transaction });

            const nuevoStockProducto = producto.stock - cantidad;
            await producto.update({ stock: nuevoStockProducto }, { transaction });
            console.log(`Stock actualizado para producto ${producto.nombre}. Nuevo stock: ${nuevoStockProducto}.`);

            // --- CORRECCIÓN AQUÍ: Pasar 'io' y el objeto de producto actualizado ---
            if (nuevoStockProducto <= producto.stock_minimo_sugerido) {
                console.log(`🔎 Detectado stock bajo para ${producto.nombre} (ID: ${producto.id}). Stock actual: ${nuevoStockProducto}, Stock mínimo sugerido: ${producto.stock_minimo_sugerido}.`);
                // Asegúrate de pasar el producto con el stock actualizado
                await enviarAlertaStock({ ...producto.toJSON(), stock: nuevoStockProducto }, io);
            }
        }

        await transaction.commit();
        console.log('Venta y detalles registrados y stock actualizado exitosamente.');
        res.status(201).json(nuevaVenta);

    } catch (error) {
        await transaction.rollback();
        console.error('VentaController CREATE: Error al crear la venta o sus detalles:', error);
        res.status(400).json({
            error: 'Error al registrar la venta.',
            details: error.message || 'Error desconocido al procesar la venta.'
        });
    }
};

/**
 * Obtiene la lista de todas las ventas con paginación (opcional) y detalles.
 * Si no se provee 'page' o 'limit' en la query, se devuelven todas las ventas.
 */
exports.getAll = async (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);

        let findOptions = {
            include: [
                {
                    model: DetalleVenta,
                    as: 'detalles',
                    include: [{
                        model: Producto,
                        as: 'producto'
                    }]
                },
                {
                    model: Usuario,
                    as: 'Usuario',
                    attributes: ['id', 'nombre', 'email']
                }
            ],
            order: [['fecha', 'DESC']],
        };

        if (!isNaN(page) && !isNaN(limit) && page > 0 && limit > 0) {
            findOptions.limit = limit;
            findOptions.offset = (page - 1) * limit;
            console.log('Buscando ventas (p' + page + ', l' + limit + ')...');
        } else {
            console.log('Buscando todas las ventas (sin paginación)...');
        }

        const ventas = await Venta.findAndCountAll(findOptions);

        console.log('Ventas encontradas:', ventas.count);
        res.json({
            total: ventas.count,
            pages: (!isNaN(limit) && limit > 0) ? Math.ceil(ventas.count / limit) : (ventas.count > 0 ? 1 : 0),
            currentPage: (!isNaN(page) && page > 0) ? page : 1,
            data: ventas.rows
        });

    } catch (error) {
        console.error('GETALL ERROR:', error);
        res.status(500).json({ error: 'Error al obtener el historial de ventas.' });
    }
};

/**
 * Obtener una venta por ID con detalles y productos.
 */
exports.getById = async (req, res) => {
    try {
        const venta = await Venta.findByPk(req.params.id, {
            include: [
                {
                    model: DetalleVenta,
                    as: 'detalles',
                    include: [{ model: Producto, as: 'producto' }]
                },
                {
                    model: Usuario,
                    as: 'Usuario',
                    attributes: ['id', 'nombre', 'email']
                }
            ]
        });
        if (!venta) {
            return res.status(404).json({ error: 'Venta no encontrada.' });
        }
        res.json(venta);
    } catch (error) {
        console.error('Error al obtener venta por ID:', error);
        res.status(500).json({ error: 'Error al obtener la venta.' });
    }
};

/**
 * Actualiza una venta existente, ajustando stock y detalles.
 */
exports.update = async (req, res) => {
    console.log('VentaController UPDATE: Iniciado para Venta ID:', req.params.id);
    console.log('VentaController UPDATE: req.body recibido:', req.body);

    const { fecha, usuario_id, detalles } = req.body;
    const ventaId = req.params.id;

    if (!fecha || !usuario_id || !Array.isArray(detalles)) {
        return res.status(400).json({ error: 'Datos incompletos para actualizar la venta.' });
    }

    const transaction = await sequelize.transaction();

    try {
        const venta = await Venta.findByPk(ventaId, {
            include: [{ model: DetalleVenta, as: 'detalles' }],
            transaction
        });

        if (!venta) {
            throw new Error('Venta no encontrada para actualizar.');
        }

        // Revertir stock de los detalles antiguos
        for (const oldDetalle of venta.detalles) {
            const producto = await Producto.findByPk(oldDetalle.producto_id, { transaction });
            if (producto) {
                await producto.update({ stock: producto.stock + oldDetalle.cantidad }, { transaction });
            }
        }

        // Eliminar detalles antiguos
        await DetalleVenta.destroy({
            where: { venta_id: ventaId },
            transaction
        });

        let totalVenta = 0;
        // Validar y calcular total para los nuevos detalles
        for (const detalle of detalles) {
            if (
                !detalle.producto_id ||
                typeof detalle.cantidad !== 'number' || detalle.cantidad <= 0 ||
                typeof detalle.precio_unitario !== 'number' || detalle.precio_unitario < 0
            ) {
                throw new Error('Detalles inválidos en la venta.');
            }
            totalVenta += detalle.cantidad * detalle.precio_unitario;
        }

        // Actualizar datos principales de la venta
        await venta.update({ fecha, usuario_id, total: totalVenta }, { transaction });

        // Obtener la instancia de socket.io del Express app
        const io = req.app.get('socketio'); // <-- ¡CLAVE! Obtiene 'io' aquí

        // Crear nuevos detalles y ajustar stock
        for (const newDetalle of detalles) {
            const { producto_id, cantidad, precio_unitario } = newDetalle;

            const producto = await Producto.findByPk(producto_id, { transaction });
            if (!producto) {
                throw new Error(`Producto con ID ${producto_id} no encontrado.`);
            }
            // Verificar stock antes de restar
            if (producto.stock < cantidad) {
                throw new Error(`Stock insuficiente para ${producto.nombre}.`);
            }

            await DetalleVenta.create({
                venta_id: venta.id,
                producto_id,
                cantidad,
                precio_unitario,
            }, { transaction });

            const nuevoStockProducto = producto.stock - cantidad; // Calcula el nuevo stock
            await producto.update({ stock: nuevoStockProducto }, { transaction });

            // --- CORRECCIÓN AQUÍ TAMBIÉN PARA EL MÉTODO UPDATE (si aplica monitoreo de stock bajo al actualizar) ---
            if (nuevoStockProducto <= producto.stock_minimo_sugerido) {
                console.log(`🔎 Detectado stock bajo para ${producto.nombre} (ID: ${producto.id}). Stock actual: ${nuevoStockProducto}, Stock mínimo sugerido: ${producto.stock_minimo_sugerido}.`);
                // Asegúrate de pasar el producto con el stock actualizado y la instancia de io
                await enviarAlertaStock({ ...producto.toJSON(), stock: nuevoStockProducto }, io);
            }
        }

        await transaction.commit();
        res.json(venta);

    } catch (error) {
        await transaction.rollback();
        console.error('VentaController UPDATE: Error al actualizar la venta:', error);
        res.status(400).json({
            error: 'Error al actualizar la venta.',
            details: error.message || 'Error desconocido al actualizar venta.'
        });
    }
};

/**
 * Elimina una venta y revierte el stock.
 */
exports.delete = async (req, res) => {
    console.log('VentaController DELETE: Iniciado para Venta ID:', req.params.id);
    const ventaId = req.params.id;

    const transaction = await sequelize.transaction();

    try {
        const venta = await Venta.findByPk(ventaId, {
            include: [{ model: DetalleVenta, as: 'detalles' }],
            transaction
        });

        if (!venta) {
            return res.status(404).json({ error: 'Venta no encontrada para eliminar.' });
        }

        // Revertir stock de los productos asociados a esta venta
        for (const detalle of venta.detalles) {
            const producto = await Producto.findByPk(detalle.producto_id, { transaction });
            if (producto) {
                await producto.update({ stock: producto.stock + detalle.cantidad }, { transaction });
            }
        }

        // Eliminar detalles de la venta
        await DetalleVenta.destroy({
            where: { venta_id: ventaId },
            transaction
        });

        // Eliminar la venta principal
        await venta.destroy({ transaction });

        await transaction.commit();
        res.json({ message: 'Venta eliminada correctamente y stock revertido.' });

    } catch (error) {
        await transaction.rollback();
        console.error('VentaController DELETE: Error al eliminar la venta:', error);
        res.status(500).json({
            error: 'Error al eliminar la venta.',
            details: error.message || 'Error desconocido al eliminar venta.'
        });
    }
};