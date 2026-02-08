'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ClientDrawer({ client, isOpen, onClose, onSave }) {
    const [formData, setFormData] = useState({
        name: '',
        status: 'lead',
        vibe_tags: '',
        facts: '{}'
    });
    const [loading, setLoading] = useState(false);

    const [trips, setTrips] = useState([]);

    // Reset form when client changes
    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name || '',
                status: client.status || 'lead',
                vibe_tags: (client.vibe_tags || []).join(', '),
                facts: JSON.stringify(client.facts || {}, null, 2)
            });

            // Fetch Trips
            const fetchTrips = async () => {
                const { data } = await supabase
                    .from('trips')
                    .select('*')
                    .eq('client_id', client.id)
                    .order('created_at', { ascending: false });
                if (data) setTrips(data);
            };
            fetchTrips();

        } else {
            setFormData({
                name: '',
                status: 'lead',
                vibe_tags: '',
                facts: '{}'
            });
            setTrips([]);
        }
    }, [client, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Parse data
            const payload = {
                name: formData.name,
                status: formData.status,
                vibe_tags: formData.vibe_tags.split(',').map(t => t.trim()).filter(Boolean),
                facts: JSON.parse(formData.facts)
            };

            let error;
            if (client?.id) {
                // UPDATE
                const res = await supabase
                    .from('clients')
                    .update(payload)
                    .eq('id', client.id);
                error = res.error;
            } else {
                // CREATE
                // Mock phone handle for now since we don't have one from Telegram here
                payload.phone_handle = `manual_${Date.now()}`;
                const res = await supabase.from('clients').insert([payload]);
                error = res.error;
            }

            if (error) throw error;
            onSave();
            onClose();
        } catch (err) {
            alert('Error saving client: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this client?')) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('clients').delete().eq('id', client.id);
            if (error) throw error;
            onSave();
            onClose();
        } catch (err) {
            alert('Error deleting: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="drawer-overlay" onClick={onClose}>
            <div className="drawer-content" onClick={e => e.stopPropagation()}>
                <div className="drawer-header">
                    <h2>{client ? 'Edit Client' : 'New Client'}</h2>
                    <button onClick={onClose} className="btn-close">×</button>
                </div>

                <div className="drawer-body">
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="input"
                            >
                                <option value="lead">Lead</option>
                                <option value="outreach">Outreach</option>
                                <option value="proposal">Proposal</option>
                                <option value="negotiation">Negotiation</option>
                                <option value="closed">Closed</option>
                                <option value="archive">Archive</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Vibes (comma separated)</label>
                            <input
                                type="text"
                                placeholder="Luxurious, Eco-Chic, Family"
                                value={formData.vibe_tags}
                                onChange={e => setFormData({ ...formData, vibe_tags: e.target.value })}
                                className="input"
                            />
                        </div>

                        <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label>Facts (JSON)</label>
                            <textarea
                                value={formData.facts}
                                onChange={e => setFormData({ ...formData, facts: e.target.value })}
                                className="input"
                                style={{ flex: 1, fontFamily: 'monospace', fontSize: '12px', minHeight: '100px' }}
                            />
                        </div>

                        <div className="drawer-actions">
                            {client && (
                                <button type="button" onClick={handleDelete} className="btn btn-danger" disabled={loading}>
                                    Delete
                                </button>
                            )}
                            <div style={{ flex: 1 }}></div>
                            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>

                    {client && (
                        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Client Journeys ({trips.length})</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {trips.map(trip => (
                                    <div key={trip.id} className="trip-card">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: 600 }}>{trip.destination}</span>
                                            <span className={`badge badge-${trip.status === 'booked' ? 'booked' : 'lead'}`} style={{ fontSize: '0.7rem' }}>
                                                {trip.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            Created: {new Date(trip.created_at).toLocaleDateString()}
                                        </div>
                                        {trip.detected_entities?.extracted?.hotel_name && (
                                            <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                                🏨 {trip.detected_entities.extracted.hotel_name}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {trips.length === 0 && <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No trips found for this client.</div>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
        .drawer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.3);
          z-index: 50;
          display: flex;
          justify-content: flex-end;
        }
        .drawer-content {
          background: white;
          width: 500px;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-shadow: -4px 0 15px rgba(0,0,0,0.1);
          animation: slideIn 0.2s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .drawer-header {
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .drawer-body {
          padding: 1.5rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .input {
          padding: 0.75rem;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          font-family: inherit;
        }
        .input:focus {
          outline: 2px solid var(--accent);
          border-color: transparent;
        }
        .drawer-actions {
          padding: 1.5rem;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          gap: 1rem;
          background: #f9fafb;
        }
        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-sm);
          font-weight: 500;
          cursor: pointer;
          border: none;
          font-size: 0.9rem;
        }
        .btn-primary { background: var(--primary); color: white; }
        .btn-secondary { background: white; border: 1px solid var(--border-subtle); }
        .btn-danger { background: #fee2e2; color: #b91c1c; }
        .btn-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: var(--text-secondary);
        }
        .trip-card {
            background: #f9fafb;
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-sm);
            padding: 0.75rem;
        }
        .badge {
            padding: 0.2rem 0.5rem;
            border-radius: 9999px;
            font-weight: 500;
            color: white;
        }
        .badge-lead {
            background-color: #f59e0b; /* amber-500 */
        }
        .badge-booked {
            background-color: #10b981; /* emerald-500 */
        }
      `}</style>
        </div>
    );
}
