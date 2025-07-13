require('dotenv').config();
const { enviarAlertaStock, enviarAlertaVencimiento } = require('./utils/notificaciones'); // Ajusta ruta según donde tengas el archivo
// O si las funciones están en otro archivo, importa de ahí

async function probarEmails() {
  const productoStockBajo = {
    nombre: 'Producto de prueba',
    stock: 2,
    stock_minimo: 5,
  };

  const productoPorVencer = {
    nombre: 'Producto por vencer',
    fecha_vencimiento: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 días desde hoy
  };

  console.log('Probando alerta de stock bajo...');
  await enviarAlertaStock(productoStockBajo);

  console.log('Probando alerta de vencimiento...');
  await enviarAlertaVencimiento(productoPorVencer);

  console.log('Test finalizado');
}

probarEmails().catch(console.error);
