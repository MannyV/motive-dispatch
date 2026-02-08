'use client';

const getFlag = (destination) => {
  if (!destination) return '✈️';
  const dest = destination.toLowerCase();
  if (dest.includes('japan') || dest.includes('tokyo')) return '🇯🇵';
  if (dest.includes('france') || dest.includes('paris')) return '🇫🇷';
  if (dest.includes('mexico') || dest.includes('tulum')) return '🇲🇽';
  if (dest.includes('italy') || dest.includes('como')) return '🇮🇹';
  if (dest.includes('uk') || dest.includes('london')) return '🇬🇧';
  if (dest.includes('usa') || dest.includes('utah') || dest.includes('sur')) return '🇺🇸';
  if (dest.includes('canada')) return '🇨🇦';
  if (dest.includes('iceland')) return '🇮🇸';
  if (dest.includes('indonesia') || dest.includes('sumba')) return '🇮🇩';
  if (dest.includes('africa')) return '🇿🇦';
  if (dest.includes('morocco') || dest.includes('marrakech')) return '🇲🇦';
  return '✈️'; // Fallback
};

export default function PipelineCard({ client, onClick }) {
  // Find the latest trip if available
  // The query will join 'trips' and order by created_at desc, so we take the first one
  const latestTrip = client.trips && client.trips.length > 0 ? client.trips[0] : null;

  return (
    <div className="pipeline-card" onClick={() => onClick(client)}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src={`https://i.pravatar.cc/150?u=${client.id}`}
            alt={client.name}
            className="client-avatar"
          />
          <h3 className="client-name">{client.name}</h3>
        </div>
      </div>

      {/* Latest Trip Indicator */}
      {latestTrip && (
        <div className="trip-indicator">
          <span className="trip-icon">{getFlag(latestTrip.destination)}</span>
          <span className="trip-dest">{latestTrip.destination}</span>
          <span className={`trip-status status-${latestTrip.status}`}>
            {latestTrip.status === 'booked' ? 'Booked' : 'Draft'}
          </span>
        </div>
      )}

      <div className="vibe-tags">
        {(client.vibe_tags || []).slice(0, 3).map(tag => (
          <span key={tag} className="vibe-tag">{tag}</span>
        ))}
      </div>

      <div className="card-footer">
        <span className="time-ago">
          {new Date(client.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>

      <style jsx>{`
        .pipeline-card {
          background: white;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1rem;
          margin-bottom: 0.75rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          cursor: pointer;
          transition: box-shadow 0.2s, transform 0.1s;
        }
        .pipeline-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .client-name {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-primary);
        }
        .client-avatar {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            object-fit: cover;
            border: 1px solid var(--border-subtle);
        }
        
        .trip-indicator {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: #f8fafc;
            padding: 0.4rem 0.6rem;
            border-radius: 6px;
            font-size: 0.8rem;
            margin-bottom: 0.75rem;
            border: 1px solid #f1f5f9;
        }
        .trip-icon { font-size: 0.9rem; }
        .trip-dest { font-weight: 500; color: #334155; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .trip-status { 
            font-size: 0.65rem; 
            text-transform: uppercase; 
            padding: 2px 4px; 
            border-radius: 4px; 
            font-weight: 600;
        }
        .status-booked { background: #dcfce7; color: #166534; }
        .status-draft { background: #fef9c3; color: #854d0e; }

        .vibe-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-bottom: 0.75rem;
        }
        .vibe-tag {
          font-size: 0.75rem;
          background: #f3f4f6;
          color: #4b5563;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
        }
        .card-footer {
            display: flex;
            justify-content: flex-end;
            font-size: 0.7rem;
            color: #9ca3af;
        }
      `}</style>
    </div>
  );
}
