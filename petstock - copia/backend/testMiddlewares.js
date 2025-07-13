const auth = require('./middleware/auth');
const roles = require('./middleware/roles');
const validarOrdenCompra = require('./middleware/validarOrdenCompra');
const ordenCompraController = require('./controllers/ordenCompraController');

console.log('auth:', typeof auth);
console.log('roles:', typeof roles);
console.log('validarOrdenCompra:', typeof validarOrdenCompra);
console.log('ordenCompraController.create:', typeof ordenCompraController.create);
