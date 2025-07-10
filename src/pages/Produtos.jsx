"use client"

import { useState, useEffect } from "react"
// CORREÇÃO: Importar uploadService e garantir que os outros serviços estão corretos.
import { produtosService, categoriasService, variacoesService, uploadService } from "../services/api"
import { useToast } from "../contexts/ToastContext"
import LoadingSpinner from "../components/LoadingSpinner"
import * as Dialog from "@radix-ui/react-dialog"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { MagnifyingGlassIcon, PlusIcon, Pencil1Icon, TrashIcon, Cross2Icon, StarFilledIcon, DragHandleDots2Icon } from "@radix-ui/react-icons"
import FileDropZone from "../components/FileDropZone"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

const PRODUTOS_POR_PAGINA = 500;

const Produtos = () => {
  const [produtos, setProdutos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")
  const [categoria, setCategoria] = useState("")
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [modalAberto, setModalAberto] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState(null)
  const [produtoExcluindo, setProdutoExcluindo] = useState(null)
  const { success, error } = useToast()

  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    categoriaId: "",
    ativo: true,
    imagensExistentes: [],
    arquivosExistentes: [],
    videosExistentes: [],
    imagensParaEnviar: [],
    arquivosParaEnviar: [],
    videosParaEnviar: []
  })

  const [salvando, setSalvando] = useState(false)
  const [variacoes, setVariacoes] = useState([])

  useEffect(() => {
    carregarDadosIniciais()
  }, [])

  useEffect(() => {
    carregarProdutos()
  }, [pagina, busca, categoria])
  
  const carregarDadosIniciais = async () => {
    setLoading(true);
    try {
      const [categoriasRes] = await Promise.all([
        categoriasService.listar(),
        carregarProdutos(1)
      ]);
      setCategorias(categoriasRes.data);
    } catch (err) {
      console.error("Erro ao carregar dados iniciais:", err);
      error("Erro ao carregar categorias.");
    } finally {
      setLoading(false);
    }
  }

  const carregarProdutos = async (paginaAtual = pagina) => {
    setLoading(true);
    try {
      const response = await produtosService.listar({
        pagina: paginaAtual,
        limit: PRODUTOS_POR_PAGINA,
        busca: busca || undefined,
        categorias: categoria || undefined,
      })
      const produtosList = response.data.produtos || response.data;
      const totalProdutos = response.data.total || produtosList.length;
      setProdutos(produtosList)
      setTotal(totalProdutos)
    } catch (err) {
      console.error("Erro ao carregar produtos:", err)
      error("Erro ao carregar produtos.")
    } finally {
      setLoading(false);
    }
  }
  
  const handleBusca = (e) => {
    setBusca(e.target.value);
    setPagina(1);
  }

  const handleCategoriaChange = (e) => {
    setCategoria(e.target.value);
    setPagina(1);
  }

  const abrirModal = async (produto = null) => {
    if (produto) {
      setProdutoEditando(produto);
      await carregarProdutoParaEdicao(produto.id);
    } else {
      setProdutoEditando(null);
      setFormData({
        nome: "",
        descricao: "",
        categoriaId: "",
        ativo: true,
        imagensExistentes: [],
        arquivosExistentes: [],
        videosExistentes: [],
        imagensParaEnviar: [],
        arquivosParaEnviar: [],
        videosParaEnviar: []
      });
      setVariacoes([]);
    }
    setModalAberto(true);
  }
  
  const carregarProdutoParaEdicao = async (id) => {
    setLoading(true);
    try {
      const resposta = await produtosService.obter(id);
      const produtoCompleto = resposta.data;
      
      const todosArquivos = produtoCompleto.ArquivoProdutos || [];

      const imagens = todosArquivos
        .filter(a => a.tipo === 'imagem')
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

      setFormData({
        nome: produtoCompleto.nome || "",
        descricao: produtoCompleto.descricao || "",
        categoriaId: produtoCompleto.categoriaId || "",
        ativo: produtoCompleto.ativo !== false,
        imagensExistentes: imagens,
        arquivosExistentes: todosArquivos.filter(a => a.tipo === 'arquivo'),
        videosExistentes: todosArquivos.filter(a => a.tipo === 'video'),
        imagensParaEnviar: [],
        arquivosParaEnviar: [],
        videosParaEnviar: []
      });

      const variacoesData = Array.isArray(produtoCompleto.variacoes) ? produtoCompleto.variacoes : [];
      setVariacoes(variacoesData.map(v => ({
        id: v.id,
        nome: v.nome || "",
        preco: v.preco != null ? String(v.preco) : "0",
        digital: !!v.digital,
        estoque: v.estoque != null ? String(v.estoque) : "0",
        ativo: v.ativo !== false
      })));

    } catch (err) {
      error("Erro ao carregar detalhes do produto.");
      fecharModal();
    } finally {
      setLoading(false);
    }
  }

  const fecharModal = () => {
    setModalAberto(false);
    setProdutoEditando(null);
  }

  const formatarPrecoParaExibicao = (valor) => {
    if (!valor) return 'R$ 0,00';
    const numero = parseFloat(String(valor).replace(',', '.'));
    if (isNaN(numero)) return 'R$ 0,00';
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);

    const dadosProduto = {
      nome: formData.nome,
      descricao: formData.descricao,
      categoriaId: formData.categoriaId,
      ativo: formData.ativo,
    };

    try {
      let produtoId;
      if (produtoEditando) {
        await produtosService.atualizar(produtoEditando.id, dadosProduto);
        produtoId = produtoEditando.id;
      } else {
        const resposta = await produtosService.criar(dadosProduto);
        produtoId = resposta.data.id;
      }
      
      if (produtoEditando?.variacoes?.length > 0) {
        // CORREÇÃO: Usar a API de variações correta para exclusão
        await Promise.all(
          produtoEditando.variacoes.map(v => variacoesService.excluir(v.id))
        );
      }
      if (variacoes.length > 0) {
        const variacoesParaEnviar = variacoes.map(v => ({
          ...v,
          preco: parseFloat(String(v.preco).replace(',', '.')) || 0,
          estoque: parseInt(v.estoque, 10) || 0,
        }));
        await variacoesService.criarEmLote(produtoId, variacoesParaEnviar);
      }
      
      if (formData.imagensParaEnviar.length > 0) {
        const formDataImagens = new FormData();
        formData.imagensParaEnviar.forEach(file => formDataImagens.append('imagens', file));
        // CORREÇÃO: Usar o uploadService que chama a rota /uploads/...
        await uploadService.uploadProdutoImagens(produtoId, formDataImagens);
      }

      for (const file of formData.arquivosParaEnviar) {
        const formDataArquivo = new FormData();
        formDataArquivo.append('arquivo', file);
        await uploadService.uploadProdutoArquivo(produtoId, formDataArquivo);
      }

      for (const file of formData.videosParaEnviar) {
        const formDataVideo = new FormData();
        formDataVideo.append('video', file);
        await uploadService.uploadProdutoVideo(produtoId, formDataVideo);
      }

      success(produtoEditando ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!");
      fecharModal();
      await carregarProdutos();
    } catch (err) {
      console.error("Erro ao salvar produto:", err.response?.data || err);
      error(err.response?.data?.erro || "Erro ao salvar produto.");
    } finally {
      setSalvando(false);
    }
  }

  const handleExcluir = (produto) => setProdutoExcluindo(produto);

  const confirmarExclusao = async () => {
    if (!produtoExcluindo) return;
    try {
      await produtosService.excluir(produtoExcluindo.id);
      success("Produto excluído com sucesso!");
      setProdutoExcluindo(null);
      await carregarProdutos();
    } catch (err) {
      error(err.response?.data?.erro || "Erro ao excluir produto.");
      setProdutoExcluindo(null);
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  const onImageDrop = (files) => setFormData(prev => ({ ...prev, imagensParaEnviar: [...prev.imagensParaEnviar, ...files] }));
  const onFileDrop = (files) => setFormData(prev => ({ ...prev, arquivosParaEnviar: [...prev.arquivosParaEnviar, ...files] }));
  const onVideoDrop = (files) => setFormData(prev => ({ ...prev, videosParaEnviar: [...prev.videosParaEnviar, ...files] }));

  const removerImagemParaEnviar = (i) => setFormData(prev => ({ ...prev, imagensParaEnviar: prev.imagensParaEnviar.filter((_, idx) => idx !== i) }));
  const removerArquivoParaEnviar = (i) => setFormData(prev => ({ ...prev, arquivosParaEnviar: prev.arquivosParaEnviar.filter((_, idx) => idx !== i) }));
  const removerVideoParaEnviar = (i) => setFormData(prev => ({ ...prev, videosParaEnviar: prev.videosParaEnviar.filter((_, idx) => idx !== i) }));

  const removerArquivoExistente = async (arquivoId) => {
    if (!produtoEditando) return;
    try {
      await uploadService.excluirArquivo(arquivoId);
      await carregarProdutoParaEdicao(produtoEditando.id);
      success("Arquivo removido com sucesso!");
    } catch (err) {
      error("Erro ao remover arquivo.");
    }
  }

  const definirPrincipal = async (arquivoId) => {
    if (!produtoEditando) return;
    try {
      await uploadService.definirImagemPrincipal(produtoEditando.id, arquivoId);
      await carregarProdutoParaEdicao(produtoEditando.id);
      success("Imagem principal definida!");
    } catch (err) {
      error("Erro ao definir imagem principal.");
    }
  }

  const handleDragEnd = async (result) => {
    if (!result.destination || !produtoEditando) return;

    const novaOrdem = Array.from(formData.imagensExistentes);
    const [itemMovido] = novaOrdem.splice(result.source.index, 1);
    novaOrdem.splice(result.destination.index, 0, itemMovido);

    setFormData(prev => ({ ...prev, imagensExistentes: novaOrdem }));

    try {
      const idsOrdenados = novaOrdem.map(img => img.id);
      await uploadService.atualizarOrdemImagens(produtoEditando.id, { ordem: idsOrdenados });
      success("Ordem das imagens atualizada!");
    } catch (err) {
      error("Falha ao salvar a nova ordem das imagens.");
      await carregarProdutoParaEdicao(produtoEditando.id);
    }
  };

  const adicionarVariacao = () => setVariacoes(prev => [...(Array.isArray(prev) ? prev : []), { nome: "", preco: "0.00", estoque: "0", digital: false, ativo: true }]);
  const removerVariacao = (index) => setVariacoes(prev => prev.filter((_, i) => i !== index));
  const handleVariacaoChange = (index, campo, valor) => setVariacoes(prev => prev.map((v, i) => (i === index ? { ...v, [campo]: valor } : v)));
  
  const totalPages = Math.ceil(total / PRODUTOS_POR_PAGINA);
  
  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Produtos</h1>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full">
          <div className="relative w-full sm:w-auto">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar por nome..." value={busca} onChange={handleBusca} className="pl-10 pr-4 py-2 border rounded-md w-full"/>
          </div>
          <select value={categoria} onChange={handleCategoriaChange} className="px-4 py-2 border rounded-md w-full sm:w-auto">
            <option value="">Todas as categorias</option>
            {categorias.map((cat) => (<option key={cat.id} value={cat.id}>{cat.nome}</option>))}
          </select>
        </div>
        <button onClick={() => abrirModal()} className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center justify-center shrink-0">
          <PlusIcon className="mr-2" /> Novo Produto
        </button>
      </div>

      {loading ? (<LoadingSpinner />) : (
        <>
          <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full bg-white border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Produto</th>
                  <th className="p-3 text-left">Variações</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((produto) => (
                  <tr key={produto.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 flex items-center gap-4">
                      <img src={produto.imagens?.[0] || "https://via.placeholder.com/150"} alt={produto.nome} className="w-12 h-12 rounded-md object-cover"/>
                      <span className="font-medium">{produto.nome}</span>
                    </td>
                    <td className="p-3">
                      <div className="space-y-2">
                        {Array.isArray(produto.variacoes) && produto.variacoes.length > 0 ? (
                          produto.variacoes.map((v, i) => (
                            <div key={i} className="flex items-center space-x-2 text-sm">
                              <span className="font-medium">{v.nome}:</span>
                              <span>{formatarPrecoParaExibicao(v.preco)}</span>
                              <span className="text-gray-500">({v.estoque} un.)</span>
                              {v.digital && <span className="text-blue-500">[Digital]</span>}
                            </div>
                          ))
                        ) : (<span className="text-gray-500 text-sm">Sem variações</span>)}
                      </div>
                    </td>
                    <td className="p-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${produto.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{produto.ativo ? "Ativo" : "Inativo"}</span></td>
                    <td className="p-3 text-right">
                      <button onClick={() => abrirModal(produto)} className="p-2 text-gray-500 hover:text-blue-600"><Pencil1Icon /></button>
                      <button onClick={() => handleExcluir(produto)} className="p-2 text-gray-500 hover:text-red-600"><TrashIcon /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {produtos.map((produto) => (
              <div key={produto.id} className="bg-white p-4 rounded-lg shadow">
                 <div className="flex items-start gap-4">
                    <img src={produto.imagens?.[0] || "https://via.placeholder.com/150"} alt={produto.nome} className="w-16 h-16 rounded-md object-cover" />
                    <div className="flex-1">
                        <h3 className="font-bold text-lg">{produto.nome}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${produto.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{produto.ativo ? "Ativo" : "Inativo"}</span>
                    </div>
                 </div>
                <div className="mt-3 space-y-2 border-t pt-3">
                  {Array.isArray(produto.variacoes) && produto.variacoes.length > 0 ? produto.variacoes.map((v, i) => (
                    <div key={i} className="text-sm"><span className="font-medium">{v.nome}: </span>{formatarPrecoParaExibicao(v.preco)} ({v.estoque} un.)</div>
                  )) : <p className="text-gray-500 text-sm">Sem variações</p>}
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <button onClick={() => abrirModal(produto)} className="p-2 bg-gray-100 rounded-md"><Pencil1Icon /></button>
                  <button onClick={() => handleExcluir(produto)} className="p-2 bg-red-100 text-red-600 rounded-md"><TrashIcon /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (<div className="flex justify-center items-center mt-6"><button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina <= 1} className="px-4 py-2 border rounded-l-md bg-white hover:bg-gray-50 disabled:opacity-50">Anterior</button><span className="px-4 py-2 border-t border-b bg-white">Página {pagina} de {totalPages}</span><button onClick={() => setPagina(p => Math.min(totalPages, p + 1))} disabled={pagina >= totalPages} className="px-4 py-2 border rounded-r-md bg-white hover:bg-gray-50 disabled:opacity-50">Próxima</button></div>)}

      <Dialog.Root open={modalAberto} onOpenChange={setModalAberto}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-black/50 fixed inset-0 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-bold mb-4">{produtoEditando ? "Editar Produto" : "Novo Produto"}</Dialog.Title>
            <Dialog.Close asChild><button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><Cross2Icon /></button></Dialog.Close>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Nome</label><input name="nome" value={formData.nome} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md"/></div>
                <div><label className="block text-sm font-medium">Categoria</label><select name="categoriaId" value={formData.categoriaId} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md"><option value="">Selecione...</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
              </div>
              <div><label className="block text-sm font-medium">Descrição</label><textarea name="descricao" value={formData.descricao} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" rows="4"></textarea></div>
              <div className="flex items-center"><input type="checkbox" name="ativo" checked={formData.ativo} onChange={handleChange} className="h-4 w-4 rounded"/><label className="ml-2">Ativo</label></div>

              <div className="space-y-4"><h3 className="text-lg font-semibold">Imagens</h3>
                {formData.imagensExistentes.length > 0 && (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="imagensDroppable" direction="horizontal">
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-wrap gap-4">
                          {formData.imagensExistentes.map((img, index) => (
                            <Draggable key={String(img.id)} draggableId={String(img.id)} index={index}>
                              {(provided) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} className="relative group">
                                  <img src={img.url} alt="preview" className="w-24 h-24 object-cover rounded-lg"/>
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                    <button type="button" {...provided.dragHandleProps} className="p-1.5 text-white cursor-move"><DragHandleDots2Icon /></button>
                                    <button type="button" onClick={() => definirPrincipal(img.id)} className={`p-1.5 rounded-full ${img.principal ? 'text-yellow-400' : 'text-white'}`}><StarFilledIcon /></button>
                                    <button type="button" onClick={() => removerArquivoExistente(img.id)} className="p-1.5 text-white hover:text-red-500"><TrashIcon /></button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
                <FileDropZone onDrop={onImageDrop} accept={{ 'image/*': [] }} tipo="imagem" />
                <div className="flex flex-wrap gap-4 mt-2">
                  {formData.imagensParaEnviar.map((file, index) => (
                     <div key={index} className="relative group w-24 h-24">
                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover rounded-lg"/>
                        <button type="button" onClick={() => removerImagemParaEnviar(index)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100">×</button>
                     </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4"><h3 className="text-lg font-semibold">Arquivo Digital</h3>
                  {formData.arquivosExistentes.map(arq => <div key={arq.id} className="text-sm"><span>{arq.nome}</span> <button type="button" onClick={() => removerArquivoExistente(arq.id)} className="text-red-500 ml-2">Remover</button></div>)}
                  <FileDropZone onDrop={onFileDrop} maxFiles={5} tipo="arquivo" />
                  {formData.arquivosParaEnviar.map((file, index) => <div key={index} className="text-sm">{file.name} <button type="button" onClick={() => removerArquivoParaEnviar(index)} className="text-red-500 ml-2">Remover</button></div>)}
                </div>
                <div className="space-y-4"><h3 className="text-lg font-semibold">Vídeo</h3>
                  {formData.videosExistentes.map(vid => <div key={vid.id} className="text-sm">{vid.nome} <button type="button" onClick={() => removerArquivoExistente(vid.id)} className="text-red-500 ml-2">Remover</button></div>)}
                  <FileDropZone onDrop={onVideoDrop} maxFiles={1} accept={{ 'video/*': [] }} tipo="video" />
                  {formData.videosParaEnviar.map((file, index) => <div key={index} className="text-sm">{file.name} <button type="button" onClick={() => removerVideoParaEnviar(index)} className="text-red-500 ml-2">Remover</button></div>)}
                </div>
              </div>

              <div className="space-y-4"><h3 className="text-lg font-semibold">Variações</h3>
                {variacoes.map((v, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-2 border rounded-md">
                    <div className="md:col-span-4"><input placeholder="Nome" value={v.nome} onChange={e => handleVariacaoChange(i, 'nome', e.target.value)} className="w-full p-2 border rounded"/></div>
                    <div className="md:col-span-3"><input placeholder="Preço (ex: 10.50)" value={v.preco} onChange={e => handleVariacaoChange(i, 'preco', e.target.value)} className="w-full p-2 border rounded"/></div>
                    <div className="md:col-span-2"><input type="number" placeholder="Estoque" value={v.estoque} onChange={e => handleVariacaoChange(i, 'estoque', e.target.value)} className="w-full p-2 border rounded"/></div>
                    <div className="md:col-span-1 flex items-center justify-center"><input type="checkbox" checked={v.digital} onChange={e => handleVariacaoChange(i, 'digital', e.target.checked)} className="h-4 w-4"/><label className="ml-1 text-xs">Digital</label></div>
                    <div className="md:col-span-1 flex items-center justify-center"><input type="checkbox" checked={v.ativo} onChange={e => handleVariacaoChange(i, 'ativo', e.target.checked)} className="h-4 w-4"/><label className="ml-1 text-xs">Ativo</label></div>
                    <div className="md:col-span-1 flex justify-end"><button type="button" onClick={() => removerVariacao(i)} className="text-red-500"><TrashIcon /></button></div>
                  </div>
                ))}
                <button type="button" onClick={adicionarVariacao} className="text-sm text-blue-600 hover:underline">Adicionar Variação</button>
              </div>

              <div className="flex justify-end gap-4"><button type="button" onClick={fecharModal} className="px-4 py-2 border rounded">Cancelar</button><button type="submit" disabled={salvando} className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300">{salvando ? 'Salvando...' : 'Salvar'}</button></div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog.Root open={!!produtoExcluindo} onOpenChange={() => setProdutoExcluindo(null)}>
        <AlertDialog.Portal>
            <AlertDialog.Overlay className="bg-black/40 fixed inset-0 z-50" />
            <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg z-50">
                <AlertDialog.Title className="font-bold text-lg">Confirmar Exclusão</AlertDialog.Title>
                <AlertDialog.Description className="my-4">Tem certeza que deseja excluir o produto "{produtoExcluindo?.nome}"?</AlertDialog.Description>
                <div className="flex justify-end gap-4">
                    <AlertDialog.Cancel asChild><button className="px-4 py-2 bg-gray-200 rounded">Cancelar</button></AlertDialog.Cancel>
                    <AlertDialog.Action asChild><button onClick={confirmarExclusao} className="px-4 py-2 bg-red-500 text-white rounded">Excluir</button></AlertDialog.Action>
                </div>
            </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  )
}

export default Produtos