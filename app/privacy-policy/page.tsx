import Header from '../components/Header'
import Footer from '../components/Footer'

export const metadata = {
  title: 'गोपनीयता नीति - GN Nepal',
  description: 'GN Nepal को गोपनीयता नीति',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm p-8">

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-800 mb-2 nepali-text">
            गोपनीयता नीति
          </h1>
          <p className="text-sm text-gray-500 mb-8">अन्तिम अपडेट: जुन २०२५</p>

          <hr className="mb-8" />

          {/* Section 1 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-3 nepali-text">
              १. परिचय
            </h2>
            <p className="text-gray-600 leading-relaxed nepali-text">
              GN Nepal (gnnepal.com) मा स्वागत छ। हामी तपाईंको गोपनीयतालाई
              सम्मान गर्छौं। यो गोपनीयता नीतिले हाम्रो वेबसाइट प्रयोग गर्दा
              हामी कस्तो जानकारी सङ्कलन गर्छौं, कसरी प्रयोग गर्छौं, र कसरी
              सुरक्षित राख्छौं भन्ने बारे जानकारी दिन्छ।
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-3 nepali-text">
              २. हामीले सङ्कलन गर्ने जानकारी
            </h2>
            <p className="text-gray-600 leading-relaxed mb-3 nepali-text">
              हामी निम्न प्रकारका जानकारी सङ्कलन गर्न सक्छौं:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 nepali-text">
              <li>वेबसाइट भ्रमण सम्बन्धी तथ्याङ्क (IP ठेगाना, ब्राउजर प्रकार)</li>
              <li>तपाईंले हेर्नुभएका पृष्ठहरू र समाचारहरू</li>
              <li>कुकिज र समान ट्र्याकिङ प्रविधिहरू</li>
              <li>तपाईंले स्वेच्छाले प्रदान गर्नुभएको जानकारी (टिप्पणी, सम्पर्क फारम)</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-3 nepali-text">
              ३. जानकारी प्रयोगको उद्देश्य
            </h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2 nepali-text">
              <li>वेबसाइटको सेवा सुधार गर्न</li>
              <li>प्रयोगकर्ताको अनुभव बेहतर बनाउन</li>
              <li>विज्ञापन सेवाहरू प्रदान गर्न (Google AdSense)</li>
              <li>वेबसाइट ट्राफिक विश्लेषण गर्न (Google Analytics)</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-3 nepali-text">
              ४. Google AdSense र विज्ञापन
            </h2>
            <p className="text-gray-600 leading-relaxed nepali-text">
              हामी Google AdSense मार्फत विज्ञापन प्रदर्शन गर्छौं। Google ले
              तपाईंको रुचि अनुसार विज्ञापन देखाउन कुकिज प्रयोग गर्न सक्छ।
              तपाईं{' '}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google Ads Settings
              </a>{' '}
              मा गएर विज्ञापन प्राथमिकता परिवर्तन गर्न सक्नुहुन्छ।
            </p>
          </section>

          {/* Section 5 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-3 nepali-text">
              ५. कुकिज नीति
            </h2>
            <p className="text-gray-600 leading-relaxed nepali-text">
              हाम्रो वेबसाइटले कुकिज प्रयोग गर्छ। कुकिज सानो टेक्स्ट फाइल हो
              जुन तपाईंको ब्राउजरमा सङ्ग्रहित हुन्छ। तपाईं आफ्नो ब्राउजर
              सेटिङमा गएर कुकिज अस्वीकार गर्न सक्नुहुन्छ, तर यसले वेबसाइटका
              केही सुविधाहरूमा असर पर्न सक्छ।
            </p>
          </section>

          {/* Section 6 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-3 nepali-text">
              ६. तेस्रो पक्ष सेवाहरू
            </h2>
            <p className="text-gray-600 leading-relaxed nepali-text">
              हामी निम्न तेस्रो पक्ष सेवाहरू प्रयोग गर्छौं:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mt-3 nepali-text">
              <li>Google AdSense — विज्ञापनका लागि</li>
              <li>Google Analytics — ट्राफिक विश्लेषणका लागि</li>
              <li>Vercel — वेबसाइट होस्टिङका लागि</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-3 nepali-text">
              ७. तपाईंका अधिकारहरू
            </h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2 nepali-text">
              <li>आफ्नो व्यक्तिगत जानकारी हेर्ने अधिकार</li>
              <li>जानकारी मेटाउन अनुरोध गर्ने अधिकार</li>
              <li>विज्ञापन ट्र्याकिङबाट बाहिर निस्कने अधिकार</li>
            </ul>
          </section>

          {/* Section 8 */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-3 nepali-text">
              ८. सम्पर्क गर्नुहोस्
            </h2>
            <p className="text-gray-600 leading-relaxed nepali-text">
              यो गोपनीयता नीति सम्बन्धी कुनै प्रश्न भए हामीलाई सम्पर्क गर्नुहोस्:
            </p>
            <div className="mt-3 bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">📧 Email: coolsriyam@gmail.com</p>
              <p className="text-gray-700 mt-1">🌐 Website: nepali-news-portal-wheat.vercel.app</p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3 nepali-text">
              ९. नीति परिवर्तन
            </h2>
            <p className="text-gray-600 leading-relaxed nepali-text">
              हामी यो गोपनीयता नीतिलाई समय–समयमा अपडेट गर्न सक्छौं।
              परिवर्तनहरू यही पृष्ठमा प्रकाशित हुनेछन्। नियमित रूपमा यो
              पृष्ठ हेर्न सिफारिस गरिन्छ।
            </p>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
