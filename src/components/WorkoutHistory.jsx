
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Plus,
  Trash2,
  Save,
  History,
  Pencil,
  X,
} from 'lucide-react'

const today = () => {
  const date = new Date()
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10)
}

const inputClass =
  'w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2.5 text-sm text-[#F2E8DC] outline-none focus:border-[#FF6B24]'

const newSet = () => ({ reps: '', weight_kg: '' })

const newExercise = () => ({
  exercise_name: '',
  sets: [newSet()],
})

export default function WorkoutHistory() {
    const formRef = useRef(null)
  const { user } = useAuth()

  const [workoutDate, setWorkoutDate] = useState(today())
  const [notes, setNotes] = useState('')
  const [entries, setEntries] = useState([newExercise()])
  const [history, setHistory] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [editingLogId, setEditingLogId] = useState(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadHistory() {
    if (!user?.id) return

    setLoading(true)
    setError('')

    try {
      const { data: logs, error: logsError } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('workout_date', { ascending: false })
        .limit(30)

      if (logsError) throw logsError

      if (!logs?.length) {
        setHistory([])
        return
      }

      const logIds = logs.map((log) => log.id)

      const { data: exerciseRows, error: exerciseError } =
        await supabase
          .from('workout_log_exercises')
          .select('*')
          .in('workout_log_id', logIds)
          .order('sort_order')

      if (exerciseError) throw exerciseError

      const exerciseIds = (exerciseRows || []).map(
        (item) => item.id,
      )

      let setRows = []

      if (exerciseIds.length) {
        const { data, error: setsError } = await supabase
          .from('workout_log_sets')
          .select('*')
          .in('exercise_log_id', exerciseIds)
          .order('set_number')

        if (setsError) throw setsError

        setRows = data || []
      }

      const formatted = logs.map((log) => ({
        ...log,
        exercises: (exerciseRows || [])
          .filter(
            (exercise) => exercise.workout_log_id === log.id,
          )
          .map((exercise) => ({
            ...exercise,
            sets: setRows.filter(
              (set) => set.exercise_log_id === exercise.id,
            ),
          })),
      }))

      setHistory(formatted)
    } catch (err) {
      setError(err.message || 'Could not load workout history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory()
  }, [user?.id])

  function resetForm() {
    setWorkoutDate(today())
    setNotes('')
    setEntries([newExercise()])
    setEditingLogId(null)
  }

  function startEditing(log) {
    setEditingLogId(log.id)
    setWorkoutDate(log.workout_date)
    setNotes(log.notes || '')

    setEntries(
      log.exercises.map((exercise) => ({
        exercise_name: exercise.exercise_name,
        sets: exercise.sets.map((set) => ({
          reps: String(set.reps),
          weight_kg: String(set.weight_kg),
        })),
      })),
    )

    setError('')
    setSuccess('')
   setTimeout(() => {
  formRef.current?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}, 100)
  }

  function cancelEditing() {
    resetForm()
    setError('')
    setSuccess('')
  }

  function updateExercise(index, field, value) {
    setEntries((current) =>
      current.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry,
      ),
    )
  }

  function updateSet(exerciseIndex, setIndex, field, value) {
    setEntries((current) =>
      current.map((entry, i) =>
        i === exerciseIndex
          ? {
              ...entry,
              sets: entry.sets.map((set, j) =>
                j === setIndex
                  ? { ...set, [field]: value }
                  : set,
              ),
            }
          : entry,
      ),
    )
  }

  async function saveWorkout(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!workoutDate) {
      setError('Choose the workout date.')
      return
    }

    if (
      !entries.length ||
      entries.some((entry) => !entry.exercise_name.trim())
    ) {
      setError('Enter a name for every exercise.')
      return
    }

    for (const entry of entries) {
      if (
        !entry.sets.length ||
        entry.sets.some(
          (set) =>
            set.reps === '' ||
            set.weight_kg === '' ||
            Number(set.reps) < 0 ||
            Number(set.weight_kg) < 0 ||
            !Number.isInteger(Number(set.reps)) ||
            !Number.isFinite(Number(set.weight_kg)),
        )
      ) {
        setError('Complete the reps and weight for every set.')
        return
      }
    }

    setSaving(true)

    try {
      if (editingLogId) {
        const exercisesPayload = entries.map((entry) => ({
          exercise_name: entry.exercise_name.trim(),
          sets: entry.sets.map((set) => ({
            reps: Number(set.reps),
            weight_kg: Number(set.weight_kg),
          })),
        }))

        const { error: updateError } = await supabase.rpc(
          'update_workout_log',
          {
            p_workout_log_id: editingLogId,
            p_workout_date: workoutDate,
            p_notes: notes.trim() || null,
            p_exercises: exercisesPayload,
          },
        )

        if (updateError) throw updateError

        resetForm()
        setSuccess('Workout updated successfully.')
      } else {
        const { data: log, error: logError } = await supabase
          .from('workout_logs')
          .insert({
            user_id: user.id,
            workout_date: workoutDate,
            notes: notes.trim() || null,
          })
          .select()
          .single()

        if (logError) throw logError

        const insertedExerciseIds = []

        try {
          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i]

            const { data: exercise, error: exerciseError } =
              await supabase
                .from('workout_log_exercises')
                .insert({
                  workout_log_id: log.id,
                  exercise_name: entry.exercise_name.trim(),
                  sort_order: i,
                })
                .select()
                .single()

            if (exerciseError) throw exerciseError

            insertedExerciseIds.push(exercise.id)

            const setPayload = entry.sets.map((set, index) => ({
              exercise_log_id: exercise.id,
              set_number: index + 1,
              reps: Number(set.reps),
              weight_kg: Number(set.weight_kg),
            }))

            const { error: setError } = await supabase
              .from('workout_log_sets')
              .insert(setPayload)

            if (setError) throw setError
          }
        } catch (insertError) {
          if (insertedExerciseIds.length) {
            await supabase
              .from('workout_log_sets')
              .delete()
              .in('exercise_log_id', insertedExerciseIds)

            await supabase
              .from('workout_log_exercises')
              .delete()
              .in('id', insertedExerciseIds)
          }

          await supabase
            .from('workout_logs')
            .delete()
            .eq('id', log.id)

          throw insertError
        }

        resetForm()
        setSuccess('Workout saved successfully.')
      }

      await loadHistory()
    } catch (err) {
      setError(err.message || 'Could not save this workout.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteWorkout(log) {
    const confirmed = window.confirm(
      'Delete this workout permanently? This will also delete all its exercises and sets.',
    )

    if (!confirmed) return

    setError('')
    setSuccess('')
    setDeletingId(log.id)

    try {
      const { error: deleteError } = await supabase.rpc(
        'delete_workout_log',
        {
          p_workout_log_id: log.id,
        },
      )

      if (deleteError) throw deleteError

      if (editingLogId === log.id) {
        resetForm()
      }

      setSuccess('Workout deleted successfully.')
      await loadHistory()
    } catch (err) {
      setError(err.message || 'Could not delete this workout.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8">
     <section
    ref={formRef}
    className="scroll-mt-6 rounded-2xl border border-white/10 bg-[#1C1C1C] p-6 sm:p-8"
    >
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#FF6B24]">
            Training journal
          </p>

          <h2 className="text-2xl font-black text-[#F2E8DC]">
            {editingLogId ? 'Edit workout' : 'Log a workout'}
          </h2>

          <p className="mt-2 text-sm text-[#F2E8DC]/50">
            {editingLogId
              ? 'Update the details of your recorded session.'
              : "Record what you completed in today's session."}
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
            {success}
          </div>
        )}

        <form onSubmit={saveWorkout} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm text-[#F2E8DC]/70">
              Workout date
            </label>

            <input
              type="date"
              className={inputClass}
              value={workoutDate}
              max={today()}
              onChange={(e) => setWorkoutDate(e.target.value)}
              required
            />
          </div>

          {entries.map((entry, exerciseIndex) => (
            <div
              key={exerciseIndex}
              className="space-y-4 rounded-xl border border-white/10 bg-[#141414] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-[#F2E8DC]">
                  Exercise {exerciseIndex + 1}
                </h3>

                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setEntries((current) =>
                        current.filter((_, i) => i !== exerciseIndex),
                      )
                    }
                    className="rounded-lg p-2 text-[#F2E8DC]/40 hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Remove exercise"
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </div>

              <input
                className={inputClass}
                placeholder="Exercise name (e.g. Bench Press)"
                value={entry.exercise_name}
                onChange={(e) =>
                  updateExercise(
                    exerciseIndex,
                    'exercise_name',
                    e.target.value,
                  )
                }
                required
              />

              <div className="space-y-3">
                {entry.sets.map((set, setIndex) => (
                  <div
                    key={setIndex}
                    className="grid grid-cols-[auto_1fr_1fr_auto] items-end gap-2"
                  >
                    <span className="pb-3 text-xs text-[#F2E8DC]/40">
                      Set {setIndex + 1}
                    </span>

                    <div>
                      <label className="mb-1 block text-xs text-[#F2E8DC]/40">
                        Reps
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        className={inputClass}
                        placeholder="10"
                        value={set.reps}
                        onChange={(e) =>
                          updateSet(
                            exerciseIndex,
                            setIndex,
                            'reps',
                            e.target.value,
                          )
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-[#F2E8DC]/40">
                        Weight (kg)
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className={inputClass}
                        placeholder="20"
                        value={set.weight_kg}
                        onChange={(e) =>
                          updateSet(
                            exerciseIndex,
                            setIndex,
                            'weight_kg',
                            e.target.value,
                          )
                        }
                        required
                      />
                    </div>

                    <button
                      type="button"
                      disabled={entry.sets.length === 1}
                      onClick={() =>
                        setEntries((current) =>
                          current.map((item, i) =>
                            i === exerciseIndex
                              ? {
                                  ...item,
                                  sets: item.sets.filter(
                                    (_, j) => j !== setIndex,
                                  ),
                                }
                              : item,
                          ),
                        )
                      }
                      className="mb-1 rounded-lg p-2 text-[#F2E8DC]/30 hover:text-red-400 disabled:opacity-20"
                      aria-label="Remove set"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setEntries((current) =>
                    current.map((item, i) =>
                      i === exerciseIndex
                        ? {
                            ...item,
                            sets: [...item.sets, newSet()],
                          }
                        : item,
                    ),
                  )
                }
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF6B24] hover:text-[#FFB347]"
              >
                <Plus size={16} /> Add set
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              setEntries((current) => [...current, newExercise()])
            }
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-[#F2E8DC]/70 hover:border-[#FF6B24]/50 hover:text-[#FF6B24]"
          >
            <Plus size={17} /> Add another exercise
          </button>

          <div>
            <label className="mb-2 block text-sm text-[#F2E8DC]/70">
              Session notes (optional)
            </label>

            <textarea
              className={inputClass}
              rows={3}
              placeholder="How did the workout go?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] px-6 py-3 text-sm font-bold text-[#F2E8DC] disabled:opacity-50"
            >
              <Save size={17} />
              {saving
                ? editingLogId
                  ? 'Updating workout...'
                  : 'Saving workout...'
                : editingLogId
                  ? 'Update workout'
                  : 'Save workout'}
            </button>

            {editingLogId && (
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-5 py-3 text-sm font-bold text-[#F2E8DC]/70 hover:border-white/30 disabled:opacity-50"
              >
                <X size={17} /> Cancel editing
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <History className="text-[#FF6B24]" size={23} />

          <div>
            <h2 className="text-2xl font-black text-[#F2E8DC]">
              Workout history
            </h2>

            <p className="text-sm text-[#F2E8DC]/40">
              Your latest 30 recorded sessions
            </p>
          </div>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-[#F2E8DC]/40">
            Loading workout history...
          </p>
        ) : history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <History
              className="mx-auto mb-3 text-[#F2E8DC]/30"
              size={30}
            />

            <p className="text-sm text-[#F2E8DC]/50">
              No completed workouts recorded yet.
            </p>
          </div>
        ) : (
          history.map((log) => (
            <article
              key={log.id}
              className="rounded-2xl border border-white/10 bg-[#1C1C1C] p-5 sm:p-6"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-[#F2E8DC]">
                    {new Date(
                      `${log.workout_date}T12:00:00`,
                    ).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </h3>

                  <span className="text-xs text-[#F2E8DC]/40">
                    {log.exercises.length} exercises
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(log)}
                    disabled={saving || deletingId !== null}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-[#F2E8DC]/70 hover:border-[#FF6B24]/50 hover:text-[#FF6B24] disabled:opacity-40"
                  >
                    <Pencil size={14} /> Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteWorkout(log)}
                    disabled={deletingId !== null || saving}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                    {deletingId === log.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {log.exercises.map((exercise) => (
                  <div key={exercise.id}>
                    <p className="mb-2 font-semibold text-[#FF6B24]">
                      {exercise.exercise_name}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {exercise.sets.map((set) => (
                        <span
                          key={set.id}
                          className="rounded-lg bg-[#141414] px-3 py-2 text-xs text-[#F2E8DC]/70"
                        >
                          Set {set.set_number}: {set.reps} reps ×{' '}
                          {set.weight_kg} kg
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {log.notes && (
                <p className="mt-4 border-t border-white/10 pt-4 text-sm text-[#F2E8DC]/50">
                  {log.notes}
                </p>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  )
}
