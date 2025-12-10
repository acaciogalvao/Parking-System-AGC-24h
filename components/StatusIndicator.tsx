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
        // checkHealth retorna { status: 'Online' | 'Offline', db: 'Connected' | 'Disconnected' }
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
            <div className="flex items-center text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Verificando...
            </div>
        );
    }

    const isOnline = health?.status === 'Online';

    const statusText = isOnline ? 'Online' : 'Offline';
    const statusColor = isOnline ? 'text-[#00b090]' : 'text-red-600';
    const statusBg = isOnline ? 'bg-[#e0f7fa]' : 'bg-red-100';
    const statusIcon = isOnline ? CheckCircle : XCircle;

    return (
        <div className={`flex items-center text-[10px] font-bold px-2 py-1 rounded-full ${statusBg} ${statusColor}`}>
            {React.createElement(statusIcon, { className: "w-3 h-3 mr-1" })}
            {statusText}
        </div>
    );
};

export default StatusIndicator;
