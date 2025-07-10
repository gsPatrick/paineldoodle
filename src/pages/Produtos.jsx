// src/components/Admin/Produtos.jsx

"use client"

import { useState, useEffect } from "react"
import { produtosService, categoriasService, variacoesService } from "../services/api"
import { useToast } from "../contexts/ToastContext"
import LoadingSpinner from "../components/LoadingSpinner"
import * as Dialog from "@radix-ui/react-dialog"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { MagnifyingGlassIcon, PlusIcon, Pencil1Icon, TrashIcon, Cross2Icon, StarIcon, StarFilledIcon, DragHandleDots2Icon } from "@radix-ui/react-icons"
import FileDropZone from "../components/FileDropZone"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

// NOVO: Definindo a constante para o limite de produtos por página
const PRODUTOS_POR_PAGINA = 500; // O limite desejado de 500 produtos

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
    // ArquivoProdutos agora será o 'single source of truth' para todos os arquivos
    ArquivoProdutos: [], // Este conterá todos os arquivos (imagens, vídeos, arquivos)
    imagensParaEnviar: [],
    arquivosParaEnviar: [],
    videosParaEnviar: []
    // Removido imagensExistentes, arquivosExistentes, videosExistentes, imagensParaRemover, etc.
    // Tudo será filtrado de ArquivoProdutos e manipulado diretamente via API.
  })

  // const [precoFormatado, setPrecoFormatado] = useState("") // Removido, pois variações têm seu próprio preço
  const [salvando, setSalvando] = useState(false)
  const [variacoes, setVariacoes] = useState([])

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    carregarProdutos()
  }, [pagina, busca, categoria])

  useEffect(() => {
    // Garantir que variacoes seja sempre um array válido
    if (!Array.isArray(variacoes)) {
      setVariacoes([]);
    }
  }, [variacoes]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [produtosRes, categoriasRes] = await Promise.all([
        // ALTERAÇÃO CRÍTICA: Usar 'limit' em vez de 'limite'
        produtosService.listar({ pagina: 1, limit: PRODUTOS_POR_PAGINA }),
        categoriasService.listar(),
      ])
      // A resposta da API de produtos pode ter um formato diferente
      const produtosList = produtosRes.data.produtos || produtosRes.data;
      const totalProdutos = produtosRes.data.total || produtosList.length;

      setProdutos(produtosList)
      setTotal(totalProdutos)
      setCategorias(categoriasRes.data)
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
      error("Erro ao carregar dados. Verifique o console para mais detalhes.")
    } finally {
      setLoading(false)
    }
  }

  const carregarProdutos = async () => {
    setLoading(true);
    try {
      const response = await produtosService.listar({
        pagina,
        // ALTERAÇÃO CRÍTICA: Usar 'limit' em vez de 'limite'
        limit: PRODUTOS_POR_PAGINA,
        busca: busca || undefined,
        categoria: categoria || undefined,
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
    setBusca(e.target.value)
    setPagina(1)
  }

  const handleCategoriaChange = (e) => {
    setCategoria(e.target.value)
    setPagina(1)
  }

  const abrirModal = async (produto = null) => {
    if (produto) {
      try {
        setLoading(true);
        // Busca os dados completos do produto para edição
        const resposta = await produtosService.obter(produto.id);
        const produtoCompleto = resposta.data;

        setProdutoEditando(produtoCompleto);
        setFormData({
          nome: produtoCompleto.nome || "",
          descricao: produtoCompleto.descricao || "",
          categoriaId: produtoCompleto.categoriaId || "",
          ativo: produtoCompleto.ativo !== undefined ? produtoCompleto.ativo : true,
          // Agora, todos os arquivos (imagens, vídeos, arquivos) vêm em ArquivoProdutos
          ArquivoProdutos: Array.isArray(produtoCompleto.ArquivoProdutos) ? produtoCompleto.ArquivoProdutos : [],
          imagensParaEnviar: [],
          arquivosParaEnviar: [],
          videosParaEnviar: []
        });
        
        // Inicializar variações com valores padrão
        const variacoesData = produtoCompleto.variacoes || [];
        setVariacoes(variacoesData.map(v => ({
          id: v.id,
          nome: v.nome || "",
          preco: v.preco !== undefined && v.preco !== null ? String(v.preco) : "0",
          digital: Boolean(v.digital),
          estoque: v.estoque !== undefined ? String(v.estoque) : "0",
          ativo: v.ativo !== undefined ? Boolean(v.ativo) : true
        })));
      } catch (err) {
        error("Erro ao carregar detalhes do produto para edição.");
        setVariacoes([]); // Garantir que variacoes seja um array vazio em caso de erro
        // Limpar formData de arquivos existentes em caso de erro de carregamento
        setFormData(prev => ({
          ...prev,
          ArquivoProdutos: [],
          imagensParaEnviar: [],
          arquivosParaEnviar: [],
          videosParaEnviar: []
        }));
        return;
      } finally {
        setLoading(false);
      }
    } else {
      setProdutoEditando(null)
      setFormData({
        nome: "",
        descricao: "",
        categoriaId: "",
        ativo: true,
        ArquivoProdutos: [],
        imagensParaEnviar: [],
        arquivosParaEnviar: [],
        videosParaEnviar: []
      })
      setVariacoes([]) // Garantir que variacoes seja um array vazio ao criar novo produto
    }
    setModalAberto(true)
  }

  const fecharModal = () => {
    setModalAberto(false)
    setProdutoEditando(null)
  }

  const formatarPreco = (valor) => {
    if (!valor && valor !== 0) return 'R$ 0,00';
    
    // Converter para string se não for
    const valorStr = String(valor);
    
    // Remover caracteres não numéricos
    const numerico = valorStr.replace(/\D/g, '');
    if (!numerico) return 'R$ 0,00';
    
    // Converter para número e formatar
    const numero = parseFloat(numerico) / 100;
    if (isNaN(numero)) return 'R$ 0,00';
    
    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    });
  }

  // Removido handlePrecoChange pois o preço agora é tratado por variação

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSalvando(true)

    const dadosProduto = {
      nome: formData.nome,
      descricao: formData.descricao,
      categoriaId: formData.categoriaId,
      ativo: formData.ativo,
    }

    try {
      let produtoId;
      let message;

      // 1. Primeiro, criar ou atualizar o produto principal
      if (produtoEditando) {
        await produtosService.atualizar(produtoEditando.id, dadosProduto)
        produtoId = produtoEditando.id;
        message = "Produto atualizado com sucesso!";
        
        // 2. Se estamos editando, primeiro excluímos as variações existentes
        if (Array.isArray(produtoEditando.variacoes) && produtoEditando.variacoes.length > 0) {
          for (const variacao of produtoEditando.variacoes) {
            try {
              if (variacao.id) { // Só tenta excluir se a variação tem um ID (já existia no DB)
                await variacoesService.excluir(produtoId, variacao.id);
              }
            } catch (err) {
              console.error(`Erro ao excluir variação ${variacao.id}:`, err);
              // Não impede o resto do processo
            }
          }
        }
      } else {
        const resposta = await produtosService.criar(dadosProduto)
        produtoId = resposta.data.id;
        message = "Produto criado com sucesso!";
      }

      // 3. Criar variações em lote (agora todas são novas ou recriadas)
      if (Array.isArray(variacoes) && variacoes.length > 0) {
        try {
          const variacoesParaEnviar = variacoes.map(variacao => {
            let preco = 0;
            if (variacao.preco) {
              let precoLimpo = String(variacao.preco).replace(/[^\d,.-]/g, '');
              const partes = precoLimpo.split(/[,.]/); // Divide por vírgula ou ponto
              if (partes.length > 2) { // Ex: 1.000,00 -> partes = ['1','000','00']
                  // Pega tudo antes da última parte e junta, depois adiciona a última parte como decimal
                  const inteira = partes.slice(0, -1).join('');
                  const decimal = partes[partes.length - 1];
                  precoLimpo = `${inteira}.${decimal}`;
              } else if (partes.length === 2 && valorLimpo.includes(',')) { // Ex: 10,00
                  precoLimpo = precoLimpo.replace(',', '.');
              }
              preco = parseFloat(precoLimpo);
              if (isNaN(preco)) {
                preco = 0;
              }
            }
            return {
              nome: variacao.nome || "Variação",
              preco: preco,
              digital: Boolean(variacao.digital),
              estoque: parseInt(variacao.estoque) || 0,
              ativo: Boolean(variacao.ativo)
            };
          });
          
          await variacoesService.criarEmLote(produtoId, variacoesParaEnviar);
        } catch (err) {
          console.error("Erro ao criar variações:", err);
          error("Erro ao criar variações do produto");
          // Continua o processo mesmo com erro de variação, se necessário
        }
      }

      // 4. Upload de imagens (corrigido o campo 'files')
      if (Array.isArray(formData.imagensParaEnviar) && formData.imagensParaEnviar.length > 0) {
        try {
          const formDataImagem = new FormData();
          formData.imagensParaEnviar.forEach(imagem => {
            formDataImagem.append("files", imagem); // <-- CORRIGIDO AQUI: 'files'
          });
          await produtosService.uploadImagens(produtoId, formDataImagem);
        } catch (err) {
          console.error("Erro ao fazer upload das imagens:", err);
          error("Erro ao fazer upload das imagens");
          // Não impede o resto do processo
        }
      }

      // 5. Upload de arquivos digitais (corrigido o campo 'file')
      if (Array.isArray(formData.arquivosParaEnviar) && formData.arquivosParaEnviar.length > 0) {
        try {
          const formDataArquivo = new FormData();
          formDataArquivo.append("file", formData.arquivosParaEnviar[0]); // <-- CORRIGIDO AQUI: 'file'
          await produtosService.uploadArquivo(produtoId, formDataArquivo);
        } catch (err) {
          console.error("Erro ao fazer upload dos arquivos:", err);
          error("Erro ao fazer upload dos arquivos digitais");
          // Não impede o resto do processo
        }
      }

      // 6. Upload de vídeos (corrigido o campo 'file')
      if (Array.isArray(formData.videosParaEnviar) && formData.videosParaEnviar.length > 0) {
        try {
          const formDataVideo = new FormData();
          formDataVideo.append("file", formData.videosParaEnviar[0]); // <-- CORRIGIDO AQUI: 'file'
          await produtosService.uploadVideo(produtoId, formDataVideo);
        } catch (err) {
          console.error("Erro ao fazer upload do vídeo:", err);
          error("Erro ao fazer upload do vídeo");
          // Não impede o resto do processo
        }
      }

      success(message);
      fecharModal();
      carregarProdutos(); // Recarrega a lista de produtos após salvar
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      error(err.response?.data?.erro || "Erro ao salvar produto");
    } finally {
      setSalvando(false);
    }
  }

  const handleExcluir = (produto) => {
    setProdutoExcluindo(produto)
  }

  const confirmarExclusao = async () => {
    if (!produtoExcluindo) return;
    try {
      await produtosService.excluir(produtoExcluindo.id)
      success("Produto excluído com sucesso")
      setProdutoExcluindo(null)
      await carregarProdutos()
    } catch (err) {
      error("Erro ao excluir produto")
      setProdutoExcluindo(null)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
  }

  const onImageDrop = (acceptedFiles) => {
    setFormData(prev => ({
      ...prev,
      imagensParaEnviar: [...(Array.isArray(prev.imagensParaEnviar) ? prev.imagensParaEnviar : []), ...acceptedFiles]
    }))
  }

  const onFileDrop = (acceptedFiles) => {
    setFormData(prev => ({
      ...prev,
      arquivosParaEnviar: [...(Array.isArray(prev.arquivosParaEnviar) ? prev.arquivosParaEnviar : []), ...acceptedFiles]
    }))
  }

  const onVideoDrop = (acceptedFiles) => {
    setFormData(prev => ({
      ...prev,
      videosParaEnviar: [...(Array.isArray(prev.videosParaEnviar) ? prev.videosParaEnviar : []), ...acceptedFiles]
    }))
  }

  const removerImagemParaEnviar = (index) => {
    setFormData(prev => ({
        ...prev,
        imagensParaEnviar: Array.isArray(prev.imagensParaEnviar) 
          ? prev.imagensParaEnviar.filter((_, i) => i !== index)
          : []
    }));
  }

  const removerArquivoParaEnviar = (index) => {
      setFormData(prev => ({
          ...prev,
          arquivosParaEnviar: Array.isArray(prev.arquivosParaEnviar)
            ? prev.arquivosParaEnviar.filter((_, i) => i !== index)
            : []
      }));
  }
  
  const removerVideoParaEnviar = (index) => { // Novo: Remover video do array de "para enviar"
    setFormData(prev => ({
        ...prev,
        videosParaEnviar: Array.isArray(prev.videosParaEnviar)
          ? prev.videosParaEnviar.filter((_, i) => i !== index)
          : []
    }));
  }

  // NOVO: Função para remover arquivo EXISTENTE (via API)
  const removerArquivoExistente = async (arquivoObj) => {
      if(!produtoEditando || !arquivoObj.id) return;
      try {
          await produtosService.removerArquivo(produtoEditando.id, arquivoObj.id);
          success("Arquivo removido com sucesso!");
          // Atualiza o estado local para remover o arquivo da lista
          setFormData(prev => ({
              ...prev,
              ArquivoProdutos: Array.isArray(prev.ArquivoProdutos)
                ? prev.ArquivoProdutos.filter(f => f.id !== arquivoObj.id)
                : []
          }));
      } catch(err) {
          console.error("Erro ao remover arquivo existente:", err);
          error(err.response?.data?.erro || "Erro ao remover arquivo existente.");
      }
  }

  // NOVO: Função para definir imagem principal (via API)
  const definirPrincipal = async (imagemObj) => {
    if(!produtoEditando || !imagemObj.id) return;
    try {
        await produtosService.definirImagemPrincipal(produtoEditando.id, imagemObj.id);
        success("Imagem principal definida com sucesso!");
        // Atualiza o estado local para refletir a mudança
        setFormData(prev => ({
            ...prev,
            ArquivoProdutos: Array.isArray(prev.ArquivoProdutos)
              ? prev.ArquivoProdutos.map(f => ({
                  ...f,
                  principal: (f.id === imagemObj.id) && (f.tipo === 'imagem') // Apenas a imagem principal, se for imagem
                }))
              : []
        }));
    } catch(err) {
        console.error("Erro ao definir imagem principal:", err);
        error(err.response?.data?.erro || "Erro ao definir imagem principal.");
    }
  }

  const adicionarVariacao = () => {
    setVariacoes(prev => {
      const variacoesAtuais = Array.isArray(prev) ? prev : [];
      return [
        ...variacoesAtuais,
        { nome: "", preco: "0.00", estoque: "0", digital: false, ativo: true }
      ];
    });
  }

  const removerVariacao = (index) => {
    setVariacoes(prev => prev.filter((_, i) => i !== index))
  }

  const handleVariacaoChange = (index, campo, valor) => {
    if (campo === "preco") {
      let valorFormatado = String(valor || '').replace(/[^\d,.]/g, ''); // Permite ponto também para entrada direta
      
      const partes = valorFormatado.split('.');
      if (partes.length > 2) { // Remove pontos extras
          valorFormatado = partes.slice(0, -1).join('') + '.' + partes[partes.length - 1];
      }
      
      // Converte vírgula para ponto se houver
      valorFormatado = valorFormatado.replace(',', '.');

      if (valorFormatado.includes('.')) {
        const decimalParts = valorFormatado.split('.');
        if (decimalParts[1] && decimalParts[1].length > 2) {
          decimalParts[1] = decimalParts[1].substring(0, 2);
          valorFormatado = decimalParts.join('.');
        }
      }

      setVariacoes(prev => prev.map((v, i) => i === index ? { ...v, [campo]: valorFormatado } : v));
    } else if (campo === "estoque") {
      setVariacoes(prev => prev.map((v, i) => i === index ? { ...v, [campo]: parseInt(valor) || 0 } : v));
    }
    else if (campo === "digital" || campo === "ativo") {
      setVariacoes(prev => prev.map((v, i) => i === index ? { ...v, [campo]: Boolean(valor) } : v));
    } else {
      setVariacoes(prev => prev.map((v, i) => i === index ? { ...v, [campo]: valor } : v));
    }
  }

  // Calcular totalPages com base na nova constante
  const totalPages = Math.ceil(total / PRODUTOS_POR_PAGINA);

  // carregarProduto agora é chamado uma vez no `abrirModal`
  // e no `useEffect` quando `produtoEditando` muda.

  // Componente de preview de imagem com funcionalidade de arrastar e soltar
  const ImagePreview = ({ imagem, onRemove, onSetPrincipal, index, isDraggable = false }) => (
    <Draggable draggableId={`imagem-${imagem.id}`} index={index} isDragDisabled={!isDraggable}>
      {(provided) => (
        <div 
          className="relative group"
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <img 
            src={imagem.url} // URL já completa
            alt={imagem.nome} 
            className="w-24 h-24 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            {isDraggable && (
              <div {...provided.dragHandleProps} className="absolute top-1 left-1 cursor-move p-1 bg-white/80 rounded-full">
                <DragHandleDots2Icon className="w-4 h-4 text-gray-700" />
              </div>
            )}
            <button
              type="button"
              onClick={() => onSetPrincipal(imagem)}
              className="p-1 bg-white/80 rounded-full hover:bg-white"
              title={imagem.principal ? "Imagem principal" : "Definir como principal"}
            >
              <StarIcon className={`w-4 h-4 ${imagem.principal ? "text-yellow-500" : "text-gray-500"}`} />
            </button>
            <button
              type="button"
              onClick={() => onRemove(imagem)} // Chama onRemove com o objeto da imagem
              className="p-1 bg-white/80 rounded-full hover:bg-white"
              title="Remover imagem"
            >
              <TrashIcon className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );

  // Componente de preview de vídeo
  const VideoPreview = ({ video, onRemove }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3.586l2.707-2.707a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 9.586V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-700 truncate max-w-[200px] block">{video.nome}</span>
          <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
            Visualizar vídeo
          </a>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(video)} // Chama onRemove com o objeto do vídeo
        className="p-1 hover:bg-gray-200 rounded-full"
        title="Remover vídeo"
      >
        <TrashIcon className="h-4 w-4 text-red-500" />
      </button>
    </div>
  );

  // Componente de preview de arquivo
  const FilePreview = ({ arquivo, onRemove }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-700 truncate max-w-[200px] block">{arquivo.nome}</span>
          <a href={arquivo.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
            Visualizar arquivo
          </a>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(arquivo)} // Chama onRemove com o objeto do arquivo
        className="p-1 hover:bg-gray-200 rounded-full"
        title="Remover arquivo"
      >
        <TrashIcon className="h-4 w-4 text-red-500" />
      </button>
    </div>
  );


  const handleDragEnd = async (result) => {
    if (!result.destination || result.source.index === result.destination.index) {
      return;
    }

    const novaOrdem = Array.from(formData.ArquivoProdutos.filter(f => f.tipo === 'imagem')); // Pega apenas imagens para reordenar
    const [imagemMovida] = novaOrdem.splice(result.source.index, 1);
    novaOrdem.splice(result.destination.index, 0, imagemMovida);

    // Atualiza o estado de ArquivoProdutos mesclando a nova ordem das imagens com os outros tipos de arquivos
    setFormData(prev => ({
      ...prev,
      ArquivoProdutos: [
        ...novaOrdem, // Imagens reordenadas
        ...prev.ArquivoProdutos.filter(f => f.tipo !== 'imagem') // Outros tipos de arquivos mantêm sua posição
      ].sort((a, b) => { // Opcional: Reordenar todos por ordem e principal para manter o principal no topo
          if (a.principal && !b.principal) return -1;
          if (!a.principal && b.principal) return 1;
          return a.ordem - b.ordem;
      })
    }));

    // Envia a nova ordem para o servidor APENAS se estiver editando um produto
    if (produtoEditando) {
      try {
        const idsOrdenados = novaOrdem.map(imagem => imagem.id);
        await produtosService.atualizarOrdemImagens(produtoEditando.id, idsOrdenados);
        success("Ordem das imagens atualizada com sucesso!");
      } catch (err) {
        console.error("Erro ao atualizar ordem das imagens:", err);
        error("Erro ao atualizar ordem das imagens.");
        // Reverte a ordem em caso de erro, recarregando o produto
        carregarProduto(produtoEditando.id);
      }
    }
  };

  const imagensExistentes = formData.ArquivoProdutos.filter(f => f.tipo === 'imagem').sort((a,b) => a.ordem - b.ordem);
  const arquivosExistentes = formData.ArquivoProdutos.filter(f => f.tipo === 'arquivo');
  const videosExistentes = formData.ArquivoProdutos.filter(f => f.tipo === 'video');


  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Produtos</h1>

      {/* Barra de Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full">
          <div className="relative w-full sm:w-auto">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={busca}
              onChange={handleBusca}
              className="pl-10 pr-4 py-2 border rounded-md w-full"
            />
          </div>
          <select
            value={categoria}
            onChange={handleCategoriaChange}
            className="px-4 py-2 border rounded-md w-full sm:w-auto"
          >
            <option value="">Todas as categorias</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => abrirModal()}
          style={{ width: '190px' }}
          className="bg-blue-500 text-white px-4 py-2 rounded-md flex items-center  justify-center"
        >
          <PlusIcon className="mr-2" /> Novo Produto
        </button>
      </div>

      {/* Tabela de Produtos (Apenas para telas médias e grandes) */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="w-full bg-gray-100 text-left">
                  <th className="p-3">Produto</th>
                  <th className="p-3">Variações</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((produto) => (
                  <tr key={produto.id} className="border-b">
                    <td className="p-3 flex items-center">
                      <div className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={
                            (produto.imagens && produto.imagens.length > 0)
                              ? produto.imagens[0]
                              : "https://via.placeholder.com/150"
                          }
                          alt={produto.nome}
                          className="w-12 h-12 rounded-md object-cover"
                        />
                      </div>
                      <span>{produto.nome}</span>
                    </td>
                    <td className="p-3">
                      <div className="space-y-2">
                        {Array.isArray(produto.variacoes) && produto.variacoes.length > 0 ? (
                          produto.variacoes.map((variacao, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                              <span className="font-medium">{variacao?.nome || "Variação"}:</span>
                              <span>{variacao?.preco !== undefined && variacao?.preco !== null 
                                ? formatarPreco(String(variacao.preco)) 
                                : formatarPreco('0')}</span>
                              <span className="text-gray-500">({variacao?.estoque || 0} un.)</span>
                              {variacao?.digital && <span className="text-blue-500">[Digital]</span>}
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-500">Sem variações</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          produto.ativo ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                        }`}
                      >
                        {produto.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-3">
                      <button onClick={() => abrirModal(produto)} className="mr-2">
                        <Pencil1Icon />
                      </button>
                      <button onClick={() => handleExcluir(produto)}>
                        <TrashIcon className="text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Lista de Produtos em Cards (Apenas para telas pequenas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {produtos.map((produto) => (
              <div key={produto.id} className="bg-white p-4 rounded-lg shadow">
                <img
                  src={(produto.imagens && produto.imagens.length > 0) ? produto.imagens[0] : "https://via.placeholder.com/150"}
                  alt={produto.nome}
                  className="w-full h-32 object-cover rounded-md mb-4"
                />
                <h3 className="font-bold text-lg">{produto.nome}</h3>
                
                <div className="mt-3 space-y-2">
                  {Array.isArray(produto.variacoes) && produto.variacoes.length > 0 ? (
                    produto.variacoes.map((variacao, index) => (
                      <div key={index} className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-medium">{variacao?.nome || "Variação"}:</span>
                        <span>{variacao?.preco !== undefined && variacao?.preco !== null 
                          ? formatarPreco(String(variacao.preco)) 
                          : formatarPreco('0')}</span>
                        <span className="text-gray-500">({variacao?.estoque || 0} un.)</span>
                        {variacao?.digital && <span className="text-blue-500">[Digital]</span>}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Sem variações</p>
                  )}
                </div>

                <div className="mt-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      produto.ativo ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"
                    }`}
                  >
                    {produto.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <button onClick={() => abrirModal(produto)} className="p-2 bg-gray-200 rounded-md">
                    <Pencil1Icon />
                  </button>
                  <button onClick={() => handleExcluir(produto)} className="p-2 bg-red-100 text-red-600 rounded-md">
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Paginação */}
      <div className="flex justify-center items-center mt-4">
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPagina(pagina - 1)}
              disabled={pagina <= 1 || loading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="px-4 py-2 text-sm">
              Página {pagina} de {totalPages}
            </span>
            <button
              onClick={() => setPagina(pagina + 1)}
              disabled={pagina >= totalPages || loading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      {/* Modal de Edição/Criação */}
      <Dialog.Root open={modalAberto}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-black/50 fixed inset-0 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <Dialog.Title className="text-xl font-bold mb-4">
                {produtoEditando ? "Editar Produto" : "Novo Produto"}
              </Dialog.Title>
              <button 
                onClick={fecharModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <Cross2Icon />
              </button>
              
              <form onSubmit={handleSubmit}>
                {/* Campos do formulário */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label>Nome</label>
                    <input name="nome" value={formData.nome} onChange={handleChange} className="w-full p-2 border rounded"/>
                  </div>
                  <div>
                    <label>Categoria</label>
                    <select name="categoriaId" value={formData.categoriaId} onChange={handleChange} className="w-full p-2 border rounded">
                      <option value="">Selecione...</option>
                      {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label>Descrição</label>
                  <textarea name="descricao" value={formData.descricao} onChange={handleChange} className="w-full p-2 border rounded" rows="4"></textarea>
                </div>
                <div className="mt-4 flex items-center space-x-4">
                    <div className="flex items-center">
                      <input type="checkbox" name="ativo" checked={formData.ativo} onChange={handleChange} className="mr-2"/>
                      <label>Ativo</label>
                    </div>
                </div>

                {/* Preview de imagens existentes */}
                {imagensExistentes && imagensExistentes.length > 0 && (
                  <div className="mt-6 p-4 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Imagens Existentes</h3>
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable droppableId="imagens" direction="horizontal">
                        {(provided) => (
                          <div 
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            {imagensExistentes.map((imagem, index) => ( // Usa imagensExistentes filtrado
                              <ImagePreview
                                key={imagem.id}
                                imagem={imagem}
                                index={index}
                                isDraggable={true}
                                onRemove={removerArquivoExistente} // <-- CHAMA A FUNÇÃO DE REMOÇÃO VIA API
                                onSetPrincipal={definirPrincipal} // <-- CHAMA A FUNÇÃO DE DEFINIR PRINCIPAL VIA API
                              />
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                )}

                {/* Upload de imagens */}
                <div className="mt-6 p-4 bg-white rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">Upload de Novas Imagens</h3>
                  <FileDropZone
                    onDrop={onImageDrop}
                    accept={{
                      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
                    }}
                    maxFiles={10}
                    tipo="imagem"
                  />
                  {Array.isArray(formData.imagensParaEnviar) && formData.imagensParaEnviar.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {formData.imagensParaEnviar.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removerImagemParaEnviar(index)}
                              className="p-1 bg-white/80 rounded-full hover:bg-white"
                              title="Remover imagem"
                            >
                              <TrashIcon className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload de arquivos */}
                {Array.isArray(variacoes) && variacoes.some(v => v.digital) && (
                  <div className="mt-6 p-4 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">Upload de Novo Arquivo Digital</h3>
                    <FileDropZone
                      onDrop={onFileDrop}
                      accept={{
                        'application/pdf': ['.pdf'],
                        'application/zip': ['.zip'],
                      }}
                      maxFiles={1}
                      tipo="arquivo"
                    />
                    {Array.isArray(formData.arquivosParaEnviar) && formData.arquivosParaEnviar.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {formData.arquivosParaEnviar.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{file.name}</span>
                              <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removerArquivoParaEnviar(index)}
                              className="p-1 hover:bg-gray-200 rounded-full"
                            >
                              <TrashIcon className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Upload de vídeos */}
                <div className="mt-6 p-4 bg-white rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">Upload de Novo Vídeo</h3>
                  <FileDropZone
                    onDrop={onVideoDrop}
                    accept={{
                      'video/*': ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']
                    }}
                    maxFiles={1}
                    tipo="video"
                  />
                  {Array.isArray(formData.videosParaEnviar) && formData.videosParaEnviar.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.videosParaEnviar.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{file.name}</span>
                            <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removerVideoParaEnviar(index)} // <-- CHAMA A REMOÇÃO DE "PARA ENVIAR"
                            className="p-1 hover:bg-gray-200 rounded-full"
                          >
                            <TrashIcon className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Preview de vídeos existentes */}
                {videosExistentes && videosExistentes.length > 0 && ( // Usa videosExistentes filtrado
                  <div className="mt-6 p-4 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Vídeos Existentes</h3>
                    <div className="space-y-3">
                      {videosExistentes.map((video) => (
                        <VideoPreview
                          key={video.id}
                          video={video}
                          onRemove={removerArquivoExistente} // <-- CHAMA A FUNÇÃO DE REMOÇÃO VIA API
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Preview de arquivos existentes */}
                {arquivosExistentes && arquivosExistentes.length > 0 && ( // Usa arquivosExistentes filtrado
                  <div className="mt-6 p-4 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Arquivos Digitais Existentes</h3>
                    <div className="space-y-3">
                      {arquivosExistentes.map((arquivo) => (
                        <FilePreview
                          key={arquivo.id}
                          arquivo={arquivo}
                          onRemove={removerArquivoExistente} // <-- CHAMA A FUNÇÃO DE REMOÇÃO VIA API
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Seção de Variações */}
                <div className="mt-6 bg-white rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Variações do Produto</h3>
                  
                  {/* Cabeçalho da tabela */}
                  <div className="hidden md:grid grid-cols-6 gap-4 px-4 py-2 bg-gray-50 rounded-t-lg text-sm font-medium text-gray-700">
                    <div className="col-span-2">Nome</div>
                    <div>Preço</div>
                    <div>Estoque</div>
                    <div className="text-center">Digital</div>
                    <div className="text-center">Ativo</div>
                    
                  </div>

                  {/* Lista de variações */}
                  <div className="space-y-3 p-4">
                    {Array.isArray(variacoes) && variacoes.map((variacao, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center bg-white p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                        {/* Nome */}
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 md:hidden mb-1">Nome</label>
                          <input
                            type="text"
                            value={variacao.nome}
                            onChange={(e) => handleVariacaoChange(index, "nome", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Nome da variação"
                          />
                        </div>

                        {/* Preço */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 md:hidden mb-1">Preço</label>
                          <input
                            type="text"
                            value={variacao.preco}
                            onChange={(e) => handleVariacaoChange(index, "preco", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="0.00" // Removido R$, a formatação é só na exibição
                          />
                        </div>

                        {/* Estoque */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 md:hidden mb-1">Estoque</label>
                          <input
                            type="number"
                            value={variacao.estoque}
                            onChange={(e) => handleVariacaoChange(index, "estoque", e.target.value)} // Campo type="number" já ajuda
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="0"
                            min="0"
                          />
                        </div>

                        {/* Digital */}
                        <div className="flex justify-center items-center">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={variacao.digital}
                              onChange={(e) => handleVariacaoChange(index, "digital", e.target.checked)}
                              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-600 md:hidden">Digital</span>
                          </label>
                        </div>

                        {/* Ativo */}
                        <div className="flex justify-center items-center">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={variacao.ativo}
                              onChange={(e) => handleVariacaoChange(index, "ativo", e.target.checked)}
                              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-600 md:hidden">Ativo</span>
                          </label>
                        </div>

                        {/* Botão Remover */}
                        <button
                          type="button"
                          onClick={() => removerVariacao(index)}
                          className="absolute right-2 top-2 md:static text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Botão Adicionar Variação */}
                  <div className="p-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={adicionarVariacao}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <PlusIcon className="h-5 w-5 mr-2 text-gray-500" />
                      Adicionar Variação
                    </button>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={fecharModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {salvando ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal de confirmação de exclusão */}
      {produtoExcluindo && (
        <AlertDialog.Root open={!!produtoExcluindo} onOpenChange={() => setProdutoExcluindo(null)}>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-black/50" />
            <AlertDialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[101] bg-white rounded-lg p-6 shadow-xl w-[400px]">
              <AlertDialog.Title className="text-lg font-semibold text-gray-900 mb-4">
                Confirmar Exclusão
              </AlertDialog.Title>
              <AlertDialog.Description className="text-sm text-gray-600 mb-6">
                Tem certeza que deseja excluir o produto "{produtoExcluindo?.nome}"? Esta ação não pode ser desfeita.
              </AlertDialog.Description>
              <div className="flex justify-end space-x-4">
                <AlertDialog.Cancel asChild>
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                    Cancelar
                  </button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <button
                    onClick={confirmarExclusao}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Excluir
                  </button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      )}

      {/* Loading Dialog */}
      <AlertDialog.Root open={salvando}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-[100] bg-black/50" />
          <AlertDialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[101] bg-white rounded-lg p-6 shadow-xl w-[300px] text-center">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <AlertDialog.Title className="text-lg font-semibold text-gray-900">
                Salvando produto...
              </AlertDialog.Title>
              <AlertDialog.Description className="text-sm text-gray-600">
                Por favor, aguarde enquanto salvamos seu produto.
              </AlertDialog.Description>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  )
}

export default Produtos;