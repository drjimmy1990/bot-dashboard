// src/app/(app)/clients/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Paper, TextField, InputAdornment } from '@mui/material';
// --- THIS IS THE FIX ---
// GridValueGetterParams is not a named export. We don't need to import it.
// The type will be inferred correctly by TypeScript or we can use the `GridValueGetter` type if needed.
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import { useClientList } from '@/hooks/useClientList';
import { CrmClient } from '@/lib/api';

// Define the columns for the DataGrid
const columns: GridColDef<CrmClient>[] = [
  {
    field: 'company_name',
    headerName: 'Company / Name',
    flex: 1.5,
    renderCell: (params) => (
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {params.row.company_name || params.row.email || 'No Name'}
      </Typography>
    ),
  },
  { field: 'email', headerName: 'Email', flex: 1.5 },
  { field: 'phone', headerName: 'Phone', flex: 1 },
  {
    field: 'client_type',
    headerName: 'Type',
    flex: 0.75,
    // --- THIS IS THE FIX ---
    // By accessing params.value, we get the direct value for the cell.
    // We safely check if it's a non-empty string before manipulating it.
    valueGetter: (value: CrmClient['client_type']) => {
      if (value && typeof value === 'string' && value.length > 0) {
        return value.charAt(0).toUpperCase() + value.slice(1);
      }
      return 'N/A';
    },
  },
  {
    field: 'total_revenue',
    headerName: 'Total Revenue',
    flex: 1,
    type: 'number',
    valueFormatter: (value: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0),
  },
  {
    field: 'last_contact_date',
    headerName: 'Last Contact',
    flex: 1,
    type: 'date',
    valueGetter: (value: CrmClient['last_contact_date']) => (value ? new Date(value) : null),
  },
];

export default function ClientsListPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });

  const { data, isLoading, isFetching } = useClientList({
    page: paginationModel.page,
    pageSize: paginationModel.pageSize,
    searchTerm: searchTerm,
  });

  const handleRowClick = (params: any) => {
    router.push(`/clients/${params.id}`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Clients
          </Typography>
          <Typography color="text.secondary">
            Search, filter, and manage all clients in your CRM.
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ height: '75vh', width: '100%' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Search by name, company, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <DataGrid
          rows={data?.clients || []}
          columns={columns}
          rowCount={data?.count || 0}
          loading={isLoading || isFetching}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          onRowClick={handleRowClick}
          sx={{
            border: 'none',
            '& .MuiDataGrid-row:hover': {
              cursor: 'pointer',
            },
          }}
        />
      </Paper>
    </Box>
  );
}