"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { api } from "../services/api"

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token")
      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`
        try {
          await loadUser()
        } catch (error) {
          console.error("Erro ao carregar usuário:", error)
          logout()
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const loadUser = async () => {
    try {
      const response = await api.get("/usuarios/perfil")
      setUser(response.data)
      return response.data
    } catch (error) {
      console.error("Erro ao carregar perfil:", error)
      if (error.response?.status === 401) {
        logout()
      }
      throw error
    }
  }

  const login = async (email, senha) => {
    try {
      const response = await api.post("/auth/login", { email, senha })
      const { token, usuario } = response.data

      localStorage.setItem("token", token)
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(usuario)

      return { success: true }
    } catch (error) {
      console.error("Erro de login:", error)
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao fazer login",
      }
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    delete api.defaults.headers.common["Authorization"]
    setUser(null)
    window.location.href = "/login"
  }

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.tipo === "admin",
    refreshUser: loadUser // Adicionando método para atualizar dados do usuário
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
