const supabase = require('./backend/db');
supabase.from('students').select('*').limit(1).then(res => {
  console.log("Students schema info:", res);
  // Also get the columns
  // Unfortunately supabase JS client doesn't have an easy way to get column definition without using rpc or postgres schema 
}).catch(console.error);
