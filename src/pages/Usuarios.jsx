"use client"

import { useState, useEffect } from "react"
import { usuariosService } from "../services/api"
import { useToast } from "../contexts/ToastContext"
import LoadingSpinner from "../components/LoadingSpinner"
import * as Dialog from "@radix-ui/react-dialog"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { MagnifyingGlassIcon, PlusIcon, Pencil1Icon, TrashIcon, Cross2Icon } from "@radix-ui/react-icons"

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [modalAberto, setModalAberto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState(null)
  const [usuarioExcluindo, setUsuarioExcluindo] = useState(null)
  const { success, error } = useToast()

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    tipo: "cliente",
    ativo: true,
    senha: "",
    novaSenha: "",
  })

  useEffect(() => {
    carregarUsuarios()
  }, [pagina, busca])

  const carregarUsuarios = async () => {
    try {
      setLoading(true)
      const response = await usuariosService.listar({
        pagina,
        limite: 10,
        busca: busca || undefined,
      })
      setUsuarios(response.data.usuarios || response.data)
      setTotal(response.data.total || response.data.length)
    } catch (err) {
      error("Erro ao carregar usuários")
    } finally {
      setLoading(false)
    }
  }

  const handleBusca = (e) => {
    setBusca(e.target.value)
    setPagina(1)
  }

  const abrirModal = (usuario = null) => {
    if (usuario) {
      setUsuarioEditando(usuario)
      setFormData({
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        ativo: usuario.ativo,
        senha: "",
        novaSenha: "",
      })
    } else {
      setUsuarioEditando(null)
      setFormData({
        nome: "",
        email: "",
        tipo: "cliente",
        ativo: true,
        senha: "",
        novaSenha: "",
      })
    }
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
    setUsuarioEditando(null)
    setFormData({
      nome: "",
      email: "",
      tipo: "cliente",
      ativo: true,
      senha: "",
      novaSenha: "",
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const dados = {
        nome: formData.nome,
        email: formData.email,
        tipo: formData.tipo,
        ativo: formData.ativo,
    }

    try {
      if (usuarioEditando) {
        if (formData.novaSenha) {
            dados.novaSenha = formData.novaSenha;
        }
        await usuariosService.atualizar(usuarioEditando.id, dados)
        success("Usuário atualizado com sucesso")
      } else {
        dados.novaSenha = formData.senha;
        await usuariosService.criar(dados)
        success("Usuário criado com sucesso")
      }
      fecharModal()
      carregarUsuarios()
    } catch (err) {
      error(err.response?.data?.message || "Erro ao salvar usuário")
    }
  }

  const confirmarExclusao = async () => {
    try {
      await usuariosService.excluir(usuarioExcluindo.id)
      success("Usuário excluído com sucesso")
      setUsuarioExcluindo(null)
      carregarUsuarios()
    } catch (err) {
      error("Erro ao excluir usuário")
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const totalPages = Math.ceil(total / 10);

  if (loading && usuarios.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600">Gerencie os usuários do sistema</p>
        </div>
        <button onClick={() => abrirModal()} className="btn btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar usuários..."
              className="input pl-10"
              value={busca}
              onChange={handleBusca}
            />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Data de Criação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td className="font-medium">{usuario.nome}</td>
                  <td>{usuario.email}</td>
                  <td>
                    <span className={`status-badge ${usuario.tipo === "admin" ? "status-active" : "status-pending"}`}>
                      {usuario.tipo === "admin" ? "Admin" : "Cliente"}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${usuario.ativo ? "status-active" : "status-inactive"}`}>
                      {usuario.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>{new Date(usuario.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => abrirModal(usuario)}
                        className="btn btn-icon btn-secondary"
                        title="Editar"
                      >
                        <Pencil1Icon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setUsuarioExcluindo(usuario)}
                        className="btn btn-icon btn-danger"
                        title="Excluir"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {usuarios.length === 0 && <div className="text-center py-8 text-gray-500">Nenhum usuário encontrado</div>}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPagina(pagina - 1)}
              disabled={pagina <= 1 || loading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="px-4 py-2 text-sm">
              Página {pagina} de {totalPages}
            </span>
            <button
              onClick={() => setPagina(pagina + 1)}
              disabled={pagina >= totalPages || loading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {/* Modal de Edição/Criação */}
      <Dialog.Root open={modalAberto} onOpenChange={setModalAberto}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold">
                {usuarioEditando ? "Editar Usuário" : "Novo Usuário"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-gray-400 hover:text-gray-600">
                  <Cross2Icon className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nome</label>
                  <input type="text" name="nome" required className="input" value={formData.nome} onChange={handleChange} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" name="email" required className="input" value={formData.email} onChange={handleChange} />
                </div>
              </div>

              {!usuarioEditando && (
                <div>
                  <label className="label">Senha</label>
                  <input type="password" name="senha" required={!usuarioEditando} className="input" value={formData.senha} onChange={handleChange} />
                </div>
              )}

              {usuarioEditando && (
                 <div>
                  <label className="label">Nova Senha (deixe em branco para não alterar)</label>
                  <input type="password" name="novaSenha" className="input" value={formData.novaSenha} onChange={handleChange} />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Tipo</label>
                  <select name="tipo" className="input" value={formData.tipo} onChange={handleChange}>
                    <option value="cliente">Cliente</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <input type="checkbox" name="ativo" id="ativo" className="mr-2" checked={formData.ativo} onChange={handleChange} />
                  <label htmlFor="ativo" className="label">Usuário ativo</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Dialog.Close asChild>
                  <button type="button" className="btn btn-secondary">
                    Cancelar
                  </button>
                </Dialog.Close>
                <button type="submit" className="btn btn-primary">
                  {usuarioEditando ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog.Root open={!!usuarioExcluindo} onOpenChange={() => setUsuarioExcluindo(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50">
            <AlertDialog.Title className="text-lg font-semibold mb-2">Confirmar Exclusão</AlertDialog.Title>
            <AlertDialog.Description className="text-gray-600 mb-4">
              Tem certeza que deseja excluir o usuário "{usuarioExcluindo?.nome}"? Esta ação não pode ser desfeita.
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

export default Usuarios
