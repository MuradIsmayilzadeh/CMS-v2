import { Inter } from 'next/font/google'
import React from 'react';
import Navbar from './components/navbar';

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Contest Managament System',
  description: 'System developed directly for managing Programming Contests',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <Navbar />
        {children}
      </body>
    </html>
  )
}
