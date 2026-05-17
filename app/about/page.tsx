import Header from '../components/Header'
import Footer from '../components/Footer'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-6 nepali-text">हाम्रो बारेमा</h1>
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 space-y-6 nepali-text">
          <p className="text-lg text-gray-700 leading-relaxed">
            <strong>GN Nepal (Global News Nepal)</strong> विश्वभरका समाचार नेपालीमा प्रस्तुत गर्ने एक आधुनिक समाचार पोर्टल हो। हामी कृत्रिम बुद्धिमत्ताको प्रयोग गरी विश्वका प्रमुख समाचार एजेन्सीहरूबाट समाचार संकलन गरी नेपाली भाषामा अनुवाद गरेर प्रस्तुत गर्दछौं।
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-8">हाम्रो उद्देश्य</h2>
          <p className="text-gray-700 leading-relaxed">
            नेपाली पाठकहरूलाई विश्वभरका महत्वपूर्ण घटनाक्रम र समाचारहरू आफ्नै भाषामा सजिलैसँग उपलब्ध गराउनु हो। हामी भरपर्दो स्रोतहरूबाट मात्र समाचार लिने र तथ्यपरक जानकारी प्रदान गर्ने प्रतिबद्ध छौं।
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mt-8">हाम्रा विशेषताहरू</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>✅ विश्वका प्रमुख समाचार स्रोतहरूबाट स्वचालित समाचार संकलन</li>
            <li>✅ उच्च गुणस्तरको नेपाली अनुवाद</li>
            <li>✅ २४/७ अद्यावधिक समाचार</li>
            <li>✅ विभिन्न श्रेणीका समाचार (राजनीति, अर्थतन्त्र, खेलकुद, प्रविधि, आदि)</li>
            <li>✅ मोबाइल-मैत्री डिजाइन</li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  )
}