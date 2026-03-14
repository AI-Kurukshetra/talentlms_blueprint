import { LeaderboardBoard } from "@/components/learner/leaderboard-board"
import { getLearnerLeaderboardData } from "@/lib/learner/data"

export default async function LearnerLeaderboardPage() {
  const data = await getLearnerLeaderboardData()

  return (
    <LeaderboardBoard
      viewerId={data.viewer.id}
      allTime={data.allTime}
      weekly={data.weekly}
      allTimeRank={data.allTimeRank}
      weeklyRank={data.weeklyRank}
    />
  )
}
