import { useState } from 'react'
import { apiRequest } from '../api/client'

function CoachProfile({ coach, onBack, user }) {
  const [requesting, setRequesting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleRequestTraining() {
    setRequesting(true)
    setMessage('')
    setError('')

    try {
      await apiRequest('/training-requests', {
        method: 'POST',
        body: JSON.stringify({
          coachUserId: coach.user_id,
          sportId: coach.sport_id,
          message:
            'I would like to request training through ATHLINK.',
        }),
      })

      setMessage(
        'Training request sent successfully.',
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div className="page-content">
      <button className="back-button" onClick={onBack}>
        ← Back to discover
      </button>

      <section className="coach-profile-hero">
        <div className="profile-avatar-large">
          {coach.full_name?.charAt(0) || 'C'}
        </div>

        <div className="coach-profile-main">
          <div className="profile-name-row">
            <h1>{coach.full_name}</h1>

            {coach.is_verified && (
              <span className="verified-badge">
                ✓ Verified
              </span>
            )}
          </div>

          <p className="profile-role">
            {coach.sport_name || 'Sports Coach'}
          </p>

          <p className="profile-location">
            📍 {coach.locality_name || 'Vadodara'}
          </p>
        </div>
      </section>

      <div className="coach-profile-grid">
        <main>
          <section className="detail-card">
            <h2>About</h2>

            <p className="event-description">
              {coach.bio ||
                'This coach has not added a biography yet.'}
            </p>
          </section>

          <section className="detail-card">
            <h2>Experience</h2>

            <div className="profile-stat-row">
              <div>
                <span>SPORT</span>
                <strong>
                  {coach.sport_name || 'Not specified'}
                </strong>
              </div>

              <div>
                <span>EXPERIENCE</span>
                <strong>
                  {coach.experience_years !== null &&
                  coach.experience_years !== undefined
                    ? `${coach.experience_years} years`
                    : 'Not specified'}
                </strong>
              </div>

              <div>
                <span>RATING</span>
                <strong>
                  {coach.rating !== null &&
                  coach.rating !== undefined
                    ? `★ ${Number(coach.rating).toFixed(1)}`
                    : 'Not rated'}
                </strong>
              </div>
            </div>
          </section>

          {coach.certification && (
            <section className="detail-card">
              <h2>Certification</h2>

              <p className="event-description">
                {coach.certification}
              </p>
            </section>
          )}
        </main>

        <aside className="profile-action-card">
          <span className="eyebrow dark">
            CONNECT
          </span>

          <h2>Train with this coach</h2>

          <p>
            Send a training request and start your
            connection through ATHLINK.
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

          {user.role === 'PLAYER' ? (
            <button
              className="register-button"
              onClick={handleRequestTraining}
              disabled={requesting || Boolean(message)}
            >
              {requesting
                ? 'Sending...'
                : message
                  ? '✓ Request sent'
                  : 'Request training →'}
            </button>
          ) : (
            <div className="role-message">
              Training requests can be sent by player
              accounts.
            </div>
          )}

          <div className="registration-note">
            <span>🔒</span>
            Your request is securely handled by ATHLINK.
          </div>
        </aside>
      </div>
    </div>
  )
}

export default CoachProfile