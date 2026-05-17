import Link from 'next/link'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 nepali-text">
            समाचार भेटिएन
          </h2>
          <p className="text-gray-600 mb-8 nepali-text">
            माफ गर्नुहोस्, तपाईंले खोजेको समाचार भेटिएन।
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-nepal-blue text-white rounded-lg hover:bg-nepal-blue/90 transition nepali-text"
          >
            गृहपृष्ठमा फर्कनुहोस्
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}