const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('🚀 Starting Supabase Setup...');

  // 1. Get Credentials
  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let dbPassword = process.env.SUPABASE_DB_PASSWORD;

  if (!supabaseUrl || supabaseUrl.includes('your_supabase_url')) {
    supabaseUrl = await question('Enter Supabase Project URL: ');
  }
  if (!supabaseKey || supabaseKey.includes('your_supabase_anon_key')) {
    supabaseKey = await question('Enter Supabase Anon Key: ');
  }
  if (!serviceRoleKey) {
    serviceRoleKey = await question('Enter Supabase Service Role Key (for bucket creation): ');
  }
  if (!dbPassword) {
    dbPassword = await question('Enter Supabase Database Password (for migrations): ');
  }

  // Save to .env.local
  const envContent = `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}
SUPABASE_DB_PASSWORD=${dbPassword}
FIREWORKS_API_KEY=${process.env.FIREWORKS_API_KEY || ''}
`;
  fs.writeFileSync('.env.local', envContent);
  console.log('✅ Updated .env.local');

  // 2. Run Migrations
  if (dbPassword) {
    console.log('📦 Running Database Migrations...');
    try {
        // Extract project ID from URL
        // URL format: https://[project-id].supabase.co
        const projectId = supabaseUrl.split('.')[0].split('//')[1];
        const connectionString = `postgresql://postgres.[${projectId}]:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`; // Use pooler for better compatibility or direct if needed. Trying generic pooler URL structure, but user might need specific host.
        // Actually, connection string usually is: postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
        const directConnectionString = `postgresql://postgres:${dbPassword}@db.${projectId}.supabase.co:5432/postgres`;
        
        const client = new Client({ connectionString: directConnectionString });
        await client.connect();

        const migrationPath = path.join(__dirname, '../supabase/migrations/20260224193000_init_schema.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        await client.query(migrationSql);
        console.log('✅ Migration applied successfully!');
        await client.end();
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        console.log('⚠️  You may need to run the SQL in supabase/migrations/ manually via the dashboard.');
    }
  }

  // 3. Create Storage Bucket
  if (serviceRoleKey) {
    console.log('🗄️  Setting up Storage...');
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (!buckets?.find(b => b.name === 'uploads')) {
        const { data, error } = await supabaseAdmin.storage.createBucket('uploads', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'application/pdf', 'text/csv', 'text/plain', 'text/markdown']
        });

        if (error) {
            console.error('❌ Failed to create bucket:', error.message);
        } else {
            console.log('✅ Created "uploads" bucket');
        }
    } else {
        console.log('✅ "uploads" bucket already exists');
    }
  }

  console.log('\n🎉 Setup Complete! You can now run "npm run dev" to start the app.');
  rl.close();
}

main();
