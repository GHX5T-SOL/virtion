import { useEffect } from 'react';
import { store } from '../game/store';
import { Wordmark } from './primitives';

const PLATFORM_PILLARS = [
  {
    label: 'Simulation layer',
    title: 'University-ready clinical practice',
    body: 'Synthetic cases let medical students rehearse history taking, examination, investigations, diagnosis, prescribing, counselling, and debrief without patient risk.',
  },
  {
    label: 'Assessment layer',
    title: 'Structured feedback after every case',
    body: 'The simulator captures learner decisions and turns them into a debrief across data gathering, clinical management, and communication.',
  },
  {
    label: 'Research layer',
    title: 'Consent-first compute network',
    body: 'The long-term roadmap is a decentralized device network that can contribute idle compute to protein folding, gene sequencing, and drug-discovery simulations.',
  },
];

const ROADMAP = [
  {
    phase: '01',
    title: '3D clinical simulation',
    body: 'Ship the core doctor-POV consultation loop for medical students, with robust fallback-safe voice and debriefs.',
  },
  {
    phase: '02',
    title: 'Curriculum and institutions',
    body: 'Package specialty modules for universities, skills labs, OSCE preparation, and supervised training cohorts.',
  },
  {
    phase: '03',
    title: 'More disciplines',
    body: 'Extend the case engine into dentistry, veterinary medicine, emergency care, allied health, and non-medical decision training.',
  },
  {
    phase: '04',
    title: 'Biomedical compute rails',
    body: 'Explore consent-first distributed compute for research workloads such as protein folding and drug-discovery simulations.',
  },
];

function CompanyStory() {
  return (
    <section className="fizer-company" aria-label="Fizer company roadmap">
      <div className="fizer-section-heading">
        <div className="fizer-kicker">Platform vision</div>
        <h2>Clinical education first. Biomedical infrastructure next.</h2>
        <p>
          Fizer starts as a high-fidelity education tool for university students. The same simulation, assessment, and consent-first infrastructure can grow into a broader training platform and, later, a research compute network.
        </p>
      </div>

      <div className="fizer-platform-grid">
        {PLATFORM_PILLARS.map((pillar) => (
          <article key={pillar.label} className="fizer-platform-card">
            <span>{pillar.label}</span>
            <h3>{pillar.title}</h3>
            <p>{pillar.body}</p>
          </article>
        ))}
      </div>

      <div className="fizer-network-panel">
        <div>
          <div className="fizer-kicker">Future compute opportunity</div>
          <h2>Idle devices as a consent-first science network.</h2>
        </div>
        <p>
          The long-term opportunity is to let opted-in devices contribute compute to biomedical simulations. That can support protein folding, sequencing workloads, and drug-discovery research while keeping today&apos;s product focused on synthetic education.
        </p>
      </div>

      <div className="fizer-roadmap">
        {ROADMAP.map((item) => (
          <article key={item.phase} className="fizer-roadmap-card">
            <strong>{item.phase}</strong>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SplashScreen() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        store.beginFromSplash();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="screen fizer-page" style={{ overflowY: 'auto' }}>
      <header className="fizer-shell fizer-splash-header">
        <Wordmark size={58} />
      </header>

      <main className="fizer-shell" style={{ padding: 'clamp(18px, 4vw, 46px) 0 46px' }}>
        <section
          className="fizer-hero-grid fizer-hero-grid--dna"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 0.92fr) minmax(320px, 0.82fr)',
            gap: 'clamp(22px, 5vw, 64px)',
            alignItems: 'center',
            minHeight: 'calc(100vh - 180px)',
          }}
        >
          <div className="fizer-home-copy popin" style={{ maxWidth: 670 }}>
            <h1 style={{ fontSize: 'clamp(46px, 7vw, 84px)', lineHeight: 0.94, letterSpacing: 0 }}>
              Practice patient encounters in a 3D clinic.
            </h1>
            <p style={{ margin: '24px 0 0', color: 'var(--ink-2)', fontSize: 'clamp(17px, 2vw, 21px)', lineHeight: 1.58, fontWeight: 650, maxWidth: 620 }}>
              Fizer puts learners into synthetic consultations: accept a patient, examine, order investigations, diagnose, prescribe, and finish with a structured debrief.
            </p>
            <div style={{ marginTop: 34 }}>
              <button
                type="button"
                className="fizer-button fizer-button--primary"
                style={{ minHeight: 54, padding: '14px 24px', fontSize: 16 }}
                onClick={() => store.beginFromSplash()}
              >
                Start Simulation
              </button>
            </div>
          </div>

          <div className="fizer-dna-hero-art popin" aria-hidden="true">
            <div className="fizer-dna-orbit-system">
              <span className="fizer-dna-ring ring-a" />
              <span className="fizer-dna-ring ring-b" />
              <span className="fizer-dna-ring ring-c" />
              <img className="fizer-dna-core" src="/fizer_logo.png" alt="" />
              {Array.from({ length: 12 }, (_, index) => (
                <span key={index} className={`fizer-dna-particle p${index + 1}`} />
              ))}
            </div>
          </div>
        </section>

        <CompanyStory />
      </main>
    </div>
  );
}
