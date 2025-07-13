const moment = require('moment');
const { enviarAlertaStock, enviarAlertaVencimiento } = require('../utils/notificaciones');
const { OrdenCompra, Proveedor, DetalleOrdenCompra, Producto } = require('../models');
const { sequelize } = require('../models'); // Importa sequelize para transacciones


/**
 * Obtener todas las órdenes de compra con proveedor y detalles.
 */
exports.getAll = async (req, res) => {
    try {
        const ordenes = await OrdenCompra.findAll({
            include: [
                { model: Proveedor, as: 'proveedor' },
                {
                    model: DetalleOrdenCompra,
                    as: 'detalles',
                    include: [{ model: Producto, as: 'producto' }]
                }
            ]
        });
        res.json(ordenes);
    } catch (error) {
        console.error('❌ Error en ordenCompraController.getAll:', error);
        res.status(500).json({ error: 'Error al obtener las órdenes de compra.', details: error.message });
    }
};

/**
 * Obtener una orden de compra por ID.
 */
exports.getById = async (req, res) => {
    try {
        const orden = await OrdenCompra.findByPk(req.params.id, {
            include: [
                { model: Proveedor, as: 'proveedor' },
                {
                    model: DetalleOrdenCompra,
                    as: 'detalles',
                    include: [{ model: Producto, as: 'producto' }]
                }
            ]
        });

        if (!orden) {
            return res.status(404).json({ error: 'Orden de compra no encontrada.' });
        }

        res.json(orden);
    } catch (error) {
        console.error('❌ Error en ordenCompraController.getById:', error);
        res.status(500).json({ error: 'Error al obtener la orden de compra.', details: error.message });
    }
};

/**
 * Crear una orden de compra con detalles (productos) - Función para creación manual.
 * Esta función espera un solo proveedor_id y productos específicos para esa orden.
 */
exports.create = async (req, res) => {
    const { proveedor_id, fecha, estado, productos } = req.body;

    if (!proveedor_id || !fecha || !estado || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ error: 'Faltan datos necesarios para registrar la orden.' });
    }

    const transaction = await sequelize.transaction();
    try {
        const nuevaOrden = await OrdenCompra.create({ proveedor_id, fecha: fecha, estado }, { transaction });

        const detalles = productos.map(p => ({
            orden_compra_id: nuevaOrden.id,
            producto_id: p.producto_id,
            cantidad: p.cantidad,
            precio: p.precio
        }));

        await DetalleOrdenCompra.bulkCreate(detalles, { transaction });

        await transaction.commit();

        res.status(201).json({
            message: 'Orden de compra registrada correctamente.',
            orden_id: nuevaOrden.id
        });
    } catch (error) {
        await transaction.rollback();
        console.error('❌ Error en ordenCompraController.create:', error);
        res.status(400).json({ error: 'Error al crear la orden de compra.', details: error.message });
    }
};

/**
 * **NUEVA FUNCIÓN: Genera órdenes de compra a partir de sugerencias de reabastecimiento.**
 * Esta función agrupa los productos seleccionados por proveedor y crea una o varias órdenes de compra.
 * @param {Array} productosSeleccionados - Un array de objetos { id: productoId, cantidad_a_pedir: cantidad }.
 */
