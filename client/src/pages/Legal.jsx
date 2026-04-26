import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const SECTIONS = {
  terms: {
    title: 'Terms & Conditions',
    lastUpdated: 'April 2026',
    content: [
      {
        heading: '1. Acceptance of Terms',
        text: 'By accessing and using Tregu ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our platform. Tregu is an online marketplace connecting buyers and sellers in Albania.'
      },
      {
        heading: '2. Platform Description',
        text: 'Tregu is a marketplace platform that allows registered businesses and individuals ("Sellers") to list and sell products to customers ("Buyers") in Albania. Tregu acts solely as an intermediary and is not responsible for the quality, safety, or legality of the items listed.'
      },
      {
        heading: '3. User Accounts',
        text: 'To sell on Tregu, you must create an account and provide accurate information. You are responsible for maintaining the confidentiality of your account credentials. Tregu reserves the right to suspend or terminate accounts that violate these terms.'
      },
      {
        heading: '4. Seller Responsibilities',
        text: 'Sellers must provide accurate product descriptions, prices, and availability. Sellers are responsible for fulfilling orders in a timely manner and maintaining professional communication with buyers. All products listed must comply with Albanian law.'
      },
      {
        heading: '5. Buyer Responsibilities',
        text: 'Buyers agree to provide accurate delivery information and to complete purchases in good faith. Cash on delivery orders must be accepted upon delivery unless there is a legitimate reason for refusal.'
      },
      {
        heading: '6. Prohibited Items',
        text: 'The following items are strictly prohibited on Tregu: illegal goods, counterfeit products, weapons, hazardous materials, adult content, and any items that violate Albanian law. Violations will result in immediate account termination.'
      },
      {
        heading: '7. Fees and Payments',
        text: 'Tregu may charge sellers a subscription fee or commission for using the platform. Current pricing is available on the platform. Tregu reserves the right to modify its fee structure with 30 days notice to sellers.'
      },
      {
        heading: '8. Dispute Resolution',
        text: 'In case of disputes between buyers and sellers, Tregu may assist in mediation but is not legally responsible for the outcome. Users are encouraged to resolve disputes amicably. Tregu reserves the right to make final decisions regarding platform-related disputes.'
      },
      {
        heading: '9. Limitation of Liability',
        text: 'Tregu is not liable for any direct, indirect, or consequential damages arising from the use of the platform. We do not guarantee uninterrupted service and are not responsible for losses caused by technical issues.'
      },
      {
        heading: '10. Governing Law',
        text: 'These terms are governed by the laws of the Republic of Albania. Any legal disputes shall be resolved in the courts of Tirana, Albania.'
      },
      {
        heading: '11. Changes to Terms',
        text: 'Tregu reserves the right to modify these terms at any time. Users will be notified of significant changes via email or platform notification. Continued use of the platform after changes constitutes acceptance of the new terms.'
      },
      {
        heading: '12. Contact',
        text: 'For questions about these terms, contact us at: tregusupport@gmail.com'
      },
    ]
  },
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: 'April 2026',
    content: [
      {
        heading: '1. Information We Collect',
        text: 'We collect information you provide when creating an account (name, email, phone number), when listing products (shop details, product information), and when placing orders (delivery address, contact details). We also collect usage data such as browsing patterns and search queries to improve our service.'
      },
      {
        heading: '2. How We Use Your Information',
        text: 'Your information is used to operate the platform, process orders, communicate with you about your account, improve our services, prevent fraud, and comply with legal obligations. We do not sell your personal data to third parties.'
      },
      {
        heading: '3. Data Sharing',
        text: 'We share necessary information between buyers and sellers to complete transactions (e.g., delivery address shared with seller). We may share data with service providers who help operate our platform (e.g., hosting, analytics). We will share data with law enforcement when legally required.'
      },
      {
        heading: '4. Data Storage',
        text: 'Your data is stored securely on servers in the European Union. We use industry-standard encryption and security measures to protect your information. We retain your data for as long as your account is active and for a reasonable period afterward.'
      },
      {
        heading: '5. Your Rights',
        text: 'You have the right to access your personal data, correct inaccurate data, request deletion of your data, and withdraw consent at any time. To exercise these rights, contact us at tregusupport@gmail.com.'
      },
      {
        heading: '6. Cookies',
        text: 'We use essential cookies to operate the platform and analytics cookies to understand how users interact with our service. You can control cookie settings through your browser, though this may affect platform functionality.'
      },
      {
        heading: '7. Children\'s Privacy',
        text: 'Tregu is not intended for users under 16 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.'
      },
      {
        heading: '8. Changes to Privacy Policy',
        text: 'We may update this policy periodically. We will notify you of significant changes via email. Continued use of the platform after changes constitutes acceptance of the updated policy.'
      },
      {
        heading: '9. Contact',
        text: 'For privacy-related questions or requests, contact us at: tregusupport@gmail.com'
      },
    ]
  },
  copyright: {
    title: 'Copyright & Intellectual Property',
    lastUpdated: 'April 2026',
    content: [
      {
        heading: '1. Platform Ownership',
        text: 'Tregu and all its content, features, and functionality are owned by Tregu and are protected by Albanian and international copyright, trademark, and other intellectual property laws.'
      },
      {
        heading: '2. Seller Content',
        text: 'Sellers retain ownership of their product photos, descriptions, and other content they upload to Tregu. By uploading content, sellers grant Tregu a non-exclusive license to display, reproduce, and promote that content on the platform.'
      },
      {
        heading: '3. Prohibited Use',
        text: 'You may not copy, reproduce, distribute, or create derivative works from Tregu\'s platform design, code, or content without explicit written permission. Scraping or automated data collection from the platform is strictly prohibited.'
      },
      {
        heading: '4. Counterfeit Products',
        text: 'Listing counterfeit, replica, or unauthorized copies of branded products is strictly prohibited. Sellers must have the right to sell all listed products. Violations will result in immediate account termination and may be reported to relevant authorities.'
      },
      {
        heading: '5. Trademark',
        text: 'The Tregu name, logo, and brand are trademarks of Tregu. You may not use these trademarks without prior written permission from Tregu.'
      },
      {
        heading: '6. DMCA / Copyright Complaints',
        text: 'If you believe content on Tregu infringes your copyright, please contact us at tregusupport@gmail.com with details of the infringement. We will investigate and take appropriate action, which may include removal of the infringing content.'
      },
      {
        heading: '7. User Generated Content',
        text: 'By submitting reviews, comments, or other content to Tregu, you grant us a perpetual, royalty-free license to use, modify, and display that content. You confirm that your content does not infringe any third-party rights.'
      },
    ]
  }
};

export default function Legal() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('terms');
  const page = SECTIONS[activePage];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ background: 'var(--text-1)', padding: '40px 20px 0' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', marginBottom: 24 }}>
            <ArrowLeft size={15} /> Back
          </button>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--green)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Legal
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 }}>
            {page.title}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>
            Last updated: {page.lastUpdated}
          </p>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 4 }}>
            {Object.entries(SECTIONS).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setActivePage(key)}
                style={{
                  padding: '10px 18px',
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  borderBottom: activePage === key ? '2px solid #fff' : '2px solid transparent',
                  color: activePage === key ? '#fff' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.15s',
                }}
              >
                {val.title.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        {page.content.map((section, i) => (
          <div key={i} style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text-1)', marginBottom: 10 }}>
              {section.heading}
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.8 }}>
              {section.text}
            </p>
          </div>
        ))}

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 28, marginTop: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.7 }}>
            These policies apply to all users of the Tregu platform. By using Tregu, you acknowledge that you have read and understood these policies. For any questions contact us at <strong>tregusupport@gmail.com</strong>
          </p>
        </div>
      </div>
    </div>
  );
}