import '../styles/globals.css'

export const metadata = {
    title: 'A-to-Z Dispatch',
    description: 'Knowledge Graph for Delivery Associates',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
