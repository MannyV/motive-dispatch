import '../styles/globals.css'

export const metadata = {
    title: 'Fora Atlas - Curator Canvas',
    description: 'AI Operating System for Travel Advisors',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
