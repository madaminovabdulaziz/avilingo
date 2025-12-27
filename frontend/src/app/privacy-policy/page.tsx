'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <Link href="/" className="text-xl font-bold tracking-tight">
            AviLingo
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-16">
        <motion.article 
          className="max-w-[900px] mx-auto px-4 sm:px-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Title */}
          <div className="mb-12 pb-8 border-b border-gray-200">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Privacy Policy</h1>
            <p className="text-gray-500 text-sm font-medium">Last Updated: December 27, 2025</p>
          </div>

          {/* Introduction */}
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              This Privacy Policy explains how AviLingo ("we," "us," or "our") collects, uses, shares, and protects your personal information when you use our mobile application and website (collectively, the "Service").
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-12">
              By using the Service, you agree to the collection and use of information in accordance with this Privacy Policy.
            </p>

            {/* Section 1 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">1</span>
                Information We Collect
              </h2>
              
              <h3 className="text-xl font-semibold mb-4 mt-8">1.1 Information You Provide</h3>
              
              <h4 className="font-semibold mb-2 text-gray-800">Account Information:</h4>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-700">
                <li>Email address</li>
                <li>Display name</li>
                <li>Password (stored securely as a hash)</li>
                <li>Native language</li>
                <li>Target ICAO level</li>
                <li>Scheduled test date (optional)</li>
              </ul>

              <h4 className="font-semibold mb-2 text-gray-800">Profile Information:</h4>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-700">
                <li>Profile photo (optional)</li>
                <li>Test location (optional)</li>
              </ul>

              <h4 className="font-semibold mb-2 text-gray-800">Learning Data:</h4>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-700">
                <li>Vocabulary review responses</li>
                <li>Listening exercise answers</li>
                <li>Speaking practice audio recordings</li>
                <li>Practice session times and durations</li>
              </ul>

              <h4 className="font-semibold mb-2 text-gray-800">Communications:</h4>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li>Support requests and correspondence</li>
                <li>Feedback and suggestions</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4 mt-8">1.2 Information Collected Automatically</h3>
              
              <h4 className="font-semibold mb-2 text-gray-800">Usage Data:</h4>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-700">
                <li>Features accessed and actions taken</li>
                <li>Time spent on exercises</li>
                <li>Learning progress and statistics</li>
                <li>App version and settings</li>
              </ul>

              <h4 className="font-semibold mb-2 text-gray-800">Device Information:</h4>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-700">
                <li>Device type and model</li>
                <li>Operating system and version</li>
                <li>Unique device identifiers</li>
                <li>IP address</li>
                <li>Browser type (for web access)</li>
              </ul>

              <h4 className="font-semibold mb-2 text-gray-800">Audio Data:</h4>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li>Voice recordings submitted for speaking practice</li>
                <li>Transcriptions generated from recordings</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4 mt-8">1.3 Information from Third Parties</h3>
              
              <h4 className="font-semibold mb-2 text-gray-800">Payment Information:</h4>
              <p className="text-gray-700 mb-4">
                We do not directly collect or store payment information. All payments are processed by Paddle.com, our Merchant of Record. Paddle may share with us:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-700">
                <li>Transaction confirmation</li>
                <li>Subscription status</li>
                <li>Country of purchase (for tax purposes)</li>
              </ul>
              <p className="text-gray-700">
                For Paddle's privacy practices, see: <a href="https://www.paddle.com/legal/privacy" className="text-black underline hover:text-red-600 transition-colors" target="_blank" rel="noopener noreferrer">https://www.paddle.com/legal/privacy</a>
              </p>
            </section>

            {/* Section 2 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">2</span>
                How We Use Your Information
              </h2>
              
              <p className="text-gray-700 mb-4">We use your information to:</p>

              <h3 className="text-xl font-semibold mb-4 mt-6">2.1 Provide the Service</h3>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li>Create and manage your account</li>
                <li>Deliver personalized learning content</li>
                <li>Process and track your learning progress</li>
                <li>Implement spaced repetition algorithms</li>
                <li>Generate AI-powered feedback on speaking exercises</li>
                <li>Calculate your predicted ICAO level</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4 mt-6">2.2 Improve the Service</h3>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li>Analyze usage patterns to improve features</li>
                <li>Develop new learning content and exercises</li>
                <li>Train and improve our AI models (using anonymized/aggregated data)</li>
                <li>Fix bugs and technical issues</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4 mt-6">2.3 Communicate With You</h3>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li>Send transactional emails (account verification, password reset)</li>
                <li>Deliver learning reminders (if enabled)</li>
                <li>Notify you of important updates or changes</li>
                <li>Respond to support requests</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4 mt-6">2.4 Ensure Security</h3>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li>Detect and prevent fraud</li>
                <li>Protect against unauthorized access</li>
                <li>Enforce our Terms of Service</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">3</span>
                How We Share Your Information
              </h2>
              
              <p className="text-gray-700 mb-6">We do not sell your personal information. We may share your information with:</p>

              <h3 className="text-xl font-semibold mb-4 mt-6">3.1 Service Providers</h3>
              <p className="text-gray-700 mb-4">We use third-party services to help operate the Service:</p>
              
              <div className="overflow-x-auto mb-6">
                <table className="w-full border border-gray-200 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold border-b">Provider</th>
                      <th className="px-4 py-3 text-left font-semibold border-b">Purpose</th>
                      <th className="px-4 py-3 text-left font-semibold border-b">Data Shared</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b">
                      <td className="px-4 py-3">Paddle.com</td>
                      <td className="px-4 py-3">Payment processing</td>
                      <td className="px-4 py-3">Transaction data</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-3">Cloud hosting provider</td>
                      <td className="px-4 py-3">Data storage</td>
                      <td className="px-4 py-3">All service data (encrypted)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-3">AI service providers</td>
                      <td className="px-4 py-3">Speech recognition, feedback</td>
                      <td className="px-4 py-3">Audio recordings, text</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-3">Email service provider</td>
                      <td className="px-4 py-3">Transactional emails</td>
                      <td className="px-4 py-3">Email address, name</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Analytics provider</td>
                      <td className="px-4 py-3">Usage analytics</td>
                      <td className="px-4 py-3">Anonymized usage data</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-xl font-semibold mb-4 mt-6">3.2 Legal Requirements</h3>
              <p className="text-gray-700 mb-2">We may disclose your information if required by law or in response to:</p>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li>Court orders or legal processes</li>
                <li>Government requests</li>
                <li>Protection of our rights or safety</li>
                <li>Investigation of potential violations</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4 mt-6">3.3 Business Transfers</h3>
              <p className="text-gray-700 mb-6">
                If AviLingo is involved in a merger, acquisition, or sale of assets, your information may be transferred. We will notify you of any such change.
              </p>

              <h3 className="text-xl font-semibold mb-4 mt-6">3.4 With Your Consent</h3>
              <p className="text-gray-700">
                We may share your information for other purposes with your explicit consent.
              </p>
            </section>

            {/* Section 4 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">4</span>
                Data Retention
              </h2>

              <h3 className="text-xl font-semibold mb-4">4.1 Active Accounts</h3>
              <p className="text-gray-700 mb-6">
                We retain your data for as long as your account is active or as needed to provide the Service.
              </p>

              <h3 className="text-xl font-semibold mb-4">4.2 Deleted Accounts</h3>
              <p className="text-gray-700 mb-2">When you delete your account:</p>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li>Account information is deleted within 30 days</li>
                <li>Learning progress data is anonymized or deleted</li>
                <li>Audio recordings are deleted within 30 days</li>
                <li>Some data may be retained for legal or legitimate business purposes</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">4.3 Backup Retention</h3>
              <p className="text-gray-700">
                Backup copies may be retained for up to 90 days for disaster recovery purposes.
              </p>
            </section>

            {/* Section 5 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">5</span>
                Data Security
              </h2>

              <p className="text-gray-700 mb-4">We implement appropriate technical and organizational measures to protect your data:</p>
              <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
                <li><strong>Encryption:</strong> Data is encrypted in transit (TLS/SSL) and at rest</li>
                <li><strong>Access Controls:</strong> Limited access to personal data on a need-to-know basis</li>
                <li><strong>Secure Storage:</strong> Data stored on secure cloud infrastructure</li>
                <li><strong>Password Security:</strong> Passwords are hashed using industry-standard algorithms</li>
                <li><strong>Regular Audits:</strong> Periodic security reviews and updates</li>
              </ul>
              <div className="bg-gray-100 border-l-4 border-black p-4">
                <p className="text-gray-700 font-medium">
                  <strong>Important:</strong> No method of transmission or storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">6</span>
                Your Rights and Choices
              </h2>

              <h3 className="text-xl font-semibold mb-4">6.1 Access and Portability</h3>
              <p className="text-gray-700 mb-6">
                You can access your personal data through your account settings. You may request a copy of your data by contacting us.
              </p>

              <h3 className="text-xl font-semibold mb-4">6.2 Correction</h3>
              <p className="text-gray-700 mb-6">
                You can update your account information at any time through the app settings.
              </p>

              <h3 className="text-xl font-semibold mb-4">6.3 Deletion</h3>
              <p className="text-gray-700 mb-6">
                You can delete your account through settings or by contacting us. This will remove your personal data as described in Section 4.
              </p>

              <h3 className="text-xl font-semibold mb-4">6.4 Communication Preferences</h3>
              <p className="text-gray-700 mb-2">You can:</p>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li>Disable push notifications in your device settings</li>
                <li>Disable email reminders in your account settings</li>
                <li>Unsubscribe from marketing emails using the link provided</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">6.5 Audio Recordings</h3>
              <p className="text-gray-700">
                You can delete individual speaking practice recordings through the app, or request deletion of all recordings by contacting us.
              </p>
            </section>

            {/* Section 7 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">7</span>
                International Data Transfers
              </h2>

              <p className="text-gray-700 mb-4">
                Your information may be transferred to and processed in countries other than your own. These countries may have different data protection laws.
              </p>
              <p className="text-gray-700 mb-2">When we transfer data internationally, we use appropriate safeguards such as:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Standard contractual clauses</li>
                <li>Data processing agreements</li>
                <li>Compliance with applicable transfer mechanisms</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">8</span>
                Children's Privacy
              </h2>

              <p className="text-gray-700 mb-4">
                The Service is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18.
              </p>
              <p className="text-gray-700">
                If you believe we have collected information from a child under 18, please contact us immediately, and we will delete such information.
              </p>
            </section>

            {/* Section 9 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">9</span>
                European Users (GDPR)
              </h2>

              <p className="text-gray-700 mb-6">
                If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, you have additional rights under the General Data Protection Regulation (GDPR):
              </p>

              <h3 className="text-xl font-semibold mb-4">9.1 Legal Basis for Processing</h3>
              <p className="text-gray-700 mb-2">We process your data based on:</p>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li><strong>Contract:</strong> To provide the Service you requested</li>
                <li><strong>Legitimate Interests:</strong> To improve and secure the Service</li>
                <li><strong>Consent:</strong> For optional features like marketing communications</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">9.2 Additional Rights</h3>
              <p className="text-gray-700 mb-2">You have the right to:</p>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Correct inaccurate data</li>
                <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                <li><strong>Restriction:</strong> Limit how we process your data</li>
                <li><strong>Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Object:</strong> Object to certain processing activities</li>
                <li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">9.3 Exercising Your Rights</h3>
              <p className="text-gray-700 mb-6">
                To exercise these rights, contact us at <a href="mailto:privacy@avilingo.com" className="text-black underline hover:text-red-600 transition-colors">privacy@avilingo.com</a>. We will respond within 30 days.
              </p>

              <h3 className="text-xl font-semibold mb-4">9.4 Data Protection Authority</h3>
              <p className="text-gray-700">
                You have the right to lodge a complaint with your local data protection authority if you believe we have violated your rights.
              </p>
            </section>

            {/* Section 10 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">10</span>
                California Users (CCPA)
              </h2>

              <p className="text-gray-700 mb-6">
                If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA):
              </p>

              <h3 className="text-xl font-semibold mb-4">10.1 Right to Know</h3>
              <p className="text-gray-700 mb-2">You can request information about:</p>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li>Categories of personal information collected</li>
                <li>Sources of personal information</li>
                <li>Purpose for collecting information</li>
                <li>Categories of third parties with whom we share information</li>
                <li>Specific pieces of personal information collected</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">10.2 Right to Delete</h3>
              <p className="text-gray-700 mb-6">
                You can request deletion of your personal information, subject to certain exceptions.
              </p>

              <h3 className="text-xl font-semibold mb-4">10.3 Right to Non-Discrimination</h3>
              <p className="text-gray-700 mb-6">
                We will not discriminate against you for exercising your CCPA rights.
              </p>

              <h3 className="text-xl font-semibold mb-4">10.4 Do Not Sell</h3>
              <p className="text-gray-700 mb-6">
                We do not sell personal information as defined by the CCPA.
              </p>

              <h3 className="text-xl font-semibold mb-4">10.5 Exercising Your Rights</h3>
              <p className="text-gray-700">
                To exercise your CCPA rights, contact us at <a href="mailto:privacy@avilingo.com" className="text-black underline hover:text-red-600 transition-colors">privacy@avilingo.com</a>.
              </p>
            </section>

            {/* Section 11 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">11</span>
                Cookies and Tracking
              </h2>

              <h3 className="text-xl font-semibold mb-4">11.1 Cookies We Use</h3>
              <p className="text-gray-700 mb-2">Our website uses cookies for:</p>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li><strong>Essential Cookies:</strong> Required for the website to function</li>
                <li><strong>Authentication:</strong> Keeping you logged in</li>
                <li><strong>Preferences:</strong> Remembering your settings</li>
                <li><strong>Analytics:</strong> Understanding how you use our website</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">11.2 Managing Cookies</h3>
              <p className="text-gray-700 mb-6">
                You can manage cookies through your browser settings. Note that disabling certain cookies may affect website functionality.
              </p>

              <h3 className="text-xl font-semibold mb-4">11.3 Do Not Track</h3>
              <p className="text-gray-700">
                We currently do not respond to "Do Not Track" browser signals.
              </p>
            </section>

            {/* Section 12 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">12</span>
                Third-Party Links
              </h2>

              <p className="text-gray-700">
                The Service may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to read their privacy policies.
              </p>
            </section>

            {/* Section 13 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">13</span>
                Changes to This Policy
              </h2>

              <p className="text-gray-700 mb-2">
                We may update this Privacy Policy from time to time. We will notify you of material changes by:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-700">
                <li>Posting the updated policy on our website</li>
                <li>Updating the "Last Updated" date</li>
                <li>Sending an email notification for significant changes</li>
              </ul>
              <p className="text-gray-700">
                Your continued use of the Service after changes take effect constitutes acceptance of the updated Privacy Policy.
              </p>
            </section>

            {/* Section 14 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">14</span>
                Contact Us
              </h2>

              <p className="text-gray-700 mb-6">
                For questions or concerns about this Privacy Policy or your personal data:
              </p>

              <div className="bg-gray-100 p-6 rounded">
                <p className="font-bold text-lg mb-3">AviLingo</p>
                <p className="text-gray-700 mb-2">
                  <strong>Privacy:</strong>{' '}
                  <a href="mailto:privacy@avilingo.com" className="text-black underline hover:text-red-600 transition-colors">privacy@avilingo.com</a>
                </p>
                <p className="text-gray-700 mb-4">
                  <strong>General Support:</strong>{' '}
                  <a href="mailto:support@avilingo.com" className="text-black underline hover:text-red-600 transition-colors">support@avilingo.com</a>
                </p>
                <p className="text-gray-700">
                  <strong>For payment-related privacy inquiries:</strong><br />
                  <a href="https://www.paddle.com/legal/privacy" className="text-black underline hover:text-red-600 transition-colors" target="_blank" rel="noopener noreferrer">Paddle Privacy Policy</a>
                </p>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-8 mt-12">
              <p className="text-gray-500 text-sm italic">
                This Privacy Policy is effective as of the "Last Updated" date above.
              </p>
            </div>
          </div>
        </motion.article>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-black text-white">
        <div className="max-w-[900px] mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-lg font-bold">AviLingo</span>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/privacy-policy" className="text-white">Privacy Policy</Link>
              <Link href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link>
            </div>
          </div>
          <p className="text-center text-xs text-gray-600 mt-6">© 2025 AviLingo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

