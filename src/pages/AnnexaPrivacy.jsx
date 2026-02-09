import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AnnexaPrivacy() {
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
        <h1 className="text-4xl font-bold mb-2">Annexa Privacy Policy</h1>
        <p className="text-zinc-400 mb-8">Last Updated: February 6, 2026</p>

        <h2>What This Tool Does</h2>
        <p>
          Annexa (provided by Vox Animus OÜ) is a free tool that helps you generate legal document templates for your SaaS product. You fill out a form, we generate documents. That's it.
        </p>

        <h2>What We Collect</h2>

        <h3>Information You Provide:</h3>
        <ul>
          <li>Product name</li>
          <li>Product description</li>
          <li>Company name</li>
          <li>Country/jurisdiction</li>
          <li>Contact email</li>
          <li>Services you use</li>
          <li>Cookie preferences</li>
        </ul>

        <h3>Automatically Collected:</h3>
        <ul>
          <li>IP address (for rate limiting only)</li>
          <li>Browser type and version</li>
          <li>Page visit timestamp</li>
          <li>Time spent on tool</li>
        </ul>

        <h2>What We DON'T Collect</h2>
        <ul>
          <li>We don't store your generated documents</li>
          <li>We don't sell your information</li>
          <li>We don't track you across other sites</li>
          <li>We don't use advertising cookies</li>
        </ul>

        <h2>How We Use Your Information</h2>

        <h3>Free Tier:</h3>
        <ul>
          <li>Generate document templates (client-side processing)</li>
          <li>Rate limiting (10 generations per IP per day)</li>
          <li>Anonymous analytics (page views, completion rates)</li>
        </ul>

        <h3>EDGE Tier:</h3>
        <ul>
          <li>Everything in Free tier</li>
          <li>Payment processing (via Stripe - see their privacy policy)</li>
          <li>Email delivery of documents</li>
          <li>Customer support</li>
        </ul>

        <h2>Data Storage</h2>

        <h3>Free Tier:</h3>
        <ul>
          <li>Form data stored in your browser (localStorage) only</li>
          <li>Server logs retained for 30 days (IP, timestamp, page path)</li>
          <li>No database storage of your content</li>
        </ul>

        <h3>EDGE Tier:</h3>
        <ul>
          <li>Generated documents stored for 30 days (for re-download)</li>
          <li>Payment information stored by Stripe (not by us)</li>
          <li>Email address stored for delivery and support</li>
        </ul>

        <h2>Data Retention</h2>
        <ul>
          <li><strong>LocalStorage:</strong> Until you clear browser data</li>
          <li><strong>Server logs:</strong> 30 days</li>
          <li><strong>EDGE documents:</strong> 30 days</li>
          <li><strong>Payment records:</strong> 7 years (required by law)</li>
        </ul>

        <h2>Your Rights (GDPR)</h2>
        <p>If you're in the EU, you have the right to:</p>
        <ul>
          <li>Access your data (email annexa@vox-animus.com)</li>
          <li>Delete your data (clear browser, request deletion)</li>
          <li>Correct your data</li>
          <li>Export your data</li>
          <li>Object to processing</li>
        </ul>

        <h2>Your Rights (CCPA)</h2>
        <p>If you're in California, you have the right to:</p>
        <ul>
          <li>Know what data we collect</li>
          <li>Delete your data</li>
          <li>Opt out of sale (we don't sell data, so this is automatic)</li>
        </ul>

        <h2>Cookies</h2>
        <p>Annexa uses these cookies:</p>
        <ul>
          <li><strong>vox.cookie-consent:</strong> Stores your cookie preference (essential)</li>
          <li><strong>_vercel_analytics:</strong> Anonymous page analytics (optional - you can opt out)</li>
        </ul>
        <p>No advertising cookies. No tracking cookies.</p>

        <h2>Third-Party Services</h2>

        <h3>Everyone:</h3>
        <ul>
          <li>Vercel (hosting - see their privacy policy)</li>
          <li>Vercel Analytics (anonymous page views)</li>
        </ul>

        <h3>EDGE Tier Only:</h3>
        <ul>
          <li>Stripe (payment processing)</li>
          <li>Resend (email delivery)</li>
        </ul>

        <p>Each service has their own privacy policy. We don't control their practices.</p>

        <h2>Changes to This Policy</h2>
        <p>
          We'll update the "Last Updated" date at the top.
          Major changes will be announced at the top of the tool page.
        </p>

        <h2>Contact</h2>
        <p>
          Questions? Email: <a href="mailto:annexa@vox-animus.com" className="text-[#C24516] hover:underline">annexa@vox-animus.com</a>
        </p>
        <p>
          Legal requests: <a href="mailto:legal@vox-animus.com" className="text-[#C24516] hover:underline">legal@vox-animus.com</a>
        </p>

        <hr className="border-zinc-800 my-8" />
        <p className="text-sm text-zinc-500">
          Annexa is operated by Vox Animus OÜ, registered in Estonia.
        </p>
      </article>
    </div>
  );
}
