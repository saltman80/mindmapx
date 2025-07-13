export default function PrivacyPolicy(): JSX.Element {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-600 mb-8">Last updated: July 10, 2024</p>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
        <p>
          Welcome to Mindmap ? Todo. Your privacy is important to us. This Privacy Policy
          explains how we collect, use, disclose, and safeguard your information when you
          visit our website and use our services.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Personal Data:</strong> Name, email address, billing information when you
            sign up or purchase a subscription through Stripe.
          </li>
          <li>
            <strong>Usage Data:</strong> Pages visited, features used, interactions with demos,
            and performance metrics collected via analytics tools.
          </li>
          <li>
            <strong>Cookies & Tracking:</strong> Cookies, local storage, and similar
            technologies to enhance functionality and track usage patterns.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>To provide, operate, and maintain our website and services.</li>
          <li>
            To process transactions and send you related information, including purchase
            confirmations and invoices.
          </li>
          <li>To improve and personalize your experience and our offerings.</li>
          <li>
            To communicate with you, including customer support and promotional materials,
            where you have consented.
          </li>
          <li>To monitor and analyze usage and trends to improve the user experience.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">4. Cookies and Tracking Technologies</h2>
        <p>
          We use cookies and similar tracking technologies to track activity on our site and hold
          certain information. You can set your browser to refuse cookies or alert you when
          cookies are being sent.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
        <p>
          We may share your information with third parties for processing and analytics, including:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li><strong>Netlify:</strong> Hosting and serverless functions.</li>
          <li><strong>Neon (Postgres):</strong> Database storage.</li>
          <li><strong>Stripe:</strong> Payment processing.</li>
          <li>Analytics providers (e.g., Google Analytics).</li>
        </ul>
        <p>
          These providers have their own privacy policies?please review them to understand how
          they handle your data.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
        <p>
          We implement reasonable security measures to protect your information. However, no
          electronic transmission or storage method is 100% secure.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">7. Children's Privacy</h2>
        <p>
          Our services are not directed to children under 13. We do not knowingly collect personal
          information from children under 13.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">8. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy periodically. We will notify you of any changes by
          posting the new policy on this page with an updated "Last updated" date.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
        <p>
          If you have questions or concerns about this Privacy Policy, please contact us at{' '}
          <a href="mailto:privacy@mindmap-todo.com" className="text-blue-600 hover:underline">
            privacy@mindmap-todo.com
          </a>.
        </p>
      </section>
    </main>
  )
}