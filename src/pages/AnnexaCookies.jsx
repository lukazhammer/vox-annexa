import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AnnexaCookies() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <button
        onClick={() => navigate('/')}
        className="text-zinc-400 hover:text-white mb-8 flex items-center text-sm"
      >
        ← Back to Annexa
      </button>

      <article className="prose prose-invert prose-zinc max-w-none">
        <h1 className="text-4xl font-bold mb-2">Cookie Policy</h1>
        <p className="text-zinc-400 mb-8">Last Updated: February 6, 2026</p>

        <h2>What Are Cookies?</h2>
        <p>
          Cookies are small text files stored in your browser. We use them to make the Launch Kit work and to understand how people use it.
        </p>

        <h2>Cookies We Use</h2>

        <h3>Essential Cookies (Required)</h3>
        <p>These cookies are necessary for the tool to function. You can't opt out.</p>

        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 my-4">
          <p className="font-semibold mb-2">vox.cookie-consent</p>
          <ul className="space-y-1 text-sm">
            <li><strong>Purpose:</strong> Remembers your cookie preference</li>
            <li><strong>Duration:</strong> 1 year</li>
            <li><strong>Provider:</strong> Vox Animus (first-party)</li>
          </ul>
        </div>

        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 my-4">
          <p className="font-semibold mb-2">vox.launch-kit-draft</p>
          <ul className="space-y-1 text-sm">
            <li><strong>Purpose:</strong> Auto-saves your form progress</li>
            <li><strong>Duration:</strong> 7 days</li>
            <li><strong>Provider:</strong> Vox Animus (first-party)</li>
          </ul>
        </div>

        <h3>Analytics Cookies (Optional)</h3>
        <p>These help us understand how people use the tool so we can improve it.</p>

        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 my-4">
          <p className="font-semibold mb-2">_vercel_analytics</p>
          <ul className="space-y-1 text-sm">
            <li><strong>Purpose:</strong> Anonymous page view tracking</li>
            <li><strong>Data collected:</strong> Page URL, referrer, device type, country</li>
            <li><strong>Data NOT collected:</strong> Personal information, IP address (anonymized)</li>
            <li><strong>Duration:</strong> Session</li>
            <li><strong>Provider:</strong> Vercel (third-party)</li>
            <li><strong>Privacy Policy:</strong> <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#C24516] hover:underline">https://vercel.com/legal/privacy-policy</a></li>
          </ul>
        </div>

        <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 my-4">
          <p className="font-semibold mb-2">Session tracking</p>
          <ul className="space-y-1 text-sm">
            <li><strong>Purpose:</strong> Understand completion rates and drop-off points</li>
            <li><strong>Data collected:</strong> Which fields completed, time spent, session ID</li>
            <li><strong>Data NOT collected:</strong> The content you enter</li>
            <li><strong>Duration:</strong> Session</li>
            <li><strong>Provider:</strong> Vox Animus (first-party)</li>
          </ul>
        </div>

        <h3>Marketing Cookies (None Currently)</h3>
        <p>
          We don't currently use marketing cookies. If we add them in the future, we'll update this policy and ask for your consent.
        </p>

        <h2>Third-Party Cookies</h2>
        <p>
          When you upgrade to EDGE, Stripe may set cookies during payment processing. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#C24516] hover:underline">Stripe's privacy policy</a>.
        </p>

        <h2>How to Control Cookies</h2>

        <h3>Via Our Tool:</h3>
        <p>Click "Cookie Settings" in the footer to change your preferences.</p>

        <h3>Via Your Browser:</h3>
        <p>Most browsers let you:</p>
        <ul>
          <li>Block cookies</li>
          <li>Delete cookies</li>
          <li>Get notified when cookies are set</li>
        </ul>

        <p className="mt-4"><strong>Instructions:</strong></p>
        <ul>
          <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
          <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
          <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
        </ul>

        <p className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 text-sm">
          <strong>Note:</strong> Blocking essential cookies will break the tool.
        </p>

        <h2>Do Not Track</h2>
        <p>
          We respect Do Not Track signals. If your browser sends DNT=1, we won't load analytics cookies.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We'll update the "Last Updated" date at the top. We'll notify you via the cookie banner if we add new cookie categories.
        </p>

        <h2>Questions?</h2>
        <p>
          Email: <a href="mailto:privacy@vox-animus.com" className="text-[#C24516] hover:underline">privacy@vox-animus.com</a>
        </p>

        <hr className="border-zinc-800 my-8" />
        <p className="text-sm text-zinc-500">
          Annexa is operated by Vox Animus OÜ, registered in Estonia.
        </p>
      </article>
    </div>
  );
}
