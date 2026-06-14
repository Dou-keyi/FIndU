import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://poytyvkbbagrexhsaong.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBveXR5dmtiYmFncmV4aHNhb25nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MDU5MTgsImV4cCI6MjA5NjQ4MTkxOH0.POJSdpIxFIW3zu1dthAFBPHbGwzmW_y_PrDmbOplHXE";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { error } = await supabase.from('profiles').update({ email: 'test@test.com' }).eq('id', '123');
  console.log(error);
}

check();
