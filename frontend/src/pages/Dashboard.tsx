import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface Stats {
  totalClients: number;
  totalContractsValue: number;
  billingsByStatus: Array<{
    status: string;
    _count: { id: number };
    _sum: { amount: number };
  }>;
  clientsByType: Array<{
    type: string;
    _count: { id: number };
  }>;
  scoreClassification: Array<{
    classification: string;
    _count: { id: number };
  }>;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (!stats) return <div>Erro ao carregar dados.</div>;

  const getBillingStat = (status: string) => 
    stats.billingsByStatus.find(b => b.status === status);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Analítico</h2>
        <p className="text-gray-500">Bem-vindo à sua plataforma de gestão de crédito.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={24} />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-semibold">Total de Clientes</p>
          <h3 className="text-3xl font-bold text-gray-900">{stats.totalClients}</h3>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <FileText size={24} />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-semibold">Volume de Contratos</p>
          <h3 className="text-3xl font-bold text-gray-900">R$ {stats.totalContractsValue.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
              <Clock size={24} />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-semibold">Cobranças Pendentes</p>
          <h3 className="text-3xl font-bold text-gray-900">R$ {getBillingStat('PENDENTE')?._sum.amount?.toLocaleString() || '0'}</h3>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <AlertCircle size={24} />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-semibold">Inadimplência</p>
          <h3 className="text-3xl font-bold text-gray-900">R$ {getBillingStat('ATRASADO')?._sum.amount?.toLocaleString() || '0'}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Classificação de Score</h3>
          <div className="space-y-4">
            {stats.scoreClassification.map(item => (
              <div key={item.classification} className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  item.classification === 'ALTO' ? 'bg-green-100 text-green-700' :
                  item.classification === 'MEDIO' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {item.classification}
                </span>
                <span className="font-medium text-gray-700">{item._count.id} clientes</span>
              </div>
            ))}
          </div>
        </div>

        {/* Client Types */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Tipos de Clientes</h3>
          <div className="flex items-center justify-around h-32">
            {stats.clientsByType.map(item => (
              <div key={item.type} className="text-center">
                <div className="text-3xl font-bold text-blue-600">{item._count.id}</div>
                <div className="text-gray-500">{item.type}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
