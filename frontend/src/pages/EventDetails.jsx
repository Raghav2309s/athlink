import { useState } from 'react'
import { apiRequest } from '../api/client'

function EventDetails({ event, onBack, user }) {
  const [registering, setRegistering] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleRegister() {
    setRegistering(true)
    setMessage('')
    setError('')

    try {
      await apiRequest(`/events/${event.id}/register`, {
        method: 'POST',
      })

      setRegistered(true)
      setMessage('You are successfully registered for this event.')
    } catch (err) {
      if (
        err.message?.toLowerCase().includes('already registered')
      ) {
        setRegistered(true)
        setMessage('You are already registered for this event.')
      } else {
        setError(err.message)
      }
    } finally {
      setRegistering(false)
    }
  }

  const startsAt = new Date(event.starts_at)
  const endsAt = new Date(event.ends_at)

  return (
    <div className="page-content">
      <button className="back-button" onClick={onBack}>
        ← Back to events
      </button>

      <section className="event-detail-hero">
        <div>
          <span className="sport-pill">
            {event.sport_name || 'SPORT'}
          </span>

          <span className="category-pill">
            {event.category}
          </span>

          <h1>{event.title}</h1>

          <p className="event-organizer">
            Hosted by{' '}
            <strong>
              {event.organization_name ||
                'ATHLINK Sports Community'}
            </strong>
          </p>
        </div>
      </section>

      <div className="event-detail-grid">
        <main className="event-detail-main">
          <section className="detail-card">
            <h2>Event details</h2>

            <div className="detail-info-grid">
              <div>
                <span>DATE</span>
                <strong>
                  {startsAt.toLocaleDateString('en-IN', {
                    dateStyle: 'full',
                  })}
                </strong>
              </div>

              <div>
                <span>TIME</span>
                <strong>
                  {startsAt.toLocaleTimeString('en-IN', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}{' '}
                  –{' '}
                  {endsAt.toLocaleTimeString('en-IN', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </strong>
              </div>

              <div>
                <span>LOCATION</span>
                <strong>
                  📍 {event.locality_name || 'Vadodara'}
                </strong>
              </div>

              <div>
                <span>CAPACITY</span>
                <strong>
                  {event.registered_count || 0}
                  {event.capacity
                    ? ` / ${event.capacity}`
                    : ''}{' '}
                  registered
                </strong>
              </div>
            </div>
          </section>

          <section className="detail-card">
            <h2>About this event</h2>

            <p className="event-description">
              {event.description ||
                'Join this sports opportunity and connect with the ATHLINK community.'}
            </p>
          </section>

          {event.eligibility_text && (
            <section className="detail-card">
              <h2>Eligibility</h2>
              <p className="event-description">
                {event.eligibility_text}
              </p>
            </section>
          )}
        </main>

        <aside className="event-registration-card">
          <span className="eyebrow dark">REGISTRATION</span>

          <h2>Join this event</h2>

          <p>
            Reserve your place and connect with other athletes.
          </p>

          {message && (
            <div className="success-message">
              ✓ {message}
            </div>
          )}

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {user.role === 'PLAYER' && !registered ? (
            <button
              className="register-button"
              onClick={handleRegister}
              disabled={registering}
            >
              {registering
                ? 'Registering...'
                : 'Register for event →'}
            </button>
          ) : registered ? (
            <button className="registered-button" disabled>
              ✓ Registered
            </button>
          ) : (
            <div className="role-message">
              Event registration is available for players.
            </div>
          )}

          <div className="registration-note">
            <span>🔒</span>
            Your registration is secured by ATHLINK.
          </div>
        </aside>
      </div>
    </div>
  )
}

export default EventDetails