exports.generarOrdenCompraDesdeSugerencias = async (req, res) => {
    console.log('📦 ordenCompraController.generarOrdenCompraDesdeSugerencias: Iniciado.');
    console.log('📦 req.body recibido:', JSON.stringify(req.body, null, 2));

    const { productosSeleccionados } = req.body;
    const usuario_id = req.usuario && req.usuario.id ? req.usuario.id : 1; 

    if (!productosSeleccionados || !Array.isArray(productosSeleccionados) || productosSeleccionados.length === 0) {
        console.error('📦 Error: No se han proporcionado productos para la orden de compra.');
        return res.status(400).json({ error: 'No se han proporcionado productos para la orden de compra.' });
    }

    const productosPorProveedor = {};
    for (const item of productosSeleccionados) {
        console.log('📦 Procesando item individual del array productosSeleccionados:', JSON.stringify(item, null, 2));

        try {
            const producto = await Producto.findByPk(item.id, { 
                attributes: ['id', 'proveedor_id', 'precio', 'nombre']
            });
            if (!producto || !producto.proveedor_id) {
                console.warn(`📦 Advertencia: Producto con ID ${item.id} (${producto ? producto.nombre : 'Desconocido'}) no encontrado o sin proveedor. Se omite.`);
                continue;
            }
            if (!productosPorProveedor[producto.proveedor_id]) {
                productosPorProveedor[producto.proveedor_id] = {
                    proveedorId: producto.proveedor_id,
                    productos: []
                };
            }
            productosPorProveedor[producto.proveedor_id].productos.push({
                productoId: producto.id,
                cantidad: item.cantidad_a_pedir,
                precioUnitario: producto.precio || 0
            });
        } catch (error) {
            console.error(`📦 Error al obtener datos del producto ${item.id}:`, error);
        }
    }

    if (Object.keys(productosPorProveedor).length === 0) {
        return res.status(400).json({ error: 'Ninguno de los productos seleccionados es válido o tiene un proveedor asignado.' });
    }

    const transaction = await sequelize.transaction();
    const ordenesGeneradas = [];

    try {
        for (const proveedorId in productosPorProveedor) {
            const { productos } = productosPorProveedor[proveedorId];
            if (productos.length === 0) continue;

            const totalOrden = productos.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);

            const nuevaOrden = await OrdenCompra.create({
                proveedor_id: proveedorId,
                fecha: new Date(),
                total: totalOrden,
                estado: 'Pendiente',
                usuario_id: usuario_id
            }, { transaction });

            const detalles = productos.map(item => ({
                orden_compra_id: nuevaOrden.id,
                producto_id: item.productoId,
                cantidad: item.cantidad,
                precio: item.precioUnitario
            }));

            await DetalleOrdenCompra.bulkCreate(detalles, { transaction });
            ordenesGeneradas.push(nuevaOrden);
        }

        await transaction.commit();
        console.log('📦 Órdenes de compra generadas exitosamente.');
        res.status(201).json({
            message: 'Órdenes de compra generadas exitosamente.',
            ordenes: ordenesGeneradas.map(oc => ({ id: oc.id, proveedor_id: oc.proveedor_id, total: oc.total, estado: oc.estado }))
        });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Error al generar la orden de compra desde sugerencias:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ 
                error: 'Error de validación al generar la orden de compra.', 
                details: error.errors.map(e => e.message).join(', ') 
            });
        }
        res.status(500).json({
            error: 'Error interno del servidor al generar la orden de compra.',
            details: error.message || 'Error desconocido.'
        });
    }
};


/**
 * Actualizar una orden de compra y sus detalles, incluyendo la reversión de stock
 * si el estado cambia de 'recibida' a otro estado.
 */
