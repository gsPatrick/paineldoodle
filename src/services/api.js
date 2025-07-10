import axios from "axios";

export const api = axios.create({
  baseURL: "https://n8n-doodledreamsbackend.r954jc.easypanel.host/api",
  timeout: 10000,
  maxContentLength: 500 * 1024 * 1024, // 500MB
  maxBodyLength: 500 * 1024 * 1024, // 500MB
});

// Interceptor para adicionar o token JWT em todas as requisições
api.interceptors.request.use((config) => {
  // O nome da chave no localStorage deve ser consistente. Se no seu app você salva como 'doodle_token', use isso.
  // Usando 'token' como exemplo para o painel de admin.
  const token = localStorage.getItem("token"); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para tratar erros de autenticação (401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Erro de autorização (401). Deslogando usuário.");
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
      // Redireciona para a página de login se não estiver nela
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
  // CORREÇÃO: A rota para excluir uma variação é pelo ID dela, não aninhada em produtos
  excluir: (variacaoId) => api.delete(`/variacoes/${variacaoId}`),
};

// NOVO SERVIÇO PARA UPLOADS E GERENCIAMENTO DE ARQUIVOS
export const uploadService = {
  // As rotas aqui correspondem ao uploadController do seu backend
  uploadProdutoImagens: (produtoId, formData) => {
    return api.post(`/uploads/produtos/${produtoId}/imagens`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000,
    });
  },
  
  uploadProdutoArquivo: (produtoId, formData) => {
    return api.post(`/uploads/produtos/${produtoId}/arquivo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000,
    });
  },

  uploadProdutoVideo: (produtoId, formData) => {
    return api.post(`/uploads/produtos/${produtoId}/video`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 600000,
    });
  },
  
  // A rota para excluir é pelo ID do arquivo
  excluirArquivo: (arquivoId) => {
    return api.delete(`/uploads/arquivos/${arquivoId}`);
  },

  definirImagemPrincipal: (produtoId, arquivoId) => {
    return api.put(`/uploads/produtos/${produtoId}/imagens/${arquivoId}/principal`);
  },

  atualizarOrdemImagens: (produtoId, dados) => {
    // A API espera um objeto { ordem: [id1, id2, ...] }
    return api.put(`/uploads/produtos/${produtoId}/imagens/ordem`, dados);
  },
};


// DEMAIS SERVIÇOS (mantidos para completude)

export const usuariosService = {
  listar: (params) => api.get("/usuarios", { params }),
  obter: (id) => api.get(`/usuarios/${id}`),
  criar: (dados) => api.post("/usuarios", dados),
  atualizar: (id, dados) => api.put(`/usuarios/${id}`, dados),
  excluir: (id) => api.delete(`/usuarios/${id}`),
  perfil: () => api.get("/usuarios/perfil"),
  atualizarPerfil: (dados) => api.put("/usuarios/perfil", dados),
};

export const pedidosService = {
  listar: (params) => api.get("/pedidos", { params }),
  obter: (id) => api.get(`/pedidos/${id}`),
  atualizarStatus: (id, status) => api.put(`/pedidos/${id}/status`, { status }),
  adicionarNotaInterna: (id, nota) => api.put(`/pedidos/${id}/nota-interna`, { nota }),
};

export const cuponsService = {
  listar: (params) => api.get("/cupons", { params }),
  obter: (id) => api.get(`/cupons/${id}`),
  criar: (dados) => api.post("/cupons", dados),
  atualizar: (id, dados) => api.put(`/cupons/${id}`, dados),
  excluir: (id) => api.delete(`/cupons/${id}`),
};

export const dashboardService = {
  metricas: () => api.get("/dashboard/metricas"),
  vendas: (params) => api.get("/dashboard/vendas", { params }),
  produtosMaisVendidos: (params) => api.get("/dashboard/produtos-mais-vendidos", { params }),
  clientesTop: (params) => api.get("/dashboard/clientes-top", { params }),
};

export const configuracoesService = {
  obter: () => api.get("/configuracoes/loja"),
  atualizar: (dados) => api.put("/configuracoes/loja", dados),
};