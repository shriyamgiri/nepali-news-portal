import Link from 'next/link'
import { Facebook, Twitter, Instagram, Youtube, Mail } from 'lucide-react'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    about: [
      { name: 'हाम्रो बारेमा', href: '/about' },
      { name: 'सम्पर्क', href: '/contact' },
      { name: 'विज्ञापन', href: '/advertising' },
      { name: 'क्यारियर', href: '/careers' },
    ],
    legal: [
      { name: 'गोपनीयता नीति', href: '/privacy' },
      { name: 'नियम र सर्तहरू', href: '/terms' },
      { name: 'कुकी नीति', href: '/cookies' },
      { name: 'अस्वीकरण', href: '/disclaimer' },
    ],
    categories: [
      { name: 'राजनीति', href: '/politics' },
      { name: 'अर्थतन्त्र', href: '/economy' },
      { name: 'खेलकुद', href: '/sports' },
      { name: 'मनोरञ्जन', href: '/entertainment' },
    ],
  }

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-nepal-blue to-nepal-red rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                ने
              </div>
              <h3 className="text-xl font-bold text-white nepali-text">
                नेपाल खबर
              </h3>
            </div>
            <p className="text-sm mb-4 nepali-text">
              विश्वभरका समाचार नेपालीमा। भरपर्दो र तथ्यपरक समाचारको लागि हामीसँग जोडिनुहोस्।
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-800 hover:bg-nepal-blue rounded-full flex items-center justify-center transition"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-800 hover:bg-nepal-blue rounded-full flex items-center justify-center transition"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-800 hover:bg-nepal-blue rounded-full flex items-center justify-center transition"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-gray-800 hover:bg-nepal-red rounded-full flex items-center justify-center transition"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4 nepali-text">द्रुत लिंक</h4>
            <ul className="space-y-2">
              {footerLinks.about.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition nepali-text"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-bold mb-4 nepali-text">श्रेणीहरू</h4>
            <ul className="space-y-2">
              {footerLinks.categories.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-white transition nepali-text"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-bold mb-4 nepali-text">
              समाचारपत्र सदस्यता
            </h4>
            <p className="text-sm mb-4 nepali-text">
              दैनिक समाचार इमेलमा प्राप्त गर्नुहोस्
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="इमेल ठेगाना"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-nepal-blue text-sm nepali-text"
              />
              <button className="px-4 py-2 bg-nepal-blue hover:bg-nepal-blue/90 text-white rounded-lg transition">
                <Mail className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p className="nepali-text">
              © {currentYear} नेपाल खबर। सर्वाधिकार सुरक्षित।
            </p>
            <div className="flex gap-6">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-white transition nepali-text"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
