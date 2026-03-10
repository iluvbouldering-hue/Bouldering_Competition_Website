import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Search, Copy, Check, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { database } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';

interface Student {
  id: string;
  name: string;
  school: string;
  class: string;
  age: number;
  gender: 'male' | 'female';
  key?: string;
}

interface Score {
  id: string;
  round: string;
  boulder: number;
  at: number | null;
  az: number | null;
  key?: string;
}

interface RankingEntry {
  id: string;
  name: string;
  top: number;
  zone: number;
  at: number;
  az: number;
  gender: 'male' | 'female';
}

type GenderFilter = 'both' | 'male' | 'female';

interface RankingBoardProps {
  showCopyLink?: boolean;
}

export function RankingBoard({ showCopyLink = false }: RankingBoardProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [selectedRound, setSelectedRound] = useState('Qualifier');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('both');
  const [searchQuery, setSearchQuery] = useState('');
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    // Load students from Firebase
    const studentsRef = ref(database, 'students');
    const unsubscribeStudents = onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const studentsList: Student[] = Object.keys(data).map((key) => ({
          ...data[key],
          key,
        }));
        setStudents(studentsList);
        localStorage.setItem('students', JSON.stringify(studentsList));
      } else {
        setStudents([]);
      }
    });

    // Load scores from Firebase
    const scoresRef = ref(database, 'scores');
    const unsubscribeScores = onValue(scoresRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const scoresList: Score[] = Object.keys(data).map((key) => ({
          ...data[key],
          key,
        }));
        setScores(scoresList);
        localStorage.setItem('scores', JSON.stringify(scoresList));
      } else {
        setScores([]);
      }
    });

    return () => {
      unsubscribeStudents();
      unsubscribeScores();
    };
  }, []);

  useEffect(() => {
    calculateRanking();
  }, [selectedRound, scores, students, genderFilter]);

  const calculateRanking = () => {
    const summary: { [key: string]: RankingEntry } = {};

    scores
      .filter((s) => s.round === selectedRound)
      .forEach((s) => {
        if (!summary[s.id]) {
          const student = students.find((st) => st.id === s.id);
          if (!student) return;

          summary[s.id] = {
            id: s.id,
            name: student.name,
            top: 0,
            zone: 0,
            at: 0,
            az: 0,
            gender: student.gender || 'male',
          };
        }

        // Count TOP if AT exists
        if (s.at !== null && s.at !== undefined) {
          summary[s.id].top += 1;
          summary[s.id].at += s.at;
        }

        // Count ZONE if AZ exists
        if (s.az !== null && s.az !== undefined) {
          summary[s.id].zone += 1;
          summary[s.id].az += s.az;
        }
      });

    let result = Object.values(summary);

    // Filter by gender
    if (genderFilter !== 'both') {
      result = result.filter((entry) => entry.gender === genderFilter);
    }

    // IFSC sorting: Top (desc), Zone (desc), AT (asc), AZ (asc)
    result.sort((a, b) => {
      if (b.top !== a.top) return b.top - a.top;
      if (b.zone !== a.zone) return b.zone - a.zone;
      if (a.at !== b.at) return a.at - b.at;
      return a.az - b.az;
    });

    setRanking(result);
  };

  const filteredRanking = ranking.filter((entry) =>
    entry.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const maleRanking = ranking.filter((entry) => entry.gender === 'male');
  const femaleRanking = ranking.filter((entry) => entry.gender === 'female');

  const getRankDisplay = (index: number, list: RankingEntry[]) => {
    if (index === 0) return { rank: 1 };

    const current = list[index];
    const prev = list[index - 1];

    if (
      current.top === prev.top &&
      current.zone === prev.zone &&
      current.at === prev.at &&
      current.az === prev.az
    ) {
      // Same rank as previous
      return getRankDisplay(index - 1, list);
    }

    return { rank: index + 1 };
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-br from-slate-300 to-slate-500 text-white';
    if (rank === 3) return 'bg-gradient-to-br from-amber-500 to-amber-700 text-white';
    return 'bg-slate-100 text-slate-700';
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/ranking-only`;
    
    // Fallback method that works without Clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      textArea.remove();
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      textArea.remove();
      // Fallback: show the URL in an alert
      alert(`Copy this link: ${url}`);
    }
  };

  const renderRankingTable = (rankingList: RankingEntry[], title?: string) => {
    if (rankingList.length === 0) {
      return (
        <div className="text-center py-12 text-slate-500">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-lg">No results{title ? ` for ${title}` : ''} in this round yet</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto -mx-6 md:mx-0">
        <div className="inline-block min-w-full align-middle">
          {title && (
            <div className="px-6 py-3 bg-slate-50 border-b-2 border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5" />
                {title}
              </h3>
            </div>
          )}
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="px-4 py-3 text-left font-bold text-slate-700">Rank</th>
                <th className="px-4 py-3 text-left font-bold text-slate-700">ID</th>
                <th className="px-4 py-3 text-left font-bold text-slate-700">Name</th>
                <th className="px-4 py-3 text-center font-bold text-slate-700">T</th>
                <th className="px-4 py-3 text-center font-bold text-slate-700">Z</th>
                <th className="px-4 py-3 text-center font-bold text-slate-700">AT</th>
                <th className="px-4 py-3 text-center font-bold text-slate-700">AZ</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {rankingList.map((entry, index) => {
                  const { rank } = getRankDisplay(index, rankingList);
                  const icon = getRankIcon(rank);
                  const badgeColor = getRankBadgeColor(rank);
                  const isHighlighted = searchQuery && entry.name.toLowerCase().includes(searchQuery.toLowerCase());

                  return (
                    <motion.tr
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{
                        layout: { duration: 0.5, type: 'spring', stiffness: 100, damping: 20 },
                        opacity: { duration: 0.3 },
                        y: { duration: 0.3 }
                      }}
                      className={`border-b border-slate-100 transition-colors ${
                        isHighlighted
                          ? 'bg-amber-50 hover:bg-amber-100'
                          : rank <= 3
                          ? 'bg-slate-50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-4">
                        <motion.div 
                          className="flex items-center gap-2"
                          layout="position"
                          transition={{ duration: 0.3 }}
                        >
                          <motion.span
                            layout
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg ${badgeColor} shadow-sm`}
                            transition={{ duration: 0.3 }}
                          >
                            {rank}
                          </motion.span>
                          {icon && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ duration: 0.4, type: 'spring' }}
                            >
                              {icon}
                            </motion.div>
                          )}
                        </motion.div>
                      </td>
                      <td className="px-4 py-4 font-mono text-sm text-slate-600">{entry.id}</td>
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {entry.name}
                        {isHighlighted && (
                          <motion.span 
                            className="ml-2 text-xs text-amber-600 font-normal"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            (Search Match)
                          </motion.span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <motion.span 
                          className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 font-bold"
                          key={`top-${entry.id}-${entry.top}`}
                          initial={{ scale: 1 }}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.4 }}
                        >
                          {entry.top}
                        </motion.span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <motion.span 
                          className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 text-amber-700 font-bold"
                          key={`zone-${entry.id}-${entry.zone}`}
                          initial={{ scale: 1 }}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.4 }}
                        >
                          {entry.zone}
                        </motion.span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <motion.span 
                          className="inline-flex items-center justify-center min-w-[2.5rem] h-10 px-2 rounded-lg bg-emerald-50 text-emerald-600 font-semibold text-sm"
                          key={`at-${entry.id}-${entry.at}`}
                          initial={{ scale: 1 }}
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ duration: 0.3 }}
                        >
                          {entry.at}
                        </motion.span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <motion.span 
                          className="inline-flex items-center justify-center min-w-[2.5rem] h-10 px-2 rounded-lg bg-amber-50 text-amber-600 font-semibold text-sm"
                          key={`az-${entry.id}-${entry.az}`}
                          initial={{ scale: 1 }}
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ duration: 0.3 }}
                        >
                          {entry.az}
                        </motion.span>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Student Ranking</h2>

            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-700">Round:</label>
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
              >
                <option value="Qualifier">Qualifier</option>
                <option value="Semi Final">Semi Final</option>
                <option value="Final">Final</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Gender Filter */}
            <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setGenderFilter('both')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                  genderFilter === 'both'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Both
              </button>
              <button
                onClick={() => setGenderFilter('male')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                  genderFilter === 'male'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Male
              </button>
              <button
                onClick={() => setGenderFilter('female')}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                  genderFilter === 'female'
                    ? 'bg-pink-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Female
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Copy Link Button */}
            {showCopyLink && (
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors shadow-md"
              >
                {linkCopied ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Ranking Link
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {ranking.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-lg">No results for this round yet</p>
          </div>
        ) : genderFilter === 'both' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border-2 border-blue-200 rounded-lg overflow-hidden">
              {renderRankingTable(maleRanking, 'Male Category')}
            </div>
            <div className="bg-white border-2 border-pink-200 rounded-lg overflow-hidden">
              {renderRankingTable(femaleRanking, 'Female Category')}
            </div>
          </div>
        ) : (
          renderRankingTable(filteredRanking)
        )}
      </div>

      <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl shadow-lg p-6 text-white">
        <h3 className="text-lg font-bold mb-3">Scoring Legend</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">T:</span>
            <span>Number of Tops</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Z:</span>
            <span>Number of Zones</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">AT:</span>
            <span>Attempts to Top</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">AZ:</span>
            <span>Attempts to Zone</span>
          </div>
        </div>
      </div>
    </>
  );
}