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
  lastUpdated: "Last Updated: October 2, 2026",
  intro: "Relay Chess is built to keep as little about you as possible. Here is everything we store and how long we keep it.",
  sections: [
  {
    "title": "1. No accounts",
    "paragraphs": [
      "Relay Chess has no accounts and no sign-in. When you first visit, the server gives your browser a random player id and a nickname, stored in your browser for up to 30 days. Clearing your site data resets it. We never ask for your name, email or password to play."
    ]
  },
  {
    "title": "2. What we keep, and for how long",
    "list": [
      "Finished games: moves, nicknames and player ids, so review links work. Deleted automatically after 30 days.",
      "Leaderboard scores: wins, losses and draws per nickname for the current day and week. Deleted automatically about a day after the period ends.",
      "Games in progress and room chat: held in server memory only, and gone when the room closes or the server restarts.",
      "Contact form: the name, email and message you send us, so we can reply.",
      "Your theme and board color: stored only in your browser."
    ]
  },
  {
    "title": "3. Analytics",
    "paragraphs": [
      "We use privacy-friendly page analytics (Vercel Analytics) to see which pages are used. If Google Analytics is enabled on this deployment, it records anonymous usage events. We do not sell, rent or share your data for advertising."
    ]
  },
  {
    "title": "4. Children",
    "paragraphs": [
      "Relay Chess does not knowingly collect personal information from children under 13. Because we don't ask for personal information to play, the only way we'd receive any is through the contact form. If a child has contacted us, ask us and we'll delete it."
    ]
  },
  {
    "title": "5. Your choices",
    "list": [
      "Clear your browser's site data for Relay Chess to drop your player id and nickname.",
      "Ask us through the contact page to delete a message you sent.",
      "Everything else expires on its own as described above."
    ]
  },
  {
    "title": "6. Open source",
    "paragraphs": [
      "The code that runs Relay Chess is open source, so you can check exactly what is stored. Other people may run their own copies; this policy covers the copy at relaychess.com."
    ]
  },
  {
    "title": "7. Changes",
    "paragraphs": [
      "We may update this policy. The date at the top shows when it last changed."
    ]
  }
] as LegalSection[],
};

const TERMS_LEGAL = {
  title: "Terms of",
  titleAccent: "Service",
  lastUpdated: "Last Updated: October 2, 2026",
  sections: [
  {
    "title": "1. Acceptance of terms",
    "paragraphs": [
      "By using Relay Chess at relaychess.com you agree to these terms. If you don't agree, please don't use the service."
    ]
  },
  {
    "title": "2. Open source",
    "paragraphs": [
      "The Relay Chess software is open source under the MIT License, which governs your use of the code. These terms cover the hosted service at relaychess.com."
    ]
  },
  {
    "title": "3. Nicknames",
    "paragraphs": [
      "You can pick any nickname, and names aren't reserved. Don't impersonate other people or use names that are hateful or harassing. We may remove names or scores that break these rules."
    ]
  },
  {
    "title": "4. Code of conduct",
    "paragraphs": [
      "Be kind in chat. Don't harass, abuse or threaten other players. The leaderboard is just for fun, but don't use bots, engines or exploits against other people."
    ]
  },
  {
    "title": "5. Disclaimer",
    "paragraphs": [
      "Relay Chess is provided \"as is\" without warranties of any kind. Games in progress can end if the server restarts, and leaderboards and saved games are deleted on a schedule."
    ]
  },
  {
    "title": "6. Limitation of liability",
    "paragraphs": [
      "To the extent the law allows, Relay Chess and its contributors are not liable for any damages arising from the use of, or inability to use, the service."
    ]
  },
  {
    "title": "7. Changes",
    "paragraphs": [
      "We may revise these terms. The date at the top shows when they last changed, and continuing to use the service means you accept the current version."
    ]
  },
  {
    "title": "8. Contact",
    "paragraphs": [
      "Questions? Use the contact page."
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
