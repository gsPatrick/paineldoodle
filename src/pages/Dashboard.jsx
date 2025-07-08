"use client"

import { useState, useEffect } from "react"
import { dashboardService } from "../services/api"
import { useToast } from "../contexts/ToastContext"
import LoadingSpinner from "../components/LoadingSpinner"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

const Dashboard = () => {
  const [metricas, setMetricas] = useState(null)
  const [vendas, setVendas] = useState([])
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState([])
  const [clientesTop, setClientesTop] = useState([])
  const [loading, setLoading] = useState(true)
  const { error } = useToast()

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)
      const [metricasRes, vendasRes, produtosRes, clientesRes] = await Promise.all([
        dashboardService.metricas(),
        dashboardService.vendas({ periodo: 30, agrupamento: "dia" }),
        dashboardService.produtosMaisVendidos({ limite: 5, periodo: 30 }),
        dashboardService.clientesTop({ limite: 5 }),
      ])

      setMetricas(metricasRes.data)
      setVendas(
        vendasRes.data.map((item) => ({
          data: item.periodo,
          vendas: item.quantidade,
          faturamento: item.total,
        }))
      )
      setProdutosMaisVendidos(produtosRes.data)
      setClientesTop(clientesRes.data)
    } catch (err) {
      const funcaoComErro = err.response?.config?.url || 'desconhecida'
      error(`Erro ao carregar dados do dashboard. Falha ao acessar: ${funcaoComErro}. ${err.message || ''}`)
      console.error('Detalhes do erro:', {
        endpoint: funcaoComErro,
        status: err.response?.status,
        mensagem: err.message,
        dados: err.response?.data
      })
    } finally {
      setLoading(false)
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do seu e-commerce</p>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Vendas Hoje</p>
              <p className="text-2xl font-bold text-gray-900">{metricas?.vendasHoje || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Faturamento Hoje</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {metricas?.faturamentoHoje?.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) || "0,00"}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{metricas?.clientesTotal || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total de Produtos</p>
              <p className="text-2xl font-bold text-gray-900">{metricas?.produtosTotal || 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas dos Últimos 30 Dias</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={vendas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip formatter={(value, name) => [value, name === 'vendas' ? 'Vendas' : name]} />
              <Line type="monotone" dataKey="vendas" stroke="#3b82f6" strokeWidth={2} name="Vendas" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Faturamento dos Últimos 30 Dias</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vendas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis tickFormatter={(value) => `R$ ${value}`} />
              <Tooltip formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
              <Bar dataKey="faturamento" fill="#10b981" name="Faturamento" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos Mais Vendidos</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {produtosMaisVendidos.map((produto) => (
                  <tr key={produto.id}>
                    <td className="font-medium">{produto.nome}</td>
                    <td>{produto.quantidade}</td>
                    <td>R$ {produto.faturamento?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Melhores Clientes</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Pedidos</th>
                  <th>Total Gasto</th>
                </tr>
              </thead>
              <tbody>
                {clientesTop.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>
                      <div>
                        <div className="font-medium">{cliente.nome}</div>
                        <div className="text-sm text-gray-500">{cliente.email}</div>
                      </div>
                    </td>
                    <td>{cliente.pedidos}</td>
                    <td>R$ {cliente.valorTotal?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
