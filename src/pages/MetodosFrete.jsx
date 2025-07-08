"use client"

import React, { useState, useEffect } from "react"
import { freteService } from "../services/api"
import { useToast } from "../contexts/ToastContext"
import LoadingSpinner from "../components/LoadingSpinner"
import * as Dialog from "@radix-ui/react-dialog"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { PlusIcon, Pencil1Icon, TrashIcon, Cross2Icon } from "@radix-ui/react-icons"

const MetodosFrete = () => {
    const [metodos, setMetodos] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalAberto, setModalAberto] = useState(false)
    const [metodoEditando, setMetodoEditando] = useState(null)
    const [metodoExcluindo, setMetodoExcluindo] = useState(null)
    const { success, error } = useToast()
    const [formData, setFormData] = useState({
        titulo: "",
        descricao: "",
        valor: "",
        prazoEntrega: "",
        ativo: true,
    })

    useEffect(() => { carregarMetodos() }, [])

    const carregarMetodos = async () => {
        setLoading(true)
        try {
            const res = await freteService.listarMetodos()
            setMetodos(res.data)
        } catch (err) {
            error("Erro ao carregar métodos de frete")
        } finally {
            setLoading(false)
        }
    }

    const abrirModal = (metodo = null) => {
        if (metodo) {
            setMetodoEditando(metodo)
            setFormData({
                titulo: metodo.titulo,
                descricao: metodo.descricao || "",
                valor: metodo.valor.toString(),
                prazoEntrega: metodo.prazoEntrega.toString(),
                ativo: metodo.ativo,
            })
        } else {
            setMetodoEditando(null)
            setFormData({ titulo: "", descricao: "", valor: "", prazoEntrega: "", ativo: true })
        }
        setModalAberto(true)
    }

    const fecharModal = () => setModalAberto(false)

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const dados = {
                titulo: formData.titulo,
                descricao: formData.descricao,
                valor: parseFloat(formData.valor),
                prazoEntrega: parseInt(formData.prazoEntrega),
                ativo: formData.ativo,
            }
            if (metodoEditando) {
                await freteService.atualizarMetodo(metodoEditando.id, dados)
                success("Método atualizado")
            } else {
                await freteService.criarMetodo(dados)
                success("Método criado")
            }
            carregarMetodos()
            fecharModal()
        } catch (err) {
            error(err.response?.data?.erro || "Erro ao salvar método")
        }
    }

    const confirmarRemocao = async () => {
        try {
            await freteService.removerMetodo(metodoExcluindo.id)
            success("Método removido")
            setMetodoExcluindo(null)
            carregarMetodos()
        } catch (err) {
            error("Erro ao remover método")
        }
    }

    if (loading) {
        return (<div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Métodos de Frete</h1>
                    <p className="text-gray-600">Gerencie métodos de frete personalizados</p>
                </div>
                <button onClick={() => abrirModal()} className="btn btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" /> Novo Método
                </button>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Título</th>
                                <th>Valor</th>
                                <th>Prazo (dias)</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {metodos.map(m => (
                                <tr key={m.id}>
                                    <td>{m.titulo}</td>
                                    <td>R$ {parseFloat(m.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td>{m.prazoEntrega}</td>
                                    <td>
                                        <span className={`status-badge ${m.ativo ? 'status-active' : 'status-inactive'}`}>
                                            {m.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="flex gap-2">
                                        <button onClick={() => abrirModal(m)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md" title="Editar"><Pencil1Icon className="w-4 h-4" /></button>
                                        <button onClick={() => setMetodoExcluindo(m)} className="p-2 text-red-600 hover:bg-red-50 rounded-md" title="Excluir"><TrashIcon className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog.Root open={modalAberto} onOpenChange={setModalAberto}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
                    <Dialog.Content className="fixed bg-white rounded-lg p-6 w-full max-w-md z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <Dialog.Title className="text-lg font-bold mb-4">{metodoEditando ? 'Editar Método' : 'Novo Método'}</Dialog.Title>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Título</label>
                                <input name="titulo" value={formData.titulo} onChange={handleChange} required className="input w-full mt-1" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Descrição</label>
                                <textarea name="descricao" value={formData.descricao} onChange={handleChange} className="input w-full mt-1" rows={3} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium">Valor (R$)</label>
                                    <input name="valor" type="number" step="0.01" value={formData.valor} onChange={handleChange} required className="input w-full mt-1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Prazo (dias)</label>
                                    <input name="prazoEntrega" type="number" value={formData.prazoEntrega} onChange={handleChange} required className="input w-full mt-1" />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" name="ativo" id="ativo" checked={formData.ativo} onChange={handleChange} className="mr-2" />
                                <label htmlFor="ativo">Ativo</label>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Dialog.Close asChild><button type="button" className="btn btn-secondary">Cancelar</button></Dialog.Close>
                                <button type="submit" className="btn btn-primary">Salvar</button>
                            </div>
                        </form>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <AlertDialog.Root open={!!metodoExcluindo} onOpenChange={() => setMetodoExcluindo(null)}>
                <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
                    <AlertDialog.Content className="fixed bg-white rounded-lg p-6 w-full max-w-sm z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <AlertDialog.Title className="text-lg font-bold">Confirmar Exclusão</AlertDialog.Title>
                        <AlertDialog.Description className="mt-2 text-gray-600">Tem certeza que deseja remover o método "{metodoExcluindo?.titulo}"?</AlertDialog.Description>
                        <div className="flex justify-end gap-2 pt-4">
                            <AlertDialog.Cancel asChild><button className="btn btn-secondary">Cancelar</button></AlertDialog.Cancel>
                            <AlertDialog.Action asChild><button onClick={confirmarRemocao} className="btn btn-danger">Excluir</button></AlertDialog.Action>
                        </div>
                    </AlertDialog.Content>
                </AlertDialog.Portal>
            </AlertDialog.Root>
        </div>
    )
}

export default MetodosFrete 