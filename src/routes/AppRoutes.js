import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Landing from '../pages/Landing';
import Courses from '../pages/Courses';
import Contact from '../pages/Contact';
import AuthLogin from '../pages/Auth/Login';
import AuthRegister from '../pages/Auth/Register';
import PaymentPage from '../pages/PaymentPage/PaymentPage';

import AdminPanel from '../pages/Admin/AdminPanel/AdminPanel';
import EventoAdmin from '../pages/Admin/EventoAdmin/EventoAdmin';
import UserPanelAdmin from '../pages/Admin/UserPanelAdmin/UserPanelAdmin';
import SolicitudesAdmin from '../pages/Admin/SolicitudesAdmin/SolicitudesAdmin';
import PeticionesCambioAdmin from '../pages/Admin/PeticionesCambioAdmin/PeticionesCambioAdmin';
import LandingAdminAdvanced from '../pages/Admin/LandingAdmin/LandingAdminAdvanced';

import ResponsableProfile from '../pages/Responsable/ProfileResponsable/Profile';
import EventoResponsable from '../pages/Responsable/EventoResponsable/EventoResponsable';
import UsersResponsable from '../pages/Responsable/UsersResponsable/UsersResponsable';

import EstudiantePanel from '../pages/User/Estudiante/EstudiantePanel/EstudiantePanel';
import EstudianteEvents from '../pages/User/Estudiante/EventoEstudiante/EstudianteEvents';
import EstudianteTest from '../pages/User/Estudiante/EstudianteTest/EstudianteTest';
import EstudianteCourseDetail from '../pages/User/Estudiante/EstudianteCourseDetail/EstudianteCourseDetail';

import ProfesorPanel from '../pages/User/Profesor/ProfesorPanel/ProfesorPanel';
import ProfesorModules from '../pages/User/Profesor/ProfesorModules/ProfesorModules';
import ProfesorTest from '../pages/User/Profesor/ProfesorTest/ProfesorTest';
import ProfesorCourseDetail from '../pages/User/Profesor/ProfesorCourseDetail/ProfesorCourseDetail';

import UserPanel from '../pages/User/UserPanel';
import SolicitudSoporte from '../pages/User/SolicitudSoporte/SolicitudSoporte';


import Perfil from '../pages/Perfil/Perfil';
import ProtectedRoute from '../components/ProtectedRoute';
import ProfesorGrading from '../pages/User/Profesor/ProfesorGrading/ProfesorGrading';
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthLogin />} />
      <Route path="/register" element={<AuthRegister />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/courses/:courseId" element={<EstudianteCourseDetail />} />
      <Route path="/payment/:courseId" element={<PaymentPage />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/profesor/grading/:taskId" element={
        <ProtectedRoute>
          <ProfesorGrading />
        </ProtectedRoute>
      } />
      {/* Admin protected */}
      <Route path="/admin/panel" element={
        <ProtectedRoute requireAdmin={true}>
          <AdminPanel />
        </ProtectedRoute>
      } />
      <Route path="/admin/events" element={
        <ProtectedRoute requireAdmin={true}>
          <EventoAdmin />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute requireAdmin={true}>
          <UserPanelAdmin />
        </ProtectedRoute>
      } />
      <Route path="/admin/solicitudes" element={
        <ProtectedRoute requireAdmin={true}>
          <SolicitudesAdmin />
        </ProtectedRoute>
      } />
      <Route path="/admin/peticiones-cambio" element={
        <ProtectedRoute requireAdmin={true}>
          <PeticionesCambioAdmin />
        </ProtectedRoute>
      } />
      <Route path="/admin/landing" element={
        <ProtectedRoute requireAdmin={true}>
          <LandingAdminAdvanced />
        </ProtectedRoute>
      } />

      {/* Responsable protected */}
      <Route path="/responsable/profile" element={
        <ProtectedRoute requireResponsable={true}>
          <ResponsableProfile />
        </ProtectedRoute>
      } />
      <Route path="/responsable/events" element={
        <ProtectedRoute requireResponsable={true}>
          <EventoResponsable />
        </ProtectedRoute>
      } />
      <Route path="/responsable/users" element={
        <ProtectedRoute requireResponsable={true}>
          <UsersResponsable />
        </ProtectedRoute>
      } />

      {/* Estudiante / User protected (authenticated) */}
      <Route path="/user/panel" element={
        <ProtectedRoute>
          <EstudiantePanel />
        </ProtectedRoute>
      } />
      <Route path="/user/events" element={
        <ProtectedRoute>
          <EstudianteEvents />
        </ProtectedRoute>
      } />
      <Route path="/user/tests" element={
        <ProtectedRoute>
          <EstudianteTest />
        </ProtectedRoute>
      } />
      <Route path="/user/course/:courseId" element={
        <ProtectedRoute>
          <EstudianteCourseDetail />
        </ProtectedRoute>
      } />
      <Route path="/user/solicitud-soporte" element={
        <ProtectedRoute>
          <SolicitudSoporte />
        </ProtectedRoute>
      } />

      {/* Perfil (acceso para cualquier usuario autenticado) */}
      <Route path="/perfil" element={
        <ProtectedRoute>
          <Perfil />
        </ProtectedRoute>
      } />

      {/* Profesor protected */}
      <Route path="/profesor/panel" element={
        <ProtectedRoute>
          <ProfesorPanel />
        </ProtectedRoute>
      } />
      <Route path="/profesor/modules" element={
        <ProtectedRoute>
          <ProfesorModules />
        </ProtectedRoute>
      } />
      <Route path="/profesor/test" element={
        <ProtectedRoute>
          <ProfesorTest />
        </ProtectedRoute>
      } />
      <Route path="/profesor/course/:courseId" element={
        <ProtectedRoute>
          <ProfesorCourseDetail />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
