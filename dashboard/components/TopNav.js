'use client';

export default function TopNav() {
    return (
        <nav className="top-nav">
            <div className="nav-left">
                <div className="logo">A-TO-Z DISPATCH</div>
                <div className="nav-links">
                    <a href="#" className="nav-link active">Clients</a>
                    <a href="#" className="nav-link">Trips</a>
                    <a href="#" className="nav-link">Inventory</a>
                </div>
            </div>

            <div className="nav-right">
                <div className="user-profile">
                    <img
                        src="https://i.pravatar.cc/150?u=sarah_dispatch"
                        alt="Sarah"
                        className="user-avatar"
                    />
                    <div className="user-info">
                        <span className="user-name">Sarah's Atlas</span>
                        <span className="user-role">Lead Dispatcher</span>
                    </div>
                </div>
                <div className="nav-actions">
                    <button className="icon-btn" title="Settings">⚙️</button>
                    <button className="icon-btn" title="Logout">↪️</button>
                </div>
            </div>

            <style jsx>{`
                .top-nav {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem 2rem;
                    background: white;
                    border-bottom: 1px solid #e5e7eb;
                    position: sticky;
                    top: 0;
                    z-index: 50;
                }
                .nav-left {
                    display: flex;
                    align-items: center;
                    gap: 3rem;
                }
                .logo {
                    font-weight: 800;
                    font-size: 1.1rem;
                    letter-spacing: 0.05em;
                    color: #111827;
                }
                .nav-links {
                    display: flex;
                    gap: 1.5rem;
                }
                .nav-link {
                    text-decoration: none;
                    color: #6b7280;
                    font-weight: 500;
                    font-size: 0.9rem;
                    transition: color 0.2s;
                }
                .nav-link:hover, .nav-link.active {
                    color: #111827;
                }
                .nav-right {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }
                .user-profile {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding-right: 1.5rem;
                    border-right: 1px solid #e5e7eb;
                }
                .user-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 1px solid #e5e7eb;
                }
                .user-info {
                    display: flex;
                    flex-direction: column;
                    line-height: 1.2;
                }
                .user-name {
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: #111827;
                }
                .user-role {
                    font-size: 0.75rem;
                    color: #6b7280;
                }
                .nav-actions {
                    display: flex;
                    gap: 0.5rem;
                }
                .icon-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 1.1rem;
                    opacity: 0.6;
                    transition: opacity 0.2s;
                }
                .icon-btn:hover {
                    opacity: 1;
                }
            `}</style>
        </nav>
    );
}
