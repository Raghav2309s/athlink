import { useEffect, useState } from 'react'
import { apiRequest } from '../api/client'

function Training({ user }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState(null)

  async function loadRequests() {
    try {
      setError('')

      const data = await apiRequest('/training-requests')
      setRequests(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  async function updateRequest(id, status) {
    setActionId(id)
    setError('')

    try {
      await apiRequest(`/training-requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })

      await loadRequests()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionId(null)
    }
  }

  const isCoach = user.role === 'COACH'

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow dark">TRAINING</p>

          <h1>
            {isCoach
              ? 'Training requests'
              : 'Your training connections'}
          </h1>

          <p>
            {isCoach
              ? 'Review players who want to train with you.'
              : 'Track your coaching requests and connections.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="empty-card large">
          <strong>Loading requests...</strong>
          <span>
            Checking your ATHLINK training connections.
          </span>
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-card large">
          <div className="empty-icon">⇄</div>

          <strong>
            {isCoach
              ? 'No training requests yet'
              : 'No training requests yet'}
          </strong>

          <span>
            {isCoach
              ? 'New player requests will appear here.'
              : 'Visit Discover to connect with a coach.'}
          </span>
        </div>
      ) : (
        <div className="training-list">
          {requests.map((request) => {
            const personName = isCoach
              ? request.player_name
              : request.coach_name

            const requestedDate = new Date(
              request.requested_at,
            )

            return (
              <article
                className="training-card"
                key={request.id}
              >
                <div className="training-avatar">
                  {personName?.charAt(0) || 'A'}
                </div>

                <div className="training-main">
                  <div className="training-title-row">
                    <div>
                      <h2>{personName}</h2>

                      <p>
                        {request.sport_name}
                        {' • '}
                        {isCoach
                          ? 'Player'
                          : 'Coach'}
                      </p>
                    </div>

                    <span
                      className={`status-badge status-${request.status.toLowerCase()}`}
                    >
                      {request.status}
                    </span>
                  </div>

                  {request.message && (
                    <p className="training-message">
                      “{request.message}”
                    </p>
                  )}

                  <div className="training-meta">
                    <span>
                      Requested{' '}
                      {requestedDate.toLocaleDateString(
                        'en-IN',
                        {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        },
                      )}
                    </span>

                    {request.responded_at && (
                      <span>
                        Responded{' '}
                        {new Date(
                          request.responded_at,
                        ).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {isCoach &&
                  request.status === 'PENDING' && (
                    <div className="training-actions">
                      <button
                        className="reject-button"
                        disabled={actionId === request.id}
                        onClick={() =>
                          updateRequest(
                            request.id,
                            'REJECTED',
                          )
                        }
                      >
                        Reject
                      </button>

                      <button
                        className="accept-button"
                        disabled={actionId === request.id}
                        onClick={() =>
                          updateRequest(
                            request.id,
                            'ACCEPTED',
                          )
                        }
                      >
                        {actionId === request.id
                          ? 'Updating...'
                          : 'Accept'}
                      </button>
                    </div>
                  )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Training