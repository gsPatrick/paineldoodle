import React, { useState, useEffect } from "react"
import { pedidosService } from "../services/api"
import LoadingSpinner from "./LoadingSpinner"

const OrderDetailsModal = ({ isOpen, pedidoId, onClose }) => {
    const [pedido, setPedido] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        if (isOpen && pedidoId) {
            setLoading(true)
            pedidosService.obter(pedidoId)
                .then((response) => {
                    setPedido(response.data)
                })
                .catch(() => {
                    setError("Erro ao carregar detalhes do pedido")
                })
                .finally(() => setLoading(false))
        }
    }, [isOpen, pedidoId])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-full overflow-y-auto p-6 relative">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl leading-none">
                    &times;
                </button>
                {loading ? (
                    <div className="flex justify-center py-10">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : (
                    pedido && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">Detalhes do Pedido #{pedido.id}</h2>
                            <div className="space-y-1">
                                <p><strong>Cliente:</strong> {pedido.Usuario?.nome} ({pedido.Usuario?.email})</p>
                                <p><strong>Status:</strong> {pedido.status}</p>
                                <p><strong>Total:</strong> R$ {Number(pedido.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                {pedido.cupomAplicado && (
                                    <p><strong>Cupom:</strong> {pedido.cupomAplicado}</p>
                                )}
                                {pedido.desconto > 0 && (
                                    <p><strong>Desconto:</strong> R$ {Number(pedido.desconto).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                )}
                                <p><strong>Data do Pedido:</strong> {new Date(pedido.createdAt).toLocaleString()}</p>
                                <p><strong>Última Atualização:</strong> {new Date(pedido.updatedAt).toLocaleString()}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold">Itens</h3>
                                <table className="table-auto w-full border border-gray-200">
                                    <thead>
                                        <tr>
                                            <th className="p-2 border">Produto</th>
                                            <th className="p-2 border">Quantidade</th>
                                            <th className="p-2 border">Preço Unitário</th>
                                            <th className="p-2 border">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pedido.itens.map((item, index) => (
                                            <tr key={index}>
                                                <td className="p-2 border">{item.nome}</td>
                                                <td className="p-2 border text-center">{item.quantidade}</td>
                                                <td className="p-2 border text-right">R$ {Number(item.preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                                                <td className="p-2 border text-right">R$ {Number(item.subtotal ?? item.preco * item.quantidade).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {pedido.Pagamentos && pedido.Pagamentos.length > 0 && (
                                <div>
                                    <h3 className="font-semibold">Pagamentos</h3>
                                    <table className="table-auto w-full border border-gray-200">
                                        <thead>
                                            <tr>
                                                <th className="p-2 border">ID</th>
                                                <th className="p-2 border">Método</th>
                                                <th className="p-2 border">Status</th>
                                                <th className="p-2 border">Valor</th>
                                                <th className="p-2 border">Data</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pedido.Pagamentos.map((pag) => (
                                                <tr key={pag.id}>
                                                    <td className="p-2 border text-center">{pag.id}</td>
                                                    <td className="p-2 border">{pag.metodo}</td>
                                                    <td className="p-2 border">{pag.status}</td>
                                                    <td className="p-2 border text-right">R$ {Number(pag.valor ?? pag.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                                                    <td className="p-2 border">{new Date(pag.createdAt).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )
                )}
            </div>
        </div>
    )
}

export default OrderDetailsModal 