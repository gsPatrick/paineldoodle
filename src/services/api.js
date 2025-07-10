import axios from "axios";

export const api = axios.create({
  baseURL: "https://n8n-doodledreamsbackend.r954jc.easypanel.host/api",
  timeout: 15000,
  maxContentLength: 500 * 1024 * 1024,
  maxBodyLength: 500 * 1024 * 1024,
});

// Interceptor para adicionar o token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);


// --- SERVIÇOS ---

export const authService = {
  login: (email, senha) => api.post("/auth/login", { email, senha }),
  register: (dados) => api.post("/auth/register", dados),
  recuperarSenha: (email) => api.post("/auth/recuperar-senha", { email }),
};

export const usuariosService = {
  listar: (params) => api.get("/usuarios", { params }),
  obter: (id) => api.get(`/usuarios/${id}`),
  criar: (dados) => api.post("/usuarios", dados),
  atualizar: (id, dados) => api.put(`/usuarios/${id}`, dados),
  excluir: (id) => api.delete(`/usuarios/${id}`),
  perfil: () => api.get("/usuarios/perfil"),
  atualizarPerfil: (dados) => api.put("/usuarios/perfil", dados),
};

export const produtosService = {
  listar: (params) => api.get("/produtos", { params }),
  obter: (id) => api.get(`/produtos/${id}`),
  criar: (dados) => api.post("/produtos", dados),
  atualizar: (id, dados) => api.put(`/produtos/${id}`, dados),
  excluir: (id) => api.delete(`/produtos/${id}`),
};

export const categoriasService = {
  listar: () => api.get("/categorias"),
  criar: (dados) => api.post("/categorias", dados),
  atualizar: (id, dados) => api.put(`/categorias/${id}`, dados),
  excluir: (id) => api.delete(`/categorias/${id}`),
};

export const variacoesService = {
  criarEmLote: (produtoId, variacoes) => api.post(`/produtos/${produtoId}/variacoes/lote`, variacoes),
  // CORREÇÃO CRÍTICA: A rota para excluir uma variação é aninhada e precisa dos dois IDs.
  // A rota no backend é /produtos/:produtoId/variacoes/:id
  excluir: (produtoId, variacaoId) => api.delete(`/produtos/${produtoId}/variacoes/${variacaoId}`),
};

// SERVIÇO PARA UPLOADS (separado do produtosService)
export const uploadService = {
  uploadProdutoImagens: (produtoId, formData) => api.post(`/uploads/produtos/${produtoId}/imagens`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300000 }),
  uploadProdutoArquivo: (produtoId, formData) => api.post(`/uploads/produtos/${produtoId}/arquivo`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300000 }),
  // CORREÇÃO: O backend espera o campo 'file' para o upload de vídeo
  uploadProdutoVideo: (produtoId, formData) => api.post(`/uploads/produtos/${produtoId}/video`, formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 600000 }),
  excluirArquivo: (arquivoId) => api.delete(`/uploads/arquivos/${arquivoId}`),
  definirImagemPrincipal: (produtoId, arquivoId) => api.put(`/uploads/produtos/${produtoId}/imagens/${arquivoId}/principal`),
  atualizarOrdemImagens: (produtoId, dados) => api.put(`/uploads/produtos/${produtoId}/imagens/ordem`, dados),
};

export const pedidosService = {
  listar: (params) => api.get("/pedidos", { params }),
  obter: (id) => api.get(`/pedidos/${id}`),
  atualizarStatus: (id, status) => api.put(`/pedidos/${id}/status`, { status }),
  gerarEtiqueta: (id) => api.post(`/pedidos/${id}/etiqueta`),
  adicionarNotaInterna: (id, nota) => api.put(`/pedidos/${id}/nota-interna`, { nota }),
};

export const freteService = {
  listarMetodos: () => api.get("/frete/metodos"),
  obterMetodo: (id) => api.get(`/frete/metodos/${id}`),
  criarMetodo: (dados) => api.post("/frete/metodos", dados),
  atualizarMetodo: (id, dados) => api.put(`/frete/metodos/${id}`, dados),
  removerMetodo: (id) => api.delete(`/frete/metodos/${id}`),
};

export const cuponsService = {
  listar: (params) => api.get("/cupons", { params }),
  obter: (id) => api.get(`/cupons/${id}`),
  criar: (dados) => api.post("/cupons", dados),
  atualizar: (id, dados) => api.put(`/cupons/${id}`, dados),
  excluir: (id) => api.delete(`/cupons/${id}`),
  validar: (codigo) => api.post("/cupons/validar", { codigo }),
};

// SERVIÇO DE RELATÓRIOS
export const relatoriosService = {
  vendas: (params) => api.get("/relatorios/vendas", { params }),
  produtosMaisVendidos: (params) => api.get("/relatorios/produtos-mais-vendidos", { params }),
  desempenhoCupons: () => api.get("/relatorios/desempenho-cupons"),
  clientesAtivos: (params) => api.get("/relatorios/clientes-ativos", { params }),
};

export const dashboardService = {
  metricas: () => api.get("/dashboard/metricas"),
  vendas: (params) => api.get("/dashboard/vendas", { params }),
  produtosMaisVendidos: (params) => api.get("/dashboard/produtos-mais-vendidos", { params }),
  clientesTop: (params) => api.get("/dashboard/clientes-top", { params }),
};

export const planosService = {
  listar: () => api.get("/subscriptions/planos"),
  obter: (id) => api.get(`/subscriptions/planos/${id}`),
  criar: (dados) => api.post("/subscriptions/planos", dados),
  atualizar: (id, dados) => api.put(`/subscriptions/planos/${id}`, dados),
  excluir: (id) => api.delete(`/subscriptions/planos/${id}`),
};

export const assinantesService = {
  listar: (params) => api.get("/subscriptions/subscribers", { params }),
  cancelar: (id) => api.post(`/subscriptions/cancel`, { subscriptionId: id }),
};

export const blogService = {
  listarTodos: (params) => api.get("/blog/admin/todos", { params }),
  obter: (id) => api.get(`/blog/${id}`),
  criar: (dados) => api.post("/blog", dados),
  atualizar: (id, dados) => api.put(`/blog/${id}`, dados),
  aprovar: (id) => api.post(`/blog/${id}/aprovar`),
  uploadImagem: (formData) => {
    return api.post("/blog/upload-imagem", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const configuracoesService = {
  // PADRONIZAÇÃO: A rota deve corresponder ao nome do arquivo de rotas do backend (configuracaoLojaRoutes.js)
  obter: () => api.get("/configuracao-loja"),
  atualizar: (dados) => api.put("/configuracao-loja", dados),
  obterEspecifica: (chave) => api.get(`/configuracao-loja/${chave}`),
  definirEspecifica: (chave, valor) => api.put(`/configuracao-loja/${chave}`, { valor }),
  inicializar: () => api.post("/configuracao-loja/inicializar"),
};