import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = 'https://cbachat.vercel.app/api/v1/appointments/public/';
const TENANT_SLUG = 'barberia-turnero';

// Generate time slots from 9:00 to 13:00 and 16:00 to 21:00
const generateTimeSlots = () => {
  const slots = [];
  
  // Morning: 9:00 to 12:30
  for(let h = 9; h < 13; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  
  // Afternoon: 16:00 to 21:00
  for(let h = 16; h <= 21; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

function App() {
  const [modo, setModo] = useState('reservar'); // 'reservar' | 'cancelar'
  const [occupiedTimes, setOccupiedTimes] = useState([]);
  
  const nowLocal = new Date();
  const year = nowLocal.getFullYear();
  const month = (nowLocal.getMonth() + 1).toString().padStart(2, '0');
  const day = nowLocal.getDate().toString().padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  const [fechaSeleccionada, setFechaSeleccionada] = useState(todayStr);
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [nuevoTurno, setNuevoTurno] = useState({
    cliente: '',
    telefono: '',
    servicio: 'Corte Clásico'
  });
  const [telefonoCancelar, setTelefonoCancelar] = useState('');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const obtenerTurnosOcupados = async (fecha) => {
    try {
      const respuesta = await axios.get(`${API_BASE_URL}slots/`, {
        params: { tenant: TENANT_SLUG, date: fecha }
      });
      setOccupiedTimes(respuesta.data.occupied_slots || []);
    } catch (error) {
      console.error("Error al traer los horarios ocupados:", error);
      setOccupiedTimes([]);
    }
  };

  useEffect(() => {
    obtenerTurnosOcupados(fechaSeleccionada);
  }, [fechaSeleccionada]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoTurno({
      ...nuevoTurno,
      [name]: value
    });
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setFechaSeleccionada(selectedDate);
    setHoraSeleccionada('');
    
    const dateObj = new Date(selectedDate + 'T00:00:00');
    if (dateObj.getDay() === 1) {
      setMensaje({ texto: 'Los lunes estamos cerrados. Por favor elige otro día.', tipo: 'error' });
    } else {
      setMensaje({ texto: '', tipo: '' });
    }
  };

  const reservarTurno = async (e) => {
    e.preventDefault();
    setMensaje({ texto: '', tipo: '' });

    if (!horaSeleccionada) {
      setMensaje({ texto: 'Por favor, selecciona un horario disponible.', tipo: 'error' });
      return;
    }

    if (!nuevoTurno.telefono) {
      setMensaje({ texto: 'El número de teléfono es obligatorio.', tipo: 'error' });
      return;
    }

    const fechaHora = `${fechaSeleccionada}T${horaSeleccionada}:00`;

    const dataToSend = {
      tenant: TENANT_SLUG,
      cliente: nuevoTurno.cliente,
      telefono: nuevoTurno.telefono,
      servicio: nuevoTurno.servicio,
      fecha_hora: fechaHora
    };

    try {
      const res = await axios.post(`${API_BASE_URL}book/`, dataToSend);
      setMensaje({ texto: res.data.message || '¡Turno reservado con éxito!', tipo: 'exito' });
      setNuevoTurno({ cliente: '', telefono: '', servicio: 'Corte Clásico' });
      setHoraSeleccionada('');
      obtenerTurnosOcupados(fechaSeleccionada);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setMensaje({ texto: error.response.data.error, tipo: 'error' });
      } else {
        setMensaje({ texto: 'No se pudo procesar la reserva. Intenta nuevamente.', tipo: 'error' });
      }
    }
  };

  const cancelarTurno = async (e) => {
    e.preventDefault();
    setMensaje({ texto: '', tipo: '' });

    if (!telefonoCancelar) {
      setMensaje({ texto: 'Por favor ingresa tu número de teléfono.', tipo: 'error' });
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}cancel/`, {
        tenant: TENANT_SLUG,
        telefono: telefonoCancelar
      });
      setMensaje({ texto: res.data.message || 'Turno cancelado con éxito.', tipo: 'exito' });
      setTelefonoCancelar('');
      obtenerTurnosOcupados(fechaSeleccionada);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setMensaje({ texto: error.response.data.error, tipo: 'error' });
      } else {
        setMensaje({ texto: 'No se encontró un turno activo para ese número de teléfono.', tipo: 'error' });
      }
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <nav className="navbar">
        <div className="logo">BARBERÍA</div>
        <ul className="nav-links">
          <li><a href="#inicio">Inicio</a></li>
          <li><a href="#servicios">Servicios</a></li>
          <li><a href="#reservar">Reservar</a></li>
        </ul>
      </nav>

      {/* Hero Section */}
      <header id="inicio" className="hero">
        <h1>Elegancia & Estilo</h1>
        <p>Experimenta el arte del cuidado masculino con nuestros barberos profesionales.</p>
        <a href="#reservar" className="btn-primary">Agenda tu Cita</a>
      </header>

      {/* Services Section */}
      <section id="servicios" className="services">
        <h2>Nuestros Servicios</h2>
        <div className="services-grid">
          <div className="service-card">
            <h3>Corte Clásico</h3>
            <p>Diseño y precisión. Adaptamos las últimas tendencias a tu estilo personal.</p>
          </div>
          <div className="service-card">
            <h3>Perfilado de Barba</h3>
            <p>Ritual de toallas calientes, navaja tradicional y productos premium.</p>
          </div>
          <div className="service-card">
            <h3>Combo Premium</h3>
            <p>La experiencia completa: corte de cabello y arreglo de barba al detalle.</p>
          </div>
        </div>
      </section>

      {/* Reservation Section */}
      <section id="reservar" className="reservation">
        <div className="reservation-container">
          <h2>Gestión de Turnos</h2>

          {/* Tab Buttons */}
          <div className="tab-buttons">
            <button 
              type="button" 
              className={`tab-btn ${modo === 'reservar' ? 'active' : ''}`}
              onClick={() => { setModo('reservar'); setMensaje({ texto: '', tipo: '' }); }}
            >
              📅 Agendar Turno
            </button>
            <button 
              type="button" 
              className={`tab-btn ${modo === 'cancelar' ? 'active' : ''}`}
              onClick={() => { setModo('cancelar'); setMensaje({ texto: '', tipo: '' }); }}
            >
              ❌ Cancelar mi Turno
            </button>
          </div>
          
          {mensaje.texto && (
            <div className={`alert ${mensaje.tipo === 'exito' ? 'success' : 'error'}`}>
              {mensaje.texto}
            </div>
          )}

          {modo === 'reservar' ? (
            <form onSubmit={reservarTurno}>
              <div className="form-group">
                <label>Nombre Completo:</label>
                <input 
                  type="text" 
                  name="cliente" 
                  value={nuevoTurno.cliente} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="Ej. Juan Pérez"
                />
              </div>

              <div className="form-group">
                <label>Teléfono (WhatsApp):</label>
                <input 
                  type="text" 
                  name="telefono" 
                  value={nuevoTurno.telefono} 
                  onChange={handleInputChange} 
                  required
                  placeholder="Ej. 3511234567 (Obligatorio)"
                />
              </div>

              <div className="form-group">
                <label>Servicio:</label>
                <select 
                  name="servicio" 
                  value={nuevoTurno.servicio} 
                  onChange={handleInputChange}
                >
                  <option value="Corte Clásico">Corte de Cabello</option>
                  <option value="Perfilado de Barba">Perfilado/Corte de Barba</option>
                  <option value="Combo Premium">Combo (Corte + Barba)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Fecha del Turno:</label>
                <input 
                  type="date" 
                  value={fechaSeleccionada}
                  min={todayStr}
                  onChange={handleDateChange} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Horarios Disponibles:</label>
                {new Date(fechaSeleccionada + 'T00:00:00').getDay() === 1 ? (
                  <div style={{ color: '#dc3545', fontWeight: 'bold', padding: '10px 0', textAlign: 'center', backgroundColor: 'rgba(220, 53, 69, 0.1)', borderRadius: '4px' }}>
                    Cerrado los Lunes
                  </div>
                ) : (
                  <div className="time-grid">
                    {TIME_SLOTS.map(time => {
                      const isOccupied = occupiedTimes.includes(time);
                      const isSelected = horaSeleccionada === time;
                      
                      let isPast = false;
                      if (fechaSeleccionada === todayStr) {
                        const now = new Date();
                        const currentHour = now.getHours();
                        const currentMinute = now.getMinutes();
                        const [slotHour, slotMin] = time.split(':').map(Number);
                        
                        if (slotHour < currentHour || (slotHour === currentHour && slotMin <= currentMinute)) {
                          isPast = true;
                        }
                      }

                      const disabled = isOccupied || isPast;
                      
                      let statusClass = 'free';
                      if (disabled) statusClass = 'occupied';
                      else if (isSelected) statusClass = 'selected';

                      return (
                        <div 
                          key={time} 
                          className={`time-slot ${statusClass}`}
                          onClick={() => {
                            if (!disabled) setHoraSeleccionada(time);
                          }}
                        >
                          {time}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Confirmar Reserva
              </button>
            </form>
          ) : (
            <form onSubmit={cancelarTurno}>
              <div className="form-group">
                <label>Ingresa tu Número de Teléfono:</label>
                <input 
                  type="text" 
                  value={telefonoCancelar} 
                  onChange={(e) => setTelefonoCancelar(e.target.value)} 
                  required 
                  placeholder="Ej. 3511234567"
                />
              </div>

              <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                Buscaremos tu último turno activo registrado con este número para cancelarlo y liberar el horario.
              </p>

              <button type="submit" className="btn-danger">
                Confirmar Cancelación de Turno
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <h2 className="logo">BARBERÍA</h2>
        <p>Elegancia y precisión en cada corte.</p>
        <p>&copy; {new Date().getFullYear()} <span className="footer-gold">Barbería Turnero</span>. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default App;