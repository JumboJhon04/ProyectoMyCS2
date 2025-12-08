/**
 * Helper para construir URLs absolutas de imágenes
 * Funciona tanto en desarrollo como en producción
 */

/**
 * Construye una URL absoluta para una imagen
 * @param {string} relativePath - Ruta relativa de la imagen (ej: "uploads/eventos/imagen.jpg")
 * @param {Object} req - Objeto request de Express (opcional)
 * @returns {string} URL absoluta de la imagen
 */
const buildImageUrl = (relativePath, req = null) => {
  if (!relativePath) return null;

  // Si ya es una URL absoluta, retornarla tal cual
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }

  // Si tenemos el objeto req, usar su información para construir la URL
  if (req) {
    // En producción, siempre usar HTTPS
    // Detectar si está en Render (production)
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
    const protocol = isProduction ? 'https' : (req.protocol || 'http');
    const host = req.get('host') || 'localhost:5000';
    return `${protocol}://${host}/${relativePath}`;
  }

  // Si no hay req, usar variable de entorno o default
  const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
  const protocol = isProduction ? 'https' : 'http';
  const baseUrl = process.env.API_BASE_URL || process.env.SERVER_URL || `${protocol}://localhost:5000`;
  return `${baseUrl}/${relativePath}`;
};

/**
 * Construye URLs para múltiples imágenes
 * @param {Array} images - Array de objetos con propiedad URL_IMAGEN o similar
 * @param {Object} req - Objeto request de Express (opcional)
 * @param {string} imageKey - Nombre de la propiedad que contiene la ruta (default: 'URL_IMAGEN')
 * @returns {Array} Array de objetos con URLs absolutas
 */
const buildImageUrls = (images, req = null, imageKey = 'URL_IMAGEN') => {
  if (!Array.isArray(images)) return images;

  return images.map(img => ({
    ...img,
    [imageKey]: buildImageUrl(img[imageKey], req)
  }));
};

module.exports = {
  buildImageUrl,
  buildImageUrls
};
