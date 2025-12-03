'use client';

import React from 'react';
import { Box, TextField, MenuItem } from '@mui/material';

export type DateRangeOption = '7d' | '30d' | '90d' | 'year' | 'all';

interface DateRangePickerProps {
    value: DateRangeOption;
    onChange: (value: DateRangeOption) => void;
}

const options: { value: DateRangeOption; label: string }[] = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: 'year', label: 'Last Year' },
    { value: 'all', label: 'All Time' },
];

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
    return (
        <Box sx={{ minWidth: 150 }}>
            <TextField
                select
                fullWidth
                size="small"
                label="Date Range"
                value={value}
                onChange={(e) => onChange(e.target.value as DateRangeOption)}
            >
                {options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        {option.label}
                    </MenuItem>
                ))}
            </TextField>
        </Box>
    );
}
