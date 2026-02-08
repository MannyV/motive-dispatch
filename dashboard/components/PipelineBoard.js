'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import PipelineCard from './PipelineCard';

const COLUMNS = [
    { id: 'lead', label: 'Leads', color: '#6366f1' },
    { id: 'proposal', label: 'Proposal', color: '#f59e0b' },
    { id: 'negotiation', label: 'Negotiation', color: '#10b981' },
    { id: 'closed', label: 'Closed', color: '#6b7280' },
];

export default function PipelineBoard({ onCardClick, budgetFilter, tagFilter }) {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCol, setActiveCol] = useState(null); // Track drop target

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

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDragEnter = (e, colId) => {
        e.preventDefault();
        setActiveCol(colId);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        // Option: clear activeCol if leaving the board or column, 
        // but for now we rely on Enter of another column or Drop to change state.
    };

    const handleDrop = async (e, newStatus) => {
        e.preventDefault();
        const clientId = e.dataTransfer.getData('clientId');

        if (!clientId) return;

        // Optimistic Update
        setClients(prev => prev.map(c =>
            c.id === clientId ? { ...c, status: newStatus } : c
        ));

        // DB Update
        const { error } = await supabase
            .from('clients')
            .update({ status: newStatus })
            .eq('id', clientId);

        if (error) {
            console.error('Error moving card:', error);
            fetchPipeline(); // Revert on error
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading Pipeline...</div>;

    return (
        <div className="pipeline-board">
            {COLUMNS.map(col => {
                const colClients = clients.filter(c => {
                    const statusMatch = c.status === col.id;
                    const budgetMatch = !budgetFilter || budgetFilter === 'all' || (c.facts && c.facts.budget === budgetFilter);
                    const tagMatch = !tagFilter || tagFilter === 'all' || (c.vibe_tags && c.vibe_tags.includes(tagFilter));
                    return statusMatch && budgetMatch && tagMatch;
                });

                return (
                    <div
                        key={col.id}
                        className={`pipeline-column ${activeCol === col.id ? 'column-active' : ''}`}
                        onDragOver={handleDragOver}
                        onDragEnter={(e) => handleDragEnter(e, col.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, col.id)}
                    >
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
            gap: 0;
            padding-bottom: 1rem;
            overflow-x: auto;
            height: calc(100vh - 150px); /* Fill remaining space */
            /* Align items stretch is default, ensuring columns take full height */
        }
        .pipeline-column {
            min-width: 280px;
            width: 280px;
            /* Transparent/White background for cleaner look */
            background: transparent; 
            border-right: none; 
            border-radius: 4px;
            display: flex;
            flex-direction: column;
            height: 100%; /* Force full height */
            transition: background 0.2s;
        }
        .pipeline-column.column-active {
            background: #f8fafc; /* Highlight when dragging over */
            box-shadow: inset 0 0 0 2px #e2e8f0;
        }
        .pipeline-column:last-child {
            border-right: none;
        }
        .column-header {
            padding: 1rem 0.5rem 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            position: sticky;
            top: 0;
            background: var(--bg-app); /* Match app bg */
            z-index: 10;
            border-bottom: 1px solid transparent;
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
