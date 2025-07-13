// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIo = require('socket.io');

// Middleware global
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Importar modelos y asociaciones correctamente
const db = require('./models');

// Importar la función de programación de cron jobs para vencimientos
const { scheduleExpirationChecks } = require('./cronJobs/checkExpirations'); // <-- ¡NUEVA IMPORTACIÓN!

// Rutas
const authRoutes = require('./routes/auth');
const dashboardRoutes = require("./routes/dashboard");
const productosRoutes = require('./routes/productos');
const proveedoresRoutes = require('./routes/proveedores');
const usuariosRoutes = require('./routes/usuarios');
const ventasRoutes = require('./routes/ventas');
const ordenesCompraRoutes = require('./routes/ordenesCompra');
const movimientosInventarioRoutes = require('./routes/movimientosInventario');
const reportesRoutes = require('./routes/reportes');
const inventarioRoutes = require('./routes/inventarioRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true
    }
});

// Configuración CORS para Express (rutas HTTP REST)
const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(logger);

app.get('/', (req, res) => {
    res.send('<h1>¡Bienvenido a la API de tu Backend!</h1><p>Las rutas de la API comienzan con /api/.</p>');
});

// Rutas montadas
app.use('/api/auth', authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/ordenes-compra', ordenesCompraRoutes);
app.use('/api/movimientos-inventario', movimientosInventarioRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/inventario', inventarioRoutes);

// Middleware de errores
app.use(errorHandler);

// Lógica de Socket.IO
app.set('socketio', io); // Puedes acceder a 'io' en tus rutas via req.app.get('socketio')

io.on('connection', (socket) => {
    console.log(`Cliente WebSocket conectado: ${socket.id}`);

    socket.emit('welcome', 'Bienvenido a PetStock!');

    socket.on('joinDashboard', (userId) => {
        socket.join(`dashboard-${userId}`);
        console.log(`Usuario ${userId} se unió a la sala dashboard-${userId}`);
    });

    socket.on('disconnect', () => {
        console.log(`Cliente WebSocket desconectado: ${socket.id}`);
    });

    socket.on('nuevoMovimientoInventario', (data) => {
        console.log('Recibido nuevo movimiento de inventario:', data);
        io.emit('inventarioActualizado', { message: 'El inventario ha sido actualizado!', data: data });
    });
});

// Sincroniza DB y levanta servidor
db.sequelize.sync({ alter: true }).then(() => {
    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => {
        console.log(`Backend corriendo en http://localhost:${PORT}`);
        // --- ¡Programar la verificación de vencimientos al iniciar el servidor! ---
        scheduleExpirationChecks(io); // Pasa la instancia de Socket.IO al cron job
    });
}).catch(err => {
    console.error('Error al conectar o sincronizar la base de datos:', err);
});