// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import theme from '@/theme';
import QueryProvider from '@/providers/QueryProvider';
import AppSidebar from '@/components/layout/AppSidebar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'N8N AI Chat Dashboard',
  description: 'Manage your AI-powered conversations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <QueryProvider>
              <Box sx={{ display: 'flex' }}>
                <AppSidebar />
                <Box
                  component="main"
                  sx={{
                    flexGrow: 1,
                    bgcolor: 'background.default',
                    width: 'calc(100% - 240px)', // Ensure main content doesn't go under the sidebar
                    height: '100vh',
                    overflow: 'auto',
                  }}
                >
                  {/* The children (our pages and their specific layouts) will render here. */}
                  {/* The header will be rendered inside the children. */}
                  {children}
                </Box>
              </Box>
            </QueryProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}