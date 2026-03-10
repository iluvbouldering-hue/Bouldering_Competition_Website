import { Link } from 'react-router';
import { UserPlus, ClipboardCheck, Trophy } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Bouldering System
          </h1>
          <p className="text-slate-600">Competition Management</p>
        </div>

        <div className="space-y-4">
          <Link
            to="/registration"
            className="flex items-center justify-center gap-3 w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <UserPlus className="w-5 h-5" />
            Register Student
          </Link>

          <Link
            to="/judge"
            className="flex items-center justify-center gap-3 w-full p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <ClipboardCheck className="w-5 h-5" />
            Judging Panel
          </Link>

          <Link
            to="/ranking"
            className="flex items-center justify-center gap-3 w-full p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <Trophy className="w-5 h-5" />
            Ranking Board
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
          <p>Official Competition Management System</p>
        </div>
      </div>
    </div>
  );
}
