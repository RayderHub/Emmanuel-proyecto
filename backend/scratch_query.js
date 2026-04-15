require('dotenv').config();
const supabase = require('./db');

async function check() {
  const { data, error } = await supabase.from('students').select('*').limit(3);
  console.log("Students limit 3:", data);
  console.log("Error:", error);
}
check();
