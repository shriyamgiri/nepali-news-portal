import Header from '../components/Header'
import Footer from '../components/Footer'

export const metadata = {
  title: 'हाम्रो बारेमा - GN Nepal',
  description: 'GN Nepal को बारेमा जान्नुहोस् - विश्वभरका समाचार नेपालीमा',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-16">
        <div className="container mx-auto px-4 max-w-5xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 nepali-text">
            GN Nepal बारेमा
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto nepali-text">
            विश्वभरका समाचार — नेपाली भाषामा, नेपाली मानिसका लागि
          </p>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12 max-w-5xl">

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 -mt-8">
          {[
            { number: '२४/७', label: 'समाचार अपडेट' },
            { number: '१०+', label: 'समाचार स्रोत' },
            { number: '५+', label: 'समाचार श्रेणी' },
            { number: '१००%', label: 'नेपाली भाषामा' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-sm p-5 text-center border border-gray-100"
            >
              <p className="text-3xl font-bold text-blue-700">{stat.number}</p>
              <p className="text-sm text-gray-500 mt-1 nepali-text">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Who We Are */}
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📰</span>
            <h2 className="text-2xl font-bold text-gray-800 nepali-text">हामी को हौं?</h2>
          </div>
          <p className="text-gray-600 leading-relaxed nepali-text text-lg">
            <strong className="text-gray-800">GN Nepal (Global News Nepal)</strong> एक आधुनिक
            डिजिटल समाचार पोर्टल हो जसले विश्वभरका प्रमुख समाचार एजेन्सीहरूबाट
            समाचार संकलन गरी उच्च गुणस्तरको नेपाली अनुवादसहित पाठकहरूसमक्ष
            पुर्‍याउँछ। हामी कृत्रिम बुद्धिमत्ता (AI) को उपयोग गरेर छिटो, सटीक
            र विश्वसनीय समाचार प्रस्तुत गर्न प्रतिबद्ध छौं।
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 rounded-xl p-8 border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🎯</span>
              <h2 className="text-xl font-bold text-gray-800 nepali-text">हाम्रो उद्देश्य</h2>
            </div>
            <p className="text-gray-600 leading-relaxed nepali-text">
              नेपाली पाठकहरूलाई विश्वभरका महत्त्वपूर्ण घटनाक्रम आफ्नै मातृभाषामा
              सजिलै र निःशुल्क उपलब्ध गराउनु। भाषाको बाधा हटाएर हरेक नेपालीलाई
              विश्व समाचारसँग जोड्नु हाम्रो मुख्य लक्ष्य हो।
            </p>
          </div>
          <div className="bg-green-50 rounded-xl p-8 border border-green-100">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🔭</span>
              <h2 className="text-xl font-bold text-gray-800 nepali-text">हाम्रो दृष्टिकोण</h2>
            </div>
            <p className="text-gray-600 leading-relaxed nepali-text">
              नेपाली भाषाको सबैभन्दा भरपर्दो र व्यापक अन्तर्राष्ट्रिय समाचार
              स्रोत बन्नु। प्रविधि र पत्रकारिताको संयोजनले नेपाली मिडियालाई
              विश्वस्तरमा पुर्‍याउने हाम्रो सपना छ।
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">⭐</span>
            <h2 className="text-2xl font-bold text-gray-800 nepali-text">हाम्रा विशेषताहरू</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: '🤖', title: 'AI-संचालित अनुवाद', desc: 'उच्च गुणस्तरको स्वचालित नेपाली अनुवाद' },
              { icon: '⚡', title: 'तत्काल अपडेट', desc: '२४ घण्टा, ७ दिन ताजा समाचार' },
              { icon: '🌍', title: 'विश्वव्यापी स्रोत', desc: 'विश्वका १०+ प्रमुख समाचार एजेन्सी' },
              { icon: '📱', title: 'मोबाइल-मैत्री', desc: 'जुनसुकै उपकरणमा सहज अनुभव' },
              { icon: '🗂️', title: 'विविध श्रेणी', desc: 'राजनीति, अर्थ, खेल, प्रविधि र थप' },
              { icon: '🔒', title: 'विश्वसनीय स्रोत', desc: 'प्रमाणित र भरपर्दो समाचार मात्र' },
            ].map((feature) => (
              <div key={feature.title} className="flex gap-4 p-4 rounded-lg bg-gray-50">
                <span className="text-2xl flex-shrink-0">{feature.icon}</span>
                <div>
                  <p className="font-semibold text-gray-800 nepali-text">{feature.title}</p>
                  <p className="text-sm text-gray-500 nepali-text">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🤝</span>
            <h2 className="text-2xl font-bold text-gray-800 nepali-text">हाम्रा मूल्यहरू</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '✅', title: 'सत्यता', desc: 'तथ्यमा आधारित र प्रमाणित समाचार मात्र प्रकाशित गर्छौं' },
              { icon: '⚖️', title: 'निष्पक्षता', desc: 'कुनै पनि राजनीतिक पूर्वाग्रह बिना समाचार प्रस्तुत गर्छौं' },
              { icon: '🚀', title: 'गति', desc: 'सबैभन्दा पहिले ताजा समाचार पाठकसम्म पुर्‍याउँछौं' },
            ].map((value) => (
              <div key={value.title} className="text-center p-6 rounded-lg bg-gray-50">
                <span className="text-3xl block mb-3">{value.icon}</span>
                <p className="font-bold text-gray-800 nepali-text mb-2">{value.title}</p>
                <p className="text-sm text-gray-500 nepali-text">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-blue-700 rounded-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3 nepali-text">हामीसँग सम्पर्क गर्नुहोस्</h2>
          <p className="text-blue-100 mb-6 nepali-text">
            कुनै सुझाव, गुनासो वा सहकार्यका लागि हामीलाई सम्पर्क गर्न नहिचकिचाउनुहोस्।
          </p>
          <a
            href="/contact"
            className="inline-block bg-white text-blue-700 font-bold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            सम्पर्क गर्नुहोस् →
          </a>
        </div>

      </main>

      <Footer />
    </div>
  )
}