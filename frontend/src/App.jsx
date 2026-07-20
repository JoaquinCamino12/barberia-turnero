import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

let rawApiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/turnos/';
if (rawApiUrl && !rawApiUrl.startsWith('http://') && !rawApiUrl.startsWith('https://')) {
  rawApiUrl = `https://${rawApiUrl}`;
}
const API_URL = rawApiUrl;


// Generate time slots from 9:00 to 13:00 and 16:00 to 21:00
const generateTimeSlots = () => {
  const slots = [];
  
  // Morning: 9:00 to 12:30
  for(let h = 9; h < 13; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  
  // Afternoon: 16:00 to 21:00 (21:00 is allowed, serializer: 16 <= hora_turno <= 21)
  // To allow exactly 21:00 and 21:30? The serializer says `16 <= hora_turno <= 21`. 
  // If `hora_turno` is 21, it allows 21:00 and 21:30.
  for(let h = 16; h <= 21; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

function App() {
  const [turnos, setTurnos] = useState([]);
  
  // Today's date as default (YYYY-MM-DD)
  // Handle timezone offset so today is correct locally
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
    servicio: 'Corte'
  });
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const obtenerTurnos = async () => {
    try {
      const respuesta = await axios.get(API_URL);
      setTurnos(respuesta.data);
    } catch (error) {
      console.error("Error al traer los turnos:", error);
    }
  };

  useEffect(() => {
    obtenerTurnos();
  }, []);

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
    setHoraSeleccionada(''); // Reset time when date changes
    
    // Check if it's Monday
    const dateObj = new Date(selectedDate + 'T00:00:00');
    if (dateObj.getDay() === 1) {
      setMensaje({ texto: 'Los lunes estamos cerrados. Por favor elige otro día.', tipo: 'error' });
    } else {
      setMensaje({ texto: '', tipo: '' });
    }
  };

  // Extract occupied times for the selected date
  const occupiedTimes = turnos
    .filter(t => t.fecha_hora.startsWith(fechaSeleccionada))
    .map(t => {
      // Backend naive date returns like "2026-07-14T17:00:00"
      const timePart = t.fecha_hora.split('T')[1];
      if (timePart) {
        const [hours, minutes] = timePart.split(':');
        return `${hours}:${minutes}`;
      }
      return '';
    });

  const reservarTurno = async (e) => {
    e.preventDefault();
    setMensaje({ texto: '', tipo: '' });

    if (!horaSeleccionada) {
      setMensaje({ texto: 'Por favor, selecciona un horario.', tipo: 'error' });
      return;
    }

    const fechaHora = `${fechaSeleccionada}T${horaSeleccionada}:00`;

    const dataToSend = {
      ...nuevoTurno,
      fecha_hora: fechaHora
    };

    try {
      await axios.post(API_URL, dataToSend);
      setMensaje({ texto: '¡Turno reservado con éxito!', tipo: 'exito' });
      setNuevoTurno({ cliente: '', telefono: '', servicio: 'Corte' });
      setHoraSeleccionada('');
      obtenerTurnos(); // Refresh occupied slots
    } catch (error) {
      if (error.response && error.response.data) {
        const errData = error.response.data;
        if (errData.fecha_hora) setMensaje({ texto: errData.fecha_hora[0], tipo: 'error' });
        else if (errData.non_field_errors) setMensaje({ texto: errData.non_field_errors[0], tipo: 'error' });
        else setMensaje({ texto: 'Revisa los datos ingresados.', tipo: 'error' });
      } else {
        setMensaje({ texto: 'No se pudo conectar con el servidor.', tipo: 'error' });
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
          <h2>Reserva tu Turno</h2>
          
          {mensaje.texto && (
            <div className={`alert ${mensaje.tipo === 'exito' ? 'success' : 'error'}`}>
              {mensaje.texto}
            </div>
          )}

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
              <label>Teléfono:</label>
              <input 
                type="text" 
                name="telefono" 
                value={nuevoTurno.telefono} 
                onChange={handleInputChange} 
                placeholder="Opcional"
              />
            </div>

            <div className="form-group">
              <label>Servicio:</label>
              <select 
                name="servicio" 
                value={nuevoTurno.servicio} 
                onChange={handleInputChange}
              >
                <option value="Corte">Corte de Cabello</option>
                <option value="Barba">Perfilado/Corte de Barba</option>
                <option value="Combo">Combo (Corte + Barba)</option>
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
                    
                    // Check if the time has already passed today
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