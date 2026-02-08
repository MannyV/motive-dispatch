'use client';
import { useState } from 'react';
import '../styles/globals.css';
import PipelineBoard from '../components/PipelineBoard';
import ClientDrawer from '../components/ClientDrawer';

export default function Home() {
    const [selectedClient, setSelectedClient] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0); // Hack to force grid refresh
    const [budgetFilter, setBudgetFilter] = useState('all');
    const [tagFilter, setTagFilter] = useState('all');

    const handleAddClient = () => {
        setSelectedClient(null);
        setIsDrawerOpen(true);
    };

    const handleRowClick = (client) => {
        setSelectedClient(client);
        setIsDrawerOpen(true);
    };

    const handleClose = () => {
        setIsDrawerOpen(false);
        setSelectedClient(null);
    };

    const handleSave = () => {
        // Refresh grid or handle logic
        setRefreshKey(prev => prev + 1);
    };

    const VIBES = ["Eco-Chic", "Brutalist", "Ultra-Luxury", "Off-the-Grid", "Wellness", "Adventure", "Family", "Art-Focused", "Culinary"];

    return (
        <main>
            <div className="container">
                <header className="header">
                    <div>
                        <h1 className="title">Fora's Curator Canvas</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Design the perfect journey.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {/* Vibe Filter */}
                        <div className="filter-wrapper">
                            <span className="filter-label">Vibe:</span>
                            <select
                                className="filter-select"
                                value={tagFilter}
                                onChange={(e) => setTagFilter(e.target.value)}
                            >
                                <option value="all">All</option>
                                {VIBES.map(vibe => (
                                    <option key={vibe} value={vibe}>{vibe}</option>
                                ))}
                            </select>
                        </div>

                        {/* Budget Filter */}
                        <div className="filter-wrapper">
                            <span className="filter-label">Budget:</span>
                            <select
                                className="filter-select"
                                value={budgetFilter}
                                onChange={(e) => setBudgetFilter(e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="high">High ($$$)</option>
                                <option value="mid">Mid ($$)</option>
                                <option value="low">Low ($)</option>
                            </select>
                        </div>

                        <button
                            onClick={handleAddClient}
                            style={{
                                background: 'var(--primary)',
                                color: 'white',
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            + Add Client
                        </button>
                    </div>
                </header>

                <section>
                    <PipelineBoard
                        key={refreshKey}
                        onCardClick={handleRowClick}
                        budgetFilter={budgetFilter}
                        tagFilter={tagFilter}
                    />
                </section>

                <ClientDrawer
                    client={selectedClient}
                    isOpen={isDrawerOpen}
                    onClose={handleClose}
                    onSave={handleSave}
                />
            </div>
        </main>
    );
}
