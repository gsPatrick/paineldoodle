"use client"

import { useState, useEffect } from "react"
import { configuracoesService } from "../services/api"
import { useToast } from "../contexts/ToastContext"
import LoadingSpinner from "../components/LoadingSpinner"

// Mapeamento de chaves para seções
const sectionMapping = {
  endereco_origem: [
    "ORIGEM_NOME", "ORIGEM_TELEFONE", "ORIGEM_EMAIL", "ORIGEM_DOCUMENTO",
    "ORIGEM_COMPANY_DOCUMENT", "ORIGEM_STATE_REGISTER", "ORIGEM_CEP",
    "ORIGEM_RUA", "ORIGEM_NUMERO", "ORIGEM_BAIRRO", "ORIGEM_CIDADE", "ORIGEM_ESTADO"
  ],
}

// Mapeamento de chaves para tipos de input
const inputTypeMapping = {
  cor_primaria: 'color',
  cor_secundaria: 'color',
  politica_troca: 'textarea',
  politica_privacidade: 'textarea',
  termos_uso: 'textarea',
  ativo: 'checkbox'
}

const Configuracoes = () => {
  const [configs, setConfigs] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { success, error } = useToast()

  const carregarConfigs = async () => {
    try {
      setLoading(true)
      const response = await configuracoesService.obter()
      setConfigs(response.data)
    } catch (err) {
      error("Erro ao carregar configurações")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarConfigs()
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setConfigs((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      await configuracoesService.atualizar(configs)
      success("Configurações atualizadas com sucesso")
    } catch (err) {
      error("Erro ao atualizar configurações")
    } finally {
      setSaving(false)
    }
  }

  const handleInicializar = async () => {
    // Adicionar um confirm para segurança
    if (window.confirm("Tem certeza que deseja restaurar as configurações padrão? Todas as suas alterações serão perdidas.")) {
      try {
        await configuracoesService.inicializar()
        success("Configurações inicializadas com sucesso")
        carregarConfigs()
      } catch (err) {
        error("Erro ao inicializar configurações")
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const renderField = (key) => {
    const value = configs[key];
    const type = inputTypeMapping[key] || (typeof value === "boolean" ? 'checkbox' : typeof value === 'number' ? 'number' : 'text');
    const label = formatLabel(key);

    return (
      <div key={key} className="mb-4">
        <label htmlFor={key} className="label">
          {label}
        </label>
        {type === 'textarea' ? (
          <textarea id={key} name={key} rows={4} className="input" value={value || ''} onChange={handleChange} />
        ) : type === 'checkbox' ? (
          <div className="flex items-center">
             <input type="checkbox" id={key} name={key} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" checked={!!value} onChange={handleChange} />
          </div>
        ) : (
          <input type={type} id={key} name={key} className={`input ${type === 'color' ? 'p-1 h-10' : ''}`} value={value || ''} onChange={handleChange} />
        )}
      </div>
    );
  };
  
  const getSectionTitle = (section) => {
    return section.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600">Gerencie as configurações gerais e de frete da sua loja.</p>
        </div>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>
        {Object.keys(sectionMapping).map(section => (
          <div key={section} className="card p-6">
             <h2 className="text-lg font-semibold border-b pb-2 mb-4">{getSectionTitle(section)}</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                {sectionMapping[section].map(renderField)}
             </div>
          </div>
        ))}

        <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={handleInicializar} className="btn btn-secondary">
              Restaurar Padrão
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? "Salvando..." : "Salvar Tudo"}
            </button>
        </div>
      </form>
    </div>
  )
}

export default Configuracoes

function formatLabel(key) {
  if (key === 'ORIGEM_COMPANY_DOCUMENT') return 'CNPJ';
  if (key === 'ORIGEM_STATE_REGISTER') return 'Inscrição Estadual';

  return key
    .replace(/_/g, " ")
    .replace("ORIGEM ", "")
    .replace(/\b\w/g, (l) => l.toUpperCase())
}
