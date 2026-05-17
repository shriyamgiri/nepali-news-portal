import Header from '../components/Header'
import Footer from '../components/Footer'

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-6 nepali-text">क्यारियर</h1>
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 nepali-text">
          <p className="text-gray-700">हाल कुनै रिक्त पद छैन। कृपया पछि फेरि जाँच गर्नुहोस्।</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}