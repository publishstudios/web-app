import './globals.css';

export const metadata = {
  title: 'PublishStudio | Professional Book OS & Typesetting Engine',
  description: 'Client-side book formatting, layout validation, and print-ready production.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
