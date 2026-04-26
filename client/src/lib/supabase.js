import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://onngupovxaequeqplikx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ubmd1cG92eGFlcXVlcXBsaWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNTUzODUsImV4cCI6MjA5MjczMTM4NX0.aTiKdVjl02JenqpQzbg2qcniscHMJyml9LMdmRsqqKg'

export const supabase = createClient(supabaseUrl, supabaseKey)
