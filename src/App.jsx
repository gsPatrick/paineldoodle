"use client"
import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./contexts/AuthContext"
import Layout from "./components/Layout"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Usuarios from "./pages/Usuarios"
import Produtos from "./pages/Produtos"
import Categorias from "./pages/Categorias"
import Pedidos from "./pages/Pedidos"
import Cupons from "./pages/Cupons"
import Relatorios from "./pages/Relatorios"
import Blog from "./pages/Blog"
import Configuracoes from "./pages/Configuracoes"
import LoadingSpinner from "./components/LoadingSpinner"
import Perfil from "./pages/Perfil"
import Fretes from "./pages/MetodosFrete"
import Planos from "./pages/Planos"
import Assinantes from "./pages/Assinantes"
// Componente de rota protegida
const ProtectedRoute = ({ element }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <LoadingSpinner />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return element
}

// Componente de rota administrativa
const AdminRoute = ({ element }) => {
  const { isAdmin, loading } = useAuth()

  if (loading) return <LoadingSpinner />

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar o painel administrativo.</p>
          <button onClick={() => {
            localStorage.removeItem("token")
            window.location.href = "/login"
          }} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Voltar para o login</button>
        </div>
      </div>
    )
  }

  return element
}

// Componente para redirecionamento condicional na rota de login
const LoginRoute = () => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <LoadingSpinner />

  // Se já estiver autenticado, redireciona para o dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Login />
}

function App() {
  const { loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />

      <Route
        path="/"
        element={<ProtectedRoute element={<Navigate to="/dashboard" replace />} />}
      />

      <Route
        path="/dashboard"
        element={<AdminRoute element={<Layout><Dashboard /></Layout>} />}
      />

      <Route
        path="/usuarios"
        element={<AdminRoute element={<Layout><Usuarios /></Layout>} />}
      />

      <Route
        path="/produtos"
        element={<AdminRoute element={<Layout><Produtos /></Layout>} />}
      />

      <Route
        path="/categorias"
        element={<AdminRoute element={<Layout><Categorias /></Layout>} />}
      />

      <Route
        path="/pedidos"
        element={<AdminRoute element={<Layout><Pedidos /></Layout>} />}
      />

      <Route
        path="/cupons"
        element={<AdminRoute element={<Layout><Cupons /></Layout>} />}
      />

      <Route
        path="/relatorios"
        element={<AdminRoute element={<Layout><Relatorios /></Layout>} />}
      />

      <Route
        path="/blog"
        element={<AdminRoute element={<Layout><Blog /></Layout>} />}
      />

      <Route
        path="/fretes"
        element={<AdminRoute element={<Layout><Fretes /></Layout>} />}
      />

      <Route
        path="/configuracoes"
        element={<AdminRoute element={<Layout><Configuracoes /></Layout>} />}
      />

      <Route
        path="/perfil"
        element={<AdminRoute element={<Layout><Perfil /></Layout>} />}
      />

      <Route
        path="/planos"
        element={<AdminRoute element={<Layout><Planos /></Layout>} />}
      />

      <Route
        path="/assinantes"
        element={<AdminRoute element={<Layout><Assinantes /></Layout>} />}
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
