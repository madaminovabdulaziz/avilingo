'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
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
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Terms of Service</h1>
            <p className="text-gray-500 text-sm font-medium">Last Updated: December 27, 2025</p>
          </div>

          {/* Introduction */}
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Welcome to AviLingo. These Terms of Service ("Terms") govern your access to and use of the AviLingo mobile application and website (collectively, the "Service"), operated by AviLingo ("we," "us," or "our").
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-12">
              By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the Service.
            </p>

            {/* Section 1 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">1</span>
                Description of Service
              </h2>
              
              <p className="text-gray-700 mb-4">
                AviLingo is an aviation English learning platform designed to help pilots prepare for ICAO (International Civil Aviation Organization) English proficiency certification. The Service provides:
              </p>
              
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li>Vocabulary training with spaced repetition</li>
                <li>Listening comprehension exercises</li>
                <li>Speaking practice with AI-powered feedback</li>
                <li>Progress tracking and ICAO level prediction</li>
                <li>Mock tests and assessments</li>
              </ul>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                <p className="text-gray-800 font-medium">
                  <strong>Important Disclaimer:</strong> AviLingo is an educational tool designed to supplement your ICAO test preparation. We do not guarantee that using AviLingo will result in achieving any particular ICAO proficiency level. Your success depends on many factors including your dedication, practice time, and individual learning capabilities.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">2</span>
                Account Registration
              </h2>

              <h3 className="text-xl font-semibold mb-4">2.1 Eligibility</h3>
              <p className="text-gray-700 mb-6">
                You must be at least 18 years old to create an account and use the Service. By registering, you represent and warrant that you meet this age requirement.
              </p>

              <h3 className="text-xl font-semibold mb-4">2.2 Account Information</h3>
              <p className="text-gray-700 mb-2">You agree to:</p>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">2.3 One Account Per User</h3>
              <p className="text-gray-700">
                Each user may maintain only one account. We reserve the right to terminate duplicate accounts.
              </p>
            </section>

            {/* Section 3 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">3</span>
                Subscription and Payments
              </h2>

              <h3 className="text-xl font-semibold mb-4">3.1 Subscription Plans</h3>
              <p className="text-gray-700 mb-2">AviLingo offers the following subscription options:</p>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li><strong>Free Tier:</strong> Limited access to vocabulary, listening, and speaking exercises</li>
                <li><strong>Premium Monthly:</strong> Full access to all features, billed monthly</li>
                <li><strong>Premium Yearly:</strong> Full access to all features, billed annually</li>
                <li><strong>Lifetime:</strong> One-time payment for permanent full access</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">3.2 Merchant of Record</h3>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <p className="text-gray-800">
                  <strong>Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles returns.</strong>
                </p>
              </div>
              <p className="text-gray-700 mb-2">When you make a purchase, you are purchasing from Paddle, who is the authorized reseller of AviLingo. Paddle handles:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-700">
                <li>Payment processing</li>
                <li>Sales tax and VAT collection</li>
                <li>Invoicing and receipts</li>
                <li>Refund processing</li>
              </ul>
              <p className="text-gray-700 mb-6">
                By making a purchase, you also agree to Paddle's Buyer Terms available at:{' '}
                <a href="https://www.paddle.com/legal/checkout-buyer-terms" className="text-black underline hover:text-red-600 transition-colors" target="_blank" rel="noopener noreferrer">https://www.paddle.com/legal/checkout-buyer-terms</a>
              </p>

              <h3 className="text-xl font-semibold mb-4">3.3 Automatic Renewal</h3>
              <p className="text-gray-700 mb-6">
                Paid subscriptions (Monthly and Yearly) automatically renew at the end of each billing period unless cancelled. You will be charged between 00:00 and 01:00 (UTC) on the renewal date.
              </p>

              <h3 className="text-xl font-semibold mb-4">3.4 Cancellation</h3>
              <p className="text-gray-700 mb-2">
                You may cancel your subscription at any time through your account settings or by contacting Paddle support at least 48 hours before the next billing date. Upon cancellation:
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li>You retain access until the end of your current billing period</li>
                <li>No refunds are provided for unused portions of the subscription period</li>
                <li>Your account reverts to the Free Tier after the subscription expires</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">3.5 Price Changes</h3>
              <p className="text-gray-700 mb-6">
                We reserve the right to change subscription prices. For existing subscribers, price changes will take effect at the next renewal period, and we will notify you in advance.
              </p>

              <h3 className="text-xl font-semibold mb-4">3.6 Free Trials</h3>
              <p className="text-gray-700">
                We may offer free trial periods for Premium subscriptions. At the end of the trial, your account will automatically convert to a paid subscription unless you cancel before the trial ends.
              </p>
            </section>

            {/* Section 4 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">4</span>
                Refund Policy
              </h2>

              <h3 className="text-xl font-semibold mb-4">4.1 Refund Eligibility</h3>
              <p className="text-gray-700 mb-2">
                You may request a refund within <strong>14 days</strong> of your initial purchase or subscription renewal if:
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li>The Service does not function as described</li>
                <li>You experience persistent technical issues that prevent use of the Service</li>
                <li>You have not substantially used the Service during this period</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">4.2 Refund Process</h3>
              <p className="text-gray-700 mb-2">To request a refund:</p>
              <ol className="list-decimal pl-6 mb-6 space-y-1 text-gray-700">
                <li>Contact Paddle support at <a href="https://paddle.net" className="text-black underline hover:text-red-600 transition-colors" target="_blank" rel="noopener noreferrer">https://paddle.net</a></li>
                <li>Provide your order number and email address used for purchase</li>
                <li>Explain the reason for your refund request</li>
              </ol>
              <p className="text-gray-700 mb-6">
                Paddle, as our Merchant of Record, will process eligible refunds within 5-10 business days.
              </p>

              <h3 className="text-xl font-semibold mb-4">4.3 Non-Refundable Items</h3>
              <p className="text-gray-700 mb-2">The following are not eligible for refunds:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Lifetime subscriptions after 14 days from purchase</li>
                <li>Subscriptions where substantial use has occurred</li>
                <li>Renewals where cancellation was not requested before the billing date</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">5</span>
                Acceptable Use
              </h2>

              <h3 className="text-xl font-semibold mb-4">5.1 Permitted Use</h3>
              <p className="text-gray-700 mb-6">
                You may use the Service only for personal, non-commercial educational purposes related to aviation English learning.
              </p>

              <h3 className="text-xl font-semibold mb-4">5.2 Prohibited Conduct</h3>
              <p className="text-gray-700 mb-2">You agree NOT to:</p>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li>Share your account credentials with others</li>
                <li>Use the Service for any commercial purpose without our written consent</li>
                <li>Copy, distribute, or create derivative works from our content</li>
                <li>Attempt to reverse engineer, decompile, or extract source code from the Service</li>
                <li>Use automated systems (bots, scrapers) to access the Service</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Circumvent any access restrictions or security measures</li>
                <li>Impersonate another person or entity</li>
                <li>Upload malicious code or content</li>
                <li>Use the Service in any way that violates applicable laws</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">5.3 User-Generated Content</h3>
              <p className="text-gray-700 mb-2">If you submit any content through the Service (such as voice recordings for speaking practice):</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>You retain ownership of your content</li>
                <li>You grant us a license to process, analyze, and store your content for the purpose of providing the Service</li>
                <li>You are responsible for ensuring your content does not violate any laws or third-party rights</li>
                <li>We may delete content that violates these Terms</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">6</span>
                Intellectual Property
              </h2>

              <h3 className="text-xl font-semibold mb-4">6.1 Our Content</h3>
              <p className="text-gray-700 mb-6">
                All content on the Service, including but not limited to text, graphics, logos, audio clips, exercises, and software, is owned by AviLingo or our licensors and is protected by copyright, trademark, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-semibold mb-4">6.2 Limited License</h3>
              <p className="text-gray-700 mb-6">
                We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for personal educational purposes, subject to these Terms.
              </p>

              <h3 className="text-xl font-semibold mb-4">6.3 Restrictions</h3>
              <p className="text-gray-700 mb-2">You may not:</p>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li>Reproduce, distribute, or publicly display our content</li>
                <li>Use our trademarks without written permission</li>
                <li>Remove any copyright or proprietary notices from our content</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">6.4 Feedback</h3>
              <p className="text-gray-700">
                Any feedback, suggestions, or ideas you provide about the Service may be used by us without any obligation to you.
              </p>
            </section>

            {/* Section 7 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">7</span>
                Third-Party Services
              </h2>

              <h3 className="text-xl font-semibold mb-4">7.1 AI Services</h3>
              <p className="text-gray-700 mb-2">The Service uses artificial intelligence for features such as speech recognition and pronunciation feedback. These AI features:</p>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li>Provide automated assessments that should not be considered definitive evaluations</li>
                <li>May occasionally produce inaccurate results</li>
                <li>Are not a substitute for professional instruction or official ICAO assessment</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">7.2 Third-Party Links</h3>
              <p className="text-gray-700">
                The Service may contain links to third-party websites or services. We are not responsible for the content, privacy practices, or availability of these external sites.
              </p>
            </section>

            {/* Section 8 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">8</span>
                Privacy
              </h2>

              <p className="text-gray-700">
                Your privacy is important to us. Please review our{' '}
                <Link href="/privacy-policy" className="text-black underline hover:text-red-600 transition-colors font-semibold">Privacy Policy</Link>
                , which explains how we collect, use, and protect your personal information.
              </p>
            </section>

            {/* Section 9 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">9</span>
                Disclaimer of Warranties
              </h2>

              <div className="bg-gray-100 p-6 rounded mb-6">
                <p className="text-gray-800 font-semibold uppercase text-sm">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
                </p>
              </div>

              <p className="text-gray-700 mb-2 uppercase text-sm">
                TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700 text-sm">
                <li>IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT</li>
                <li>WARRANTIES THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES</li>
                <li>WARRANTIES REGARDING THE ACCURACY OR RELIABILITY OF ANY CONTENT OR INFORMATION</li>
              </ul>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                <p className="text-gray-800 font-medium">
                  <strong>IMPORTANT:</strong> AviLingo is an educational tool only. We do not guarantee:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
                  <li>That you will achieve any specific ICAO proficiency level</li>
                  <li>That the content is sufficient for ICAO test preparation</li>
                  <li>That AI-generated feedback accurately reflects your English proficiency</li>
                  <li>The accuracy of predicted ICAO levels</li>
                </ul>
              </div>
            </section>

            {/* Section 10 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">10</span>
                Limitation of Liability
              </h2>

              <p className="text-gray-700 mb-4 uppercase text-sm font-semibold">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>

              <h3 className="text-xl font-semibold mb-4">10.1 No Consequential Damages</h3>
              <p className="text-gray-700 mb-2 uppercase text-sm">
                WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li>Loss of profits, revenue, or data</li>
                <li>Failure to achieve ICAO certification</li>
                <li>Career or employment impacts</li>
                <li>Cost of substitute services</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">10.2 Liability Cap</h3>
              <p className="text-gray-700 mb-6 uppercase text-sm">
                OUR TOTAL LIABILITY SHALL NOT EXCEED THE GREATER OF: THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED US DOLLARS ($100).
              </p>

              <h3 className="text-xl font-semibold mb-4">10.3 Exceptions</h3>
              <p className="text-gray-700">
                Some jurisdictions do not allow limitation of liability for certain damages. In such cases, our liability is limited to the maximum extent permitted by law.
              </p>
            </section>

            {/* Section 11 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">11</span>
                Indemnification
              </h2>

              <p className="text-gray-700 mb-2">
                You agree to indemnify, defend, and hold harmless AviLingo, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Any content you submit through the Service</li>
              </ul>
            </section>

            {/* Section 12 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">12</span>
                Modifications to Service and Terms
              </h2>

              <h3 className="text-xl font-semibold mb-4">12.1 Service Changes</h3>
              <p className="text-gray-700 mb-6">
                We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice.
              </p>

              <h3 className="text-xl font-semibold mb-4">12.2 Terms Changes</h3>
              <p className="text-gray-700 mb-2">
                We may update these Terms from time to time. We will notify you of material changes by:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-700">
                <li>Posting the updated Terms on our website</li>
                <li>Sending an email to registered users</li>
                <li>Displaying a notice in the app</li>
              </ul>
              <p className="text-gray-700">
                Your continued use of the Service after changes take effect constitutes acceptance of the new Terms.
              </p>
            </section>

            {/* Section 13 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">13</span>
                Termination
              </h2>

              <h3 className="text-xl font-semibold mb-4">13.1 Termination by You</h3>
              <p className="text-gray-700 mb-6">
                You may terminate your account at any time by contacting us or through your account settings.
              </p>

              <h3 className="text-xl font-semibold mb-4">13.2 Termination by Us</h3>
              <p className="text-gray-700 mb-2">
                We may suspend or terminate your account immediately, without prior notice, if:
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-1 text-gray-700">
                <li>You breach these Terms</li>
                <li>You engage in fraudulent or illegal activity</li>
                <li>We are required to do so by law</li>
                <li>We discontinue the Service</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">13.3 Effect of Termination</h3>
              <p className="text-gray-700 mb-2">Upon termination:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Your right to access the Service ends immediately</li>
                <li>We may delete your account data after a reasonable period</li>
                <li>Provisions that should survive termination (such as intellectual property, limitation of liability, and indemnification) will remain in effect</li>
              </ul>
            </section>

            {/* Section 14 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">14</span>
                Dispute Resolution
              </h2>

              <h3 className="text-xl font-semibold mb-4">14.1 Informal Resolution</h3>
              <p className="text-gray-700 mb-6">
                Before filing any formal dispute, you agree to contact us at{' '}
                <a href="mailto:legal@avilingo.com" className="text-black underline hover:text-red-600 transition-colors">legal@avilingo.com</a>{' '}
                to attempt to resolve the dispute informally.
              </p>

              <h3 className="text-xl font-semibold mb-4">14.2 Governing Law</h3>
              <p className="text-gray-700 mb-6">
                These Terms are governed by the laws of the jurisdiction where AviLingo is incorporated, without regard to conflict of law principles.
              </p>

              <h3 className="text-xl font-semibold mb-4">14.3 Arbitration</h3>
              <p className="text-gray-700 mb-6">
                Any disputes that cannot be resolved informally shall be resolved through binding arbitration, except for disputes that qualify for small claims court.
              </p>

              <h3 className="text-xl font-semibold mb-4">14.4 Class Action Waiver</h3>
              <p className="text-gray-700">
                You agree to resolve disputes with us on an individual basis and waive any right to participate in a class action lawsuit or class-wide arbitration.
              </p>
            </section>

            {/* Section 15 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">15</span>
                General Provisions
              </h2>

              <h3 className="text-xl font-semibold mb-4">15.1 Entire Agreement</h3>
              <p className="text-gray-700 mb-6">
                These Terms, together with our Privacy Policy and any other agreements referenced herein, constitute the entire agreement between you and AviLingo.
              </p>

              <h3 className="text-xl font-semibold mb-4">15.2 Severability</h3>
              <p className="text-gray-700 mb-6">
                If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in effect.
              </p>

              <h3 className="text-xl font-semibold mb-4">15.3 Waiver</h3>
              <p className="text-gray-700 mb-6">
                Our failure to enforce any right or provision does not constitute a waiver of that right or provision.
              </p>

              <h3 className="text-xl font-semibold mb-4">15.4 Assignment</h3>
              <p className="text-gray-700 mb-6">
                You may not assign or transfer these Terms without our consent. We may assign our rights and obligations without restriction.
              </p>

              <h3 className="text-xl font-semibold mb-4">15.5 Force Majeure</h3>
              <p className="text-gray-700">
                We are not liable for any failure to perform due to causes beyond our reasonable control.
              </p>
            </section>

            {/* Section 16 */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">16</span>
                Contact Information
              </h2>

              <p className="text-gray-700 mb-6">
                For questions about these Terms or the Service:
              </p>

              <div className="bg-gray-100 p-6 rounded">
                <p className="font-bold text-lg mb-3">AviLingo</p>
                <p className="text-gray-700 mb-2">
                  <strong>General Support:</strong>{' '}
                  <a href="mailto:support@avilingo.com" className="text-black underline hover:text-red-600 transition-colors">support@avilingo.com</a>
                </p>
                <p className="text-gray-700 mb-4">
                  <strong>Legal inquiries:</strong>{' '}
                  <a href="mailto:legal@avilingo.com" className="text-black underline hover:text-red-600 transition-colors">legal@avilingo.com</a>
                </p>
                <p className="text-gray-700">
                  <strong>For payment and billing inquiries:</strong><br />
                  <a href="https://paddle.net" className="text-black underline hover:text-red-600 transition-colors" target="_blank" rel="noopener noreferrer">Paddle Support</a>
                </p>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-8 mt-12">
              <p className="text-gray-600 text-center italic">
                By using AviLingo, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
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
              <Link href="/terms-of-service" className="text-white">Terms of Service</Link>
              <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/refund-policy" className="hover:text-white transition-colors">Refund Policy</Link>
            </div>
          </div>
          <p className="text-center text-xs text-gray-600 mt-6">© 2025 AviLingo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