exports.update = async (req, res) => {
    const { id } = req.params;
    const { proveedor_id, fecha, estado, productos } = req.body; // 'productos' es el array de detalles que viene del frontend

    const transaction = await sequelize.transaction();
    try {
        const orden = await OrdenCompra.findByPk(id, { transaction });
        if (!orden) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Orden de compra no encontrada.' });
        }

        const oldEstado = orden.estado; // Guarda el estado actual de la orden
        const newEstado = estado;       // El nuevo estado que viene en la solicitud

        // 1. Actualizar los campos principales de la OrdenCompra
        await orden.update({ proveedor_id, fecha, estado: newEstado }, { transaction });

        // 2. Lógica de reversión de stock si el estado cambia de 'recibida' a otro
        if (oldEstado === 'recibida' && newEstado !== 'recibida') {
            console.log(`🔄 Reversión de stock: Orden ID ${id} cambia de 'recibida' a '${newEstado}'.`);
            const detallesOrdenOriginal = await DetalleOrdenCompra.findAll({
                where: { orden_compra_id: id },
                transaction
            });

            for (const detalle of detallesOrdenOriginal) {
                const producto = await Producto.findByPk(detalle.producto_id, { transaction });
                if (producto) {
                    producto.stock = (producto.stock || 0) - detalle.cantidad; // Resta el stock
                    await producto.save({ transaction });
                    console.log(`📦 Stock de producto ${producto.nombre} (ID: ${producto.id}) revertido en ${detalle.cantidad}. Nuevo stock: ${producto.stock}`);

                    // Alertas de stock (si son necesarias aquí)
                    if (producto.stock < (producto.stock_minimo_sugerido || 0)) {
                        console.warn(`⚠️ Alerta de stock: Producto ${producto.nombre} (ID: ${producto.id}) por debajo del stock mínimo después de reversión.`);
                        // Descomentado para enviar alertas de stock
                        await enviarAlertaStock(producto, req.app.get('socketio')); 
                    }
                }
            }
            console.log(`✅ Stock revertido para la orden ${id}.`);
        } else if (oldEstado !== 'recibida' && newEstado === 'recibida') {
            // Si se cambia a 'recibida' a través de esta ruta, sumamos stock
            // Esto es útil si no se usó confirmarRecepcion o si se revirtió y se quiere volver a recibir
            console.log(`🔄 Suma de stock: Orden ID ${id} cambia a 'recibida'.`);
            const detallesOrdenActuales = await DetalleOrdenCompra.findAll({
                where: { orden_compra_id: id },
                transaction
            });

            for (const detalle of detallesOrdenActuales) {
                const producto = await Producto.findByPk(detalle.producto_id, { transaction });
                if (producto) {
                    producto.stock = (producto.stock || 0) + detalle.cantidad; // Suma el stock
                    await producto.save({ transaction });
                    console.log(`📦 Stock de producto ${producto.nombre} (ID: ${producto.id}) sumado en ${detalle.cantidad}. Nuevo stock: ${producto.stock}`);
                }
            }
            console.log(`✅ Stock sumado para la orden ${id}.`);
        }


        // 3. Manejar los detalles de la orden de compra (productos)
        if (Array.isArray(productos)) {
            const existingDetalles = await DetalleOrdenCompra.findAll({
                where: { orden_compra_id: id },
                transaction
            });

            const newDetalles = [];
            const updatedDetalles = [];
            const existingDetalleIds = new Set(existingDetalles.map(d => d.id));
            const incomingDetalleIds = new Set();

            for (const prod of productos) {
                if (!prod.producto_id || isNaN(parseFloat(prod.cantidad)) || isNaN(parseFloat(prod.precio))) {
                    console.warn(`❌ Detalle de producto inválido en la solicitud para orden ${id}:`, prod);
                    continue;
                }

                prod.cantidad = parseFloat(prod.cantidad);
                prod.precio = parseFloat(prod.precio);

                if (prod.id) {
                    incomingDetalleIds.add(prod.id);
                    const existing = existingDetalles.find(d => d.id === prod.id);
                    if (existing) {
                        if (existing.producto_id !== prod.producto_id ||
                            existing.cantidad !== prod.cantidad ||
                            existing.precio !== prod.precio) {
                            updatedDetalles.push({
                                id: prod.id,
                                producto_id: prod.producto_id,
                                cantidad: prod.cantidad,
                                precio: prod.precio
                            });
                        }
                    } else {
                        newDetalles.push({
                            orden_compra_id: id,
                            producto_id: prod.producto_id,
                            cantidad: prod.cantidad,
                            precio: prod.precio
                        });
                    }
                } else {
                    newDetalles.push({
                        orden_compra_id: id,
                        producto_id: prod.producto_id,
                        cantidad: prod.cantidad,
                        precio: prod.precio
                    });
                }
            }

            const detallesToDelete = existingDetalles.filter(d => !incomingDetalleIds.has(d.id));
            if (detallesToDelete.length > 0) {
                console.log(`🗑️ Eliminando ${detallesToDelete.length} detalles de la orden.`);
                await DetalleOrdenCompra.destroy({
                    where: { id: detallesToDelete.map(d => d.id) },
                    transaction
                });
            }

            if (newDetalles.length > 0) {
                console.log(`✨ Creando ${newDetalles.length} nuevos detalles para la orden.`);
                await DetalleOrdenCompra.bulkCreate(newDetalles, { transaction });
            }

            for (const detail of updatedDetalles) {
                console.log(`✏️ Actualizando detalle ID ${detail.id} de la orden.`);
                await DetalleOrdenCompra.update(
                    {
                        producto_id: detail.producto_id,
                        cantidad: detail.cantidad,
                        precio: detail.precio
                    },
                    {
                        where: { id: detail.id },
                        transaction
                    }
                );
            }
            console.log(`✅ Detalles de la orden manejados.`);
        } else {
            console.warn(`⚠️ No se recibió un array 'productos' para actualizar los detalles de la orden ${id}.`);
        }

        await transaction.commit();
        res.json({ message: 'Orden de compra actualizada correctamente.', orden });

    } catch (error) {
        await transaction.rollback();
        console.error('❌ Error en ordenCompraController.update:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ 
                error: 'Error de validación al actualizar la orden de compra.', 
                details: error.errors.map(e => e.message).join(', ') 
            });
        }
        res.status(400).json({ error: 'Error al actualizar la orden de compra.', details: error.message });
    }
};

