"use client"

import { useState, useEffect } from "react"
import { categoriasService } from "../services/api"
import { useToast } from "../contexts/ToastContext"
import LoadingSpinner from "../components/LoadingSpinner"
import * as Dialog from "@radix-ui/react-dialog"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { PlusIcon, Pencil1Icon, TrashIcon, Cross2Icon } from "@radix-ui/react-icons"

const Categorias = () => {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [categoriaEditando, setCategoriaEditando] = useState(null)
  const [categoriaExcluindo, setCategoriaExcluindo] = useState(null)
  const { success, error } = useToast()

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    ativo: true,
  })

  useEffect(() => {
    carregarCategorias()
  }, [])

  const carregarCategorias = async () => {
    try {
      setLoading(true)
      const response = await categoriasService.listar()
      setCategorias(response.data)
    } catch (err) {
      error("Erro ao carregar categorias")
    } finally {
      setLoading(false)
    }
  }

  const abrirModal = (categoria = null) => {
    if (categoria) {
      setCategoriaEditando(categoria)
      setFormData({
        nome: categoria.nome,
        descricao: categoria.descricao || "",
        ativo: categoria.ativo,
      })
    } else {
      setCategoriaEditando(null)
      setFormData({
        nome: "",
        descricao: "",
        ativo: true,
      })
    }
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
    setCategoriaEditando(null)
    setFormData({
      nome: "",
      descricao: "",
      ativo: true,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (categoriaEditando) {
        await categoriasService.atualizar(categoriaEditando.id, formData)
        success("Categoria atualizada com sucesso")
      } else {
        await categoriasService.criar(formData)
        success("Categoria criada com sucesso")
      }
      fecharModal()
      carregarCategorias()
    } catch (err) {
      error(err.response?.data?.message || "Erro ao salvar categoria")
    }
  }

  const confirmarExclusao = async () => {
    try {
      await categoriasService.excluir(categoriaExcluindo.id)
      success("Categoria excluída com sucesso")
      setCategoriaExcluindo(null)
      carregarCategorias()
    } catch (err) {
      error("Erro ao excluir categoria")
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
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-600">Gerencie as categorias de produtos</p>
        </div>
        <button onClick={() => abrirModal()} className="btn btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          Nova Categoria
        </button>
      </div>

      {/* Grid de Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categorias.map((categoria) => (
          <div key={categoria.id} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{categoria.nome}</h3>
                {categoria.descricao && <p className="text-gray-600 text-sm mt-1">{categoria.descricao}</p>}
              </div>
              <span className={`status-badge ${categoria.ativo ? "status-active" : "status-inactive"}`}>
                {categoria.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => abrirModal(categoria)}
                className="btn btn-icon btn-secondary"
                title="Editar"
              >
                <Pencil1Icon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCategoriaExcluindo(categoria)}
                className="btn btn-icon btn-danger"
                title="Excluir"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {categorias.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">Nenhuma categoria encontrada</div>
          <button onClick={() => abrirModal()} className="btn btn-primary">
            Criar primeira categoria
          </button>
        </div>
      )}

      {/* Modal de Edição/Criação */}
      <Dialog.Root open={modalAberto} onOpenChange={setModalAberto}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold">
                {categoriaEditando ? "Editar Categoria" : "Nova Categoria"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-gray-400 hover:text-gray-600">
                  <Cross2Icon className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  name="nome"
                  required
                  className="input"
                  value={formData.nome}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  name="descricao"
                  rows={3}
                  className="input"
                  value={formData.descricao}
                  onChange={handleChange}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="ativo"
                  id="ativo"
                  className="mr-2"
                  checked={formData.ativo}
                  onChange={handleChange}
                />
                <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                  Categoria ativa
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Dialog.Close asChild>
                  <button type="button" className="btn btn-secondary">
                    Cancelar
                  </button>
                </Dialog.Close>
                <button type="submit" className="btn btn-primary">
                  {categoriaEditando ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog.Root open={!!categoriaExcluindo} onOpenChange={() => setCategoriaExcluindo(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50">
            <AlertDialog.Title className="text-lg font-semibold mb-2">Confirmar Exclusão</AlertDialog.Title>
            <AlertDialog.Description className="text-gray-600 mb-4">
              Tem certeza que deseja excluir a categoria "{categoriaExcluindo?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialog.Description>
            <div className="flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <button className="btn btn-secondary">Cancelar</button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button onClick={confirmarExclusao} className="btn btn-danger">
                  Excluir
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  )
}

export default Categorias
