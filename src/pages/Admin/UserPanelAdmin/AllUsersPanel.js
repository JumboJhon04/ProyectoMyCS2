import React, { useEffect, useMemo, useState } from 'react';
import './AllUsersPanel.css';
import API_URL from '../../../config/api';

export default function AllUsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState(''); // Nuevo filtro por rol
  const [roles, setRoles] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState('');
  const [editingStatus, setEditingStatus] = useState('');
  const [saving, setSaving] = useState(false);

  // Cargar usuarios y roles
  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch(`${API_URL}/api/admins/usuarios/todos`),
        fetch(`${API_URL}/api/admins/roles/disponibles`)
      ]);

      if (!usersRes.ok) throw new Error('Error al cargar usuarios');
      if (!rolesRes.ok) throw new Error('Error al cargar roles');

      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();

      setUsers(usersData.data || []);
      // Filtrar roles para excluir INVITADO y USUARIO
      const rolesFiltered = (rolesData.data || []).filter(
        role => !['INV', 'OTRO'].includes(role.CODIGO)
      );
      setRoles(rolesFiltered);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    return users.filter(u => {
      const fullName = `${u.NOMBRES} ${u.APELLIDOS}`.toLowerCase();
      const matchesQuery = fullName.includes(query.toLowerCase()) || 
                          (u.CORREO || '').toLowerCase().includes(query.toLowerCase());
      const matchesRole = !roleFilter || u.CODIGOROL === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditingRole(user.CODIGOROL);
    setEditingStatus(user.CODIGOESTADO);
  };

  const handleSaveChanges = async () => {
    if (!editingUser) return;

    setSaving(true);
    try {
      // Actualizar rol si cambió
      if (editingRole !== editingUser.CODIGOROL) {
        const roleRes = await fetch(`${API_URL}/api/admins/usuarios/rol`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuarioId: editingUser.id,
            nuevoRol: editingRole
          })
        });

        if (!roleRes.ok) throw new Error('Error al actualizar rol');
      }

      // Actualizar estado si cambió
      if (editingStatus !== editingUser.CODIGOESTADO) {
        const statusRes = await fetch(`${API_URL}/api/admins/usuarios/estado`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuarioId: editingUser.id,
            nuevoEstado: editingStatus
          })
        });

        if (!statusRes.ok) throw new Error('Error al actualizar estado');
      }

      // Recargar usuarios
      await loadUsers();
      setEditingUser(null);
    } catch (err) {
      console.error('Error:', err);
      alert('Error guardando cambios: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getRoleLabel = (codigo) => {
    const role = roles.find(r => r.CODIGO === codigo);
    return role ? role.NOMBRE : codigo;
  };

  return (
    <div className="aup-wrapper aup-root">
      <div className="aup-header">
        <div className="aup-top">
          <div className="aup-title">Gestión de Usuarios</div>
          <div className="aup-stats">
            <span className="aup-badge">{users.length} usuarios</span>
          </div>
        </div>

        <div className="aup-search-row">
          <div className="aup-searchbox">
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              type="text" 
              placeholder="Buscar por nombre o email" 
              aria-label="Buscar usuarios"
            />
            <button type="button" className="aup-search-icon" title="Buscar" aria-label="Buscar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M20 20 L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="aup-role-filter"
          >
            <option value="">Todos los roles</option>
            {roles.map(role => (
              <option key={role.CODIGO} value={role.CODIGO}>
                {role.NOMBRE}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="aup-card">
        {loading ? (
          <div style={{padding:'24px', color:'#666', textAlign:'center'}}>
            Cargando usuarios...
          </div>
        ) : error ? (
          <div style={{padding:'24px', color:'#dc3545', textAlign:'center'}}>
            Error: {error}
          </div>
        ) : (
          <table className="aup-table" role="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Teléfono</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{padding:20, color:'#666', textAlign:'center'}}>
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                filtered.map(user => (
                  <tr key={user.id}>
                    <td data-label="Nombre">
                      <div className="aup-row-user">
                        <div className="aup-avatar">
                          {`${user.NOMBRES[0]}${user.APELLIDOS[0]}`.toUpperCase()}
                        </div>
                        <div>{`${user.NOMBRES} ${user.APELLIDOS}`}</div>
                      </div>
                    </td>
                    <td data-label="Email">{user.CORREO}</td>
                    <td data-label="Rol">
                      <span className="aup-role-badge">{getRoleLabel(user.CODIGOROL)}</span>
                    </td>
                    <td data-label="Estado">
                      <span className={`aup-status ${user.CODIGOESTADO === 'ACTIVO' ? 'active' : 'inactive'}`}>
                        {user.CODIGOESTADO}
                      </span>
                    </td>
                    <td data-label="Teléfono">{user.TELEFONO || 'N/A'}</td>
                    <td data-label="Acción">
                      <button 
                        className="aup-link-btn"
                        onClick={() => handleEditClick(user)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de edición */}
      {editingUser && (
        <div className="aup-modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="aup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="aup-modal-header">
              <h3>Editar Usuario</h3>
              <button className="aup-modal-close" onClick={() => setEditingUser(null)}>×</button>
            </div>

            <div className="aup-modal-content">
              <div className="aup-info-section">
                <h4>Información Personal</h4>
                <div className="aup-info-grid">
                  <div className="aup-info-item">
                    <span className="aup-label">Nombre:</span>
                    <span className="aup-value">{`${editingUser.NOMBRES} ${editingUser.APELLIDOS}`}</span>
                  </div>
                  <div className="aup-info-item">
                    <span className="aup-label">Email:</span>
                    <span className="aup-value">{editingUser.CORREO}</span>
                  </div>
                  <div className="aup-info-item">
                    <span className="aup-label">Cédula:</span>
                    <span className="aup-value">{editingUser.CEDULA}</span>
                  </div>
                  <div className="aup-info-item">
                    <span className="aup-label">Teléfono:</span>
                    <span className="aup-value">{editingUser.TELEFONO || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="aup-edit-section">
                <div className="aup-form-group">
                  <label>Rol</label>
                  <select 
                    value={editingRole} 
                    onChange={(e) => setEditingRole(e.target.value)}
                    className="aup-select"
                  >
                    {roles.map(role => (
                      <option key={role.CODIGO} value={role.CODIGO}>
                        {role.NOMBRE}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="aup-form-group">
                  <label>Estado</label>
                  <select 
                    value={editingStatus} 
                    onChange={(e) => setEditingStatus(e.target.value)}
                    className="aup-select"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="aup-modal-footer">
              <button 
                className="aup-btn-cancel" 
                onClick={() => setEditingUser(null)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                className="aup-btn-save" 
                onClick={handleSaveChanges}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
