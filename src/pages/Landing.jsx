import { Link } from 'react-router-dom'
import { Users, MessageSquare, Brain, CheckCircle, Circle } from 'lucide-react'
import Button from '../components/Button'
import styles from './Landing.module.css'

export default function Landing() {
  return (
    <div className={styles.page}>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>

          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              Free to use · No credit card required
            </div>
            <h1 className={styles.heroHeadline}>
              Study together.<br />
              <span className={styles.heroAccent}>Learn smarter.</span>
            </h1>
            <p className={styles.heroDescription}>
              Create collaborative study rooms, chat with your group in real time,
              and generate AI-powered quizzes to test what you actually know.
            </p>
            <div className={styles.heroCtas}>
              <Button as={Link} to="/signup" size="lg">
                Get Started — it&apos;s free
              </Button>
              <Button as={Link} to="/login" variant="secondary" size="lg">
                Sign in
              </Button>
            </div>
            <ul className={styles.heroProof}>
              <li><CheckCircle size={14} /><span>Collaborative study rooms</span></li>
              <li><CheckCircle size={14} /><span>Real-time chat</span></li>
              <li><CheckCircle size={14} /><span>AI quiz generation</span></li>
            </ul>
          </div>

          {/* Product preview */}
          <div className={styles.heroVisual} aria-hidden="true">
            <div className={styles.previewWindow}>
              <div className={styles.previewBar}>
                <span className={styles.previewDot} style={{ background: '#ef4444' }} />
                <span className={styles.previewDot} style={{ background: '#f59e0b' }} />
                <span className={styles.previewDot} style={{ background: '#22c55e' }} />
                <span className={styles.previewTitle}>📚 Biology Midterms</span>
                <span className={styles.previewBadge}>4 members</span>
              </div>

              <div className={styles.previewBody}>
                {/* Sidebar */}
                <div className={styles.previewSidebar}>
                  <p className={styles.previewSidebarLabel}>MEMBERS</p>
                  <div className={styles.previewMember}>
                    <span className={styles.previewAvatar}>A</span>
                    <div>
                      <p className={styles.previewMemberName}>Aman</p>
                      <p className={styles.previewOnline}>● Online</p>
                    </div>
                  </div>
                  <div className={styles.previewMember}>
                    <span className={styles.previewAvatar}>S</span>
                    <div>
                      <p className={styles.previewMemberName}>Sara</p>
                      <p className={styles.previewOnline}>● Online</p>
                    </div>
                  </div>
                  <div className={styles.previewMember}>
                    <span className={styles.previewAvatar}>R</span>
                    <div>
                      <p className={styles.previewMemberName}>Rahul</p>
                      <p className={styles.previewOffline}>○ Offline</p>
                    </div>
                  </div>
                </div>

                {/* Chat */}
                <div className={styles.previewChat}>
                  <div className={styles.previewMessages}>
                    <div className={styles.previewMsg}>
                      <span className={styles.previewMsgSender}>Aman</span>
                      <div className={styles.previewBubble}>Can we quiz on Chapter 5?</div>
                    </div>
                    <div className={styles.previewMsg}>
                      <span className={styles.previewMsgSender}>Sara</span>
                      <div className={styles.previewBubbleAccent}>Generating quiz now…</div>
                    </div>
                    <div className={styles.previewMsg}>
                      <span className={styles.previewMsgSender}>Aman</span>
                      <div className={styles.previewBubble}>Ready! 5 questions 🎯</div>
                    </div>
                  </div>
                  <div className={styles.previewInput}>
                    <span className={styles.previewInputText}>Type a message…</span>
                  </div>
                </div>
              </div>

              {/* Quiz bar at bottom */}
              <div className={styles.previewQuizBar}>
                <Brain size={14} style={{ color: 'var(--color-accent)' }} />
                <span className={styles.previewQuizText}>AI Quiz ready — 5 questions on Cell Biology</span>
                <span className={styles.previewQuizBtn}>Start Quiz</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section className={styles.features}>
        <div className="container">
          <div className={styles.featuresHeader}>
            <h2 className={styles.featuresTitle}>
              Everything your study session needs
            </h2>
            <p className={styles.featuresSubtitle}>
              One focused space. No context-switching.
            </p>
          </div>

          <ul className={styles.featureGrid}>
            <FeatureCard
              icon={<Users size={20} />}
              title="Study Rooms"
              description="Create a private room and invite your group with a short code. See who's online and pick up exactly where you left off."
            />
            <FeatureCard
              icon={<MessageSquare size={20} />}
              title="Real-time Chat"
              description="Messages sync instantly for everyone in the room. Coordinate your session without leaving the page."
            />
            <FeatureCard
              icon={<Circle size={20} />}
              title="Presence Indicators"
              description="See who's currently online in your room. Know when your study partner joins so you can start together."
            />
            <FeatureCard
              icon={<Brain size={20} />}
              title="AI Quiz Generation"
              description="Enter any topic and Scramble builds a custom multiple-choice quiz powered by Groq. Takes seconds."
            />
            <FeatureCard
              icon={<CheckCircle size={20} />}
              title="Instant Scoring"
              description="Answer questions and get your score immediately. See exactly which questions you got right and why."
            />
            <FeatureCard
              icon={<Users size={20} />}
              title="Shared Quizzes"
              description="Quizzes belong to your room. Everyone in the group can take the same quiz and compare their knowledge."
            />
          </ul>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className={styles.howItWorks}>
        <div className="container">
          <div className={styles.featuresHeader}>
            <h2 className={styles.featuresTitle}>How it works</h2>
            <p className={styles.featuresSubtitle}>
              From login to quiz results in under two minutes.
            </p>
          </div>

          <ol className={styles.steps}>
            <Step num="1" title="Create or join a room" description="Start a room for your study group or enter a shared code from a friend." />
            <Step num="2" title="Chat in real time"     description="Coordinate your session, share what you're working on, and see who's online." />
            <Step num="3" title="Generate a quiz"       description="Pick a topic and difficulty. Groq AI builds a custom quiz in seconds." />
            <Step num="4" title="See your results"      description="Get your score, review the explanations, and identify gaps in your knowledge." />
          </ol>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaBox}>
            <h2 className={styles.ctaTitle}>Ready to study smarter?</h2>
            <p className={styles.ctaDesc}>
              Free to use. No credit card. No setup.
            </p>
            <div className={styles.ctaButtons}>
              <Button as={Link} to="/signup" size="lg">
                Create your account
              </Button>
              <Button as={Link} to="/login" variant="secondary" size="lg">
                Sign in
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerInner}>
            <span className={styles.footerBrand}>Scramble</span>
            <span className={styles.footerCopy}>
              A collaborative study platform.
            </span>
          </div>
        </div>
      </footer>

    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────── */

function FeatureCard({ icon, title, description }) {
  return (
    <li className={styles.featureCard}>
      <div className={styles.featureIcon} aria-hidden="true">{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDesc}>{description}</p>
    </li>
  )
}

function Step({ num, title, description }) {
  return (
    <li className={styles.step}>
      <div className={styles.stepNum}>{num}</div>
      <div className={styles.stepContent}>
        <h3 className={styles.stepTitle}>{title}</h3>
        <p className={styles.stepDesc}>{description}</p>
      </div>
    </li>
  )
}
