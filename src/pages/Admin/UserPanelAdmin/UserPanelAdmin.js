import React, { useEffect, useMemo, useState } from 'react';
import './UserPanelAdmin.css';

const SAMPLE_USERS = [
  {
    id:1,
    name:'Alex Albornoz',
    email:'wpillapa8482@uta.edu.ec',
    date:'13/07/2023',
    phone:'0912569348',
    role: 'responsable'
  },
  {
    id:2,
    name:'Matías Carrasco',
    email:'ftravez7536@uta.edu.ec',
    date:'27/06/2023',
    phone:'0963851207',
    role: 'responsable'
  }
];

export default function UserPanelAdmin(){
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // intenta cargar desde un endpoint real si lo tienes
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('No API');
        const data = await res.json();
        if (!cancelled) setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        // fallback a datos mock locales si no hay backend
        if (!cancelled) setUsers(SAMPLE_USERS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchesQuery = u.name.toLowerCase().includes(query.toLowerCase()) || (u.email || '').toLowerCase().includes(query.toLowerCase());
      const matchesRole = roleFilter ? (u.role === roleFilter) : true;
      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  return (
    <div className="upa-wrapper upa-root">
      <div className="upa-header">
        <div className="upa-top">
          <div className="upa-title">Usuarios Responsables</div>
          <button className="upa-add-btn">Añadir nuevo responsable</button>
        </div>

        <div className="upa-search-row">
          <div className="upa-searchbox">
            <input value={query} onChange={(e)=>setQuery(e.target.value)} type="text" placeholder="Nombre o email" aria-label="Buscar por nombre" />
            <select value={roleFilter} onChange={(e)=>setRoleFilter(e.target.value)} aria-label="Roles">
              <option value="">Roles</option>
              <option value="admin">Admin</option>
              <option value="responsable">Responsable</option>
            </select>
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
          <div style={{padding:'24px', color:'#666'}}>Cargando usuarios...</div>
        ) : (
          <table className="upa-table" role="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Fecha de creacion</th>
                <th>Telefono</th>
                <th>Ver</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{padding:20,color:'#666'}}>No se encontraron usuarios.</td>
                </tr>
              ) : (
                filtered.map(user => (
                  <tr key={user.id}>
                    <td data-label="Nombre">
                      <div className="upa-row-user">
                        <div className="upa-avatar">{(user.name||'').split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
                        <div>{user.name}</div>
                      </div>
                    </td>
                    <td data-label="Email">{user.email}</td>
                    <td data-label="Fecha de creacion">{user.date || ''}</td>
                    <td data-label="Telefono">{user.phone || ''}</td>
                    <td data-label="Ver"><a className="upa-link">ver informacion</a></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
