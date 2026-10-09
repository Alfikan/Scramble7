import { useState, useEffect } from 'react'
import { Trophy } from 'lucide-react'
import { getRoomLeaderboard } from '../services/quizService'
import { getUser } from '../services/userService'
import Loading from './Loading'
import styles from './Leaderboard.module.css'

/**
 * Leaderboard
 *
 * Fetches and renders quiz results for all members of a room,
 * sorted by average score descending.
 *
 * Props:
 *   roomId — string
 */
export default function Leaderboard({ roomId }) {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!roomId) return
    setLoading(true)

    getRoomLeaderboard(roomId)
      .then(async (rawRows) => {
        // Enrich each row with the user's display name from Firestore
        const enriched = await Promise.all(
          rawRows.map(async (row) => {
            const profile = await getUser(row.userId)
            return { ...row, displayName: profile?.displayName || 'Unknown' }
          })
        )
        setRows(enriched)
        setLoading(false)
      })
      .catch((err) => {
        console.error('[Leaderboard] failed to load:', err)
        setError('Could not load leaderboard. Check your connection.')
        setLoading(false)
      })
  }, [roomId])

  if (loading) {
    return (
      <div className={styles.centered}>
        <Loading size="md" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.centered}>
        <p className={styles.errorText}>{error}</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className={styles.centered}>
        <Trophy size={28} className={styles.emptyIcon} aria-hidden="true" />
        <p className={styles.emptyTitle}>No quiz results yet</p>
        <p className={styles.emptyText}>
          Generate and complete a quiz to appear on the leaderboard.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.leaderboard}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>#</th>
              <th className={styles.th}>Student</th>
              <th className={styles.thRight}>Quizzes</th>
              <th className={styles.thRight}>Avg Score</th>
              <th className={styles.thRight}>Best</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              // Determine rank — same rank if tied on avgPct
              const rank = i > 0 && rows[i - 1].avgPct === row.avgPct
                ? null   // tied with previous
                : i + 1

              return (
                <tr key={row.userId} className={styles.tr}>
                  <td className={styles.tdRank}>
                    {rank === 1
                      ? <span className={styles.goldMedal}>🥇</span>
                      : rank === 2
                        ? <span className={styles.silverMedal}>🥈</span>
                        : rank === 3
                          ? <span className={styles.bronzeMedal}>🥉</span>
                          : <span className={styles.rankNum}>{rank ?? '='}</span>
                    }
                  </td>
                  <td className={styles.td}>
                    <div className={styles.studentCell}>
                      <span className={styles.avatar}>
                        {row.displayName[0]?.toUpperCase() || '?'}
                      </span>
                      <span className={styles.name}>{row.displayName}</span>
                    </div>
                  </td>
                  <td className={styles.tdRight}>{row.quizzesCompleted}</td>
                  <td className={styles.tdRight}>
                    <span className={styles.pctBadge}>{row.avgPct}%</span>
                  </td>
                  <td className={styles.tdRight}>{row.bestPct}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
