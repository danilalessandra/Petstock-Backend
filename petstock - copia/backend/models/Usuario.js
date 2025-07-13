// backend/models/Usuario.js
module.exports = (sequelize, DataTypes) => {
  const Usuario = sequelize.define('Usuario', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    rol: {
      type: DataTypes.ENUM('administrador', 'empleado'),
      allowNull: false
    },
    refreshToken: { // <-- ¡Añade este campo!
      type: DataTypes.STRING,
      allowNull: true // Puede ser nulo si el usuario no tiene un refresh token activo (ej. recién registrado o sesión cerrada)
    }
  }, {
    tableName: 'usuarios',
    timestamps: true,
    // Si tenías hooks beforeCreate/beforeUpdate para el hashing de la contraseña, asegúrate de que sigan aquí.
  });

  return Usuario;
};