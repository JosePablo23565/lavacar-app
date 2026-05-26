import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home } from './components/Home'
import { AppointmentForm } from './components/AppointmentForm'
import { AdminLogin } from './pages/AdminLogin'
import { AdminDashboard } from './pages/AdminDashboard'
import { Contact } from './components/Contact'
import { Opiniones } from './components/Opiniones'
import { useState, useEffect } from 'react'

function NavBar() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [scrolling, setScrolling] = useState(false)

  // Detectar scroll para cambiar estilo del navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolling(true)
      } else {
        setScrolling(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Cerrar menú al hacer clic en un enlace
  const handleMenuClick = () => {
    setMenuAbierto(false)
  }

  // Prevenir scroll cuando el menú está abierto
  useEffect(() => {
    if (menuAbierto) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [menuAbierto])

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolling 
          ? 'bg-gradient-to-r from-blue-600 to-blue-800 shadow-xl backdrop-blur-sm bg-opacity-95' 
          : 'bg-gradient-to-r from-blue-500 to-blue-700 shadow-lg'
      }`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo con animación */}
            <div className="flex items-center space-x-2 group cursor-pointer">
              <div className="text-3xl transform transition-transform duration-300 group-hover:scale-110">
                🚗
              </div>
              <div className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Lavacar
              </div>
            </div>
            
            {/* Botón de menú hamburguesa con animación */}
            <button 
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="relative w-10 h-10 rounded-lg hover:bg-white/20 focus:outline-none transition-all duration-300 transform hover:scale-105"
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="space-y-1.5">
                  <span className={`block w-6 h-0.5 bg-white rounded-full transition-all duration-300 ${
                    menuAbierto ? 'rotate-45 translate-y-2' : ''
                  }`}></span>
                  <span className={`block w-6 h-0.5 bg-white rounded-full transition-all duration-300 ${
                    menuAbierto ? 'opacity-0' : ''
                  }`}></span>
                  <span className={`block w-6 h-0.5 bg-white rounded-full transition-all duration-300 ${
                    menuAbierto ? '-rotate-45 -translate-y-2' : ''
                  }`}></span>
                </div>
              </div>
            </button>
          </div>

          {/* Menú desplegable con animación */}
          <div className={`fixed top-16 left-0 right-0 bg-gradient-to-b from-blue-600 to-blue-800 shadow-2xl z-40 transition-all duration-300 ease-in-out ${
            menuAbierto ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
          }`}>
            <div className="py-4 space-y-1 max-w-6xl mx-auto px-4">
              <a 
                href="/" 
                onClick={handleMenuClick}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-200 transform hover:translate-x-1 group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">🏠</span>
                <span className="font-medium">Inicio</span>
              </a>
              <a 
                href="/agendar" 
                onClick={handleMenuClick}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-200 transform hover:translate-x-1 group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">📅</span>
                <span className="font-medium">Agendar Cita</span>
              </a>
              <a 
                href="/contacto" 
                onClick={handleMenuClick}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-200 transform hover:translate-x-1 group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">📞</span>
                <span className="font-medium">Contacto</span>
              </a>
              <a 
                href="/opiniones" 
                onClick={handleMenuClick}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-200 transform hover:translate-x-1 group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">⭐</span>
                <span className="font-medium">Opiniones</span>
              </a>
              <a 
                href="/login" 
                onClick={handleMenuClick}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-200 transform hover:translate-x-1 group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">🔐</span>
                <span className="font-medium">Admin</span>
              </a>
              <button 
                onClick={() => {
                  setShowLocationModal(true)
                  handleMenuClick()
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all duration-200 transform hover:translate-x-1 group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">📍</span>
                <span className="font-medium">Ubicación</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Fondo oscuro que tapa el contenido cuando el menú está abierto */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-35 transition-all duration-300 ${
          menuAbierto ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setMenuAbierto(false)}
      />

      {/* Espaciador para que el contenido no quede debajo del navbar fijo */}
      <div className="h-16"></div>

      {/* MODAL DE UBICACIÓN */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl transform animate-scaleIn">
            <div className="text-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
                <span className="text-4xl">📍</span>
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-center text-gray-800 mb-2">
              Nuestra Ubicación
            </h3>
            <p className="text-center text-gray-500 text-sm mb-6">
              ¡Ven y conócenos! 🚗
            </p>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-sm">
                  📍
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Dirección exacta:</p>
                  <p className="text-gray-600">
                    Bagaces, Guanacaste<br />
                    Costa Rica
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-2xl bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-sm">
                  ⏰
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=10.5218901,-85.2548091', '_blank')}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition flex items-center justify-center gap-2 font-semibold shadow-md"
              >
                🗺️ Abrir en Google Maps
              </button>
              <button
                onClick={() => setShowLocationModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition font-semibold"
              >
                ✖️ Cerrar
              </button>
            </div>
            
            <p className="text-center text-xs text-gray-400 mt-4">
              ¡Te esperamos con los mejores precios y calidad!
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
        .animate-pulse {
          animation: pulse 2s infinite;
        }
      `}</style>
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          {/* Home como página principal */}
          <Route path="/" element={<Home />} />
          
          {/* Rutas con NavBar */}
          <Route path="/agendar" element={
            <>
              <NavBar />
              <AppointmentForm />
            </>
          } />
          <Route path="/contacto" element={
            <>
              <NavBar />
              <Contact />
            </>
          } />
          <Route path="/opiniones" element={
            <>
              <NavBar />
              <Opiniones />
            </>
          } />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App