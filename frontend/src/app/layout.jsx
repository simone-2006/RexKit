import './globals.css';

export const metadata = {
  title: 'RexKit'
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
