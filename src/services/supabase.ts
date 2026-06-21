
import { createClient } from '@supabase/supabase-js';

// Fallback to provided keys if environment variables are missing
const DEFAULT_URL = 'https://sjztvkbolivugdkgvvdp.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqenR2a2JvbGl2dWdka2d2dmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Njg3NjIsImV4cCI6MjA4MDM0NDc2Mn0.3kp0x807eQhPSLB_GALgxNB-e25SbrA9kwcWo7lzAEw';

const supabaseUrl = process.env.VITE_SUPABASE_URL || DEFAULT_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase keys are missing. App functionality will be limited.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
