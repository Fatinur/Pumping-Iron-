import { useEffect, useState } from 'react'
import {
  Dumbbell,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  UserRound,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

const inputClass =
  'w-full rounded-lg border border-white/10 bg-[#202020] px-4 py-3 text-sm text-[#F2E8DC] outline-none transition focus:border-[#FF6B24]/60'

const labelClass =
  'mb-2 block text-xs font-bold uppercase tracking-wider text-white/40'

const weekdays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

export default function AdminWorkouts() {
  const [members, setMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState('')

  const [planId, setPlanId] = useState(null)
  const [title, setTitle] = useState('')
  const [structureMode, setStructureMode] = useState('by_day')
  const [exercises, setExercises] = useState([])

  const [loadingMembers, setLoadingMembers] = useState(true)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load members.
  useEffect(() => {
    async function loadMembers() {
      setLoadingMembers(true)
      setError('')

      const { data, error: membersError } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('role', 'member')
        .order('full_name')

      if (membersError) {
        setError(membersError.message)
        setLoadingMembers(false)
        return
      }

      setMembers(data || [])
      setLoadingMembers(false)
    }

    loadMembers()
  }, [])

  // Load only the owner's assigned plan for the selected member.
  useEffect(() => {
    let mounted = true

    async function loadPlan() {
      if (!selectedMember) {
        setPlanId(null)
        setTitle('')
        setStructureMode('by_day')
        setExercises([])
        return
      }

      setLoadingPlan(true)
      setError('')
      setSuccess('')

      setPlanId(null)
      setTitle('')
      setStructureMode('by_day')
      setExercises([])

      const { data: plan, error: planError } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', selectedMember)
        .eq('plan_type', 'assigned')
        .maybeSingle()

      if (!mounted) return

      if (planError) {
        setError(planError.message)
        setLoadingPlan(false)
        return
      }

      if (!plan) {
        setLoadingPlan(false)
        return
      }

      const { data: exerciseData, error: exercisesError } =
        await supabase
          .from('plan_exercises')
          .select('*')
          .eq('plan_id', plan.id)
          .order('sort_order')

      if (!mounted) return

      if (exercisesError) {
        setError(exercisesError.message)
        setLoadingPlan(false)
        return
      }

      setPlanId(plan.id)
      setTitle(plan.title)
      setStructureMode(plan.structure_mode)

      setExercises(
        (exerciseData || []).map((exercise) => ({
          id: exercise.id,
          exercise_name: exercise.exercise_name,
          day_name: exercise.day_name || '',
          instructions: exercise.instructions || '',
          sort_order: exercise.sort_order,
        }))
      )

      setLoadingPlan(false)
    }

    loadPlan()

    return () => {
      mounted = false
    }
  }, [selectedMember])

  function addExercise() {
    setExercises((current) => [
      ...current,
      {
        id: null,
        exercise_name: '',
        day_name: '',
        instructions: '',
        sort_order: current.length,
      },
    ])
  }

  function updateExercise(index, field, value) {
    setExercises((current) =>
      current.map((exercise, exerciseIndex) =>
        exerciseIndex === index
          ? { ...exercise, [field]: value }
          : exercise
      )
    )
  }

  function removeExercise(index) {
    setExercises((current) =>
      current
        .filter((_, exerciseIndex) => exerciseIndex !== index)
        .map((exercise, newIndex) => ({
          ...exercise,
          sort_order: newIndex,
        }))
    )
  }

  function moveExercise(index, direction) {
    setExercises((current) => {
      const next = [...current]
      const targetIndex = index + direction

      if (targetIndex < 0 || targetIndex >= next.length) {
        return current
      }

      ;[next[index], next[targetIndex]] = [
        next[targetIndex],
        next[index],
      ]

      return next.map((exercise, newIndex) => ({
        ...exercise,
        sort_order: newIndex,
      }))
    })
  }

  async function handleSave() {
    setError('')
    setSuccess('')

    if (!selectedMember) {
      setError('Please select a member first.')
      return
    }

    if (!title.trim()) {
      setError('Please enter a workout plan title.')
      return
    }

    if (exercises.length === 0) {
      setError('Add at least one exercise to the workout plan.')
      return
    }

    if (
      exercises.some(
        (exercise) => !exercise.exercise_name.trim()
      )
    ) {
      setError('Every exercise must have a name.')
      return
    }

    if (
      structureMode === 'by_day' &&
      exercises.some((exercise) => !exercise.day_name)
    ) {
      setError('Please select a training day for every exercise.')
      return
    }

    setSaving(true)

    // Create or update ONLY the assigned workout plan.
    let savedPlan = null
    // eslint-disable-next-line no-useless-assignment
    let planError = null

    const planPayload = {
      user_id: selectedMember,
      plan_type: 'assigned',
      title: title.trim(),
      structure_mode: structureMode,
    }

    if (planId) {
      const result = await supabase
        .from('workout_plans')
        .update(planPayload)
        .eq('id', planId)
        .eq('plan_type', 'assigned')
        .select()
        .single()

      savedPlan = result.data
      planError = result.error
    } else {
      const result = await supabase
        .from('workout_plans')
        .insert(planPayload)
        .select()
        .single()

      savedPlan = result.data
      planError = result.error
    }

    if (planError) {
      setError(planError.message)
      setSaving(false)
      return
    }

    // Keep only the exercises currently present in the editor.
    const currentIds = exercises
      .filter((exercise) => exercise.id)
      .map((exercise) => exercise.id)

    let deleteQuery = supabase
      .from('plan_exercises')
      .delete()
      .eq('plan_id', savedPlan.id)

    if (currentIds.length > 0) {
      deleteQuery = deleteQuery.not(
        'id',
        'in',
        `(${currentIds.join(',')})`
      )
    }

    const { error: deleteError } = await deleteQuery

    if (deleteError) {
      setError(deleteError.message)
      setSaving(false)
      return
    }

    // Update existing exercises.
    for (let index = 0; index < exercises.length; index++) {
      const exercise = exercises[index]

      if (!exercise.id) continue

      const { error: updateError } = await supabase
        .from('plan_exercises')
        .update({
          exercise_name: exercise.exercise_name.trim(),
          day_name:
            structureMode === 'by_day'
              ? exercise.day_name
              : null,
          instructions: exercise.instructions.trim() || null,
          sort_order: index,
        })
        .eq('id', exercise.id)
        .eq('plan_id', savedPlan.id)

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }
    }

    // Insert new exercises.
    const newExercises = exercises
      .map((exercise, index) => ({ exercise, index }))
      .filter(({ exercise }) => !exercise.id)

    if (newExercises.length > 0) {
      const rows = newExercises.map(({ exercise, index }) => ({
        plan_id: savedPlan.id,
        exercise_name: exercise.exercise_name.trim(),
        day_name:
          structureMode === 'by_day'
            ? exercise.day_name
            : null,
        instructions: exercise.instructions.trim() || null,
        sort_order: index,
      }))

      const { error: insertError } = await supabase
        .from('plan_exercises')
        .insert(rows)

      if (insertError) {
        setError(insertError.message)
        setSaving(false)
        return
      }
    }

    setPlanId(savedPlan.id)

    // Reload saved exercise IDs and database values.
    const { data: refreshedExercises, error: refreshError } =
      await supabase
        .from('plan_exercises')
        .select('*')
        .eq('plan_id', savedPlan.id)
        .order('sort_order')

    if (refreshError) {
      setError(refreshError.message)
      setSaving(false)
      return
    }

    setExercises(
      (refreshedExercises || []).map((exercise) => ({
        id: exercise.id,
        exercise_name: exercise.exercise_name,
        day_name: exercise.day_name || '',
        instructions: exercise.instructions || '',
        sort_order: exercise.sort_order,
      }))
    )

    setSuccess('Assigned workout plan saved successfully.')
    setSaving(false)
  }

  const selectedMemberDetails = members.find(
    (member) => member.id === selectedMember
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#FF8248]">
          Training management
        </p>

        <h1 className="text-3xl font-black tracking-tight text-[#F2E8DC] sm:text-4xl">
          Workout Plans
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
          Create and manage assigned workout routines for your members.
          Members can still manage their own personal workout plans separately.
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
          <CheckCircle2 size={18} className="shrink-0" />
          {success}
        </div>
      )}

      {/* Member selection */}
      <section className="rounded-xl border border-white/[0.07] bg-[#181818] p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <UserRound className="text-[#FF8248]" size={21} />

          <div>
            <h2 className="font-bold text-[#F2E8DC]">
              Select member
            </h2>

            <p className="mt-1 text-xs text-white/35">
              Choose who will receive this assigned workout plan.
            </p>
          </div>
        </div>

        {loadingMembers ? (
          <p className="text-sm text-white/40">
            Loading members...
          </p>
        ) : members.length === 0 ? (
          <p className="rounded-lg bg-[#202020] p-4 text-sm text-white/40">
            No registered members found.
          </p>
        ) : (
          <div className="max-w-xl">
            <label className={labelClass}>Member</label>

            <select
              value={selectedMember}
              onChange={(event) =>
                setSelectedMember(event.target.value)
              }
              className={inputClass}
            >
              <option value="">Choose a member</option>

              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name || 'Unnamed member'}
                  {member.phone ? ` — ${member.phone}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* Workout editor */}
      {selectedMember && (
        <section className="space-y-6 rounded-xl border border-white/[0.07] bg-[#181818] p-5 sm:p-6">
          {loadingPlan ? (
            <div className="flex min-h-48 items-center justify-center text-sm text-white/40">
              <RefreshCw className="mr-3 animate-spin" size={18} />
              Loading assigned workout plan...
            </div>
          ) : (
            <>
              {/* Selected member */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/35">
                    Assigning workout to
                  </p>

                  <h2 className="mt-1 text-xl font-black text-[#F2E8DC]">
                    {selectedMemberDetails?.full_name || 'Member'}
                  </h2>

                  {selectedMemberDetails?.phone && (
                    <p className="mt-1 text-xs text-white/35">
                      {selectedMemberDetails.phone}
                    </p>
                  )}
                </div>

                <span className="rounded-full bg-[#FF6B24]/10 px-3 py-1.5 text-xs font-bold text-[#FF8248]">
                  {planId ? 'Existing assigned plan' : 'New assigned plan'}
                </span>
              </div>

              {/* Plan details */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Workout plan title
                  </label>

                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. Beginner Strength Program"
                    maxLength={100}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Workout structure
                  </label>

                  <select
                    value={structureMode}
                    onChange={(event) =>
                      setStructureMode(event.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="by_day">By Day</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>
              </div>

              {/* Exercise list */}
              <div className="space-y-4 border-t border-white/[0.07] pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ClipboardList
                      className="text-[#FF8248]"
                      size={20}
                    />

                    <div>
                      <h3 className="font-bold text-[#F2E8DC]">
                        Exercises
                      </h3>

                      <p className="mt-1 text-xs text-white/35">
                        {exercises.length} exercise
                        {exercises.length === 1 ? '' : 's'} added
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addExercise}
                    className="flex items-center gap-2 rounded-lg border border-[#FF6B24]/30 px-4 py-2.5 text-xs font-bold text-[#FF8248] transition hover:bg-[#FF6B24]/10"
                  >
                    <Plus size={16} />
                    Add exercise
                  </button>
                </div>

                {exercises.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-[#202020]/50 p-8 text-center">
                    <Dumbbell
                      className="mx-auto mb-3 text-white/25"
                      size={28}
                    />

                    <p className="font-bold text-[#F2E8DC]">
                      No exercises added yet
                    </p>

                    <p className="mt-2 text-sm text-white/35">
                      Start building this member's assigned workout plan.
                    </p>

                    <button
                      type="button"
                      onClick={addExercise}
                      className="mt-4 text-sm font-bold text-[#FF8248] hover:text-[#FFB347]"
                    >
                      + Add your first exercise
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {exercises.map((exercise, index) => (
                      <div
                        key={exercise.id || `new-${index}`}
                        className="space-y-4 rounded-xl border border-white/[0.07] bg-[#202020]/60 p-4 sm:p-5"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#FF8248]">
                            Exercise {index + 1}
                          </p>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveExercise(index, -1)}
                              disabled={index === 0}
                              title="Move up"
                              className="rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white disabled:opacity-20"
                            >
                              <ChevronUp size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => moveExercise(index, 1)}
                              disabled={index === exercises.length - 1}
                              title="Move down"
                              className="rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white disabled:opacity-20"
                            >
                              <ChevronDown size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => removeExercise(index)}
                              title="Remove exercise"
                              className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div
                          className={
                            structureMode === 'by_day'
                              ? 'grid gap-4 sm:grid-cols-2'
                              : ''
                          }
                        >
                          <div>
                            <label className={labelClass}>
                              Exercise name
                            </label>

                            <input
                              type="text"
                              value={exercise.exercise_name}
                              onChange={(event) =>
                                updateExercise(
                                  index,
                                  'exercise_name',
                                  event.target.value
                                )
                              }
                              placeholder="e.g. Bench Press"
                              maxLength={120}
                              className={inputClass}
                            />
                          </div>

                          {structureMode === 'by_day' && (
                            <div>
                              <label className={labelClass}>
                                Training day
                              </label>

                              <select
                                value={exercise.day_name}
                                onChange={(event) =>
                                  updateExercise(
                                    index,
                                    'day_name',
                                    event.target.value
                                  )
                                }
                                className={inputClass}
                              >
                                <option value="">Select a day</option>

                                {weekdays.map((day) => (
                                  <option key={day} value={day}>
                                    {day}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className={labelClass}>
                            Instructions (optional)
                          </label>

                          <textarea
                            rows={2}
                            value={exercise.instructions}
                            onChange={(event) =>
                              updateExercise(
                                index,
                                'instructions',
                                event.target.value
                              )
                            }
                            placeholder="Add guidance, technique notes or other instructions..."
                            maxLength={1000}
                            className={`${inputClass} resize-y`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Save */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-6">
                <p className="max-w-md text-xs leading-5 text-white/35">
                  This saves the owner's assigned routine separately from
                  the member's personal workout plan.
                </p>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || exercises.length === 0}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FFB347] via-[#FF6B24] to-[#D94A36] px-6 py-3 text-sm font-bold text-[#F2E8DC] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <RefreshCw size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}

                  {saving ? 'Saving workout plan...' : 'Save workout plan'}
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  )
}