// src/components/crm/ClientTagsManager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Autocomplete, TextField, Chip, Box, CircularProgress } from '@mui/material';
import { supabase } from '@/lib/supabaseClient';
// CrmTag is no longer needed here since we are only fetching the name
import { useClient } from '@/hooks/useClient';

interface ClientTagsManagerProps {
  clientId: string;
  currentTags: string[] | null;
}

// --- THIS IS THE FIX ---
// The function now correctly states it returns an array of objects with a 'name' property.
async function fetchAllTags(): Promise<{ name: string }[]> {
  const { data, error } = await supabase
    .from('crm_tags')
    .select('name')
    .order('name');
  if (error) throw new Error(error.message);
  // If data is null, return an empty array to prevent errors.
  return data || []; 
}

export default function ClientTagsManager({ clientId, currentTags }: ClientTagsManagerProps) {
  const { updateClient, isUpdatingClient } = useClient(clientId);
  const [tags, setTags] = useState<string[]>(currentTags || []);

  useEffect(() => {
    setTags(currentTags || []);
  }, [currentTags]);

  const { data: allTags = [], isLoading: isLoadingTags } = useQuery<{ name: string }[]>({
    queryKey: ['allTags'],
    queryFn: fetchAllTags,
    staleTime: 1000 * 60 * 5, 
  });
  
  // The mapping remains the same as it correctly extracts the 'name' string.
  const tagOptions = allTags.map(tag => tag.name);

  const handleTagsChange = (event: React.SyntheticEvent, newValue: string[]) => {
    setTags(newValue);
    updateClient({ tags: newValue });
  };

  return (
    <Box>
      <Autocomplete
        multiple
        id="client-tags-manager"
        value={tags}
        onChange={handleTagsChange}
        options={tagOptions}
        loading={isLoadingTags}
        freeSolo 
        renderTags={(value: readonly string[], getTagProps) =>
          value.map((option: string, index: number) => (
            <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} />
          ))
        }
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label="Tags"
            placeholder="Add or create tags"
            size="small"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoadingTags || isUpdatingClient ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </Box>
  );
}