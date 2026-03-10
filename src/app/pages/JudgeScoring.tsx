import { useState, useEffect, FormEvent } from 'react';
import { BackButton } from '../components/BackButton';
import { Save, Trash2 } from 'lucide-react';
import { database } from '../lib/firebase';
import { ref, push, update, onValue, remove } from 'firebase/database';

interface Student {
  id: string;
  name: string;
  school: string;
  class: string;
  age: number;
  gender?: 'male' | 'female';
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

export default function JudgeScoring() {
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [round, setRound] = useState('');
  const [boulder, setBoulder] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [az, setAz] = useState<number | null>(null);
  const [at, setAt] = useState<number | null>(null);
  const [selectedScores, setSelectedScores] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

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
    // Reset selectAll when scores change
    if (selectedScores.size === 0) {
      setSelectAll(false);
    } else if (scores.length > 0 && selectedScores.size === scores.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedScores, scores]);

  const recordAttempt = (type: 'fall' | 'zone' | 'top') => {
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    if (type === 'zone' && az === null) {
      setAz(newAttemptCount);
    }

    if (type === 'top') {
      if (az === null) {
        setAz(newAttemptCount);
      }
      if (at === null) {
        setAt(newAttemptCount);
      }
    }
  };

  const resetAttempts = () => {
    setAttemptCount(0);
    setAz(null);
    setAt(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const newScore = {
      id: selectedStudent,
      round,
      boulder: Number(boulder),
      at,
      az,
    };

    const existingScore = scores.find(
      (s) =>
        s.id === newScore.id &&
        s.round === newScore.round &&
        s.boulder === newScore.boulder
    );

    if (existingScore && existingScore.key) {
      if (window.confirm('Score exists. Overwrite?')) {
        const scoreRef = ref(database, `scores/${existingScore.key}`);
        await update(scoreRef, newScore);
      }
    } else {
      const scoresRef = ref(database, 'scores');
      await push(scoresRef, newScore);
    }

    setSelectedStudent('');
    setRound('');
    setBoulder('');
    resetAttempts();
  };

  const getStudentName = (id: string) => {
    const student = students.find((s) => s.id === id);
    return student ? student.name : 'Unknown';
  };

  const handleSelectAll = () => {
    if (selectAll) {
      // Unselect all
      setSelectedScores(new Set());
      setSelectAll(false);
    } else {
      // Select all
      const allKeys = new Set(scores.map((s) => s.key).filter((k): k is string => !!k));
      setSelectedScores(allKeys);
      setSelectAll(true);
    }
  };

  const handleSelectScore = (key: string) => {
    const newSelected = new Set(selectedScores);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedScores(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedScores.size === 0) {
      alert('Please select scores to delete');
      return;
    }

    const count = selectedScores.size;
    if (!window.confirm(`Delete ${count} selected score${count > 1 ? 's' : ''}?`)) {
      return;
    }

    // Delete all selected scores from Firebase
    const deletePromises = Array.from(selectedScores).map((key) => {
      const scoreRef = ref(database, `scores/${key}`);
      return remove(scoreRef);
    });

    await Promise.all(deletePromises);
    setSelectedScores(new Set());
    setSelectAll(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">
            Judge Scoring – Student Category
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Student
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">-- Select Student --</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.id} - {student.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Round
              </label>
              <select
                value={round}
                onChange={(e) => setRound(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">-- Select Round --</option>
                <option value="Qualifier">Qualifier</option>
                <option value="Semi Final">Semi Final</option>
                <option value="Final">Final</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Boulder
              </label>
              <input
                type="number"
                min="1"
                value={boulder}
                onChange={(e) => setBoulder(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div className="bg-slate-50 rounded-lg p-6 space-y-3">
              <div className="text-lg font-bold text-slate-900">
                Attempts: <span className="text-emerald-600">{attemptCount}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-lg">
                <div>
                  <span className="font-semibold text-slate-700">AZ:</span>{' '}
                  <span className="font-bold text-amber-600">
                    {az ?? '-'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">AT:</span>{' '}
                  <span className="font-bold text-emerald-600">
                    {at ?? '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => recordAttempt('fall')}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                Fall
              </button>
              <button
                type="button"
                onClick={() => recordAttempt('zone')}
                className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                Zone
              </button>
              <button
                type="button"
                onClick={() => recordAttempt('top')}
                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                Top
              </button>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              <Save className="w-5 h-5" />
              Save Score
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="mr-2"
                    />
                    ID
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-slate-700">
                    Name
                  </th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-slate-700 hidden sm:table-cell">
                    Round
                  </th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-slate-700">
                    Boulder
                  </th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-slate-700">
                    AT
                  </th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-slate-700">
                    AZ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {scores.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No scores recorded yet
                    </td>
                  </tr>
                ) : (
                  scores.map((score) => (
                    <tr
                      key={score.key}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-3 py-3 text-sm text-slate-900">
                        <input
                          type="checkbox"
                          checked={selectedScores.has(score.key || '')}
                          onChange={() => handleSelectScore(score.key || '')}
                          className="mr-2"
                        />
                        {score.id}
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-900">
                        {getStudentName(score.id)}
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-600 hidden sm:table-cell">
                        {score.round}
                      </td>
                      <td className="px-3 py-3 text-sm text-center text-slate-900">
                        {score.boulder}
                      </td>
                      <td className="px-3 py-3 text-sm text-center font-semibold text-emerald-600">
                        {score.at ?? '-'}
                      </td>
                      <td className="px-3 py-3 text-sm text-center font-semibold text-amber-600">
                        {score.az ?? '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {scores.length > 0 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
              <div className="text-sm text-slate-600">
                {selectedScores.size > 0 ? (
                  <span className="font-semibold">
                    {selectedScores.size} score{selectedScores.size > 1 ? 's' : ''} selected
                  </span>
                ) : (
                  <span>No scores selected</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={selectedScores.size === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg disabled:shadow-none"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}