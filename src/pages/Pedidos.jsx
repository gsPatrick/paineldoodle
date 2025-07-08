"use client"

import { useState, useEffect } from "react"
import { pedidosService } from "../services/api"
import { useToast } from "../contexts/ToastContext"
import LoadingSpinner from "../components/LoadingSpinner"
import OrderDetailsDialog from "../components/OrderDetailsDialog"
import { MagnifyingGlassIcon } from "@radix-ui/react-icons"

const statusOptions = [
  { value: "", label: "Todos os Status" },
  { value: "pendente", label: "Pendente" },
  { value: "pago", label: "Pago" },
  { value: "processando", label: "Processando" },
  { value: "enviado", label: "Enviado" },
  { value: "entregue", label: "Entregue" },
  { value: "cancelado", label: "Cancelado" },
]

const Pedidos = () => {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [busca, setBusca] = useState("")
  const [status, setStatus] = useState("")
  const { success, error } = useToast()
  const [isModalOpen, setModalOpen] = useState(false)
  const [selectedPedidoId, setSelectedPedidoId] = useState(null)

  const openModal = (id) => {
    setSelectedPedidoId(id)
    setModalOpen(true)
  }

  useEffect(() => {
    carregarPedidos()
  }, [pagina, busca, status])

  const carregarPedidos = async () => {
    try {
      setLoading(true)
      const params = {
        pagina,
        limite: 10,
        busca: busca || undefined,
        status: status || undefined,
      }
      const response = await pedidosService.listar(params)
      setPedidos(response.data.pedidos || [])
      setTotal(response.data.total || 0)
    } catch (err) {
      error("Erro ao carregar pedidos")
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

  const atualizarStatus = async (pedidoId, novoStatus) => {
    try {
      await pedidosService.atualizarStatus(pedidoId, novoStatus)
      success("Status do pedido atualizado")
      // Atualiza apenas o pedido modificado no estado local para evitar recarregar tudo
      setPedidos(pedidos.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p))
    } catch (err) {
      error("Erro ao atualizar status")
    }
  }

  const totalPages = Math.ceil(total / 10)

  if (loading && pedidos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-gray-600">Gerencie os pedidos da loja</p>
      </div>

      {/* Filtros e Busca */}
      <div className="card p-4 flex items-center gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por ID do pedido ou nome do cliente..."
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
                <th className="w-1/6">ID</th>
                <th className="w-2/6">Cliente</th>
                <th className="w-1/6">Total</th>
                <th className="w-1/6">Status</th>
                <th className="w-1/6">Data</th>
                <th className="w-1/6">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id}>
                  <td className="font-mono">#{pedido.id}</td>
                  <td>{pedido.Usuario?.nome || "Cliente não identificado"}</td>
                  <td>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(pedido.total)}
                  </td>
                  <td>
                    <select
                      value={pedido.status}
                      onChange={(e) => atualizarStatus(pedido.id, e.target.value)}
                      className="input input-sm"
                    >
                      {statusOptions.slice(1).map(opt => (
                         <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>{new Date(pedido.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td>
                    <button onClick={() => openModal(pedido.id)} className="btn btn-secondary btn-sm">
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pedidos.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              Nenhum pedido encontrado com os filtros atuais.
            </div>
          )}
        </div>
      </div>

      {/* Paginação */}
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

      {selectedPedidoId && (
         <OrderDetailsDialog open={isModalOpen} onOpenChange={setModalOpen} pedidoId={selectedPedidoId} />
      )}
    </div>
  )
}

export default Pedidos
