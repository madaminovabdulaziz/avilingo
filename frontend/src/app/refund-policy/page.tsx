'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function RefundPolicyPage() {
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
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Refund Policy</h1>
            <p className="text-gray-500 text-sm font-medium">Last Updated: December 27, 2025</p>
          </div>

          {/* Introduction */}
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed mb-12">
              At AviLingo, we want you to be satisfied with your purchase. This Refund Policy explains when and how you can request a refund.
            </p>

            {/* Payment Processing */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">1</span>
                Payment Processing
              </h2>
              
              <p className="text-gray-700">
                All payments for AviLingo are processed by <strong>Paddle.com</strong>, our Merchant of Record. Paddle handles all payment processing, invoicing, and refund requests.
              </p>
            </section>

            {/* Refund Eligibility */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">2</span>
                Refund Eligibility
              </h2>

              <h3 className="text-xl font-semibold mb-4">14-Day Money-Back Guarantee</h3>
              
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                <p className="text-gray-800 font-medium">
                  We offer a <strong>14-day refund period</strong> for all new purchases and subscription renewals.
                </p>
              </div>

              <h4 className="font-semibold mb-2 text-gray-800">You are eligible for a refund if:</h4>
              <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
                <li>You request a refund within 14 days of your purchase date</li>
                <li>You request a refund within 14 days of your subscription renewal date</li>
                <li>The Service does not function as described</li>
                <li>You experience persistent technical issues that prevent normal use</li>
              </ul>

              <h3 className="text-xl font-semibold mb-4 mt-8">Refund Considerations</h3>
              <p className="text-gray-700 mb-2">When reviewing refund requests, we consider:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Time since purchase</li>
                <li>Extent of Service usage during the refund period</li>
                <li>Reason for the refund request</li>
              </ul>
            </section>

            {/* Non-Refundable Situations */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">3</span>
                Non-Refundable Situations
              </h2>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <p className="text-gray-800 font-medium">Refunds are generally <strong>not available</strong> for:</p>
              </div>

              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Requests made more than 14 days after purchase or renewal</li>
                <li>Accounts with substantial usage of premium features</li>
                <li>Lifetime subscriptions after the 14-day period</li>
                <li>Subscriptions cancelled after the renewal billing date</li>
                <li>Violations of our Terms of Service</li>
              </ul>
            </section>

            {/* How to Request a Refund */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">4</span>
                How to Request a Refund
              </h2>

              <div className="space-y-6">
                <div className="bg-gray-100 p-6 rounded">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-black text-white text-xs flex items-center justify-center rounded-full">1</span>
                    Contact Paddle Support
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Visit <a href="https://paddle.net" className="text-black underline hover:text-red-600 transition-colors font-semibold" target="_blank" rel="noopener noreferrer">https://paddle.net</a> and submit a refund request with:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Your order number (from your purchase confirmation email)</li>
                    <li>The email address used for the purchase</li>
                    <li>Reason for your refund request</li>
                  </ul>
                </div>

                <div className="bg-gray-100 p-6 rounded">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-black text-white text-xs flex items-center justify-center rounded-full">2</span>
                    Processing Time
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700">
                    <li>Refund requests are typically reviewed within 2-3 business days</li>
                    <li>Approved refunds are processed within 5-10 business days</li>
                    <li>Funds may take additional time to appear depending on your payment method</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 border border-gray-200 rounded">
                <h4 className="font-semibold mb-2 text-gray-800">Alternative Contact</h4>
                <p className="text-gray-700">
                  If you have difficulty reaching Paddle, you can contact us at{' '}
                  <a href="mailto:support@avilingo.com" className="text-black underline hover:text-red-600 transition-colors font-semibold">support@avilingo.com</a>{' '}
                  and we will assist you.
                </p>
              </div>
            </section>

            {/* Subscription Cancellation vs. Refund */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">5</span>
                Subscription Cancellation vs. Refund
              </h2>

              <p className="text-gray-700 mb-6">
                <strong>Cancellation</strong> and <strong>refund</strong> are different:
              </p>

              <div className="overflow-x-auto mb-6">
                <table className="w-full border border-gray-200 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold border-b">Action</th>
                      <th className="px-4 py-3 text-left font-semibold border-b">What Happens</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b">
                      <td className="px-4 py-3 font-semibold">Cancellation</td>
                      <td className="px-4 py-3">Your subscription stops renewing. You keep access until the end of your current billing period. No refund is issued.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold">Refund</td>
                      <td className="px-4 py-3">Your payment is returned. Your access is typically revoked immediately.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-100 p-6 rounded">
                <h3 className="text-lg font-semibold mb-3">To Cancel (Without Refund)</h3>
                <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                  <li>Go to Account Settings in the app</li>
                  <li>Select "Manage Subscription"</li>
                  <li>Click "Cancel Subscription"</li>
                </ol>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-yellow-800 text-sm font-medium">
                    ⚠️ Cancel at least 48 hours before your next billing date to avoid being charged.
                  </p>
                </div>
              </div>
            </section>

            {/* Chargebacks */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">6</span>
                Chargebacks
              </h2>

              <p className="text-gray-700 mb-4">
                We encourage you to contact us or Paddle for refund requests before initiating a chargeback with your bank.
              </p>

              <div className="bg-red-50 border border-red-200 p-4 rounded">
                <p className="font-semibold text-red-800 mb-2">Chargebacks:</p>
                <ul className="list-disc pl-6 space-y-1 text-red-700">
                  <li>Take longer to resolve (30-90 days)</li>
                  <li>May result in account suspension</li>
                  <li>Should only be used for unauthorized transactions</li>
                </ul>
              </div>
            </section>

            {/* Free Trial */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">7</span>
                Free Trial
              </h2>

              <p className="text-gray-700 mb-2">If you signed up for a free trial:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>No payment is charged during the trial period</li>
                <li>Cancel before the trial ends to avoid being charged</li>
                <li>If charged after trial, standard 14-day refund policy applies</li>
              </ul>
            </section>

            {/* Changes to This Policy */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">8</span>
                Changes to This Policy
              </h2>

              <p className="text-gray-700">
                We may update this Refund Policy from time to time. Changes will be posted on this page with an updated "Last Updated" date.
              </p>
            </section>

            {/* Contact Us */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-black text-white text-sm flex items-center justify-center font-bold">9</span>
                Contact Us
              </h2>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-gray-100 p-6 rounded">
                  <h3 className="font-semibold text-lg mb-3">For refund requests:</h3>
                  <a 
                    href="https://paddle.net" 
                    className="inline-flex items-center gap-2 text-black font-semibold underline hover:text-red-600 transition-colors"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Paddle Support →
                  </a>
                </div>
                <div className="bg-gray-100 p-6 rounded">
                  <h3 className="font-semibold text-lg mb-3">For questions about this policy:</h3>
                  <a 
                    href="mailto:support@avilingo.com" 
                    className="inline-flex items-center gap-2 text-black font-semibold underline hover:text-red-600 transition-colors"
                  >
                    support@avilingo.com →
                  </a>
                </div>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-8 mt-12">
              <p className="text-gray-600 text-center italic">
                Thank you for choosing AviLingo for your aviation English learning journey.
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
              <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/refund-policy" className="text-white">Refund Policy</Link>
            </div>
          </div>
          <p className="text-center text-xs text-gray-600 mt-6">© 2025 AviLingo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

