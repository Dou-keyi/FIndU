import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://poytyvkbbagrexhsaong.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBveXR5dmtiYmFncmV4aHNhb25nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MDU5MTgsImV4cCI6MjA5NjQ4MTkxOH0.POJSdpIxFIW3zu1dthAFBPHbGwzmW_y_PrDmbOplHXE";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log(Object.keys(data[0] || {}));
}

check();
