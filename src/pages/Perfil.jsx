"use client"

import { useState, useEffect } from "react"
import { usuariosService } from "../services/api"
import { useToast } from "../contexts/ToastContext"
import LoadingSpinner from "../components/LoadingSpinner"

const Perfil = () => {
    const [formData, setFormData] = useState({ nome: "", email: "", senhaAtual: "", novaSenha: "" })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { success, error } = useToast()

    const carregarPerfil = async () => {
        try {
            setLoading(true)
            const response = await usuariosService.perfil()
            const { nome, email } = response.data
            setFormData({ nome, email, senhaAtual: "", novaSenha: "" })
        } catch (err) {
            error("Erro ao carregar perfil")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        carregarPerfil()
    }, [])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            setSaving(true)
            const response = await usuariosService.atualizarPerfil(formData)
            success(response.data.mensagem || "Perfil atualizado com sucesso")
        } catch (err) {
            error(err.response?.data?.erro || "Erro ao atualizar perfil")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
                <p className="text-gray-600">Atualize seus dados</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                        Nome
                    </label>
                    <input
                        type="text"
                        id="nome"
                        name="nome"
                        className="input"
                        required
                        value={formData.nome}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        className="input"
                        required
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label htmlFor="senhaAtual" className="block text-sm font-medium text-gray-700 mb-1">
                        Senha Atual (se for trocar)
                    </label>
                    <input
                        type="password"
                        id="senhaAtual"
                        name="senhaAtual"
                        className="input"
                        value={formData.senhaAtual}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label htmlFor="novaSenha" className="block text-sm font-medium text-gray-700 mb-1">
                        Nova Senha
                    </label>
                    <input
                        type="password"
                        id="novaSenha"
                        name="novaSenha"
                        className="input"
                        value={formData.novaSenha}
                        onChange={handleChange}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="submit" disabled={saving} className="btn btn-primary">
                        {saving ? "Salvando..." : "Salvar Perfil"}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default Perfil
