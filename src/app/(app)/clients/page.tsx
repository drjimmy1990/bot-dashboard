// src/app/(app)/clients/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Button,
  Stack,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { DataGrid, GridColDef, GridPaginationModel, GridRowParams, GridRowSelectionModel, GridRowId } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LabelIcon from '@mui/icons-material/Label';
import DeleteIcon from '@mui/icons-material/Delete';
import { useClientList, ClientFilters as ClientFiltersType } from '@/hooks/useClientList';
import { CrmClient } from '@/lib/api';
import ClientFilters from './components/ClientFilters';

// Define the columns for the DataGrid
const columns: GridColDef<CrmClient>[] = [
  {
    field: 'company_name',
    headerName: 'Company / Name',
    flex: 1.5,
    renderCell: (params) => (
      <Stack direction="column" justifyContent="center" sx={{ height: '100%', py: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
          {params.row.company_name || params.row.email || 'No Name'}
        </Typography>
        {params.row.platform_user_id && (
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, mt: 0.5 }}>
            ID: {params.row.platform_user_id}
          </Typography>
        )}
      </Stack>
    ),
  },
  { field: 'email', headerName: 'Email', flex: 1.5 },
  { field: 'phone', headerName: 'Phone', flex: 1 },
  {
    field: 'client_type',
    headerName: 'Type',
    flex: 0.75,
    valueGetter: (value: CrmClient['client_type']) => {
      if (value && typeof value === 'string' && value.length > 0) {
        return value.charAt(0).toUpperCase() + value.slice(1);
      }
      return 'N/A';
    },
    renderCell: (params) => {
      const colorMap: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
        customer: 'success',
        lead: 'info',
        prospect: 'warning',
        partner: 'secondary',
        inactive: 'default'
      };
      return <Chip label={params.value} size="small" color={colorMap[params.row.client_type] || 'default'} variant="outlined" />;
    }
  },
  {
    field: 'lifecycle_stage',
    headerName: 'Stage',
    flex: 0.75,
    valueGetter: (value: string) => value ? value.charAt(0).toUpperCase() + value.slice(1) : 'N/A',
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

  // Filter State
  const [filters, setFilters] = useState<ClientFiltersType>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Selection State
  const [rowSelectionModel, setRowSelectionModel] = useState<any>([]);

  const { data, isLoading, isFetching } = useClientList({
    page: paginationModel.page,
    pageSize: paginationModel.pageSize,
    searchTerm: searchTerm,
    filters: filters,
  });

  const handleRowClick = (params: GridRowParams) => {
    router.push(`/clients/${params.id}`);
  };

  const activeFilterCount = Object.keys(filters).filter(k => {
    const val = filters[k as keyof ClientFiltersType];
    return Array.isArray(val) ? val.length > 0 : val !== undefined && val !== null;
  }).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Clients
          </Typography>
          <Typography color="text.secondary">
            Manage your client database.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setIsFilterOpen(true)}
          >
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
          <Button variant="contained" onClick={() => {/* TODO: Create Client Modal */ }}>
            Add Client
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ height: '75vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Toolbar */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 400 }}
          />

          {/* Bulk Actions */}
          {rowSelectionModel.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ ml: 'auto', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {rowSelectionModel.length} selected
              </Typography>
              <Tooltip title="Assign Agent">
                <IconButton size="small"><PersonAddIcon /></IconButton>
              </Tooltip>
              <Tooltip title="Add Tags">
                <IconButton size="small"><LabelIcon /></IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" color="error"><DeleteIcon /></IconButton>
              </Tooltip>
            </Stack>
          )}
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
          getRowHeight={() => 'auto'}
          sx={{
            border: 'none',
            '& .MuiDataGrid-row:hover': {
              cursor: 'pointer',
            },
          }}
        />
      </Paper>

      <ClientFilters
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onFilterChange={setFilters}
        onReset={() => setFilters({})}
      />
    </Box>
  );
}