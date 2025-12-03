import React from 'react';
import {
    Box,
    Typography,
    Drawer,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    OutlinedInput,
    TextField,
    Button,
    Divider,
    Stack,
    SelectChangeEvent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ClientFilters as FilterType } from '@/hooks/useClientList';
import { useTags } from '@/hooks/useTags';
import { useAgents } from '@/hooks/useAgents';

interface ClientFiltersProps {
    open: boolean;
    onClose: () => void;
    filters: FilterType;
    onFilterChange: (newFilters: FilterType) => void;
    onReset: () => void;
}

const STATUS_OPTIONS = ['lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist', 'churned'];
const TYPE_OPTIONS = ['lead', 'prospect', 'customer', 'partner', 'inactive'];
const QUALITY_OPTIONS = ['hot', 'warm', 'cold'];

export default function ClientFilters({
    open,
    onClose,
    filters,
    onFilterChange,
    onReset,
}: ClientFiltersProps) {
    const { data: tags } = useTags();
    const { data: agents } = useAgents();

    const handleMultiSelectChange = (event: SelectChangeEvent<string[]>, field: keyof FilterType) => {
        const {
            target: { value },
        } = event;
        onFilterChange({
            ...filters,
            [field]: typeof value === 'string' ? value.split(',') : value,
        });
    };

    const handleTextChange = (field: keyof FilterType, value: any) => {
        onFilterChange({
            ...filters,
            [field]: value,
        });
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { width: 350, p: 3 } }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Filters</Typography>
                <Button size="small" onClick={onReset}>
                    Reset
                </Button>
            </Box>

            <Stack spacing={3}>
                {/* Status */}
                <FormControl size="small">
                    <InputLabel>Lifecycle Stage</InputLabel>
                    <Select
                        multiple
                        value={filters.status || []}
                        onChange={(e) => handleMultiSelectChange(e, 'status')}
                        input={<OutlinedInput label="Lifecycle Stage" />}
                        renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => (
                                    <Chip key={value} label={value} size="small" />
                                ))}
                            </Box>
                        )}
                    >
                        {STATUS_OPTIONS.map((status) => (
                            <MenuItem key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Type */}
                <FormControl size="small">
                    <InputLabel>Client Type</InputLabel>
                    <Select
                        multiple
                        value={filters.type || []}
                        onChange={(e) => handleMultiSelectChange(e, 'type')}
                        input={<OutlinedInput label="Client Type" />}
                        renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => (
                                    <Chip key={value} label={value} size="small" />
                                ))}
                            </Box>
                        )}
                    >
                        {TYPE_OPTIONS.map((type) => (
                            <MenuItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Lead Quality */}
                <FormControl size="small">
                    <InputLabel>Lead Quality</InputLabel>
                    <Select
                        multiple
                        value={filters.lead_quality || []}
                        onChange={(e) => handleMultiSelectChange(e, 'lead_quality')}
                        input={<OutlinedInput label="Lead Quality" />}
                        renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => (
                                    <Chip key={value} label={value} size="small" />
                                ))}
                            </Box>
                        )}
                    >
                        {QUALITY_OPTIONS.map((q) => (
                            <MenuItem key={q} value={q}>
                                {q.charAt(0).toUpperCase() + q.slice(1)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Divider />

                {/* Agent */}
                <FormControl size="small">
                    <InputLabel>Assigned Agent</InputLabel>
                    <Select
                        value={filters.assignee || ''}
                        label="Assigned Agent"
                        onChange={(e) => handleTextChange('assignee', e.target.value || undefined)}
                    >
                        <MenuItem value="">
                            <em>Any</em>
                        </MenuItem>
                        <MenuItem value="unassigned">Unassigned</MenuItem>
                        {agents?.map((agent) => (
                            <MenuItem key={agent.id} value={agent.id}>
                                {agent.full_name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Tags */}
                <FormControl size="small">
                    <InputLabel>Tags</InputLabel>
                    <Select
                        multiple
                        value={filters.tags || []}
                        onChange={(e) => handleMultiSelectChange(e, 'tags')}
                        input={<OutlinedInput label="Tags" />}
                        renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => (
                                    <Chip key={value} label={value} size="small" />
                                ))}
                            </Box>
                        )}
                    >
                        {tags?.map((tag) => (
                            <MenuItem key={tag.name} value={tag.name}>
                                {tag.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Divider />

                {/* Revenue */}
                <Typography variant="subtitle2">Total Revenue</Typography>
                <Stack direction="row" spacing={2}>
                    <TextField
                        label="Min"
                        type="number"
                        size="small"
                        value={filters.min_revenue || ''}
                        onChange={(e) => handleTextChange('min_revenue', e.target.value ? Number(e.target.value) : undefined)}
                    />
                    <TextField
                        label="Max"
                        type="number"
                        size="small"
                        value={filters.max_revenue || ''}
                        onChange={(e) => handleTextChange('max_revenue', e.target.value ? Number(e.target.value) : undefined)}
                    />
                </Stack>

                <Divider />

                {/* Dates */}
                <Typography variant="subtitle2">Created Date</Typography>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Stack spacing={2}>
                        <DatePicker
                            label="Created After"
                            value={filters.created_after || null}
                            onChange={(newValue) => handleTextChange('created_after', newValue)}
                            slotProps={{ textField: { size: 'small' } }}
                        />
                        <DatePicker
                            label="Created Before"
                            value={filters.created_before || null}
                            onChange={(newValue) => handleTextChange('created_before', newValue)}
                            slotProps={{ textField: { size: 'small' } }}
                        />
                    </Stack>
                </LocalizationProvider>
            </Stack>
        </Drawer>
    );
}
