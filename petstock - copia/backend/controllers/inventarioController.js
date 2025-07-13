const { Producto, DetalleVenta, Venta, Proveedor, OrdenCompra, DetalleOrdenCompra, sequelize, Sequelize } = require('../models');
const { Op, literal, fn, col } = Sequelize;

// ==============================================================================
// ASISTENTE DE REABASTECIMIENTO INTELIGENTE
// ==============================================================================

/**
 * Obtiene sugerencias de reabastecimiento para productos.
 * GET /api/inventario/sugerencias-reabastecimiento
 */
exports.getSugerenciasReabastecimiento = async (req, res) => {
  try {
    const { 
      dias_periodo_analisis = 90, // Por defecto, últimos 90 días
      umbral_dias_stock_minimo = 14, // Si el stock actual cubre menos de 14 días, es crítico
      dias_cobertura_deseados = 30 // Días de stock que se desea tener después del pedido
    } = req.query; // Permite que los parámetros se pasen por query string

    const sugerencias = [];

    // Obtener todos los productos junto con su promedio de venta en el período
    const productosConVentas = await Producto.findAll({
      attributes: [
        'id',
        'nombre',
        'stock', // stock_actual
        'dias_transito_proveedor',
        'factor_seguridad_stock',
        'stock_minimo_sugerido', 
        [
          // MODIFICACIÓN CLAVE FINAL:
          // Usamos "::date" para la conversión explícita a tipo DATE en la comparación.
          // Esto es más robusto en algunos escenarios de PostgreSQL que DATE() función.
          literal(`
            COALESCE(
              SUM(
                CASE 
                  WHEN "DetalleVenta->Ventum"."fecha" IS NOT NULL AND ("DetalleVenta->Ventum"."fecha")::date >= (CURRENT_DATE - INTERVAL '${parseInt(dias_periodo_analisis)} DAY') 
                  THEN "DetalleVenta"."cantidad" 
                  ELSE 0 
                END
              ), 0
            )::NUMERIC / ${parseInt(dias_periodo_analisis)}
          `), 
          'promedio_venta_diaria' 
        ]
      ],
      include: [
        {
          model: DetalleVenta,
          as: 'DetalleVenta', 
          attributes: [],
          required: false, // LEFT JOIN para DetalleVenta
          include: {
            model: Venta,
            as: 'Ventum', // Alias para el modelo Venta
            attributes: [],
            required: false, // LEFT JOIN para Venta
            // No hay 'where' aquí para no filtrar las uniones antes de la suma
          }
        },
        {
          model: Proveedor, 
          as: 'Proveedor', 
          attributes: ['id', 'nombre'], 
          required: false
        }
      ],
      group: [
        'Producto.id', 
        'Producto.nombre', 
        'Producto.stock', 
        'Producto.dias_transito_proveedor', 
        'Producto.factor_seguridad_stock',
        'Producto.stock_minimo_sugerido', 
        'Proveedor.id', 
        'Proveedor.nombre' 
      ],
      order: [['nombre', 'ASC']]
    });

    for (const producto of productosConVentas) {
      const id_producto = producto.id;
      const nombre_producto = producto.nombre;
      const stock_actual = producto.stock;
      
      // promedio_venta_diaria ahora contendrá la SUMA TOTAL de ventas para esta depuración
      const total_ventas_periodo = parseFloat(producto.dataValues.promedio_venta_diaria || 0); 
      
      // Calculamos el promedio diario aquí en JavaScript para la sugerencia
      const promedio_venta_diaria_calculado = total_ventas_periodo; // Ya viene calculado del SQL

      const dias_transito = producto.dias_transito_proveedor !== null ? producto.dias_transito_proveedor : 7;
      const factor_seguridad = producto.factor_seguridad_stock !== null ? parseFloat(producto.factor_seguridad_stock) : 1.20;
      const id_proveedor = producto.Proveedor ? producto.Proveedor.id : null; 
      const nombre_proveedor = producto.Proveedor ? producto.Proveedor.nombre : 'Sin Proveedor';
      const stock_minimo_sugerido = producto.stock_minimo_sugerido !== null ? producto.stock_minimo_sugerido : 0; 

      let dias_stock_restantes = 0;
      if (promedio_venta_diaria_calculado > 0) { // Usar el promedio calculado
        dias_stock_restantes = stock_actual / promedio_venta_diaria_calculado;
      }

      const umbral_critico_total = parseInt(umbral_dias_stock_minimo) + dias_transito;

      // La lógica para determinar si se sugiere un reabastecimiento permanece igual
      // Usar promedio_venta_diaria_calculado en la condición
      if ((dias_stock_restantes <= umbral_critico_total && promedio_venta_diaria_calculado > 0) || 
          (stock_actual <= 0 && stock_minimo_sugerido > 0 && promedio_venta_diaria_calculado === 0)) {
        
        let cantidad_a_pedir = 0;
        let motivo = '';

        if (promedio_venta_diaria_calculado > 0) { // Usar el promedio calculado
          const cantidad_necesaria_calculada = Math.ceil(
            promedio_venta_diaria_calculado * (parseInt(dias_cobertura_deseados) + dias_transito) * factor_seguridad
          );
          cantidad_a_pedir = cantidad_necesaria_calculada - stock_actual;
          motivo = `Stock bajo (cubre ${Math.round(dias_stock_restantes)} días) y promedio de venta de ${promedio_venta_diaria_calculado.toFixed(2)} unidades/día.`;
        } else if (stock_actual <= 0 && stock_minimo_sugerido > 0) {
          cantidad_a_pedir = stock_minimo_sugerido - stock_actual;
          motivo = `Stock agotado y se recomienda un mínimo de ${stock_minimo_sugerido} unidades.`;
        }
        
        if (cantidad_a_pedir < 0) cantidad_a_pedir = 0;
        cantidad_a_pedir = Math.ceil(cantidad_a_pedir); 

        if (cantidad_a_pedir > 0) { 
          sugerencias.push({
            id_producto: id_producto,
            nombre_producto: nombre_producto,
            stock_actual: stock_actual,
            promedio_venta_diaria: promedio_venta_diaria_calculado.toFixed(2), // Enviar el promedio calculado
            dias_stock_restantes: dias_stock_restantes.toFixed(2),
            umbral_critico: umbral_critico_total,
            cantidad_sugerida_a_pedir: cantidad_a_pedir,
            proveedor_sugerido: nombre_proveedor,
            motivo: motivo
          });
        }
      }
    }

    return res.status(200).json(sugerencias);

  } catch (error) {
    console.error('Error al obtener sugerencias de reabastecimiento:', error);
    return res.status(500).json({ message: 'Error interno del servidor al obtener sugerencias.', error: error.message });
  }
};

