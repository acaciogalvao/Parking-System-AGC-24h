import React, { useState, useEffect } from 'react';
import { checkHealth } from '../services/apiService';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface HealthStatus {
    status: 'Online' | 'Offline';
    db: 'Connected' | 'Disconnected';
}

const StatusIndicator: React.FC = () => {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchHealth = async () => {
        setLoading(true);
        const status = await checkHealth();
        setHealth(status);
        setLoading(false);
    };

    useEffect(() => {
        fetchHealth();
        // Polling a cada 10 segundos para manter o status atualizado
        const interval = setInterval(fetchHealth, 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center text-sm text-slate-500">
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Verificando...
            </div>
        );
    }

    const isOnline = health?.status === 'Online';
    const dbStatus = health?.db === 'Connected';

    const statusText = isOnline ? 'Online' : 'Offline';
    const statusColor = isOnline ? 'text-green-600' : 'text-red-600';
    const statusBg = isOnline ? 'bg-green-100' : 'bg-red-100';
    const statusIcon = isOnline ? CheckCircle : XCircle;

    return (
        <div className={`flex items-center text-sm font-bold px-3 py-1 rounded-full ${statusBg} ${statusColor}`}>
            {React.createElement(statusIcon, { className: "w-4 h-4 mr-1" })}
            {statusText}
            {isOnline && (
                <span className="ml-2 text-xs font-normal text-slate-500">
                    (DB: {dbStatus ? 'Conectado' : 'Desconectado'})
                </span>
            )}
        </div>
    );
};

export default StatusIndicator;
