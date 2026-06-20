// THE MD CODE - Supabase Configuration
// Replace with your actual credentials after creating the project

const SUPABASE_URL = 'https://fcelaqzradnxhuupzfuf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjZWxhcXpyYWRueGh1dXB6ZnVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODM0OTMsImV4cCI6MjA5NzU1OTQ5M30.PSjR4oBM8ioU0ezyIzDl3YnE_FMOPl-giLWeYxm8oZ4';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { supabaseClient };
