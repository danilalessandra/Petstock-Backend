module.exports = function(rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Acceso prohibido: rol insuficiente.' });
    }
    next();
  };
};
