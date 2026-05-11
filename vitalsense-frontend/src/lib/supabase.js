import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lyxizhgtmelogrrupjap.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5eGl6aGd0bWVsb2dycnVwamFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNDI0MjgsImV4cCI6MjA5MjkxODQyOH0.x_9qKlzk8x4b4EQtzEZxWciQafNCtDYGQxYATk8K218'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
