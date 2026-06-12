import Header from '../components/Header'
import Footer from '../components/Footer'
import { Mail, MapPin, Phone } from 'lucide-react'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-6 nepali-text">सम्पर्क</h1>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
            <h2 className="text-xl font-bold mb-6 nepali-text">सम्पर्क जानकारी</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Email</p>
                  <p className="text-gray-600">coolsriyam@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900 nepali-text">ठेगाना</p>
                  <p className="text-gray-600">Kathmandu, Nepal</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
            <h2 className="text-xl font-bold mb-6 nepali-text">हामीलाई सन्देश पठाउनुहोस्</h2>
            <form className="space-y-4">
              <input type="text" placeholder="तपाईंको नाम" className="w-full px-4 py-3 border rounded-lg nepali-text" />
              <input type="email" placeholder="इमेल" className="w-full px-4 py-3 border rounded-lg" />
              <textarea placeholder="सन्देश" rows={4} className="w-full px-4 py-3 border rounded-lg nepali-text"></textarea>
              <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 nepali-text">पठाउनुहोस्</button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}