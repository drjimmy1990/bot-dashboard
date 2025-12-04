import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    MenuItem,
    Chip,
    Autocomplete
} from '@mui/material';
import { CrmClient } from '@/lib/api';
import { useClient } from '@/hooks/useClient';

interface ClientEditModalProps {
    open: boolean;
    onClose: () => void;
    client: CrmClient;
}

const LIFECYCLE_STAGES = ['lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist', 'churned'];
const CLIENT_TYPES = ['lead', 'prospect', 'customer', 'partner', 'inactive'];

export default function ClientEditModal({ open, onClose, client }: ClientEditModalProps) {
    const { updateClient, isUpdatingClient } = useClient(client.id);

    const [formData, setFormData] = useState({
        company_name: '',
        email: '',
        phone: '',
        address_city: '',
        address_country: '',
        lifecycle_stage: '',
        client_type: '',
        tags: [] as string[]
    });

    useEffect(() => {
        if (client) {
            const address = client.address as { city?: string; country?: string } | null;
            setFormData({
                company_name: client.company_name || '',
                email: client.email || '',
                phone: client.phone || '',
                address_city: address?.city || '',
                address_country: address?.country || '',
                lifecycle_stage: client.lifecycle_stage || 'lead',
                client_type: client.client_type || 'lead',
                tags: client.tags || []
            });
        }
    }, [client, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTagsChange = (event: React.SyntheticEvent, newValue: string[]) => {
        setFormData(prev => ({ ...prev, tags: newValue }));
    };

    const handleSubmit = () => {
        updateClient({
            company_name: formData.company_name,
            email: formData.email,
            phone: formData.phone,
            address: {
                city: formData.address_city,
                country: formData.address_country
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            lifecycle_stage: formData.lifecycle_stage as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            client_type: formData.client_type as any,
            tags: formData.tags
        }, {
            onSuccess: () => {
                onClose();
            }
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Edit Client Details</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Company / Name"
                            name="company_name"
                            value={formData.company_name}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Autocomplete
                            multiple
                            freeSolo
                            options={[]}
                            value={formData.tags}
                            onChange={handleTagsChange}
                            renderTags={(value: readonly string[], getTagProps) =>
                                value.map((option: string, index: number) => {
                                    const { key, ...tagProps } = getTagProps({ index });
                                    return (
                                        <Chip variant="outlined" label={option} key={key} {...tagProps} />
                                    );
                                })
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="outlined"
                                    label="Tags"
                                    placeholder="Add tags"
                                />
                            )}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            select
                            fullWidth
                            label="Lifecycle Stage"
                            name="lifecycle_stage"
                            value={formData.lifecycle_stage}
                            onChange={handleChange}
                        >
                            {LIFECYCLE_STAGES.map((stage) => (
                                <MenuItem key={stage} value={stage}>
                                    {stage.charAt(0).toUpperCase() + stage.slice(1)}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            select
                            fullWidth
                            label="Client Type"
                            name="client_type"
                            value={formData.client_type}
                            onChange={handleChange}
                        >
                            {CLIENT_TYPES.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="City"
                            name="address_city"
                            value={formData.address_city}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Country"
                            name="address_country"
                            value={formData.address_country}
                            onChange={handleChange}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={isUpdatingClient}>
                    {isUpdatingClient ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
