import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Home } from './components/Home/Home'
import { AppointmentForm } from './components/AppointmentForm/AppointmentForm'
import { AdminDashboard } from './pages/AdminDashboard/AdminDashboard'
import { Contact } from './components/Contact/Contact'
import { Opiniones } from './components/Opiniones/Opiniones'
import { ClienteAuth } from './pages/ClienteAuth/ClienteAuth'
import { ActualizarContrasena } from './pages/ActualizarContrasena/ActualizarContrasena'
import { CompletarPerfil } from './pages/CompletarPerfil/CompletarPerfil'
import { RutaProtegida } from './components/RutaProtegida/RutaProtegida'
import { NavBar } from './components/NavBar/NavBar'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen">
          <Routes>
            <Route
              path="/"
              element={
                <RutaProtegida>
                  <>
                    <NavBar />
                    <Home />
                  </>
                </RutaProtegida>
              }
            />
            <Route
              path="/agendar"
              element={
                <RutaProtegida>
                  <>
                    <NavBar />
                    <AppointmentForm />
                  </>
                </RutaProtegida>
              }
            />
            <Route
              path="/contacto"
              element={
                <RutaProtegida>
                  <>
                    <NavBar />
                    <Contact />
                  </>
                </RutaProtegida>
              }
            />
            <Route
              path="/opiniones"
              element={
                <RutaProtegida>
                  <>
                    <NavBar />
                    <Opiniones />
                  </>
                </RutaProtegida>
              }
            />
            <Route path="/acceder" element={<ClienteAuth />} />
            <Route path="/completar-perfil" element={<CompletarPerfil />} />
            <Route path="/actualizar-contrasena" element={<ActualizarContrasena />} />
            <Route
              path="/admin"
              element={
                <RutaProtegida>
                  <>
                    <NavBar />
                    <AdminDashboard />
                  </>
                </RutaProtegida>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
