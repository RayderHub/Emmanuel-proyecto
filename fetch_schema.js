const supabaseUrl = 'https://epudwuykseeckuguedjh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwdWR3dXlrc2VlY2t1Z3VlZGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMDU0MzIsImV4cCI6MjA5MTY4MTQzMn0.nsp2oPT_NzO-hlTieom6gkZHiAYvBXTvhMYX3Ozpx6w';

fetch(`${supabaseUrl}/rest/v1/students?select=*&limit=1`, {
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  }
}).then(r => r.json()).then(data => console.log('STUDENTS:', data));

fetch(`${supabaseUrl}/rest/v1/group_members?select=*&limit=1`, {
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  }
}).then(r => r.json()).then(data => console.log('GROUP_MEMBERS:', data));
