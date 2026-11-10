
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  Plus,
  Trash2,
  Dumbbell,
  ClipboardList,
  ShieldCheck,
  Lock,
} from 'lucide-react'
import WorkoutHistory from '../components/WorkoutHistory'

const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const inputClass =
  'w-full rounded-lg border border-white/10 bg-[#141414] px-4 py-3 text-sm text-[#F2E8DC] outline-none transition focus:border-[#FF6B24]'

const buttonClass =
  'rounded-lg bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] px-6 py-3 text-sm font-bold text-[#F2E8DC] transition hover:brightness-110 disabled:opacity-50'

export default function MemberWorkouts() {
  const { user } = useAuth()

  const [personalPlan, setPersonalPlan] = useState(null)
  const [assignedPlan, setAssignedPlan] = useState(null)

  const [personalExercises, setPersonalExercises] = useState([])
  const [assignedExercises, setAssignedExercises] = useState([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [planTitle, setPlanTitle] = useState('')
  const [structureMode, setStructureMode] = useState('by_day')

  const [exerciseName, setExerciseName] = useState('')
  const [exerciseDay, setExerciseDay] = useState('Monday')
  const [instructions, setInstructions] = useState('')

  // Fetch personal and assigned plans separately.
  async function loadPlan() {
    if (!user?.id) return

    setLoading(true)
    setError('')

    try {
      const [personalResult, assignedResult] = await Promise.all([
        supabase
          .from('workout_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('plan_type', 'personal')
          .maybeSingle(),

        supabase
          .from('workout_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('plan_type', 'assigned')
          .maybeSingle(),
      ])

      if (personalResult.error) throw personalResult.error
      if (assignedResult.error) throw assignedResult.error

      const personal = personalResult.data
      const assigned = assignedResult.data

      setPersonalPlan(personal)
      setAssignedPlan(assigned)

      setPlanTitle(personal?.title || '')

      // Fetch exercises for both plans independently.
      const [personalExerciseResult, assignedExerciseResult] =
        await Promise.all([
          personal
            ? supabase
                .from('plan_exercises')
                .select('*')
                .eq('plan_id', personal.id)
                .order('sort_order', { ascending: true })
            : Promise.resolve({ data: [], error: null }),

          assigned
            ? supabase
                .from('plan_exercises')
                .select('*')
                .eq('plan_id', assigned.id)
                .order('sort_order', { ascending: true })
            : Promise.resolve({ data: [], error: null }),
        ])

      if (personalExerciseResult.error) {
        throw personalExerciseResult.error
      }

      if (assignedExerciseResult.error) {
        throw assignedExerciseResult.error
      }

      setPersonalExercises(personalExerciseResult.data || [])
      setAssignedExercises(assignedExerciseResult.data || [])
    } catch (err) {
      setError(err.message || 'Could not load your workout plans.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPlan()
  }, [user?.id])

  // Create a personal workout plan.
  async function createPlan(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!planTitle.trim()) {
      setError('Please enter a workout plan name.')
      return
    }

    if (!user?.id) {
      setError('You must be logged in to create a workout plan.')
      return
    }

    setSaving(true)

    try {
      const { data, error: createError } = await supabase
        .from('workout_plans')
        .insert({
          user_id: user.id,
          title: planTitle.trim(),
          structure_mode: structureMode,
          plan_type: 'personal',
        })
        .select()
        .single()

      if (createError) throw createError

      setPersonalPlan(data)
      setPersonalExercises([])
      setSuccess('Your personal workout plan has been created.')
    } catch (err) {
      setError(err.message || 'Could not create your workout plan.')
    } finally {
      setSaving(false)
    }
  }

  // Update personal plan name.
  async function updatePlan(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!planTitle.trim()) {
      setError('Plan name cannot be empty.')
      return
    }

    if (!personalPlan) return

    setSaving(true)

    try {
      const { error: updateError } = await supabase
        .from('workout_plans')
        .update({ title: planTitle.trim() })
        .eq('id', personalPlan.id)

      if (updateError) throw updateError

      setPersonalPlan({
        ...personalPlan,
        title: planTitle.trim(),
      })

      setSuccess('Personal plan name updated.')
    } catch (err) {
      setError(err.message || 'Could not update your plan.')
    } finally {
      setSaving(false)
    }
  }

  // Add exercise to personal plan.
  async function addExercise(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!exerciseName.trim()) {
      setError('Please enter an exercise name.')
      return
    }

    if (!personalPlan) return

    setSaving(true)

    try {
      const { data, error: insertError } = await supabase
        .from('plan_exercises')
        .insert({
          plan_id: personalPlan.id,
          exercise_name: exerciseName.trim(),
          day_name:
            personalPlan.structure_mode === 'by_day'
              ? exerciseDay
              : null,
          instructions: instructions.trim() || null,
          sort_order: personalExercises.length,
        })
        .select()
        .single()

      if (insertError) throw insertError

      setPersonalExercises((current) => [...current, data])
      setExerciseName('')
      setInstructions('')
      setSuccess('Exercise added to your personal plan.')
    } catch (err) {
      setError(err.message || 'Could not add this exercise.')
    } finally {
      setSaving(false)
    }
  }

  // Delete exercise from personal plan.
  async function deleteExercise(exerciseId) {
    setError('')
    setSuccess('')

    const confirmed = window.confirm(
      'Remove this exercise from your personal workout plan?',
    )

    if (!confirmed) return

    try {
      const { error: deleteError } = await supabase
        .from('plan_exercises')
        .delete()
        .eq('id', exerciseId)

      if (deleteError) throw deleteError

      setPersonalExercises((current) =>
        current.filter((exercise) => exercise.id !== exerciseId),
      )

      setSuccess('Exercise removed from your personal plan.')
    } catch (err) {
      setError(err.message || 'Could not remove this exercise.')
    }
  }

  function groupExercises(plan, exercises) {
    if (plan?.structure_mode === 'by_day') {
      return days.map((day) => ({
        day,
        items: exercises.filter(
          (exercise) => exercise.day_name === day,
        ),
      }))
    }

    return [
      {
        day: 'Exercises',
        items: exercises,
      },
    ]
  }

  const assignedGroups = groupExercises(
    assignedPlan,
    assignedExercises,
  )

  const personalGroups = groupExercises(
    personalPlan,
    personalExercises,
  )

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-[#F2E8DC]/50">
        Loading your workout plans...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {/* Page heading */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-[#FF6B24]">
          Training
        </p>

        <h1 className="text-3xl font-black text-[#F2E8DC] sm:text-4xl">
          Workout Planner
        </h1>

        <p className="mt-2 text-sm text-[#F2E8DC]/50">
          Follow your training plan, build your routine and track your progress.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {success}
        </div>
      )}

      {/* OWNER-ASSIGNED WORKOUT */}
      {assignedPlan && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-[#FF6B24]/30 bg-[#1C1C1C] p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-[#FF6B24]/10 p-3 text-[#FF6B24]">
                <ShieldCheck size={24} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#FF6B24]">
                  Trainer assigned
                </p>

                <h2 className="mt-1 text-xl font-bold text-[#F2E8DC]">
                  {assignedPlan.title}
                </h2>

                <p className="mt-1 text-xs text-[#F2E8DC]/40">
                  {assignedPlan.structure_mode === 'by_day'
                    ? 'Organized by training days'
                    : 'Flexible exercise list'}
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-[#F2E8DC]/50 sm:flex">
                <Lock size={14} />
                Read only
              </div>
            </div>

            <p className="text-sm text-[#F2E8DC]/50">
              This workout was assigned by your gym owner. Follow the
              routine and contact the trainer if you need changes.
            </p>
          </div>

          {assignedExercises.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
              <Dumbbell
                className="mx-auto mb-3 text-[#F2E8DC]/30"
                size={30}
              />

              <p className="text-sm text-[#F2E8DC]/50">
                Your trainer hasn't added exercises yet.
              </p>
            </div>
          ) : (
            assignedGroups.map(({ day, items }) => (
              <div
                key={day}
                className="rounded-2xl border border-white/10 bg-[#1C1C1C] p-5 sm:p-6"
              >
                <h3 className="mb-4 font-bold text-[#FF6B24]">
                  {day}
                </h3>

                <div className="space-y-3">
                  {items.map((exercise, index) => (
                    <div
                      key={exercise.id}
                      className="flex items-start gap-3 rounded-xl border border-white/5 bg-[#141414] p-4"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FF6B24]/10 text-sm font-bold text-[#FF6B24]">
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <p className="font-semibold text-[#F2E8DC]">
                          {exercise.exercise_name}
                        </p>

                        {exercise.instructions && (
                          <p className="mt-1 whitespace-pre-wrap text-sm text-[#F2E8DC]/40">
                            {exercise.instructions}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* PERSONAL WORKOUT */}
      <section className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#FF6B24]">
            Personal training
          </p>

          <h2 className="text-2xl font-black text-[#F2E8DC]">
            Your Personal Workout
          </h2>

          <p className="mt-2 text-sm text-[#F2E8DC]/50">
            Create and manage your own workout routine.
          </p>
        </div>

        {!personalPlan ? (
          <div className="rounded-2xl border border-white/10 bg-[#1C1C1C] p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-[#FF6B24]/10 p-3 text-[#FF6B24]">
                <Dumbbell size={24} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#F2E8DC]">
                  Create your personal workout
                </h3>

                <p className="text-sm text-[#F2E8DC]/50">
                  Choose a name and organize your exercises.
                </p>
              </div>
            </div>

            <form onSubmit={createPlan} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-[#F2E8DC]/70">
                  Plan name
                </label>

                <input
                  className={inputClass}
                  placeholder="e.g. My Strength Training"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#F2E8DC]/70">
                  Workout structure
                </label>

                <select
                  className={inputClass}
                  value={structureMode}
                  onChange={(e) => setStructureMode(e.target.value)}
                >
                  <option value="by_day">Organize by days</option>
                  <option value="flexible">
                    One flexible exercise list
                  </option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className={buttonClass}
              >
                {saving ? 'Creating...' : 'Create personal workout'}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Personal plan details */}
            <section className="rounded-2xl border border-white/10 bg-[#1C1C1C] p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-[#FF6B24]/10 p-3 text-[#FF6B24]">
                  <ClipboardList size={24} />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#FF6B24]">
                    Your personal plan
                  </p>

                  <p className="text-xs text-[#F2E8DC]/40">
                    {personalPlan.structure_mode === 'by_day'
                      ? 'Organized by days'
                      : 'Flexible exercise list'}
                  </p>
                </div>
              </div>

              <form
                onSubmit={updatePlan}
                className="flex flex-col gap-3 sm:flex-row"
              >
                <input
                  className={inputClass}
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="Workout plan name"
                />

                <button
                  type="submit"
                  disabled={saving}
                  className={`${buttonClass} shrink-0`}
                >
                  Save name
                </button>
              </form>
            </section>

            {/* Add personal exercise */}
            <section className="rounded-2xl border border-white/10 bg-[#1C1C1C] p-6 sm:p-8">
              <h3 className="mb-5 text-xl font-bold text-[#F2E8DC]">
                Add an exercise
              </h3>

              <form onSubmit={addExercise} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-[#F2E8DC]/70">
                    Exercise name
                  </label>

                  <input
                    className={inputClass}
                    placeholder="e.g. Bench Press"
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                    required
                  />
                </div>

                {personalPlan.structure_mode === 'by_day' && (
                  <div>
                    <label className="mb-2 block text-sm text-[#F2E8DC]/70">
                      Training day
                    </label>

                    <select
                      className={inputClass}
                      value={exerciseDay}
                      onChange={(e) => setExerciseDay(e.target.value)}
                    >
                      {days.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm text-[#F2E8DC]/70">
                    Instructions{' '}
                    <span className="text-[#F2E8DC]/30">
                      (optional)
                    </span>
                  </label>

                  <textarea
                    className={inputClass}
                    rows={2}
                    placeholder="e.g. 3 sets, focus on controlled movement"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className={`${buttonClass} inline-flex items-center gap-2`}
                >
                  <Plus size={17} />
                  {saving ? 'Adding...' : 'Add exercise'}
                </button>
              </form>
            </section>

            {/* Personal exercise list */}
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#F2E8DC]">
                  Your exercises
                </h3>

                <span className="text-sm text-[#F2E8DC]/40">
                  {personalExercises.length}{' '}
                  {personalExercises.length === 1
                    ? 'exercise'
                    : 'exercises'}
                </span>
              </div>

              {personalExercises.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                  <Dumbbell
                    className="mx-auto mb-3 text-[#F2E8DC]/30"
                    size={30}
                  />

                  <p className="text-sm text-[#F2E8DC]/50">
                    No exercises yet. Add your first exercise above.
                  </p>
                </div>
              ) : (
                personalGroups.map(({ day, items }) => (
                  <div
                    key={day}
                    className="rounded-2xl border border-white/10 bg-[#1C1C1C] p-5 sm:p-6"
                  >
                    <h4 className="mb-4 font-bold text-[#FF6B24]">
                      {day}
                    </h4>

                    {items.length === 0 ? (
                      <p className="text-sm text-[#F2E8DC]/30">
                        No exercises added.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {items.map((exercise, index) => (
                          <div
                            key={exercise.id}
                            className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-[#141414] p-4"
                          >
                            <div className="flex min-w-0 gap-3">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FF6B24]/10 text-sm font-bold text-[#FF6B24]">
                                {index + 1}
                              </span>

                              <div className="min-w-0">
                                <p className="font-semibold text-[#F2E8DC]">
                                  {exercise.exercise_name}
                                </p>

                                {exercise.instructions && (
                                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#F2E8DC]/40">
                                    {exercise.instructions}
                                  </p>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => deleteExercise(exercise.id)}
                              className="shrink-0 rounded-lg p-2 text-[#F2E8DC]/30 transition hover:bg-red-500/10 hover:text-red-400"
                              aria-label={`Delete ${exercise.exercise_name}`}
                              title="Remove exercise"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </section>
          </>
        )}
      </section>

      {/* Workout history */}
      <WorkoutHistory />
    </div>
  )
}
