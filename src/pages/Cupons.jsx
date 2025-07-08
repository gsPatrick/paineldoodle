"use client"

import { useState, useEffect } from "react"
import { cuponsService } from "../services/api"
import { useToast } from "../contexts/ToastContext"
import LoadingSpinner from "../components/LoadingSpinner"
import * as Dialog from "@radix-ui/react-dialog"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { PlusIcon, Pencil1Icon, TrashIcon, Cross2Icon } from "@radix-ui/react-icons"

const Cupons = () => {
  const [cupons, setCupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [modalAberto, setModalAberto] = useState(false)
  const [cupomEditando, setCupomEditando] = useState(null)
  const [cupomExcluindo, setCupomExcluindo] = useState(null)
  const { success, error } = useToast()

  const [formData, setFormData] = useState({
    codigo: "",
    valor: "",
    tipo: "percentual",
    validade: "",
    usoMaximo: 1,
    ativo: true,
  })
  const [displayValor, setDisplayValor] = useState("")

  useEffect(() => {
    carregarCupons()
  }, [pagina])

  const carregarCupons = async () => {
    try {
      setLoading(true)
      const response = await cuponsService.listar({ pagina, limite: 9 })
      setCupons(response.data.cupons || response.data)
      setTotal(response.data.total || response.data.length)
    } catch (err) {
      error("Erro ao carregar cupons")
    } finally {
      setLoading(false)
    }
  }

  const abrirModal = (cupom = null) => {
    if (cupom) {
      setCupomEditando(cupom)
      setFormData({
        codigo: cupom.codigo,
        valor: cupom.valor,
        tipo: cupom.tipo,
        validade: cupom.validade ? cupom.validade.split("T")[0] : "",
        usoMaximo: cupom.usoMaximo,
        ativo: cupom.ativo,
      })
      setDisplayValor(
        cupom.tipo === "percentual"
          ? String(cupom.valor)
          : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cupom.valor))
      )
    } else {
      setCupomEditando(null)
      setFormData({
        codigo: "",
        valor: "",
        tipo: "percentual",
        validade: "",
        usoMaximo: 1,
        ativo: true,
      })
      setDisplayValor("")
    }
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
    setCupomEditando(null)
    setFormData({
      codigo: "",
      valor: "",
      tipo: "percentual",
      validade: "",
      usoMaximo: 1,
      ativo: true,
    })
    setDisplayValor("")
  }

  const handleValorChange = (e) => {
    const { value } = e.target;
    let valorNumerico = value.replace(/[^0-9]/g, '');
    let display = '';
    let valorFinal = '';

    if (formData.tipo === 'percentual') {
      valorNumerico = valorNumerico.slice(0, 3); // Limita a 3 dígitos para percentual
      display = valorNumerico;
      valorFinal = valorNumerico;
    } else { // Fixo
      if (valorNumerico) {
        const numero = parseFloat(valorNumerico) / 100;
        display = numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        valorFinal = numero.toString();
      }
    }

    setFormData(prev => ({ ...prev, valor: valorFinal }));
    setDisplayValor(display);
  }

  const handleTipoChange = (e) => {
    setFormData(prev => ({
      ...prev,
      tipo: e.target.value,
      valor: "", // Limpa o valor ao trocar o tipo
    }));
    setDisplayValor("");
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        valor: Number(formData.valor),
        usoMaximo: Number(formData.usoMaximo),
      }
      if (cupomEditando) {
        await cuponsService.atualizar(cupomEditando.id, payload)
        success("Cupom atualizado com sucesso")
      } else {
        await cuponsService.criar(payload)
        success("Cupom criado com sucesso")
      }
      fecharModal()
      carregarCupons()
    } catch (err) {
      error(err.response?.data?.erro || "Erro ao salvar cupom")
    }
  }

  const confirmarExclusao = async () => {
    try {
      await cuponsService.excluir(cupomExcluindo.id)
      success("Cupom excluído com sucesso")
      setCupomExcluindo(null)
      carregarCupons()
    } catch (err) {
      error("Erro ao excluir cupom")
    }
  }

  const totalPages = Math.ceil(total / 9);

  if (loading && cupons.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Cupons</h1>
          <p className="text-gray-600">Gerencie os cupons de desconto</p>
        </div>
        <button
          onClick={() => abrirModal()}
          className="btn btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Novo Cupom
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cupons.map((cupom) => (
          <div key={cupom.id} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {cupom.codigo}
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Valor:{" "}
                  {cupom.tipo === "percentual"
                    ? `${cupom.valor}%`
                    : `R$ ${Number(cupom.valor).toFixed(2)}`}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  Validade:{" "}
                  {new Date(cupom.validade).toLocaleDateString()}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  Usos: {cupom.usoAtual}/{cupom.usoMaximo}
                </p>
              </div>
              <span
                className={`status-badge ${cupom.ativo ? "status-active" : "status-inactive"
                  }`}
              >
                {cupom.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => abrirModal(cupom)}
                className="btn btn-icon btn-secondary"
                title="Editar"
              >
                <Pencil1Icon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCupomExcluindo(cupom)}
                className="btn btn-icon btn-danger"
                title="Excluir"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {cupons.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">Nenhum cupom encontrado</div>
          <button
            onClick={() => abrirModal()}
            className="btn btn-primary"
          >
            Criar primeiro cupom
          </button>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPagina(pagina - 1)}
              disabled={pagina <= 1 || loading}
              className="btn btn-secondary"
            >
              Anterior
            </button>
            <span className="px-4 py-2 text-sm">
              Página {pagina} de {totalPages}
            </span>
            <button
              onClick={() => setPagina(pagina + 1)}
              disabled={pagina >= totalPages || loading}
              className="btn btn-secondary"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      <Dialog.Root
        open={modalAberto}
        onOpenChange={setModalAberto}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold">
                {cupomEditando ? "Editar Cupom" : "Novo Cupom"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600"
                  onClick={fecharModal}
                >
                  <Cross2Icon className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Código
                  </label>
                  <input
                    type="text"
                    name="codigo"
                    required
                    className="input"
                    value={formData.codigo}
                    onChange={handleChange}
                    onBlur={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Tipo
                  </label>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleTipoChange}
                    className="input"
                  >
                    <option value="percentual">Percentual (%)</option>
                    <option value="fixo">Fixo (R$)</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Valor
                </label>
                <input
                  type="text"
                  name="valor"
                  required
                  className="input"
                  value={displayValor}
                  onChange={handleValorChange}
                  placeholder={formData.tipo === 'percentual' ? '%' : 'R$ 0,00'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Validade
                  </label>
                  <input
                    type="date"
                    name="validade"
                    required
                    className="input"
                    value={formData.validade}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Uso Máximo
                  </label>
                  <input
                    type="number"
                    name="usoMaximo"
                    required
                    className="input"
                    value={formData.usoMaximo}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="ativo"
                  className="mr-2"
                  checked={formData.ativo}
                  onChange={handleChange}
                />
                <label
                  className="text-sm font-medium text-gray-700"
                >
                  Cupom ativo
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {cupomEditando ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog.Root
        open={!!cupomExcluindo}
        onOpenChange={() => setCupomExcluindo(null)}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50">
            <AlertDialog.Title className="text-lg font-semibold mb-2">
              Confirmar Exclusão
            </AlertDialog.Title>
            <AlertDialog.Description className="text-gray-600 mb-4">
              Tem certeza que deseja excluir o cupom "{cupomExcluindo?.codigo}"? Esta ação não pode ser desfeita.
            </AlertDialog.Description>
            <div className="flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <button className="btn btn-secondary">Cancelar</button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button
                  onClick={confirmarExclusao}
                  className="btn btn-danger"
                >
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

export default Cupons
