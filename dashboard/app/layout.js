import '../styles/globals.css'

export const metadata = {
    title: 'Sarah\'s Atlas',
    description: 'AI Operating System for Travel Advisors',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
