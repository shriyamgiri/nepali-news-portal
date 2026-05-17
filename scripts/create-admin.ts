import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function createAdmin() {
  console.log('🔐 Admin User Creation Script\n')

  // Get Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Get admin details
  const email = await question('Enter admin email: ')
  const name = await question('Enter admin name: ')
  const password = await question('Enter password (min 8 chars): ')

  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters')
    process.exit(1)
  }

  // Simple password hash (in production, use bcrypt)
  const passwordHash = Buffer.from(password).toString('base64')

  try {
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        email,
        name,
        password_hash: passwordHash,
        role: 'superadmin',
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating admin:', error.message)
      process.exit(1)
    }

    console.log('\n✅ Admin user created successfully!')
    console.log(`📧 Email: ${email}`)
    console.log(`👤 Name: ${name}`)
    console.log(`🔑 Role: superadmin\n`)
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    rl.close()
    process.exit(0)
  }
}

createAdmin()