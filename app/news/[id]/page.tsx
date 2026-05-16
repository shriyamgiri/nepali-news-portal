'use client'

import { use } from 'react'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import { 
  ThumbsUp, 
  Heart, 
  Share2, 
  Facebook, 
  Twitter, 
  Mail,
  Clock,
  Eye,
  User,
  MessageCircle,
  ExternalLink
} from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export default function NewsArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [reactions, setReactions] = useState({
    like: 230,
    love: 85,
    wow: 42,
  })
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [comment, setComment] = useState({
    name: '',
    email: '',
    text: '',
  })

  const article = {
    id: resolvedParams.id,
    title: 'काठमाडौंमा नयाँ मेट्रो रेल सेवा आजदेखि सुरु',
    content: `काठमाडौं उपत्यकामा लामो समयदेखि प्रतीक्षित मेट्रो रेल सेवा आजदेखि औपचारिक रूपमा सञ्चालनमा आएको छ। यो सेवाले यातायात समस्या समाधान गर्ने अपेक्षा गरिएको छ।

नयाँ मेट्रो रेल सेवाले काठमाडौं, भक्तपुर र ललितपुरलाई जोड्ने गरी तीन मुख्य मार्गमा सञ्चालन हुनेछ। यातायात व्यवस्था विभागका अनुसार, यो सेवाले दैनिक लाखौं यात्रुलाई सेवा प्रदान गर्ने अपेक्षा गरिएको छ।

प्रधानमन्त्रीले उद्घाटन कार्यक्रममा बोल्दै यो परियोजना राष्ट्रिय गौरवको परियोजना भएको बताउनुभयो। उहाँले यस सेवाले काठमाडौं उपत्यकाको यातायात समस्या समाधान गर्न महत्वपूर्ण भूमिका खेल्ने विश्वास व्यक्त गर्नुभयो।

मेट्रो रेल सेवाको पहिलो चरणमा ३० किलोमिटर लामो मार्गमा सेवा सञ्चालन हुनेछ। यसमा कुल २५ स्टेशन रहेका छन्। प्रत्येक ट्रेनमा ६०० जना यात्रु एकैपटक यात्रा गर्न सक्नेछन्।

यातायात विशेषज्ञहरूले यो सेवाले वायु प्रदूषण कम गर्न पनि महत्वपूर्ण योगदान पुर्‍याउने बताएका छन्। साथै पेट्रोल र डिजलको खपतमा पनि कमी आउने अपेक्षा गरिएको छ।

पहिलो हप्तामा यात्रु भाडा ५० प्रतिशत छुटमा उपलब्ध हुनेछ। त्यसपछि न्यूनतम भाडा रु २० तोकिएको छ। मासिक पास लिने यात्रुहरूलाई थप छुटको सुविधा प्रदान गरिनेछ।`,
    category: 'राजनीति',
    source: 'BBC',
    sourceUrl: 'https://www.bbc.com/nepali',
    originalLanguage: 'अंग्रेजी',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200',
    publishedAt: '२०८१ वैशाख २, आइतबार, १४:३० बजे',
    updatedAt: '२०८१ वैशाख २, आइतबार, १५:१५ बजे',
    views: 15420,
    readTime: '५ मिनेट',
    tags: ['मेट्रो', 'यातायात', 'काठमाडौं', 'विकास'],
  }

  const relatedNews = [
    { id: 2, title: 'काठमाडौं उपत्यकामा सार्वजनिक यातायातमा सुधार', views: 8900 },
    { id: 3, title: 'नेपालमा आधुनिक पूर्वाधार विकासको नयाँ युग', views: 7650 },
    { id: 4, title: 'भारत र चीनबाट नेपाललाई यातायात सहयोग', views: 6420 },
  ]

  const comments = [
    {
      id: 1,
      name: 'राम बहादुर',
      time: '१ घण्टा अघि',
      text: 'यो साँच्चै राम्रो खबर हो। यसले काठमाडौंको यातायात समस्या धेरै हदसम्म समाधान हुनेछ।',
      likes: 15,
    },
    {
      id: 2,
      name: 'सीता देवी',
      time: '२ घण्टा अघि',
      text: 'धेरै पर्खिएको परियोजना। अब सरकारले यसलाई राम्ररी सञ्चालन गरोस्।',
      likes: 8,
    },
  ]

  const handleReaction = (type: string) => {
    if (userReaction === type) {
      setUserReaction(null)
      setReactions((prev) => ({ ...prev, [type]: prev[type as keyof typeof prev] - 1 }))
    } else {
      if (userReaction) {
        setReactions((prev) => ({ ...prev, [userReaction]: prev[userReaction as keyof typeof prev] - 1 }))
      }
      setUserReaction(type)
      setReactions((prev) => ({ ...prev, [type]: prev[type as keyof typeof prev] + 1 }))
    }
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Comment submitted:', comment)
    setComment({ name: '', email: '', text: '' })
    alert('तपाईंको टिप्पणी सफलतापूर्वक पेश गरियो। यो प्रशासकद्वारा स्वीकृत पछि प्रकाशित हुनेछ।')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Article */}
          <article className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 border border-gray-100">
              {/* Category Badge */}
              <Link 
                href="/politics"
                className="inline-block px-3 py-1 bg-nepal-red text-white text-sm font-medium rounded-full mb-4 nepali-text hover:bg-nepal-red/90 transition"
              >
                {article.category}
              </Link>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4 nepali-text">
                {article.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {article.publishedAt}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {article.views.toLocaleString('ne-NP')} पटक पढिएको
                </span>
                <span className="flex items-center gap-1">
                  📖 {article.readTime} पढ्ने समय
                </span>
              </div>

              {/* Source Attribution */}
              <div className="bg-blue-50 border-l-4 border-nepal-blue p-4 mb-6 rounded nepali-text">
                <p className="text-sm text-gray-700">
                  <strong>स्रोत:</strong> {article.source} |{' '}
                  <strong>मूल भाषा:</strong> {article.originalLanguage} |{' '}
                  <a 
                    href={article.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-nepal-blue hover:underline inline-flex items-center gap-1"
                  >
                    मूल समाचार पढ्नुहोस्
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              {/* Featured Image */}
              <div className="mb-6 rounded-lg overflow-hidden">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-auto"
                />
              </div>

              {/* Article Content */}
              <div className="prose prose-lg max-w-none nepali-text">
                {article.content.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-4 text-gray-700 leading-relaxed text-lg">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Tags */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tag/${tag}`}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition nepali-text"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Reactions */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 nepali-text">
                  तपाईंको प्रतिक्रिया
                </h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleReaction('like')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${
                      userReaction === 'like'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    👍 <span className="font-medium">{reactions.like}</span>
                  </button>
                  <button
                    onClick={() => handleReaction('love')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${
                      userReaction === 'love'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    ❤️ <span className="font-medium">{reactions.love}</span>
                  </button>
                  <button
                    onClick={() => handleReaction('wow')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${
                      userReaction === 'wow'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    😮 <span className="font-medium">{reactions.wow}</span>
                  </button>
                </div>
              </div>

              {/* Share */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 nepali-text">शेयर गर्नुहोस्</h3>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition">
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition">
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
                    <Share2 className="w-4 h-4" />
                    WhatsApp
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              <div id="comments" className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 nepali-text">
                  टिप्पणीहरू ({comments.length})
                </h3>

                {/* Comment Form */}
                <form onSubmit={handleCommentSubmit} className="mb-8 p-6 bg-gray-50 rounded-lg">
                  <h4 className="font-bold text-gray-800 mb-4 nepali-text">
                    आफ्नो टिप्पणी थप्नुहोस्
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="तपाईंको नाम *"
                      value={comment.name}
                      onChange={(e) => setComment({ ...comment, name: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-nepal-blue nepali-text"
                      required
                    />
                    <input
                      type="email"
                      placeholder="तपाईंको इमेल *"
                      value={comment.email}
                      onChange={(e) => setComment({ ...comment, email: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-nepal-blue"
                      required
                    />
                  </div>
                  <textarea
                    placeholder="तपाईंको टिप्पणी लेख्नुहोस् *"
                    value={comment.text}
                    onChange={(e) => setComment({ ...comment, text: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-nepal-blue mb-4 nepali-text"
                    rows={4}
                    required
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-nepal-blue hover:bg-nepal-blue/90 text-white rounded-lg font-medium transition nepali-text"
                  >
                    टिप्पणी पेश गर्नुहोस्
                  </button>
                  <p className="text-xs text-gray-500 mt-2 nepali-text">
                    * तपाईंको टिप्पणी प्रशासकद्वारा स्वीकृत पछि मात्र प्रकाशित हुनेछ।
                  </p>
                </form>

                {/* Comments List */}
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-500" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-bold text-gray-800 nepali-text">{comment.name}</h5>
                            <span className="text-xs text-gray-500">{comment.time}</span>
                          </div>
                          <p className="text-gray-700 nepali-text">{comment.text}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <button className="text-sm text-gray-600 hover:text-nepal-blue transition flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {comment.likes}
                          </button>
                          <button className="text-sm text-gray-600 hover:text-nepal-blue transition nepali-text">
                            जवाफ दिनुहोस्
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Related News */}
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 nepali-text">सम्बन्धित समाचार</h3>
              <div className="space-y-4">
                {relatedNews.map((news) => (
                  <Link key={news.id} href={`/news/${news.id}`} className="block group">
                    <h4 className="text-sm font-semibold text-gray-800 group-hover:text-nepal-blue transition mb-1 nepali-text line-clamp-2">
                      {news.title}
                    </h4>
                    <span className="text-xs text-gray-500">
                      👁 {news.views.toLocaleString('ne-NP')}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Ad Space */}
            <div className="bg-gray-200 rounded-xl p-8 text-center border-2 border-dashed border-gray-300">
              <p className="text-gray-500 font-medium nepali-text">विज्ञापन स्थान</p>
              <p className="text-sm text-gray-400 mt-2">300 x 600</p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  )
}
