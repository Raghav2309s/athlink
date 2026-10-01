import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'

function Discover({ onOpenCoach }) {
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCoaches() {
      try {
        const data = await apiRequest('/discovery/coaches')
        setCoaches(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadCoaches()
  }, [])

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow dark">DISCOVER</p>
          <h1>Find your coach</h1>
          <p>
            Connect with coaches and sports professionals in
            the ATHLINK community.
          </p>
        </div>
      </div>

      <div className="discover-toolbar">
        <div className="discover-search">
          <span>⌕</span>
          <input
            type="text"
            placeholder="Search coaches..."
          />
        </div>

        <button className="discover-filter">
          ⚽ All sports ▾
        </button>

        <button className="discover-filter">
          📍 All locations ▾
        </button>
      </div>

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="empty-card large">
          <strong>Finding coaches...</strong>
          <span>
            Searching the ATHLINK sports network.
          </span>
        </div>
      ) : coaches.length === 0 ? (
        <div className="empty-card large">
          <strong>No coaches found</strong>
          <span>
            Coach profiles will appear here when available.
          </span>
        </div>
      ) : (
        <>
          <div className="discover-result-header">
            <span>
              {coaches.length} coach
              {coaches.length === 1 ? '' : 'es'} found
            </span>
          </div>

          <div className="discover-grid">
            {coaches.map((coach) => (
              <article
                className="discover-coach-card"
                key={coach.user_id}
              >
                <div className="discover-coach-header">
                  <div className="discover-avatar">
                    {coach.full_name?.charAt(0) || 'C'}
                  </div>

                  {coach.is_verified && (
                    <span className="verified-badge">
                      ✓ Verified
                    </span>
                  )}
                </div>

                <h2>{coach.full_name}</h2>

                <p className="discover-sport">
                  {coach.sport_name || 'Sports Coach'}
                </p>

                <div className="discover-meta">
                  <span>
                    📍 {coach.locality_name || 'Vadodara'}
                  </span>

                  {coach.experience_years !== null &&
                    coach.experience_years !== undefined && (
                      <span>
                        ◷ {coach.experience_years} years
                      </span>
                    )}
                </div>

                {coach.rating !== null &&
                  coach.rating !== undefined && (
                    <div className="discover-rating">
                      ★ {Number(coach.rating).toFixed(1)}
                    </div>
                  )}

                {coach.academy_name && (
                  <p className="academy-name">
                    {coach.academy_name}
                  </p>
                )}

                <button
                  className="discover-profile-button"
                  onClick={() => onOpenCoach(coach)}
                >
                  View profile →
                </button>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default Discover