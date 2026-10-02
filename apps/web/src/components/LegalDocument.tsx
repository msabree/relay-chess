type LegalSection = {
  title: string;
  paragraphs?: string[];
  list?: string[];
  paragraphsAfter?: string[];
  listAfter?: string[];
};

const PRIVACY_LEGAL = {
  title: "Privacy",
  titleAccent: "Policy",
  lastUpdated: "Last Updated: June 1, 2025",
  intro: "Protecting your private information is our priority. This Privacy Policy applies to Relay Chess and governs how we collect and use your data. By using Relay Chess, you consent to the data practices described in this policy.",
  sections: [
  {
    "title": "1. Collection of Your Personal Information",
    "paragraphs": [
      "To provide you with our services, Relay Chess may collect personally identifiable information, such as:"
    ],
    "list": [
      "First and Last Name",
      "Email Address",
      "Username and profile information",
      "Game statistics and history"
    ],
    "paragraphsAfter": [
      "We only collect personal information that you voluntarily provide to us. This may occur when you:"
    ],
    "listAfter": [
      "Create an account",
      "Participate in games and tournaments",
      "Contact us via email or support channels",
      "Subscribe to notifications or updates"
    ]
  },
  {
    "title": "2. Use of Your Personal Information",
    "paragraphs": [
      "Relay Chess uses your personal information to:"
    ],
    "list": [
      "Provide and maintain our chess platform services",
      "Match you with other players for games",
      "Track your game history and statistics",
      "Communicate with you about games, updates, and features",
      "Send you notifications about your account activity",
      "Improve our services and user experience"
    ]
  },
  {
    "title": "3. Sharing Information with Third Parties",
    "paragraphs": [
      "We do not sell, rent, or lease your personal information to third parties. We may share data with trusted partners who help us:"
    ],
    "list": [
      "Perform statistical analysis and improve our services",
      "Provide customer support and technical assistance",
      "Send communications and notifications",
      "Process authentication through OAuth providers (Google, Apple)"
    ],
    "paragraphsAfter": [
      "All third parties are required to maintain the confidentiality of your information and are prohibited from using it for any other purpose."
    ]
  },
  {
    "title": "4. Your Rights",
    "paragraphs": [
      "You have the right to:"
    ],
    "list": [
      "Access your personal information",
      "Request deletion of your personal information",
      "Opt-out of marketing communications",
      "Request correction of inaccurate data",
      "Export your game data and statistics",
      "Close your account at any time"
    ]
  },
  {
    "title": "5. Children Under Thirteen",
    "paragraphs": [
      "Relay Chess does not knowingly collect personal information from children under 13. If you are under 13, please do not use our services without parental consent. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information."
    ]
  },
  {
    "title": "6. Changes to This Policy",
    "paragraphs": [
      "We may update this Privacy Policy from time to time. We will notify you of any significant changes by:"
    ],
    "list": [
      "Sending an email to your registered address",
      "Posting a notice on our website",
      "Updating the \"Last Updated\" date"
    ],
    "paragraphsAfter": [
      "Your continued use of Relay Chess after such modifications constitutes your acceptance of the updated policy."
    ]
  }
] as LegalSection[],
};

const TERMS_LEGAL = {
  title: "Terms of",
  titleAccent: "Service",
  lastUpdated: "Last Updated: June 1, 2025",
  sections: [
  {
    "title": "1. Acceptance of Terms",
    "paragraphs": [
      "By accessing and using Relay Chess, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service."
    ]
  },
  {
    "title": "2. Use License",
    "paragraphs": [
      "Permission is granted to temporarily use Relay Chess for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:"
    ],
    "list": [
      "Modify or copy the materials",
      "Use the materials for any commercial purpose or for any public display",
      "Attempt to reverse engineer any software contained on Relay Chess",
      "Remove any copyright or other proprietary notations from the materials"
    ]
  },
  {
    "title": "3. User Accounts",
    "paragraphs": [
      "To access certain features of Relay Chess, you must create an account. You agree to:"
    ],
    "list": [
      "Provide accurate, current, and complete information during registration",
      "Maintain and promptly update your account information",
      "Maintain the security of your password and identification",
      "Accept all responsibility for activities that occur under your account",
      "Notify us immediately of any unauthorized use of your account"
    ]
  },
  {
    "title": "4. Code of Conduct",
    "paragraphs": [
      "You agree not to use Relay Chess to harass, abuse, or harm others. Cheating, exploiting bugs, or using automated tools to gain unfair advantages is strictly prohibited. We reserve the right to suspend or terminate accounts that violate these rules."
    ]
  },
  {
    "title": "5. Disclaimer",
    "paragraphs": [
      "Relay Chess is provided \"as is\" without warranties of any kind. We do not guarantee uninterrupted or error-free service. Your use of the platform is at your own risk."
    ]
  },
  {
    "title": "6. Limitation of Liability",
    "paragraphs": [
      "In no event shall Relay Chess or its suppliers be liable for any damages arising out of the use or inability to use the platform, even if we have been notified of the possibility of such damages."
    ]
  },
  {
    "title": "7. Modifications",
    "paragraphs": [
      "Relay Chess may revise these terms at any time without notice. By using this platform, you agree to be bound by the current version of these Terms of Service."
    ]
  },
  {
    "title": "8. Governing Law",
    "paragraphs": [
      "These terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions."
    ]
  },
  {
    "title": "9. Contact Information",
    "paragraphs": [
      "If you have any questions about these Terms of Service, please contact us through our support channels on the Relay Chess website."
    ]
  }
] as LegalSection[],
};

type LegalDocumentProps = {
  document: 'privacy' | 'terms';
};

const LegalDocument = ({ document }: LegalDocumentProps) => {
  const legal = document === 'privacy' ? PRIVACY_LEGAL : TERMS_LEGAL;
  const sections = legal.sections;

  return (
    <>
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {legal.title} <span className="text-gradient">{legal.titleAccent}</span>
        </h1>
        <p className="text-fg-muted text-lg">{legal.lastUpdated}</p>
      </div>

      {document === 'privacy' && 'intro' in legal && (
        <div className="glass-effect border border-line rounded-2xl p-6 md:p-8 backdrop-blur-xl mb-8">
          <p className="text-lg text-fg-muted leading-relaxed">{PRIVACY_LEGAL.intro}</p>
        </div>
      )}

      <div className="space-y-8">
        {sections.map((section, index) => (
          <section
            key={index}
            className="glass-effect border border-line rounded-2xl p-6 md:p-8 backdrop-blur-xl"
          >
            <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
            {section.paragraphs?.map((paragraph, i) => (
              <p key={`p-${i}`} className="text-fg-muted mb-4 leading-relaxed">
                {paragraph}
              </p>
            ))}
            {section.list && (
              <ul className="list-disc pl-6 mb-4 space-y-2 text-fg-muted">
                {section.list.map((item, i) => (
                  <li key={`l-${i}`}>{item}</li>
                ))}
              </ul>
            )}
            {section.paragraphsAfter?.map((paragraph, i) => (
              <p key={`pa-${i}`} className="text-fg-muted mb-4 leading-relaxed">
                {paragraph}
              </p>
            ))}
            {section.listAfter && (
              <ul className="list-disc pl-6 space-y-2 text-fg-muted">
                {section.listAfter.map((item, i) => (
                  <li key={`la-${i}`}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </>
  );
};

export default LegalDocument;