/**
 * Crea una nueva Orden de Compra desde las sugerencias.
 * POST /api/ordenes-compra/generar-desde-sugerencias
 *
 * Requiere en el cuerpo (body) de la solicitud:
 * {
 * "id_proveedor": 1, // ID del proveedor
 * "productos": [
 * { "id_producto": 101, "cantidad": 40, "precio_compra": 25.00 },
 * { "id_producto": 105, "cantidad": 15, "precio_compra": 12.50 }
 * ]
 * }
 */
exports.crearOrdenCompraDesdeSugerencias = async (req, res) => {
  const { id_proveedor, productos } = req.body;

  if (!id_proveedor || !productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ message: 'Datos incompletos para crear la orden de compra.' });
  }

  let transaction;
  try {
    transaction = await sequelize.transaction();

    // 1. Calcular el total estimado de la orden
    const total_estimado = productos.reduce((sum, item) => sum + (item.cantidad * item.precio_compra), 0);

    // 2. Crear la Orden de Compra principal
    const nuevaOrden = await OrdenCompra.create({
      proveedor_id: id_proveedor,
      fecha: new Date(), 
      estado: 'Pendiente',
      total_estimado: total_estimado 
    }, { transaction });

    // 3. Preparar los detalles de la orden para inserción masiva
    const detallesOrden = productos.map(item => ({
      orden_compra_id: nuevaOrden.id,
      producto_id: item.id_producto,
      cantidad: item.cantidad,
      precio: item.precio_compra 
    }));

    // 4. Crear los detalles de la orden de compra
    await DetalleOrdenCompra.bulkCreate(detallesOrden, { transaction });

    // 5. Confirmar la transacción
    await transaction.commit();

    return res.status(201).json({ 
      message: 'Orden de compra creada exitosamente desde sugerencias.',
      orden_compra: nuevaOrden 
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Error al crear orden de compra desde sugerencias:', error);
    return res.status(500).json({ message: 'Error interno del servidor al crear la orden de compra.', error: error.message });
  }
};
