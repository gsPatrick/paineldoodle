import React, { useState } from "react"
import { relatoriosService } from "../services/api"
import { useToast } from "../contexts/ToastContext"
import LoadingSpinner from "../components/LoadingSpinner"

const Relatorios = () => {
  const [tab, setTab] = useState("vendas")
  const [loading, setLoading] = useState(false)
  const { error } = useToast()

  // Vendas
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [vendasResumo, setVendasResumo] = useState(null)
  const [vendasPorDia, setVendasPorDia] = useState([])
  const [vendasLista, setVendasLista] = useState([])

  // Produtos Mais Vendidos
  const [periodoProdutos, setPeriodoProdutos] = useState("30")
  const [limiteProdutos, setLimiteProdutos] = useState("10")
  const [produtosData, setProdutosData] = useState([])

  // Desempenho Cupons
  const [cuponsData, setCuponsData] = useState([])

  // Clientes Ativos
  const [clientesData, setClientesData] = useState([])

  const buscarVendas = async () => {
    if (!dataInicio || !dataFim) return
    setLoading(true)
    try {
      const res = await relatoriosService.vendas({ dataInicio, dataFim })
      const { resumo, vendasPorDia, vendas } = res.data
      setVendasResumo(resumo)
      setVendasPorDia(vendasPorDia)
      setVendasLista(vendas)
    } catch (err) {
      error("Erro ao buscar relatório de vendas")
    } finally {
      setLoading(false)
    }
  }

  const buscarProdutos = async () => {
    setLoading(true)
    try {
      const res = await relatoriosService.produtosMaisVendidos({ periodo: periodoProdutos, limite: limiteProdutos })
      setProdutosData(res.data.produtos)
    } catch (err) {
      error("Erro ao buscar produtos mais vendidos")
    } finally {
      setLoading(false)
    }
  }

  const buscarCupons = async () => {
    setLoading(true)
    try {
      const res = await relatoriosService.desempenhoCupons()
      setCuponsData(res.data)
    } catch (err) {
      error("Erro ao buscar desempenho de cupons")
    } finally {
      setLoading(false)
    }
  }

  const buscarClientes = async () => {
    setLoading(true)
    try {
      const res = await relatoriosService.clientesAtivos()
      setClientesData(res.data)
    } catch (err) {
      error("Erro ao buscar clientes ativos")
    } finally {
      setLoading(false)
    }
  }

  const handleTabClick = (newTab) => {
    setTab(newTab)
    if (newTab === "produtos") buscarProdutos()
    if (newTab === "cupons") buscarCupons()
    if (newTab === "clientes") buscarClientes()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-gray-600">Análises e relatórios da loja</p>
      </div>

      <div className="flex space-x-4 border-b border-gray-200 mb-4">
        <button onClick={() => handleTabClick("vendas")}
          className={`px-4 py-2 -mb-px border-b-2 ${tab === "vendas" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}>
          Vendas
        </button>
        <button onClick={() => handleTabClick("produtos")}
          className={`px-4 py-2 -mb-px border-b-2 ${tab === "produtos" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}>
          Mais Vendidos
        </button>
        <button onClick={() => handleTabClick("cupons")}
          className={`px-4 py-2 -mb-px border-b-2 ${tab === "cupons" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-800"}`}>
          Cupons
        </button>
   
      </div>

      <div className="card p-6">
        {loading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {!loading && tab === "vendas" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium">Data Início</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                  className="input mt-1 w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Data Fim</label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={e => setDataFim(e.target.value)}
                  className="input mt-1 w-full"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={buscarVendas}
                  className="btn btn-primary w-full">
                  Buscar
                </button>
              </div>
            </div>

            {vendasResumo && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-sm text-gray-500">Total Pedidos</div>
                  <div className="text-xl font-bold">{vendasResumo.quantidadePedidos}</div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-sm text-gray-500">Total Receita</div>
                  <div className="text-xl font-bold">
                    R$ {vendasResumo.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="bg-white p-4 rounded shadow">
                  <div className="text-sm text-gray-500">Ticket Médio</div>
                  <div className="text-xl font-bold">
                    R$ {vendasResumo.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            )}

            {vendasPorDia.length > 0 && (
              <div className="card overflow-hidden mb-4">
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Total</th>
                        <th>Pedidos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendasPorDia.map(item => (
                        <tr key={item.data}>
                          <td>{item.data}</td>
                          <td>
                            R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td>{item.quantidade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {vendasLista.length > 0 && (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Email</th>
                        <th>Total</th>
                        <th>Itens</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendasLista.map(pedido => (
                        <tr key={pedido.id}>
                          <td>{pedido.id}</td>
                          <td>{pedido.cliente}</td>
                          <td>{pedido.email}</td>
                          <td>
                            R$ {pedido.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td>{pedido.itens}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && tab === "produtos" && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Vendidos</th>
                  <th>Total Vendas</th>
                </tr>
              </thead>
              <tbody>
                {produtosData.map(prod => (
                  <tr key={prod.id}>
                    <td>{prod.nome}</td>
                    <td>{prod.totalVendido}</td>
                    <td>
                      R$ {prod.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && tab === "cupons" && (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Cupom</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Pedidos</th>
                  <th>Total Desconto</th>
                  <th>Total Vendas</th>
                  <th>% Conversão</th>
                </tr>
              </thead>
              <tbody>
                {cuponsData.map(c => (
                  <tr key={c.id}>
                    <td>{c.codigo}</td>
                    <td>{c.tipo}</td>
                    <td>
                      R$ {c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td>{c.desempenho.totalPedidos}</td>
                    <td>
                      R$ {c.desempenho.totalDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      R$ {c.desempenho.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td>{c.desempenho.conversao}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Relatorios