/**
 * Eliminar una orden de compra junto con sus detalles.
 */
exports.delete = async (req, res) => {
    try {
        const orden = await OrdenCompra.findByPk(req.params.id);
        if (!orden) {
            return res.status(404).json({ error: 'Orden de compra no encontrada.' });
        }

        await DetalleOrdenCompra.destroy({ where: { orden_compra_id: orden.id } });
        await orden.destroy();

        res.json({ message: 'Orden de compra y sus detalles eliminados correctamente.' });
    } catch (error) {
        console.error('❌ Error en ordenCompraController.delete:', error);
        res.status(500).json({ error: 'Error al eliminar la orden de compra.', details: error.message });
    }
};

/**
 * Confirmar recepción de productos y actualizar stock, enviar alertas.
 */
exports.confirmarRecepcion = async (req, res) => {
    const transaction = await sequelize.transaction(); // Iniciar transacción para confirmarRecepcion
    try {
        const { id } = req.params;
        const orden = await OrdenCompra.findByPk(id, {
            include: [{ model: DetalleOrdenCompra, as: 'detalles' }]
        });

        if (!orden) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Orden no encontrada.' });
        }

        if (orden.estado === 'recibida') {
            await transaction.rollback();
            return res.status(400).json({ error: 'La orden ya fue recibida anteriormente.' });
        }

        for (const detalle of orden.detalles) {
            const producto = await Producto.findByPk(detalle.producto_id, { transaction });
            if (producto) {
                producto.stock = (producto.stock || 0) + detalle.cantidad;
                await producto.save({ transaction });

                // Alertas de stock (activadas aquí)
                if (producto.stock < (producto.stock_minimo_sugerido || 0) && producto.promedio_venta_diaria > 0) {
                    await enviarAlertaStock(producto, req.app.get('socketio')); 
                }

                // Alertas de vencimiento (activadas aquí)
                if (producto.fecha_vencimiento) {
                    const diasRestantes = moment(producto.fecha_vencimiento).diff(moment(), 'days');
                    const umbralAlertaVencimiento = 30; 
                    if (diasRestantes <= umbralAlertaVencimiento) {
                        await enviarAlertaVencimiento(producto, req.app.get('socketio')); 
                    }
                }
            }
        }

        orden.estado = 'recibida';
        await orden.save({ transaction });

        await transaction.commit();
        res.json({ message: 'Productos recibidos y stock actualizado correctamente.' });
    } catch (error) {
        await transaction.rollback();
        console.error('❌ Error en confirmarRecepcion:', error);
        res.status(500).json({ error: 'Error al recibir productos.', details: error.message });
    }
};
