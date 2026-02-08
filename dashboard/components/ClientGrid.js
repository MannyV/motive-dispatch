'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export default function ClientGrid({ onRowClick }) {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchClients = async () => {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setClients(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchClients();

        // Realtime Subscription
        const subscription = supabase
            .channel('clients_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, payload => {
                console.log('Change received!', payload);
                fetchClients(); // Refresh on any change
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    if (loading) return <div style={{ padding: '2rem' }}>Loading Canvas...</div>;

    return (
        <div className="data-grid">
            <div className="grid-header">
                <div>Client Name</div>
                <div>Status</div>
                <div>Vibes</div>
                <div>Latest Facts</div>
            </div>

            {clients.map((client) => (
                <div
                    key={client.id}
                    className="grid-row"
                    onClick={() => onRowClick(client)}
                >
                    <div style={{ fontWeight: 500 }}>{client.name}</div>
                    <div>
                        <span className={`badge badge-${client.status || 'lead'}`}>
                            {client.status || 'lead'}
                        </span>
                    </div>
                    <div>
                        {(client.vibe_tags || []).slice(0, 3).map(tag => (
                            <span key={tag} className="badge badge-vibe">{tag}</span>
                        ))}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {Object.keys(client.facts || {}).slice(0, 3).join(', ')}...
                    </div>
                </div>
            ))}

            {clients.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                    No clients found. Send a message to the bot to get started!
                </div>
            )}
        </div>
    );
}
