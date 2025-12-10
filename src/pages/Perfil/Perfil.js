import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../../context/UserContext';
import API_URL from '../../config/api';
import './Perfil.css';
import { FaUser, FaCamera, FaEdit, FaSave, FaTimes, FaFileUpload, FaTrash, FaPen } from 'react-icons/fa';

const Perfil = () => {
  const { user, setUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    fotoPerfil: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        nombres: user.nombres || user.NOMBRES || '',
        apellidos: user.apellidos || user.APELLIDOS || '',
        telefono: user.telefono || user.TELEFONO || '',
        fotoPerfil: user.fotoPerfil || user.FOTO_PERFIL || user.foto || ''
      });
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [user, isEditing]);

  useEffect(() => {
    fetchLatestProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLatestProfile = async () => {
    if (!user || (!user.id && !user.SECUENCIAL)) return;

    try {
      const id = user.id || user.SECUENCIAL;
      const response = await fetch(`${API_URL}/api/users/${id}/profile`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const userData = data.data;
          setFormData({
            nombres: userData.NOMBRES || userData.nombres || '',
            apellidos: userData.APELLIDOS || userData.apellidos || '',
            telefono: userData.TELEFONO || userData.telefono || '',
            fotoPerfil: userData.FOTO_PERFIL || userData.fotoPerfil || userData.foto || ''
          });
          setUser(prev => ({
            ...prev, 
            ...userData,
            nombres: userData.NOMBRES || userData.nombres,
            apellidos: userData.APELLIDOS || userData.apellidos,
            telefono: userData.TELEFONO || userData.telefono,
            fotoPerfil: userData.FOTO_PERFIL || userData.fotoPerfil || userData.foto
          }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch fresh profile", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData(prev => ({
        ...prev,
        fotoPerfil: ''
    }));
  };

  const startCamera = async () => {
    try {
      setShowCamera(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("No se pudo acceder a la cámara. Verifique los permisos.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      canvasRef.current.toBlob((blob) => {
        if (blob) {
            const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
            setSelectedFile(file);
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            stopCamera();
        }
      }, 'image/jpeg');
    }
  };

  useEffect(() => {
    if (showCamera && videoRef.current && stream) {
        videoRef.current.srcObject = stream;
    }
  }, [showCamera, stream]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg('');

    try {
      const id = user.id || user.SECUENCIAL;
      
      const data = new FormData();
      data.append('nombres', formData.nombres);
      data.append('apellidos', formData.apellidos);
      data.append('telefono', formData.telefono);
      
      if (selectedFile) {
        data.append('fotoPerfil', selectedFile);
      } else {
        data.append('fotoPerfil', formData.fotoPerfil);
      }

      const response = await fetch(`${API_URL}/api/users/${id}/profile`, {
        method: 'PUT',
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar perfil');
      }

      setSuccessMsg('Guardado correctamente');
      setIsEditing(false);
      
      setUser(prev => ({
        ...prev,
        ...result.data,
        nombres: result.data.NOMBRES || result.data.nombres,
        apellidos: result.data.APELLIDOS || result.data.apellidos,
        telefono: result.data.TELEFONO || result.data.telefono,
        fotoPerfil: result.data.FOTO_PERFIL || result.data.fotoPerfil || result.data.foto,
        foto: result.data.FOTO_PERFIL || result.data.fotoPerfil || result.data.foto
      }));

      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedStoredUser = {
          ...storedUser,
          ...result.data,
          nombres: result.data.NOMBRES || result.data.nombres,
          apellidos: result.data.APELLIDOS || result.data.apellidos,
          telefono: result.data.TELEFONO || result.data.telefono,
          fotoPerfil: result.data.FOTO_PERFIL || result.data.fotoPerfil || result.data.foto,
          foto: result.data.FOTO_PERFIL || result.data.fotoPerfil || result.data.foto
      };
      localStorage.setItem('user', JSON.stringify(updatedStoredUser));

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setSuccessMsg('');
  };

  if (!user) return <div className="profile-wrapper">Cargando...</div>;

  let avatarSrc = null;
  if (isEditing) {
      if (previewUrl) avatarSrc = previewUrl;
      else if (formData.fotoPerfil) avatarSrc = formData.fotoPerfil;
  } else {
      if (user.fotoPerfil || user.FOTO_PERFIL || user.foto) avatarSrc = user.fotoPerfil || user.FOTO_PERFIL || user.foto;
  }

  const userRole = user?.rol || user?.codigoRol === 'ADM' ? 'Administrador' : 'Estudiante';

  return (
    <div className="profile-wrapper">
      <div className="profile-card-split">
        
        {/* LEFT PANEL: Avatar & Identity */}
        <div className="profile-left-panel">
            <div className="profile-avatar-container">
                {avatarSrc ? (
                    <img 
                        src={avatarSrc} 
                        alt="Perfil" 
                        className="profile-avatar" 
                        onError={(e) => {e.target.onerror = null; e.target.src = '';}} 
                    />
                ) : (
                    <div className="profile-avatar-placeholder">
                        <FaUser />
                    </div>
                )}
                {isEditing && avatarSrc && (
                    <button type="button" className="btn-icon-delete" onClick={handleRemovePhoto}>
                        <FaTrash />
                    </button>
                )}
            </div>
            
            <h2 className="profile-name-display">
                {isEditing ? 'Editando Perfil' : `${formData.nombres} ${formData.apellidos}`}
            </h2>
            <span className="profile-role-badge">{userRole}</span>

            {!isEditing && (
                 <button className="btn-edit-toggle" onClick={() => setIsEditing(true)}>
                    <FaPen /> Editar
                 </button>
            )}
        </div>

        {/* RIGHT PANEL: Details & Form */}
        <div className="profile-right-panel">
            
            <div className="profile-content-header">
                <h3>Información Personal</h3>
                {(successMsg || error) && (
                    <div className={`status-message ${error ? 'error' : 'success'}`}>
                        {successMsg || error}
                    </div>
                )}
            </div>

            <div className="profile-scroll-area">
                {!isEditing ? (
                    <div className="info-grid">
                         <div className="info-item">
                            <span className="info-label">Nombres</span>
                            <span className="info-value">{formData.nombres}</span>
                         </div>
                         <div className="info-item">
                            <span className="info-label">Apellidos</span>
                            <span className="info-value">{formData.apellidos}</span>
                         </div>
                         <div className="info-item">
                            <span className="info-label">Teléfono</span>
                            <span className="info-value">{formData.telefono || 'No registrado'}</span>
                         </div>
                         <div className="info-item">
                            <span className="info-label">Cédula</span>
                            <span className="info-value">{user.cedula || user.CEDULA || 'N/A'}</span>
                         </div>
                         <div className="info-item full">
                            <span className="info-label">Correo Electrónico</span>
                            <span className="info-value">{user.correo || user.CORREO || user.email}</span>
                         </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="compact-form">
                        <div className="form-row">
                             <div className="form-group">
                                <label>Nombres</label>
                                <input
                                    type="text"
                                    name="nombres"
                                    value={formData.nombres}
                                    onChange={handleChange}
                                    required
                                />
                             </div>
                             <div className="form-group">
                                <label>Apellidos</label>
                                <input
                                    type="text"
                                    name="apellidos"
                                    value={formData.apellidos}
                                    onChange={handleChange}
                                    required
                                />
                             </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Teléfono</label>
                                <input
                                    type="tel"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                    placeholder="099..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Cédula</label>
                                <input
                                    type="text"
                                    value={user.cedula || user.CEDULA || ''}
                                    disabled
                                    className="input-disabled"
                                    style={{backgroundColor: '#f1f5f9', color: '#64748b'}}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Foto de Perfil</label>
                            <div className="media-selector-compact">
                                <label className="media-btn">
                                    <input type="file" accept="image/*" onChange={handleFileSelect} hidden />
                                    <FaFileUpload /> Subir
                                </label>
                                <button type="button" className="media-btn" onClick={startCamera}>
                                    <FaCamera /> Cámara
                                </button>
                                <input
                                    type="text"
                                    name="fotoPerfil"
                                    className="url-input-compact"
                                    value={formData.fotoPerfil}
                                    onChange={handleChange}
                                    placeholder="O URL..."
                                    disabled={!!selectedFile}
                                />
                            </div>
                            {selectedFile && <div className="file-selected-badge">{selectedFile.name}</div>}
                        </div>

                        <div className="form-actions-footer">
                            <button type="button" className="btn-secondary" onClick={handleCancel}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? '...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
      </div>

      {showCamera && (
        <div className="camera-overlay">
            <div className="camera-box">
                <video ref={videoRef} autoPlay playsInline></video>
                <canvas ref={canvasRef} style={{display: 'none'}}></canvas>
                <div className="camera-actions">
                    <button type="button" className="btn-secondary" onClick={stopCamera}>Cancelar</button>
                    <button type="button" className="btn-primary" onClick={capturePhoto}>
                        <FaCamera /> Capturar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Perfil;
