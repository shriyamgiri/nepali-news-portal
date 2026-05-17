import Header from '../components/Header'
import Footer from '../components/Footer'

export default function AdvertisingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-6 nepali-text">विज्ञापन</h1>
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 space-y-6">
          <p className="text-lg text-gray-700 nepali-text">GN Nepal मा विज्ञापनको लागि सम्पर्क गर्नुहोस्।</p>
          <p className="text-gray-700">Email: ads@gn-nepal.com</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}