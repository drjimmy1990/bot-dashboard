import React from 'react';
import { Box, Typography, Divider, Chip, Stack } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { CrmClient, Contact } from '@/lib/api';

interface ClientSidebarProps {
    client: CrmClient;
    contact: Contact | null;
}

export default function ClientSidebar({ client, contact }: ClientSidebarProps) {
    // Helper to get channel name safely
    // contact.channels can be an object or an array depending on the join
    const channelName = contact?.channels
        ? (Array.isArray(contact.channels) ? contact.channels[0]?.name : contact.channels.name)
        : 'Unknown Channel';

    const platformName = contact?.platform || 'Unknown Platform';

    return (
        <Box sx={{ p: 3, height: '100%', borderRight: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                CONTACT DETAILS
            </Typography>

            <Stack spacing={2} sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {client?.email || 'No email'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                        {client?.phone || 'No phone'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                        {client?.address && typeof client.address === 'object' && 'city' in client.address ? (client.address as { city: string }).city : 'Unknown Location'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ChatBubbleOutlineIcon fontSize="small" color="action" />
                    <Box>
                        <Typography variant="body2" fontWeight="medium">
                            {platformName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {channelName}
                        </Typography>
                    </Box>
                </Box>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                ATTRIBUTES
            </Typography>

            <Stack spacing={2} sx={{ mb: 4 }}>
                <Box>
                    <Typography variant="caption" color="text.secondary">Source</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                            {client?.source || 'Direct'}
                        </Typography>
                    </Box>
                </Box>
                <Box>
                    <Typography variant="caption" color="text.secondary">Assigned Agent</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                            {/* TODO: Fetch agent name from ID */}
                            {client?.assigned_to ? 'Assigned' : 'Unassigned'}
                        </Typography>
                    </Box>
                </Box>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                TAGS
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {client?.tags?.map((tag: string) => (
                    <Chip key={tag} label={tag} size="small" />
                ))}
                {(!client?.tags || client.tags.length === 0) && (
                    <Typography variant="body2" color="text.secondary">No tags</Typography>
                )}
            </Box>
        </Box>
    );
}
