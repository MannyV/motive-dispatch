'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import PipelineCard from './PipelineCard';

const COLUMNS = [
    { id: 'lead', label: 'Leads', color: '#6366f1' },
    { id: 'outreach', label: 'Outreach', color: '#ec4899' },
    { id: 'proposal', label: 'Proposal', color: '#f59e0b' },
    { id: 'negotiation', label: 'Negotiation', color: '#10b981' },
    { id: 'closed', label: 'Closed', color: '#6b7280' },
];

export default function PipelineBoard({ onCardClick, budgetFilter }) {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPipeline = async () => {
        // Fetch clients AND their trips (to show specific info on the card)
        const { data, error } = await supabase
            .from('clients')
            .select('*, trips(destination, status, created_at)')
            .order('created_at', { ascending: false });

        // Sort trips for each client so [0] is the latest
        if (data) {
            data.forEach(client => {
                if (client.trips) {
                    client.trips.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                }
            });
            setClients(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPipeline();

        const subscription = supabase
            .channel('pipeline_updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, fetchPipeline)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, fetchPipeline) // Also update if a trip changes
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    if (loading) return <div style={{ padding: '2rem' }}>Loading Pipeline...</div>;

    return (
        <div className="pipeline-board">
            {COLUMNS.map(col => {
                const colClients = clients.filter(c => {
                    const statusMatch = c.status === col.id || (col.id === 'outreach' && c.status === 'active');
                    const budgetMatch = !budgetFilter || budgetFilter === 'all' || (c.facts && c.facts.budget === budgetFilter);
                    return statusMatch && budgetMatch;
                });

                return (
                    <div key={col.id} className="pipeline-column">
                        <div className="column-header">
                            <div className="col-badge" style={{ background: col.color }}></div>
                            <span className="col-title">{col.label}</span>
                            <span className="col-count">{colClients.length}</span>
                        </div>

                        <div className="column-content">
                            {colClients.map(client => (
                                <PipelineCard key={client.id} client={client} onClick={onCardClick} />
                            ))}
                        </div>
                    </div>
                )
            })}

            <style jsx>{`
        .pipeline-board {
            display: flex;
            gap: 1.5rem;
            padding-bottom: 1rem;
            overflow-x: auto;
            height: calc(100vh - 150px); /* Fill remaining space */
            align-items: flex-start;
        }
        .pipeline-column {
            min-width: 320px;
            width: 320px;
            background: #f4f5f7; /* Very light gray wrapper */
            border-radius: var(--radius-md);
            display: flex;
            flex-direction: column;
            max-height: 100%;
        }
        .column-header {
            padding: 1rem 1rem 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            position: sticky;
            top: 0;
            background: #f4f5f7;
            border-radius: var(--radius-md) var(--radius-md) 0 0;
            z-index: 10;
        }
        .col-badge {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
        .col-title {
            font-weight: 600;
            font-size: 0.9rem;
            color: #4b5563;
        }
        .col-count {
            background: #e5e7eb;
            color: #6b7280;
            font-size: 0.75rem;
            padding: 2px 6px;
            border-radius: 9px;
            font-weight: 600;
        }
        .column-content {
            padding: 0 0.75rem 0.75rem;
            overflow-y: auto;
            flex: 1;
        }
      `}</style>
        </div>
    );
}
