import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  UserPlus, 
  Building2,
  FileUp,
  X,
  Trash2,
  Edit2
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  document: string;
  type: 'PF' | 'PJ';
  score: number;
  classification: string;
  email: string;
  phone?: string;
  address?: string;
}

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [error, setError] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    type: 'PF' as 'PF' | 'PJ',
    email: '',
    phone: '',
    street: '',
    number: '',
    neighborhood: '',
    cep: '',
    address: '' // Keep for backend compatibility
  });

  const [isFetchingCNPJ, setIsFetchingCNPJ] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  // Auto-fetch CNPJ
  useEffect(() => {
    const fetchCNPJ = async () => {
      const cleanCNPJ = formData.document.replace(/\D/g, '');
      if (formData.type === 'PJ' && cleanCNPJ.length === 14 && !editingClient) {
        setIsFetchingCNPJ(true);
        try {
          const response = await api.get(`/clients/cnpj/${cleanCNPJ}`);
          const data = response.data;
          
          if (data.name) {
            setFormData(prev => ({
              ...prev,
              name: data.name || prev.name,
              email: data.email || prev.email,
              phone: data.phone || prev.phone,
              street: data.street || prev.street,
              number: data.number || prev.number,
              neighborhood: data.neighborhood || prev.neighborhood,
              cep: data.cep || prev.cep,
              address: data.address || prev.address
            }));
          }
        } catch (err) {
          console.error('Erro ao buscar CNPJ:', err);
        } finally {
          setIsFetchingCNPJ(false);
        }
      }
    };

    const timer = setTimeout(fetchCNPJ, 500);
    return () => clearTimeout(timer);
  }, [formData.document, formData.type, editingClient]);

  const fetchClients = async () => {
    try {
      console.log('[Frontend] Iniciando fetchClients...');
      const response = await api.get('/clients');
      console.log('[Frontend] Clientes recebidos:', response.data);
      
      if (Array.isArray(response.data)) {
        setClients(response.data);
      } else {
        console.error('[Frontend] Resposta inválida do backend:', response.data);
      }
    } catch (err) {
      console.error('[Frontend] Erro ao buscar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm) {
      fetchClients();
      return;
    }
    try {
      const response = await api.get(`/clients/search?q=${searchTerm}`);
      setClients(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    
    // Simple attempt to parse address
    let street = '';
    let number = '';
    let neighborhood = '';
    let cep = '';

    if (client.address) {
      const parts = client.address.split(',').map(p => p.trim());
      street = parts[0] || '';
      if (parts[1]) {
        const numParts = parts[1].split('-').map(p => p.trim());
        number = numParts[0] || '';
      }
      neighborhood = parts[2] || '';
    }

    setFormData({
      name: client.name,
      document: client.document,
      type: client.type,
      email: client.email || '',
      phone: client.phone || '',
      street,
      number,
      neighborhood,
      cep,
      address: client.address || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Atenção: Excluir este cliente removerá permanentemente todos os seus contratos, cobranças e documentos vinculados. Deseja continuar?')) {
      try {
        await api.delete(`/clients/${id}`);
        fetchClients();
      } catch (err: any) {
        console.error(err);
        const message = err.response?.data?.message || 'Erro ao excluir cliente.';
        alert(message);
      }
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    console.log('[Frontend] Iniciando handleCreateClient com dados:', formData);

    // Combine address fields
    const fullAddress = [
      formData.street,
      formData.number,
      formData.neighborhood,
      formData.cep
    ].filter(Boolean).join(', ');

    // Filter out UI-only fields from the payload
    const { street, number, neighborhood, cep, ...rest } = formData;

    const payload = {
      ...rest,
      address: fullAddress || formData.address
    };

    try {
      if (editingClient) {
        console.log('[Frontend] Atualizando cliente existente:', editingClient.id);
        const response = await api.patch(`/clients/${editingClient.id}`, payload);
        console.log('[Frontend] Cliente atualizado com sucesso:', response.data);
      } else {
        console.log('[Frontend] Criando novo cliente...');
        const response = await api.post('/clients', payload);
        const newClient = response.data;
        console.log('[Frontend] Novo cliente criado:', newClient);
        
        // Adicionar o novo cliente diretamente no estado para feedback imediato
        setClients(prev => {
          const exists = prev.some(c => c.id === newClient.id);
          if (exists) return prev;
          return [newClient, ...prev];
        });
      }
      
      setIsModalOpen(false);
      setEditingClient(null);
      setFormData({ name: '', document: '', type: 'PF', email: '', phone: '', street: '', number: '', neighborhood: '', cep: '', address: '' });
      setSearchTerm('');
      
      console.log('[Frontend] Chamando fetchClients para sincronizar...');
      await fetchClients(); 
    } catch (err: any) {
      console.error('[Frontend] Erro ao salvar cliente:', err);
      setError(err.response?.data?.message || 'Erro ao salvar cliente. Verifique os dados.');
    }
  };

  const openNewClientModal = () => {
    setEditingClient(null);
    setFormData({ name: '', document: '', type: 'PF', email: '', phone: '', street: '', number: '', neighborhood: '', cep: '', address: '' });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Clientes</h2>
          <p className="text-gray-500">Visualize e gerencie seus clientes PF e PJ.</p>
        </div>
        <button 
          onClick={openNewClientModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors font-bold shadow-sm"
        >
          <Plus size={20} />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, CPF/CNPJ ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder:text-gray-400"
          />
        </form>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Documento</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Score</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${client.type === 'PF' ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>
                        {client.type === 'PF' ? <UserPlus size={18} /> : <Building2 size={18} />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{client.name}</p>
                        <p className="text-xs text-gray-500">{client.email || 'Sem email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">{client.document}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{client.type}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full min-w-[60px]">
                        <div 
                          className={`h-full rounded-full ${
                            client.score > 70 ? 'bg-green-500' : client.score > 30 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${client.score}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-800">{client.score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      client.classification === 'ALTO' ? 'bg-green-100 text-green-700' :
                      client.classification === 'MEDIO' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {client.classification}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => {/* Implementar upload modal */}}
                        title="Upload" 
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-blue-600"
                      >
                        <FileUp size={18} />
                      </button>
                      <button 
                        onClick={() => handleEdit(client)}
                        title="Editar" 
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-green-600"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(client.id)}
                        title="Excluir" 
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {clients.length === 0 && !loading && (
          <div className="p-12 text-center">
            <p className="text-gray-500 font-bold">Nenhum cliente encontrado.</p>
          </div>
        )}
      </div>

      {/* Modal Novo/Editar Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">
                {editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 font-medium">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as 'PF' | 'PJ'})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                  >
                    <option value="PF">Pessoa Física (CPF)</option>
                    <option value="PJ">Pessoa Jurídica (CNPJ)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {formData.type === 'PF' ? 'CPF' : 'CNPJ'}
                    {isFetchingCNPJ && <span className="ml-2 text-blue-600 text-xs animate-pulse">Buscando dados...</span>}
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.document}
                    onChange={e => setFormData({...formData, document: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                    placeholder="Apenas números"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nome / Razão Social</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                    placeholder="Ex: João Silva ou Empresa LTDA"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="col-span-2 grid grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Rua</label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={e => setFormData({...formData, street: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                      placeholder="Nome da rua"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Número</label>
                    <input
                      type="text"
                      value={formData.number}
                      onChange={e => setFormData({...formData, number: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">CEP</label>
                    <input
                      type="text"
                      value={formData.cep}
                      onChange={e => setFormData({...formData, cep: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Bairro</label>
                    <input
                      type="text"
                      value={formData.neighborhood}
                      onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                      placeholder="Nome do bairro"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-100"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
