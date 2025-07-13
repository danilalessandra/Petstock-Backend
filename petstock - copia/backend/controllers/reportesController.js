// backend/controllers/reportesController.js

const { Sequelize, Op } = require('sequelize');
const db = require('../models');

const Venta = db.Venta;
const DetalleVenta = db.DetalleVenta;
const Producto = db.Producto;
const Proveedor = db.Proveedor;
const Usuario = db.Usuario; // Asegúrate de que Usuario está importado
const OrdenCompra = db.OrdenCompra;

// =========================================
// Reporte de ventas generales
// =========================================
exports.reporteVentas = async (req, res) => {
  try {
    const totalVentasRegistradas = await Venta.count();

    const ventasConDetalles = await Venta.findAll({
      include: [
        {
          model: DetalleVenta,
          as: 'detalles',
          attributes: ['cantidad', 'precio_unitario'],
          required: false
        }
      ]
    });

    let totalMontoVentas = 0;
    ventasConDetalles.forEach(venta => {
      venta.detalles.forEach(detalle => {
        totalMontoVentas += detalle.cantidad * parseFloat(detalle.precio_unitario);
      });
    });

    const ultimasVentas = await Venta.findAll({
      limit: 5,
      order: [['fecha', 'DESC']],
      include: [
        {
          model: Usuario,
          as: 'Usuario', // CORRECTO: 'Usuario' con U mayúscula
          attributes: ['id', 'nombre']
        },
        {
          model: DetalleVenta,
          as: 'detalles',
          attributes: ['cantidad', 'precio_unitario'],
          required: false
        }
      ]
    });

    const ultimasVentasFormateadas = ultimasVentas.map(v => {
      let total = 0;
      if (v.detalles && Array.isArray(v.detalles)) {
        v.detalles.forEach(detalle => {
          total += detalle.cantidad * parseFloat(detalle.precio_unitario);
        });
      }
      return {
        id: v.id,
        fecha: v.fecha,
        usuario: v.Usuario ? v.Usuario.nombre : 'Desconocido', // Acceder como 'v.Usuario'
        total: parseFloat(total.toFixed(2)),
        estado: 'Completada' // Valor hardcodeado o ajusta según tu lógica si tienes un campo 'estado' en Venta
      };
    });

    res.status(200).json({
      message: 'Reporte de ventas general generado exitosamente',
      totalVentasRegistradas,
      totalMontoVentas: parseFloat(totalMontoVentas.toFixed(2)),
      ultimasVentas: ultimasVentasFormateadas
    });
  } catch (error) {
    console.error('❌ Error en reporteVentas:', error);
    res.status(500).json({ message: 'Error interno al generar reporte de ventas', error: error.message });
  }
};

// =========================================
// Reporte de inventario
// =========================================
exports.reporteInventario = async (req, res) => {
  try {
    const productosEnInventario = await Producto.findAll({
      include: [{ model: Proveedor, attributes: ['id', 'nombre'] }]
    });

    const productosBajoStock = await Producto.count({
      where: {
        stock: { [Op.lt]: 10 }
      }
    });

    res.status(200).json({
      message: 'Reporte de inventario generado exitosamente',
      totalProductos: productosEnInventario.length,
      productosDetalle: productosEnInventario.map(p => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: parseFloat(p.precio),
        stock: p.stock,
        fecha_vencimiento: p.fecha_vencimiento,
        proveedor: p.Proveedor ? p.Proveedor.nombre : 'N/A'
      })),
      cantidadProductosBajoStock: productosBajoStock
    });
  } catch (error) {
    console.error('❌ Error en reporteInventario:', error);
    res.status(500).json({ message: 'Error interno al generar reporte de inventario', error: error.message });
  }
};

// =========================================
// Reporte de ventas mensuales
// =========================================
exports.reporteVentasMensuales = async (req, res) => {
  try {
    const ventasMensuales = await Venta.findAll({
      attributes: [
        [Sequelize.fn('TO_CHAR', Sequelize.col('fecha'), 'YYYY-MM'), 'periodo'],
        [Sequelize.fn('SUM', Sequelize.literal('"detalles"."cantidad" * CAST("detalles"."precio_unitario" AS DECIMAL(10,2))')), 'totalVentas'],
        [Sequelize.fn('COUNT', Sequelize.col('Venta.id')), 'cantidadPedidos']
      ],
      include: [
        {
          model: DetalleVenta,
          as: 'detalles',
          attributes: [],
          required: true
        }
      ],
      group: ['periodo'],
      order: [['periodo', 'ASC']],
      raw: true
    });

    res.status(200).json({
      message: 'Reporte de ventas mensuales generado exitosamente',
      ventasPorMes: ventasMensuales
    });
  } catch (error) {
    console.error('❌ Error en reporteVentasMensuales:', error);
    res.status(500).json({ message: 'Error interno al generar reporte mensual', error: error.message });
  }
};

// =========================================
// Reporte de proveedores
// =========================================
exports.reporteProveedores = async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll();

    res.status(200).json({
      message: 'Reporte de proveedores generado exitosamente',
      totalProveedores: proveedores.length,
      listaProveedores: proveedores.map(p => ({
        id: p.id,
        nombre: p.nombre,
        contacto: p.contacto,
        direccion: p.direccion
      }))
    });
  } catch (error) {
    console.error('❌ Error en reporteProveedores:', error);
    res.status(500).json({ message: 'Error interno al generar reporte de proveedores', error: error.message });
  }
};

// =========================================
// Reporte de órdenes de compra
// =========================================
exports.reporteOrdenes = async (req, res) => {
  try {
    const totalOrdenesRegistradas = await OrdenCompra.count();

    const ultimasOrdenes = await OrdenCompra.findAll({
      limit: 10,
      order: [['fecha', 'DESC']],
      include: [
        {
          model: Proveedor,
          as: 'proveedor', // <--- ¡CORRECCIÓN CLAVE AQUÍ! Añadir el alias 'proveedor' (en minúscula)
          attributes: ['id', 'nombre']
        }
      ]
    });

    res.status(200).json({
      message: 'Reporte de órdenes de compra generado exitosamente',
      totalOrdenesRegistradas,
      totalMontoOrdenes: 0, // Si no tienes lógica aún para calcular montos
      ultimasOrdenes: ultimasOrdenes.map(o => ({
        id: o.id,
        fecha: o.fecha,
        proveedor: o.proveedor ? o.proveedor.nombre : 'N/A', // <--- Acceder como 'o.proveedor' (en minúscula)
        estado: o.estado
      }))
    });
  } catch (error) {
    console.error('❌ Error en reporteOrdenes:', error);
    res.status(500).json({ message: 'Error interno al generar reporte de órdenes', error: error.message });
  }
};
