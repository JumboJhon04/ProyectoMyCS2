import React, { useEffect, useMemo, useState } from 'react';
import './UserPanelAdmin.css';
import NewResponsableModal from './NewResponsableModal';
import ViewResponsableModal from './ViewResponsableModal';

export default function UserPanelAdmin(){
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Cargar responsables desde el backend
  const loadResponsables = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/auth/responsables');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar responsables');
      }

      setUsers(data.data || []);
    } catch (err) {
      console.error('Error al cargar responsables:', err);
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResponsables();
  }, []);

  const filtered = useMemo(() => {
    return users.filter(u => {
      const fullName = `${u.NOMBRES} ${u.APELLIDOS}`.toLowerCase();
      const matchesQuery = fullName.includes(query.toLowerCase()) || 
                          (u.CORREO || '').toLowerCase().includes(query.toLowerCase());
      return matchesQuery;
    });
  }, [users, query]);

  const handleCreateResponsable = (newResponsable) => {
    console.log('Responsable creado:', newResponsable);
    loadResponsables();
  };

  const handleViewInfo = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  return (
    <div className="upa-wrapper upa-root">
      <div className="upa-header">
        <div className="upa-top">
          <div className="upa-title">Usuarios Responsables</div>
          <button className="upa-add-btn" onClick={() => setIsModalOpen(true)}>
            Añadir nuevo responsable
          </button>
        </div>

        <div className="upa-search-row">
          <div className="upa-searchbox">
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              type="text" 
              placeholder="Buscar por nombre o email" 
              aria-label="Buscar por nombre" 
            />
            <button type="button" className="upa-search-icon" title="Buscar" aria-label="Buscar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M20 20 L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="upa-card">
        {loading ? (
          <div style={{padding:'24px', color:'#666', textAlign:'center'}}>
            Cargando usuarios...
          </div>
        ) : error ? (
          <div style={{padding:'24px', color:'#dc3545', textAlign:'center'}}>
            Error: {error}
          </div>
        ) : (
          <table className="upa-table" role="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Fecha de nacimiento</th>
                <th>Teléfono</th>
                <th>Ver</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{padding:20, color:'#666', textAlign:'center'}}>
                    No se encontraron responsables.
                  </td>
                </tr>
              ) : (
                filtered.map(user => (
                  <tr key={user.id}>
                    <td data-label="Nombre">
                      <div className="upa-row-user">
                        <div className="upa-avatar">
                          {`${user.NOMBRES[0]}${user.APELLIDOS[0]}`.toUpperCase()}
                        </div>
                        <div>{`${user.NOMBRES} ${user.APELLIDOS}`}</div>
                      </div>
                    </td>
                    <td data-label="Email">{user.CORREO}</td>
                    <td data-label="Fecha de nacimiento">{user.date || 'N/A'}</td>
                    <td data-label="Teléfono">{user.TELEFONO || 'N/A'}</td>
                    <td data-label="Ver">
                      <a 
                        className="upa-link" 
                        onClick={() => handleViewInfo(user)}
                        style={{cursor:'pointer'}}
                      >
                        ver información
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal para crear nuevo responsable */}
      <NewResponsableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateResponsable}
      />

      {/* Modal para ver información del responsable */}
      <ViewResponsableModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedUser(null);
        }}
        responsable={selectedUser}
      />
    </div>
  );
}