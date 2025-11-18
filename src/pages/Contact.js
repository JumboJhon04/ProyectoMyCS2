import React, { useState } from 'react';
import './landing.css';
import PublicHeader from '../components/PublicHeader/PublicHeader';

export default function Contact() {
  const [form, setForm] = useState({ name:'', email:'', message:'' });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const onSubmit = (e) => {
    e.preventDefault();
    alert('Gracias, mensaje enviado (simulado).');
    setForm({ name:'', email:'', message:'' });
  };

  return (
    <div>
      <PublicHeader />
      <div style={{ padding:'28px 0' }}>
      <div style={{ maxWidth:800, margin:'0 auto', padding:'0 16px', background:'#fff', borderRadius:8, boxShadow:'0 6px 18px rgba(0,0,0,0.03)', paddingTop:18 }}>
        <h2 style={{ marginLeft:12 }}>Contacto</h2>
        <form onSubmit={onSubmit} style={{ padding:12, display:'grid', gap:12 }}>
          <input name="name" value={form.name} onChange={onChange} placeholder="Tu nombre" style={{ padding:10, borderRadius:6, border:'1px solid #e0e6ea' }} />
          <input name="email" value={form.email} onChange={onChange} placeholder="Tu correo" style={{ padding:10, borderRadius:6, border:'1px solid #e0e6ea' }} />
          <textarea name="message" value={form.message} onChange={onChange} placeholder="Tu mensaje" rows={6} style={{ padding:10, borderRadius:6, border:'1px solid #e0e6ea' }} />
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-primary" type="submit">Enviar</button>
            <button className="btn" type="button" onClick={() => setForm({ name:'', email:'', message:'' })}>Limpiar</button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
