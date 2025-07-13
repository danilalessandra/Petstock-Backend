// backend/test_roles.js
const rolesMiddleware = require('./middleware/roles');

console.log('--- Probando roles.js ---');

// Simula una llamada al middleware roles con un array de roles
const myMiddlewareFunction = rolesMiddleware(['admin', 'user']);

// Verifica que lo que devuelve es una función
if (typeof myMiddlewareFunction === 'function') {
    console.log('rolesMiddleware devuelve una FUNCIÓN correctamente.');

    // Simula la llamada a la función middleware con req, res, next
    const mockReq = { user: { rol: 'admin' } };
    const mockRes = { status: (code) => ({ json: (data) => console.log(`Respuesta simulada: ${code}`, data) }) };
    const mockNext = () => console.log('next() llamado.');

    console.log('Probando con rol permitido (admin):');
    myMiddlewareFunction(mockReq, mockRes, mockNext);

    console.log('Probando con rol NO permitido (guest):');
    const mockReqForbidden = { user: { rol: 'guest' } };
    myMiddlewareFunction(mockReqForbidden, mockRes, mockNext);

    console.log('Probando sin req.user:');
    const mockReqNoUser = {};
    myMiddlewareFunction(mockReqNoUser, mockRes, mockNext);

} else {
    console.error('ERROR: rolesMiddleware NO devuelve una función. Tipo:', typeof myMiddlewareFunction);
}

console.log('--- Fin de la prueba ---');