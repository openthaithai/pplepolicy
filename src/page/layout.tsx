import React from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="antialiased min-h-screen font-prompt">
      {children}
    </div>
  );
}
