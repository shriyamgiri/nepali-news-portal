import { supabase } from '../lib/supabase'

export default async function TestDB() {
  // Fetch categories from database
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order')

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Database Connection Failed</h1>
          <p className="text-gray-700 mb-2">Error: {error.message}</p>
          <p className="text-sm text-gray-500">Check your .env.local file</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-green-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-green-600 mb-4">✅ Database Connected!</h1>
        <p className="text-gray-700 mb-4">Successfully fetched {categories?.length} categories from Supabase:</p>
        
        <div className="space-y-2">
          {categories?.map((cat) => (
            <div key={cat.id} className="p-3 bg-gray-50 rounded border border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <p className="font-semibold">{cat.name_en} / {cat.name_ne}</p>
                  <p className="text-sm text-gray-500">Slug: {cat.slug}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded">
          <p className="text-sm text-gray-700">
            <strong>Next Step:</strong> Replace mock data in your homepage with real database queries!
          </p>
        </div>
      </div>
    </div>
  )
}