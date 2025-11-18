import React, { useState, useEffect } from "react";
import { useCourses } from "../../../context/CoursesContext";
import "./EventoResponsable.css";

const NewEventModal = ({ isOpen, onClose, course }) => {
  const { updateCourse } = useCourses();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Curso");
  const [attendanceRequired, setAttendanceRequired] = useState("");
  const [passingGrade, setPassingGrade] = useState("");
  const [capacity, setCapacity] = useState("");
  const [hours, setHours] = useState("");
  const [modality, setModality] = useState("Presencial");
  const [cost, setCost] = useState("");
  const [teacher, setTeacher] = useState("");
  const [objective, setObjective] = useState("");
  const [topics, setTopics] = useState([""]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ✅ NUEVO: Estados para carreras
  const [carrerasDisponibles, setCarrerasDisponibles] = useState([]);
  const [carrerasSeleccionadas, setCarrerasSeleccionadas] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // ✅ CARGAR CARRERAS AL MONTAR EL COMPONENTE
  useEffect(() => {
    const fetchCarreras = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/carreras");
        const data = await response.json();
        if (data.success) {
          setCarrerasDisponibles(data.data);
        }
      } catch (err) {
        console.error("Error cargando carreras:", err);
      }
    };

    fetchCarreras();
  }, []);

  useEffect(() => {
    if (course) {
      setTitle(course.title || "");
      setType(course.meta?.type || "Curso");
      setAttendanceRequired(course.meta?.attendanceRequired || "");
      setPassingGrade(course.meta?.passingGrade || "");
      setCapacity(course.meta?.capacity || "");
      setHours(course.meta?.hours || "");
      setModality(course.meta?.modality || "Presencial");
      setCost(course.price != null ? String(course.price) : "");
      setTeacher(course.meta?.teacher || "");
      setObjective(course.meta?.objective || "");
      setStartDate(course.meta?.startDate || "");
      setEndDate(course.meta?.endDate || "");

      // ✅ CARGAR CARRERAS SELECCIONADAS
      setCarrerasSeleccionadas(course.meta?.carreras || []);

      const coursTopics = course.meta?.topics;
      if (Array.isArray(coursTopics) && coursTopics.length > 0) {
        setTopics(coursTopics);
      } else {
        setTopics([""]);
      }

      setImagePreview(course.imageUrl || "");
      setImageFile(null);
      setError(null);
    }
  }, [course]);

  if (!isOpen || !course) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTopicChange = (index, value) => {
    setTopics((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const addTopic = () => {
    setTopics((prev) => [...prev, ""]);
  };

  const removeTopic = (index) => {
    if (topics.length > 1) {
      setTopics((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // ✅ MANEJAR SELECCIÓN DE CARRERAS
  const handleCarreraChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) =>
      parseInt(option.value)
    );
    setCarrerasSeleccionadas(selectedOptions);
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  
  if (!title.trim()) {
    return setError('El nombre del evento es obligatorio');
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return setError('La fecha de inicio no puede ser posterior a la fecha de fin');
  }

  // ✅ LOGS PARA DEBUGUEAR
  console.log('🔍 MODAL - Carreras seleccionadas:', carrerasSeleccionadas);
  console.log('🔍 MODAL - Tipo de carreras:', typeof carrerasSeleccionadas, Array.isArray(carrerasSeleccionadas));

  const updated = {
    title: title.trim(),
    description: objective || '',
    price: cost ? Number(cost) : 0,
    imageFile: imageFile,
    meta: {
      type,
      attendanceRequired,
      passingGrade: passingGrade ? Number(passingGrade) : null,
      capacity,
      hours,
      modality,
      teacher,
      objective,
      topics: topics.filter((t) => t && t.trim()),
      isPaid: cost && Number(cost) > 0,
      startDate,
      endDate,
      carreras: carrerasSeleccionadas // ✅ Asegurarse que sea un array
    },
  };

  console.log('📦 MODAL - Objeto completo a enviar:', updated);
  console.log('📦 MODAL - Carreras en meta:', updated.meta.carreras);

  try {
    setSaving(true);
    await updateCourse(course.id, updated);
    setSaving(false);
    onClose();
  } catch (err) {
    console.error(err);
    setSaving(false);
    setError(err.message || 'Error guardando cambios. Intente de nuevo.');
  }
};
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal edit-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
        }}
      >
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <h3 className="modal-title">EDITAR EVENTO</h3>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-content">
            {/* Imagen */}
            <div className="form-group">
              <label>Imagen del evento:</label>
              {imagePreview && (
                <div style={{ marginBottom: "10px" }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "200px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
            {/* Nombre y Tipo */}
            <div className="two-col-grid">
              <div className="form-group">
                <label>Nombre del evento: *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nombre del evento"
                  required
                />
              </div>

              <div className="form-group">
                <label>Tipo de evento: *</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option>Curso</option>
                  <option>Taller</option>
                  <option>Seminario</option>
                  <option>Conferencia</option>
                </select>
              </div>
            </div>
            {/* Fechas */}
            <div className="two-col-grid">
              <div className="form-group">
                <label>Fecha de inicio:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Fecha de fin:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            {/* Asistencia y Nota */}
            <div className="two-col-grid">
              <div className="form-group">
                <label>Asistencia de aprobación (%):</label>
                <input
                  type="number"
                  value={attendanceRequired}
                  onChange={(e) => setAttendanceRequired(e.target.value)}
                  placeholder="70"
                  min="0"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label>Nota de aprobación:</label>
                <input
                  type="number"
                  step="0.01"
                  value={passingGrade}
                  onChange={(e) => setPassingGrade(e.target.value)}
                  placeholder="7.00"
                  min="0"
                  max="10"
                />
              </div>
            </div>
            {/* Capacidad y Horas */}
            <div className="two-col-grid">
              <div className="form-group">
                <label>Capacidad máxima:</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="30"
                />
              </div>

              <div className="form-group">
                <label>Número de horas:</label>
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="40"
                />
              </div>
            </div>
            {/* Modalidad y Costo */}
            <div className="two-col-grid">
              <div className="form-group">
                <label>Modalidad:</label>
                <select
                  value={modality}
                  onChange={(e) => setModality(e.target.value)}
                >
                  <option>Presencial</option>
                  <option>Virtual</option>
                  <option>Híbrido</option>
                </select>
              </div>

              <div className="form-group">
                <label>Costo ($):</label>
                <input
                  type="number"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  min="0"
                />
              </div>
            </div>
            {/* ✅ CARRERAS (MULTIPLE SELECT) y Docente */}
            // ✅ CARRERAS AGRUPADAS POR FACULTAD
            <div className="form-group">
              <label>Carreras (mantén Ctrl para seleccionar varias):</label>
              <select
                multiple
                value={carrerasSeleccionadas.map(String)}
                onChange={handleCarreraChange}
                style={{
                  minHeight: "150px",
                  width: "100%",
                  padding: "8px",
                }}
              >
                {(() => {
                  // Agrupar carreras por facultad
                  const facultades = {};
                  carrerasDisponibles.forEach((carrera) => {
                    const facultad = carrera.NOMBRE_FACULTAD || "Sin Facultad";
                    if (!facultades[facultad]) {
                      facultades[facultad] = [];
                    }
                    facultades[facultad].push(carrera);
                  });

                  // Renderizar optgroups
                  return Object.keys(facultades)
                    .sort()
                    .map((facultadNombre) => (
                      <optgroup key={facultadNombre} label={facultadNombre}>
                        {facultades[facultadNombre].map((carrera) => (
                          <option
                            key={carrera.SECUENCIAL}
                            value={carrera.SECUENCIAL}
                          >
                            {carrera.NOMBRE_CARRERA}
                          </option>
                        ))}
                      </optgroup>
                    ));
                })()}
              </select>
              <small
                style={{
                  color: "#666",
                  fontSize: "12px",
                  marginTop: "4px",
                  display: "block",
                }}
              >
                {carrerasSeleccionadas.length} carrera(s) seleccionada(s)
              </small>
            </div>
            {/* Objetivo */}
            <div className="form-group">
              <label>Objetivo:</label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Describe el objetivo del evento"
                rows="3"
              />
            </div>
            {/* Temas */}
            <div className="form-group">
              <label>Temas:</label>
              {Array.isArray(topics) &&
                topics.map((t, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", gap: "8px", marginBottom: "8px" }}
                  >
                    <input
                      value={t}
                      onChange={(e) => handleTopicChange(i, e.target.value)}
                      placeholder={`Tema ${i + 1}`}
                      style={{ flex: 1 }}
                    />
                    {topics.length > 1 && (
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => removeTopic(i)}
                        style={{ padding: "8px 12px" }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              <button
                type="button"
                className="btn-secondary"
                onClick={addTopic}
                style={{ marginTop: "8px" }}
              >
                + Agregar tema
              </button>
            </div>
            {error && (
              <div
                style={{
                  color: "red",
                  padding: "10px",
                  backgroundColor: "#ffe6e6",
                  borderRadius: "4px",
                  marginTop: "10px",
                }}
              >
                {error}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewEventModal;
