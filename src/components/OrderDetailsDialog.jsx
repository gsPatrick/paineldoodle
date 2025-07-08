import React, { useState, useEffect } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import * as Tabs from "@radix-ui/react-tabs"
import { pedidosService } from "../services/api"
import LoadingSpinner from "./LoadingSpinner"

const OrderDetailsDialog = ({ open, onOpenChange, pedidoId }) => {
    const [pedido, setPedido] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [nota, setNota] = useState("")
    const [label, setLabel] = useState(null)

    useEffect(() => {
        if (open && pedidoId) {
            setLoading(true)
            pedidosService.obter(pedidoId)
                .then((response) => {
                    setPedido(response.data)
                    setNota(response.data.obsInterna || "")
                })
                .catch(() => setError("Erro ao carregar detalhes do pedido"))
                .finally(() => setLoading(false))
        }
    }, [open, pedidoId])

    const handleSaveNote = async () => {
        try {
            await pedidosService.adicionarNotaInterna(pedidoId, nota)
        } catch {
            setError("Erro ao salvar nota interna")
        }
    }

    const handleGenerateLabel = async () => {
        try {
            const response = await pedidosService.gerarEtiqueta(pedidoId)
            setLabel(response.data)
        } catch {
            setError("Erro ao gerar etiqueta")
        }
    }

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl z-50 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <Dialog.Title className="text-2xl font-bold">Detalhes do Pedido #{pedido?.id}</Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                        </Dialog.Close>
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : error ? (
                        <p className="text-red-500 mt-4">{error}</p>
                    ) : (
                        pedido && (
                            <Tabs.Root defaultValue="info" className="mt-4">
                                <Tabs.List className="flex space-x-4 border-b pb-2">
                                    <Tabs.Trigger value="info" className="px-3 py-1 font-medium">Informações</Tabs.Trigger>
                                    <Tabs.Trigger value="itens" className="px-3 py-1 font-medium">Itens</Tabs.Trigger>
                                    <Tabs.Trigger value="pagamentos" className="px-3 py-1 font-medium">Pagamentos</Tabs.Trigger>
                                    <Tabs.Trigger value="endereco" className="px-3 py-1 font-medium">Endereço</Tabs.Trigger>
                                    <Tabs.Trigger value="nota" className="px-3 py-1 font-medium">Nota Interna</Tabs.Trigger>
                                    <Tabs.Trigger value="etiqueta" className="px-3 py-1 font-medium">Etiqueta</Tabs.Trigger>
                                </Tabs.List>

                                <Tabs.Content value="info" className="p-4">
                                    <p><strong>Cliente:</strong> {pedido.Usuario?.nome} ({pedido.Usuario?.email})</p>
                                    <p><strong>Status:</strong> </p>
                                    <select value={pedido.status} onChange={(e) => pedidosService.atualizarStatus(pedidoId, e.target.value)} className="input text-sm">
                                        <option value="pendente">Pendente</option>
                                        <option value="pago">Pago</option>
                                        <option value="processando">Processando</option>
                                        <option value="enviado">Enviado</option>
                                        <option value="entregue">Entregue</option>
                                        <option value="cancelado">Cancelado</option>
                                    </select>
                                    <p><strong>Total:</strong> R$ {Number(pedido.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                                    <p><strong>Data:</strong> {new Date(pedido.createdAt).toLocaleString()}</p>
                                </Tabs.Content>

                                <Tabs.Content value="itens" className="p-4">
                                    <table className="w-full border border-gray-200">
                                        <thead>
                                            <tr>
                                                <th className="p-2 border">Produto</th>
                                                <th className="p-2 border">Qtd</th>
                                                <th className="p-2 border">Unitário</th>
                                                <th className="p-2 border">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pedido.itens.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="p-2 border">{item.nome}</td>
                                                    <td className="p-2 border text-center">{item.quantidade}</td>
                                                    <td className="p-2 border text-right">R$ {Number(item.preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                                                    <td className="p-2 border text-right">R$ {Number(item.subtotal ?? item.preco * item.quantidade).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </Tabs.Content>

                                <Tabs.Content value="pagamentos" className="p-4">
                                    {pedido.Pagamentos?.length > 0 ? (
                                        <table className="w-full border border-gray-200">
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
                                    ) : (
                                        <p>Sem pagamentos registrados</p>
                                    )}
                                </Tabs.Content>

                                <Tabs.Content value="endereco" className="p-4">
                                    <p><strong>Endereço de Entrega:</strong></p>
                                    <p>{JSON.stringify(pedido.enderecoEntrega, null, 2)}</p>
                                </Tabs.Content>

                                <Tabs.Content value="nota" className="p-4 space-y-2">
                                    <textarea
                                        value={nota}
                                        onChange={(e) => setNota(e.target.value)}
                                        rows={4}
                                        className="w-full border p-2"
                                        placeholder="Observação interna"
                                    />
                                    <button onClick={handleSaveNote} className="btn btn-primary">Salvar Nota</button>
                                </Tabs.Content>

                                <Tabs.Content value="etiqueta" className="p-4 space-y-2">
                                    <button onClick={handleGenerateLabel} className="btn btn-secondary">Gerar Etiqueta Melhor Envio</button>
                                    {label && (
                                        <pre className="bg-gray-100 p-2 mt-2 overflow-auto">{JSON.stringify(label, null, 2)}</pre>
                                    )}
                                </Tabs.Content>
                            </Tabs.Root>
                        )
                    )}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default OrderDetailsDialog 