const db = require('../models');
const { Producto, Venta, Proveedor, OrdenCompra, Sequelize } = db;
const { Op } = Sequelize;

exports.getDashboardStats = async (req, res) => {
    try {
        const totalProductos = await Producto.count();

        // **Estrategia para "Ventas Hoy":**
        // 1. Obtener la fecha y hora actual en la zona horaria de Santiago (Chile).
        // 2. Determinar el inicio y fin del "día de hoy" en esa zona horaria.
        // 3. Convertir esos límites a UTC para la consulta a la base de datos.
        //    Esto es crucial si tu base de datos guarda las fechas en UTC (que es lo más común para TIMESTAMP WITHOUT TIME ZONE).

        const now = new Date(); // Obtiene la fecha y hora actual del servidor (ej: 2025-07-09 16:07:04 GMT-0400 (Chile Standard Time))

        // Convertir a la representación de la fecha en la zona horaria de Santiago
        const chileTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Santiago' }));
        // chileTime ahora es un objeto Date que internamente representa la hora de Santiago,
        // pero sus métodos como getHours(), getDate() etc., operarán según su valor interno,
        // no la zona horaria local del servidor.

        // Calcular el inicio del día en la zona horaria de Santiago (ej: 2025-07-09 00:00:00 en Santiago)
        const startOfTodayInChile = new Date(chileTime.getFullYear(), chileTime.getMonth(), chileTime.getDate(), 0, 0, 0, 0);

        // Calcular el fin del día en la zona horaria de Santiago (ej: 2025-07-09 23:59:59.999 en Santiago)
        const endOfTodayInChile = new Date(chileTime.getFullYear(), chileTime.getMonth(), chileTime.getDate(), 23, 59, 59, 999);

        // Convertir estos objetos Date a su representación UTC para la consulta a la base de datos.
        // Esto es necesario porque DataTypes.DATE en Sequelize a menudo mapea a TIMESTAMP WITHOUT TIME ZONE,
        // que es comúnmente interpretado como UTC por la base de datos.
        const startOfTodayUtc = new Date(startOfTodayInChile.toISOString()); // Convierte a cadena ISO (UTC) y luego a Date
        const endOfTodayUtc = new Date(endOfTodayInChile.toISOString());     // Convierte a cadena ISO (UTC) y luego a Date

        // Opcional: Logs para depuración
        console.log("Servidor actual (UTC):", new Date().toISOString());
        console.log("Hora de Santiago:", chileTime.toLocaleString());
        console.log("Inicio del día en Santiago (para consulta UTC):", startOfTodayUtc.toISOString());
        console.log("Fin del día en Santiago (para consulta UTC):", endOfTodayUtc.toISOString());

        // Contar ventas realizadas hoy (en el rango de tiempo de Santiago, convertido a UTC)
        const ventasHoy = await Venta.count({
            where: {
                fecha: {
                    [Op.gte]: startOfTodayUtc,
                    [Op.lte]: endOfTodayUtc
                }
            }
        });

        // Contar todas las ventas
        const totalVentas = await Venta.count();

        const totalProveedores = await Proveedor.count();

        const ordenesPendientes = await OrdenCompra.count({
            where: { estado: 'Pendiente' }
        });

        res.json({
            totalProductos,
            ventasHoy,
            totalVentas,
            totalProveedores,
            ordenesPendientes
        });
    } catch (error) {
        console.error('Error al obtener estadísticas del dashboard:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener estadísticas.' });
    }
};