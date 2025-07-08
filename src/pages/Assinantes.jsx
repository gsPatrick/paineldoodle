"use client"

import { useState, useEffect } from "react"
import { assinantesService } from "../services/api"
import { useToast } from "../contexts/ToastContext"
import LoadingSpinner from "../components/LoadingSpinner"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { MagnifyingGlassIcon } from "@radix-ui/react-icons"

const statusOptions = [
  { value: "", label: "Todos os Status" },
  { value: "active", label: "Ativa" },
  { value: "paused", label: "Pausada" },
  { value: "cancelled", label: "Cancelada" },
]

const Assinantes = () => {
  const [assinantes, setAssinantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [busca, setBusca] = useState("")
  const [status, setStatus] = useState("")
  const [assinaturaCancelando, setAssinaturaCancelando] = useState(null)
  const { success, error } = useToast()

  useEffect(() => {
    carregarAssinantes()
  }, [pagina, busca, status])

  const carregarAssinantes = async () => {
    try {
      setLoading(true)
      const params = {
        pagina,
        limite: 10,
        busca: busca || undefined,
        status: status || undefined,
      }
      const response = await assinantesService.listar(params)
      setAssinantes(response.data.assinantes || [])
      setTotal(response.data.total || 0)
    } catch (err) {
      error("Erro ao carregar assinantes")
    } finally {
      setLoading(false)
    }
  }

  const handleBuscaChange = (e) => {
    setBusca(e.target.value)
    setPagina(1)
  }

  const handleStatusChange = (e) => {
    setStatus(e.target.value)
    setPagina(1)
  }

  const confirmarCancelamento = async () => {
    if (!assinaturaCancelando) return
    try {
      await assinantesService.cancelar(assinaturaCancelando.id)
      success("Assinatura cancelada com sucesso!")
      setAssinaturaCancelando(null)
      carregarAssinantes()
    } catch (err) {
      error(err.response?.data?.erro || "Erro ao cancelar assinatura")
      setAssinaturaCancelando(null)
    }
  }

  const totalPages = Math.ceil(total / 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assinantes</h1>
        <p className="text-gray-600">Gerencie os assinantes da sua loja</p>
      </div>

      <div className="card p-4 flex items-center gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={busca}
            onChange={handleBuscaChange}
            className="input pl-10 w-full"
          />
        </div>
        <select value={status} onChange={handleStatusChange} className="input">
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Data da Assinatura</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {assinantes.map((assinatura) => (
                <tr key={assinatura.id}>
                  <td>{assinatura.Usuario?.nome}</td>
                  <td>{assinatura.Plano?.nome}</td>
                  <td>
                    <span className={`status-badge ${
                      assinatura.status === 'active' ? 'status-active' : 'status-inactive'
                    }`}>{assinatura.status}</span>
                  </td>
                  <td>{new Date(assinatura.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td>
                    {assinatura.status === 'active' && (
                      <button onClick={() => setAssinaturaCancelando(assinatura)} className="btn btn-danger btn-sm">
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {assinantes.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              Nenhum assinante encontrado com os filtros atuais.
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center">
          <div className="flex items-center space-x-2">
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1 || loading} className="btn btn-secondary">
              Anterior
            </button>
            <span className="px-4 py-2 text-sm font-medium">Página {pagina} de {totalPages}</span>
            <button onClick={() => setPagina(p => Math.min(totalPages, p + 1))} disabled={pagina === totalPages || loading} className="btn btn-secondary">
              Próxima
            </button>
          </div>
        </div>
      )}

      <AlertDialog.Root open={!!assinaturaCancelando} onOpenChange={() => setAssinaturaCancelando(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50">
            <AlertDialog.Title className="text-lg font-semibold mb-2">Confirmar Cancelamento</AlertDialog.Title>
            <AlertDialog.Description className="text-gray-600 mb-4">
              Tem certeza que deseja cancelar a assinatura de "{assinaturaCancelando?.Usuario.nome}"?
            </AlertDialog.Description>
            <div className="flex justify-end gap-3">
              <AlertDialog.Cancel asChild><button className="btn btn-secondary">Voltar</button></AlertDialog.Cancel>
              <AlertDialog.Action asChild><button onClick={confirmarCancelamento} className="btn btn-danger">Sim, cancelar</button></AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  )
}

export default Assinantes 