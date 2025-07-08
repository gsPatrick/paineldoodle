import React, { useState, useEffect } from "react"
import { blogService } from "../services/api"
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css"
import LoadingSpinner from "../components/LoadingSpinner"
import * as Dialog from "@radix-ui/react-dialog"
import { PlusIcon, Pencil1Icon, TrashIcon, Cross2Icon } from "@radix-ui/react-icons"
import { useToast } from "../contexts/ToastContext"
import FileDropZone from "../components/FileDropZone"

const Blog = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [postEditando, setPostEditando] = useState(null)
  const { success, error } = useToast()
  const [formData, setFormData] = useState({
    titulo: "",
    conteudo: "",
    imagemDestaque: "",
    imagemFile: null,
  })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregarPosts()
  }, [])

  const carregarPosts = async () => {
    try {
      const res = await blogService.listarTodos()
      setPosts(res.data.posts)
    } catch (err) {
      error("Erro ao carregar posts")
    } finally {
      setLoading(false)
    }
  }

  const abrirModal = (post = null) => {
    if (post) {
      setPostEditando(post)
      setFormData({
        titulo: post.titulo || "",
        conteudo: post.conteudo || "",
        imagemDestaque: post.imagemDestaque || "",
        imagemFile: null,
      })
    } else {
      setPostEditando(null)
      setFormData({
        titulo: "",
        conteudo: "",
        imagemDestaque: "",
        imagemFile: null,
      })
    }
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleContentChange = (value) => {
    setFormData(prev => ({ ...prev, conteudo: value }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData();
    formData.append('imagem', file);

    try {
      const res = await blogService.uploadImagem(formData)
      // A API agora deve retornar a URL completa ou um caminho relativo
      const imageUrl = res.data.url.startsWith('http') ? res.data.url : `${api.defaults.baseURL}/${res.data.url}`.replace('/api//', '/');

      setFormData(prev => ({
        ...prev,
        imagemDestaque: imageUrl,
      }))
      success("Imagem enviada com sucesso!")
    } catch (err) {
      error("Erro ao enviar imagem.")
      console.error(err);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSalvando(true)
    try {
      const dados = {
        titulo: formData.titulo,
        conteudo: formData.conteudo,
        imagemDestaque: formData.imagemDestaque,
      }
      if (postEditando) {
        await blogService.atualizar(postEditando.id, dados)
        success("Post atualizado")
      } else {
        await blogService.criar(dados)
        success("Post criado")
      }
      carregarPosts()
      fecharModal()
    } catch (err) {
      error("Erro ao salvar post")
    } finally {
      setSalvando(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Confirmar exclusão?")) return
    try {
      // Ainda não há endpoint de exclusão, implementar conforme necessário
      error("Funcionalidade de exclusão não implementada")
    } finally {
      carregarPosts()
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
      {salvando && (
        <div className="fixed bottom-4 right-4 bg-white p-2 rounded-full shadow z-50">
          <LoadingSpinner size="sm" />
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <p className="text-gray-600">Gerencie os posts do blog</p>
        </div>
        <button onClick={() => abrirModal()} className="btn btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          Novo Post
        </button>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Autor</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id}>
                  <td>{post.titulo}</td>
                  <td>{post.Usuario?.nome}</td>
                  <td>{new Date(post.publicadoEm || post.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button onClick={() => abrirModal(post)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md" title="Editar"><Pencil1Icon className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(post.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md" title="Excluir"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog.Root open={modalAberto} onOpenChange={setModalAberto}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-lg z-50 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-bold">{postEditando ? "Editar Post" : "Novo Post"}</Dialog.Title>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Título</label>
                <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Conteúdo</label>
                <ReactQuill value={formData.conteudo} onChange={handleContentChange} theme="snow" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Imagem de Destaque</label>
                <FileDropZone accept="image/*" multiple={false} onFilesSelected={(files) => handleImageUpload({ target: { files } })}>
                  {formData.imagemFile ? <span>{formData.imagemFile.name}</span> : <span className="text-gray-500">Clique ou arraste imagem aqui</span>}
                </FileDropZone>
                {formData.imagemDestaque && <img src={formData.imagemDestaque} alt="Preview" className="mt-2 max-h-40" />}
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={fecharModal} className="btn">Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

export default Blog
