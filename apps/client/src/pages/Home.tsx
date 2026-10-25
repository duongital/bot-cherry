import { Link } from "react-router-dom";
import { authClient } from "../lib/auth-client";

const facts = [
  {
    emoji: "🌳",
    title: "A rose by another name",
    body: "Cherries are the fruit of trees in the genus Prunus, which belongs to the rose family (Rosaceae).",
  },
  {
    emoji: "🍬",
    title: "Sweet and sour",
    body: "Most edible cherries fall into two groups: sweet cherries (Prunus avium) and sour cherries (Prunus cerasus).",
  },
  {
    emoji: "🌸",
    title: "Blossom season",
    body: "Cherry blossoms, or sakura, are celebrated in Japan as a symbol of renewal, and hanami picnics date back centuries.",
  },
  {
    emoji: "🗓️",
    title: "A short season",
    body: "Fresh cherries are a late-spring to early-summer treat. Their peak season is short, which makes them feel special.",
  },
  {
    emoji: "💪",
    title: "Small but mighty",
    body: "Cherries provide vitamin C, fiber, potassium, and antioxidant compounds such as anthocyanins.",
  },
  {
    emoji: "😴",
    title: "Nature's nightcap",
    body: "Tart cherries are one of the few foods that naturally contain melatonin, a hormone linked to sleep.",
  },
  {
    emoji: "🌍",
    title: "Grown around the world",
    body: "Turkey, the United States, Chile, and Uzbekistan are among the largest cherry-producing countries.",
  },
  {
    emoji: "🍒",
    title: "The emoji",
    body: "The cherry emoji (🍒) is Unicode U+1F352, added in 2010 as part of Unicode 6.0.",
  },
];

export default function Home() {
  const session = authClient.useSession();

  return (
    <>
      <section className="home-hero">
        <p className="eyebrow">Welcome to bot-cherry</p>
        <h1>
          <span aria-hidden="true">🍒</span> Cherries, but make it bot.
        </h1>
        <p className="home-hero-text">
          bot-cherry is a small AI chat project with a big soft spot for
          cherries. Here are a few facts about the fruit behind the name.
        </p>
        <div className="home-hero-actions">
          {session.data ? (
            <span className="welcome-pill">
              🍒 Signed in as <strong>{session.data.user.email}</strong>
            </span>
          ) : (
            <>
              <Link to="/signup" className="app-btn">
                Create an account
              </Link>
              <Link to="/login" className="app-btn app-btn-ghost">
                Log in
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="facts" aria-labelledby="facts-heading">
        <h2 id="facts-heading">Cherry facts</h2>
        <div className="facts-grid">
          {facts.map((fact) => (
            <article key={fact.title} className="fact-card">
              <span className="fact-emoji" aria-hidden="true">
                {fact.emoji}
              </span>
              <h3>{fact.title}</h3>
              <p>{fact.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
