const nodemailer = require('nodemailer');

exports.enviarCorreo = async (destinatario, asunto, contenido) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.CORREO_ADMIN,
      pass: process.env.CLAVE_CORREO
    }
  });

  await transporter.sendMail({
    from: process.env.CORREO_ADMIN,
    to: destinatario,
    subject: asunto,
    text: contenido
  });
};