import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marketplace Auto-Reply',
  description: 'Auto-replies and templates for Facebook Marketplace messages',
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{props.children}</body>
    </html>
  );
}

