"use client"

import { useState, useEffect } from "react"
import { planosService, produtosService } from "../services/api"
import { useToast } from "../contexts/ToastContext"
import LoadingSpinner from "../components/LoadingSpinner"
import * as Dialog from "@radix-ui/react-dialog"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { PlusIcon, Pencil1Icon, Cross2Icon, TrashIcon } from "@radix-ui/react-icons"
import Select from "react-select"

const Planos = () => {
  const [planos, setPlanos] = useState([])
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [planoEditando, setPlanoEditando] = useState(null)
  const [planoExcluindo, setPlanoExcluindo] = useState(null)
  const { success, error } = useToast()

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    preco: "",
    frequencia: "mensal",
    ativo: true,
    produtos: [],
  })

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      const [planosRes, produtosRes] = await Promise.all([
        planosService.listar(),
        produtosService.listar({ limite: 1000 }), // Carregar todos os produtos para o select
      ])
      setPlanos(planosRes.data || [])
      setProdutos(
        produtosRes.data.produtos.map(p => ({ value: p.id, label: p.nome }))
      )
    } catch (err) {
      error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const abrirModal = (plano = null) => {
    if (plano) {
      setPlanoEditando(plano)
      setFormData({
        nome: plano.nome,
        descricao: plano.descricao || "",
        preco: plano.preco,
        frequencia: plano.frequencia,
        ativo: plano.ativo,
        produtos: (plano.produtos || []).map(p => ({ value: p.id, label: p.nome })),
      })
    } else {
      setPlanoEditando(null)
      setFormData({
        nome: "",
        descricao: "",
        preco: "",
        frequencia: "mensal",
        ativo: true,
        produtos: [],
      })
    }
    setModalAberto(true)
  }

  const fecharModal = () => setModalAberto(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        preco: Number(formData.preco),
        produtoIds: formData.produtos.map(p => p.value),
      }
      delete payload.produtos

      if (planoEditando) {
        await planosService.atualizar(planoEditando.id, payload)
        success("Plano atualizado com sucesso")
      } else {
        await planosService.criar(payload)
        success("Plano criado com sucesso")
      }
      fecharModal()
      carregarDados()
    } catch (err) {
      error(err.response?.data?.erro || "Erro ao salvar plano")
    }
  }

  const handleExcluir = async () => {
    if (!planoExcluindo) return;
    try {
      await planosService.excluir(planoExcluindo.id);
      success("Plano excluído com sucesso");
      setPlanoExcluindo(null);
      carregarDados();
    } catch (err) {
      error(err.response?.data?.erro || "Erro ao excluir plano");
      setPlanoExcluindo(null);
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planos de Assinatura</h1>
          <p className="text-gray-600">Gerencie os planos de assinatura da loja</p>
        </div>
        <button onClick={() => abrirModal()} className="btn btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          Novo Plano
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {planos.map((plano) => (
          <div key={plano.id} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{plano.nome}</h3>
              <span className={`status-badge ${plano.ativo ? "status-active" : "status-inactive"}`}>
                {plano.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
            <p className="text-2xl font-bold">R$ {plano.preco} <span className="text-sm font-normal">/ {plano.frequencia}</span></p>
            <p className="text-gray-600 mt-2">{plano.descricao}</p>
            <div className="mt-4">
              <h4 className="font-semibold">Produtos:</h4>
              <ul className="list-disc list-inside text-sm">
                {(plano.produtos || []).map(p => <li key={p.id}>{p.nome}</li>)}
              </ul>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => abrirModal(plano)} className="btn btn-icon btn-secondary" title="Editar">
                <Pencil1Icon className="w-4 h-4" />
              </button>
              <button onClick={() => setPlanoExcluindo(plano)} className="btn btn-icon btn-danger" title="Excluir">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog.Root open={modalAberto} onOpenChange={setModalAberto}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-lg z-50">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold">{planoEditando ? "Editar Plano" : "Novo Plano"}</Dialog.Title>
              <Dialog.Close asChild><button className="text-gray-400 hover:text-gray-600"><Cross2Icon className="w-5 h-5" /></button></Dialog.Close>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nome do Plano</label>
                <input type="text" name="nome" required className="input" value={formData.nome} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Preço (R$)</label>
                  <input type="number" name="preco" required className="input" value={formData.preco} onChange={handleChange} step="0.01" />
                </div>
                <div>
                  <label className="label">Frequência</label>
                  <select name="frequencia" value={formData.frequencia} onChange={handleChange} className="input">
                    <option value="mensal">Mensal</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Descrição</label>
                <textarea name="descricao" rows={3} className="input" value={formData.descricao} onChange={handleChange} />
              </div>
              <div>
                <label className="label">Produtos Inclusos</label>
                <Select
                  isMulti
                  name="produtos"
                  options={produtos}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  value={formData.produtos}
                  onChange={(selected) => setFormData(prev => ({ ...prev, produtos: selected }))}
                  placeholder="Selecione os produtos..."
                />
              </div>
              <div className="flex items-center">
                <input type="checkbox" name="ativo" id="ativo" className="mr-2" checked={formData.ativo} onChange={handleChange} />
                <label htmlFor="ativo" className="label">Plano Ativo</label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Dialog.Close asChild><button type="button" className="btn btn-secondary">Cancelar</button></Dialog.Close>
                <button type="submit" className="btn btn-primary">{planoEditando ? "Atualizar" : "Criar"}</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog.Root open={!!planoExcluindo} onOpenChange={() => setPlanoExcluindo(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50">
            <AlertDialog.Title className="text-lg font-semibold mb-2">Confirmar Exclusão</AlertDialog.Title>
            <AlertDialog.Description className="text-gray-600 mb-4">
              Tem certeza que deseja excluir o plano "{planoExcluindo?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialog.Description>
            <div className="flex justify-end gap-3">
              <AlertDialog.Cancel asChild><button className="btn btn-secondary">Cancelar</button></AlertDialog.Cancel>
              <AlertDialog.Action asChild><button onClick={handleExcluir} className="btn btn-danger">Sim, excluir</button></AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  )
}

export default Planos 