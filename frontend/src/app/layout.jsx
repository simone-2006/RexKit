import './globals.css';

export const metadata = {
  title: 'RexKit',
  icons: {
    icon: [
      { url: '/icons/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icons/icon.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: { url: '/icons/apple-icon.png', sizes: '180x180', type: 'image/png' }
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
