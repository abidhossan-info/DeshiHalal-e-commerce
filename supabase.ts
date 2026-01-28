
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://riunsoaikrgjsdpbbhrh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdW5zb2Fpa3JnanNkcGJiaHJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTkyOTEsImV4cCI6MjA4NTE3NTI5MX0.r9v6xy_SUW48xIAedglf67jT6FE_-KaViHT4AKcichw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
