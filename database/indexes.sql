-- Enable pg_trgm extension for text search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes for text search on frequently searched columns
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm ON contacts USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_crm_clients_company_name_trgm ON crm_clients USING gin(company_name gin_trgm_ops);

-- Create indexes for common query patterns to improve performance
CREATE INDEX IF NOT EXISTS idx_messages_sent_at_contact ON messages(contact_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_activities_created_at_client ON crm_activities(client_id, created_at DESC);
