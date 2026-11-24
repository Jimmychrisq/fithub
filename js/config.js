// Supabase Configuration
const SUPABASE_URL = 'https://fcxhaxhuiuzgwvwltbhk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjeGhheGh1aXV6Z3d2d2x0YmhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNTUzNjUsImV4cCI6MjEwNjYzMTM2NX0.Z3CgSOQr7L9i-185kd0WGX-stmbFxKnUBCyTHrO8zIo';

// Initialize Supabase Client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin Email & Global User State
const ADMIN_EMAIL = 'jqu@na.edu';
let currentUser = null;