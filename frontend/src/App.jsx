import { useEffect, useState } from 'react'
import './App.css'

const API_BASE = 'http://localhost:4000/api/v1'

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result?.error?.message || 'Something went wrong')
  }

  return result.data
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      onLogin(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="visual-overlay" />

        <div className="visual-content">
          <div className="brand-mark">A</div>

          <p className="eyebrow">SPORTS NETWORKING PLATFORM</p>

          <h1>
            Connect.
            <br />
            Train.
            <br />
            <span>Compete.</span>
          </h1>

          <p className="visual-description">
            Discover athletes, connect with coaches, find opportunities,
            and grow your sports journey — all in one place.
          </p>

          <div className="visual-stats">
            <div>
              <strong>10+</strong>
              <span>Sports</span>
            </div>

            <div>
              <strong>15+</strong>
              <span>Localities</span>
            </div>

            <div>
              <strong>1</strong>
              <span>Community</span>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-container">
          <div className="mobile-brand">
            <div className="brand-mark small">A</div>
            <span>ATHLINK</span>
          </div>

          <div className="auth-header">
            <p className="eyebrow">WELCOME BACK</p>
            <h2>Sign in to ATHLINK</h2>
            <p>Continue your journey with the sports community.</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <label htmlFor="email">Email address</label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <div className="password-label">
              <label htmlFor="password">Password</label>

              <button type="button" className="forgot-button">
                Forgot password?
              </button>
            </div>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {error && <div className="login-error">{error}</div>}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="auth-divider">
            <span>ATHLINK</span>
          </div>

          <p className="signup-text">
            New to ATHLINK?{' '}
            <button type="button">Create an account</button>
          </p>

          <p className="demo-hint">
            Demo accounts are available for Player, Coach,
            Organization and Admin roles.
          </p>
        </div>
      </section>
    </main>
  )
}

function Dashboard({ user, onLogout }) {
  const [profile, setProfile] = useState(null)
  const [coaches, setCoaches] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [profileData, coachesData, eventsData] = await Promise.all([
          apiRequest('/profile/me'),
          apiRequest('/discovery/coaches'),
          apiRequest('/events?upcoming=true'),
        ])

        setProfile(profileData)
        setCoaches(coachesData)
        setEvents(eventsData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const displayName =
    profile?.fullName ||
    profile?.name ||
    user.email.split('@')[0]

  const roleLabel = user.role?.toLowerCase()

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark sidebar-logo">A</div>
          <span>ATHLINK</span>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active">
            <span>⌂</span>
            Dashboard
          </button>

          <button className="nav-item">
            <span>⌕</span>
            Discover
          </button>

          <button className="nav-item">
            <span>◫</span>
            Events
          </button>

          <button className="nav-item">
            <span>⇄</span>
            Training
          </button>

          <button className="nav-item">
            <span>◎</span>
            Profile
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item">
            <span>⚙</span>
            Settings
          </button>

          <button className="nav-item logout" onClick={onLogout}>
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="dashboard">
        <header className="topbar">
          <div>
            <span className="topbar-mobile-brand">ATHLINK</span>
          </div>

          <div className="topbar-user">
            <button className="notification-button">♢</button>

            <div className="user-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="user-info">
              <strong>{displayName}</strong>
              <span>{roleLabel}</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <section className="welcome-section">
            <div>
              <p className="eyebrow dark">YOUR SPORTS JOURNEY</p>
              <h1>Good evening, {displayName} 👋</h1>
              <p>
                Here's what's happening in your sports community.
              </p>
            </div>
          </section>

          {error && (
            <div className="dashboard-error">
              {error}
            </div>
          )}

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon green">⚽</div>
              <div>
                <span>Your role</span>
                <strong>{user.role}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue">👥</div>
              <div>
                <span>Coaches nearby</span>
                <strong>{loading ? '—' : coaches.length}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">🏆</div>
              <div>
                <span>Upcoming events</span>
                <strong>{loading ? '—' : events.length}</strong>
              </div>
            </div>
          </section>

          <div className="dashboard-columns">
            <section className="content-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow dark">DISCOVER</p>
                  <h2>Nearby coaches</h2>
                </div>

                <button className="text-button">
                  View all →
                </button>
              </div>

              {loading ? (
                <div className="empty-card">
                  Loading coaches...
                </div>
              ) : coaches.length === 0 ? (
                <div className="empty-card">
                  <strong>No coaches found yet.</strong>
                  <span>
                    Coach profiles will appear here when available.
                  </span>
                </div>
              ) : (
                <div className="coach-grid">
                  {coaches.slice(0, 3).map((coach) => (
                    <article className="coach-card" key={coach.user_id}>
                      <div className="coach-top">
                        <div className="coach-avatar">
                          {coach.full_name?.charAt(0) || 'C'}
                        </div>

                        {coach.is_verified && (
                          <span className="verified">✓</span>
                        )}
                      </div>

                      <h3>{coach.full_name}</h3>

                      <p className="coach-sport">
                        {coach.sport_name || 'Sports Coach'}
                      </p>

                      <p className="coach-location">
                        📍 {coach.locality_name || 'Vadodara'}
                      </p>

                      <button className="outline-button">
                        View profile
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="content-section events-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow dark">OPPORTUNITIES</p>
                  <h2>Upcoming events</h2>
                </div>

                <button className="text-button">
                  View all →
                </button>
              </div>

              {loading ? (
                <div className="empty-card">
                  Loading events...
                </div>
              ) : events.length === 0 ? (
                <div className="empty-card">
                  <strong>No upcoming events.</strong>
                  <span>
                    New sports opportunities will appear here.
                  </span>
                </div>
              ) : (
                <div className="event-list">
                  {events.slice(0, 3).map((event) => (
                    <article className="event-card" key={event.id}>
                      <div className="event-date">
                        <strong>
                          {new Date(event.starts_at).getDate()}
                        </strong>
                        <span>
                          {new Date(event.starts_at).toLocaleString(
                            'en-US',
                            { month: 'short' },
                          )}
                        </span>
                      </div>

                      <div className="event-details">
                        <span className="event-category">
                          {event.category}
                        </span>

                        <h3>{event.title}</h3>

                        <p>
                          🕐{' '}
                          {new Date(event.starts_at).toLocaleTimeString(
                            'en-IN',
                            {
                              hour: 'numeric',
                              minute: '2-digit',
                            },
                          )}
                          {'  '}•{'  '}
                          📍 {event.locality_name || 'Vadodara'}
                        </p>
                      </div>

                      <button className="event-arrow">→</button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)

  function handleLogout() {
    setUser(null)
  }

  if (!user) {
    return <Login onLogin={setUser} />
  }

  return <Dashboard user={user} onLogout={handleLogout} />
}

export default App