const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

// Registrar nuevo usuario
const registrarUsuario = async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    const {
      nombres,
      apellidos,
      cedula,
      fechaNacimiento,
      telefono,
      direccion,
      correo,
      contrasena
    } = req.body;

    console.log('📝 Datos recibidos:', { nombres, apellidos, cedula, correo });

    // Validaciones básicas
    if (!nombres || !apellidos || !cedula || !correo || !contrasena) {
      return res.status(400).json({
        error: 'Todos los campos obligatorios deben ser completados'
      });
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({
        error: 'El formato del correo electrónico no es válido'
      });
    }

    // Verificar si el correo ya existe
    const [existingEmail] = await connection.execute(
      'SELECT SECUENCIAL FROM usuario WHERE CORREO = ?',
      [correo]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({
        error: 'El correo electrónico ya está registrado'
      });
    }

    // Verificar si la cédula ya existe
    const [existingCedula] = await connection.execute(
      'SELECT SECUENCIAL FROM usuario WHERE CEDULA = ?',
      [cedula]
    );

    if (existingCedula.length > 0) {
      return res.status(400).json({
        error: 'La cédula ya está registrada'
      });
    }

    // Encriptar la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

    // Insertar el nuevo usuario
    const [result] = await connection.execute(
      `INSERT INTO usuario (
        NOMBRES,
        APELLIDOS,
        CEDULA,
        FECHA_NACIMIENTO,
        TELEFONO,
        DIRECCION,
        CORREO,
        CONTRASENA,
        CODIGOROL,
        CODIGOESTADO,
        ES_INTERNO
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'EST', 'ACTIVO', 0)`,
      [
        nombres,
        apellidos,
        cedula,
        fechaNacimiento || null,
        telefono,
        direccion || null,
        correo,
        hashedPassword
      ]
    );

    console.log('✅ Usuario registrado con ID:', result.insertId);

    // Respuesta exitosa (no devolver la contraseña)
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        id: result.insertId,
        nombres,
        apellidos,
        correo,
        rol: 'Estudiante'
      }
    });

  } catch (error) {
    console.error('❌ Error al registrar usuario:', error);
    res.status(500).json({
      error: 'Error al registrar el usuario',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// Login de usuario
const loginUsuario = async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    const { correo, contrasena } = req.body;

    console.log('🔐 Intento de login:', correo);

    // Validaciones básicas
    if (!correo || !contrasena) {
      return res.status(400).json({
        error: 'Correo y contraseña son obligatorios'
      });
    }

    // Buscar usuario por correo
    const [usuarios] = await connection.execute(
      `SELECT 
        u.SECUENCIAL,
        u.NOMBRES,
        u.APELLIDOS,
        u.CORREO,
        u.CONTRASENA,
        u.CODIGOROL,
        u.CODIGOESTADO,
        r.NOMBRE as ROL_NOMBRE
       FROM usuario u
       LEFT JOIN rol_usuario r ON u.CODIGOROL = r.CODIGO
       WHERE u.CORREO = ?`,
      [correo]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({
        error: 'Correo o contraseña incorrectos'
      });
    }

    const usuario = usuarios[0];

    // Verificar si el usuario está activo
    if (usuario.CODIGOESTADO !== 'ACTIVO') {
      return res.status(403).json({
        error: 'Tu cuenta está inactiva. Contacta al administrador'
      });
    }

    // Verificar la contraseña
    const passwordMatch = await bcrypt.compare(contrasena, usuario.CONTRASENA);

    if (!passwordMatch) {
      return res.status(401).json({
        error: 'Correo o contraseña incorrectos'
      });
    }

    console.log('✅ Login exitoso para:', correo);

    // Respuesta exitosa (no devolver la contraseña)
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        id: usuario.SECUENCIAL,
        nombres: usuario.NOMBRES,
        apellidos: usuario.APELLIDOS,
        correo: usuario.CORREO,
        rol: usuario.ROL_NOMBRE,
        codigoRol: usuario.CODIGOROL
      }
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      error: 'Error al iniciar sesión',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// Registrar nuevo responsable (solo para admins)
const registrarResponsable = async (req, res) => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    const {
      nombres,
      apellidos,
      cedula,
      fechaNacimiento,
      telefono,
      direccion,
      correo,
      contrasena
    } = req.body;

    console.log('📝 Creando responsable:', { nombres, apellidos, cedula, correo });

    // Validaciones básicas
    if (!nombres || !apellidos || !cedula || !correo || !contrasena || !telefono) {
      return res.status(400).json({
        error: 'Todos los campos obligatorios deben ser completados'
      });
    }

    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({
        error: 'El formato del correo electrónico no es válido'
      });
    }

    // Verificar si el correo ya existe
    const [existingEmail] = await connection.execute(
      'SELECT SECUENCIAL FROM usuario WHERE CORREO = ?',
      [correo]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({
        error: 'El correo electrónico ya está registrado'
      });
    }

    // Verificar si la cédula ya existe
    const [existingCedula] = await connection.execute(
      'SELECT SECUENCIAL FROM usuario WHERE CEDULA = ?',
      [cedula]
    );

    if (existingCedula.length > 0) {
      return res.status(400).json({
        error: 'La cédula ya está registrada'
      });
    }

    // Encriptar la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

    // Insertar el nuevo responsable con rol RES
    const [result] = await connection.execute(
      `INSERT INTO usuario (
        NOMBRES,
        APELLIDOS,
        CEDULA,
        FECHA_NACIMIENTO,
        TELEFONO,
        DIRECCION,
        CORREO,
        CONTRASENA,
        CODIGOROL,
        CODIGOESTADO,
        ES_INTERNO
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'RES', 'ACTIVO', 1)`,
      [
        nombres,
        apellidos,
        cedula,
        fechaNacimiento || null,
        telefono,
        direccion || null,
        correo,
        hashedPassword
      ]
    );

    console.log('✅ Responsable creado con ID:', result.insertId);

    // Respuesta exitosa
    res.status(201).json({
      success: true,
      message: 'Responsable creado exitosamente',
      data: {
        id: result.insertId,
        nombres,
        apellidos,
        correo,
        rol: 'Responsable'
      }
    });

  } catch (error) {
    console.error('❌ Error al crear responsable:', error);
    res.status(500).json({
      error: 'Error al crear el responsable',
      details: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// Obtener todos los responsables
const obtenerResponsables = async (req, res) => {
  try {
    const [responsables] = await pool.execute(
      `SELECT 
        u.SECUENCIAL as id,
        u.NOMBRES,
        u.APELLIDOS,
        u.CEDULA,
        u.CORREO,
        u.TELEFONO,
        u.DIRECCION,
        u.FECHA_NACIMIENTO,
        u.CODIGOESTADO,
        DATE_FORMAT(u.FECHA_NACIMIENTO, '%d/%m/%Y') as date,
        r.NOMBRE as rol
       FROM usuario u
       LEFT JOIN rol_usuario r ON u.CODIGOROL = r.CODIGO
       WHERE u.CODIGOROL = 'RES'
       ORDER BY u.SECUENCIAL DESC`
    );

    res.json({
      success: true,
      data: responsables
    });
  } catch (error) {
    console.error('❌ Error al obtener responsables:', error);
    res.status(500).json({
      error: 'Error al obtener responsables',
      details: error.message
    });
  }
};


module.exports = {
  registrarUsuario,
  loginUsuario,
  registrarResponsable,  // NUEVO
  obtenerResponsables    // NUEVO
};