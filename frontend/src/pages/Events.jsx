import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'

function Events({ onOpenEvent }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await apiRequest('/events?upcoming=true')
        setEvents(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow dark">OPPORTUNITIES</p>
          <h1>Events</h1>
          <p>
            Discover tournaments, training sessions, trials and
            sports opportunities around you.
          </p>
        </div>
      </div>

      <div className="event-filters">
        <button className="filter-button active">All</button>
        <button className="filter-button">Tournaments</button>
        <button className="filter-button">Training</button>
        <button className="filter-button">Trials</button>
        <button className="filter-button">Meetups</button>
      </div>

      {loading && (
        <div className="empty-card">
          <strong>Loading events...</strong>
          <span>Finding upcoming opportunities.</span>
        </div>
      )}

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="empty-card large">
          <strong>No upcoming events</strong>
          <span>
            New sports opportunities will appear here.
          </span>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="events-grid">
          {events.map((event) => (
            <article className="large-event-card" key={event.id}>
              <div className="event-card-banner">
                <span className="sport-pill">
                  {event.sport_name || 'SPORT'}
                </span>

                <span className="category-pill">
                  {event.category}
                </span>
              </div>

              <div className="large-event-body">
                <div className="large-event-date">
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

                <div className="large-event-info">
                  <h2>{event.title}</h2>

                  <p>
                    🕐{' '}
                    {new Date(event.starts_at).toLocaleString(
                      'en-IN',
                      {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      },
                    )}
                  </p>

                  <p>
                    📍 {event.locality_name || 'Vadodara'}
                  </p>

                  <div className="event-capacity">
                    <span>
                      👥 {event.registered_count || 0}
                      {event.capacity
                        ? ` / ${event.capacity}`
                        : ''}{' '}
                      registered
                    </span>

                    {event.capacity && (
                      <div className="capacity-bar">
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              ((event.registered_count || 0) /
                                event.capacity) *
                                100,
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="large-event-footer">
                <span>
                  {event.organization_name ||
                    'ATHLINK Sports Community'}
                </span>

                <button
                  className="primary-small-button"
                  onClick={() => onOpenEvent(event)}
                >
                  View event →
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default Events