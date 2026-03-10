import { BackButton } from '../components/BackButton';
import { RankingBoard } from '../components/RankingBoard';

export default function Ranking() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>
        <RankingBoard showCopyLink={true} />
      </div>
    </div>
  );
}
