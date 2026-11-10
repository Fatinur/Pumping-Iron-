import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'
import { writeFile } from 'node:fs/promises'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const DEMO_TAG = 'pumping-iron-v1'
const DEMO_COUNT = 20
const APPLY = process.argv.includes('--apply')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
}

if (!SERVICE_ROLE_KEY.startsWith('sb_secret_') &&
    !SERVICE_ROLE_KEY.startsWith('eyJ')) {
  throw new Error('The supplied key does not look like a Supabase secret/service-role key.')
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const names = [
  'Rahim Ahmed',
  'Sakib Hasan',
  'Tanvir Islam',
  'Nabil Hossain',
  'Fahim Rahman',
  'Arif Mahmud',
  'Shakil Ahmed',
  'Mehedi Hasan',
  'Rafiul Islam',
  'Imran Hossain',
  'Siam Rahman',
  'Nafis Ahmed',
  'Tanjim Khan',
  'Riad Mahmud',
  'Asif Karim',
  'Shuvo Islam',
  'Rifat Hasan',
  'Adnan Rahman',
  'Sajid Ahmed',
  'Mushfiq Islam',
]

const exercises = [
  {
    name: 'Bench Press',
    instructions: 'Keep your shoulder blades retracted and lower the bar under control.',
  },
  {
    name: 'Incline Dumbbell Press',
    instructions: 'Maintain a controlled range of motion.',
  },
  {
    name: 'Lat Pulldown',
    instructions: 'Pull toward your upper chest without swinging.',
  },
  {
    name: 'Seated Cable Row',
    instructions: 'Keep your back neutral and squeeze your shoulder blades.',
  },
  {
    name: 'Barbell Squat',
    instructions: 'Brace your core and maintain stable foot positioning.',
  },
  {
    name: 'Leg Press',
    instructions: 'Avoid locking your knees at the top.',
  },
  {
    name: 'Shoulder Press',
    instructions: 'Keep your core tight throughout the movement.',
  },
  {
    name: 'Lateral Raises',
    instructions: 'Use controlled movement and avoid swinging.',
  },
  {
    name: 'Bicep Curls',
    instructions: 'Keep your elbows stable.',
  },
  {
    name: 'Tricep Pushdown',
    instructions: 'Keep your upper arms close to your body.',
  },
  {
    name: 'Romanian Deadlift',
    instructions: 'Push your hips back while maintaining a neutral spine.',
  },
  {
    name: 'Plank',
    instructions: 'Maintain a straight line from shoulders to heels.',
  },
]

const weeklyPlans = [
  {
    day: 'Monday',
    exercises: ['Bench Press', 'Incline Dumbbell Press', 'Tricep Pushdown'],
  },
  {
    day: 'Tuesday',
    exercises: ['Lat Pulldown', 'Seated Cable Row', 'Bicep Curls'],
  },
  {
    day: 'Wednesday',
    exercises: ['Barbell Squat', 'Leg Press', 'Plank'],
  },
  {
    day: 'Thursday',
    exercises: ['Shoulder Press', 'Lateral Raises', 'Bicep Curls'],
  },
  {
    day: 'Friday',
    exercises: ['Romanian Deadlift', 'Lat Pulldown', 'Plank'],
  },
]

const randomPassword = () => randomBytes(12).toString('base64url') + 'A9!'

const randomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const pad = (number) => String(number).padStart(2, '0')

const getDhakaDate = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const values = Object.fromEntries(parts.map((p) => [p.type, p.value]))

  return `${values.year}-${values.month}-${values.day}`
}

const shiftDate = (dateString, days) => {
  const date = new Date(`${dateString}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

const shiftMonths = (dateString, months) => {
  const date = new Date(`${dateString}T00:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + months)
  return date.toISOString().slice(0, 10)
}

const firstOfMonth = (dateString) => `${dateString.slice(0, 7)}-01`

const endOfMembership = (startDate, duration) => {
  const nextMonth = shiftMonths(startDate, duration)
  return shiftDate(nextMonth, -1)
}

const checkError = (error, label) => {
  if (error) {
    throw new Error(`${label}: ${error.message}`)
  }
}

async function getAllAuthUsers() {
  const users = []
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    })

    checkError(error, 'Could not retrieve Auth users')

    users.push(...data.users)

    if (data.users.length < 1000) break

    page++
  }

  return users
}

async function waitForProfile(userId) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle()

    checkError(error, 'Profile lookup failed')

    if (data) return data

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  throw new Error(`Profile trigger did not create profile for ${userId}`)
}

async function insertRows(table, rows) {
  if (!rows.length) return []

  const { data, error } = await supabase
    .from(table)
    .insert(rows)
    .select()

  checkError(error, `Insert failed in ${table}`)

  return data
}

async function main() {
  console.log('\nPUMPING IRON — DEMO DATA SEEDER\n')

  const today = getDhakaDate()
  const monthStart = firstOfMonth(today)

  // 1. Verify owner account.

  const { data: owners, error: ownerError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'owner')

  checkError(ownerError, 'Could not verify owner')

  if (!owners || owners.length !== 1) {
    throw new Error(
      `Expected exactly one owner account. Found ${owners?.length ?? 0}. Aborting.`,
    )
  }

  const ownerId = owners[0].id

  // 2. Retrieve actual membership plans.

  const { data: plans, error: planError } = await supabase
    .from('membership_plans')
    .select('*')
    .eq('is_active', true)

  checkError(planError, 'Could not retrieve membership plans')

  if (!plans || plans.length < 5) {
    throw new Error('Not enough active membership plans. Aborting.')
  }

  // 3. Check existing demo users.

  const authUsers = await getAllAuthUsers()

  const existingDemoUsers = authUsers.filter(
    (user) => user.user_metadata?.demo_seed === DEMO_TAG,
  )

  if (existingDemoUsers.length) {
    throw new Error(
      `Found ${existingDemoUsers.length} existing demo accounts. Refusing to duplicate data.`,
    )
  }

  const existingEmails = new Set(authUsers.map((user) => user.email))

  const credentials = names.map((name, index) => ({
    name,
    email: `pumpingiron.demo${pad(index + 1)}@example.com`,
    password: randomPassword(),
  }))

  for (const account of credentials) {
    if (existingEmails.has(account.email)) {
      throw new Error(`Email already exists: ${account.email}. Aborting.`)
    }
  }

  console.log(`Owner verified: ${owners[0].full_name}`)
  console.log(`Active membership plans found: ${plans.length}`)
  console.log(`Demo accounts to create: ${DEMO_COUNT}`)
  console.log('Existing demo accounts: 0')

  if (!APPLY) {
    console.log('\nDRY RUN ONLY — no database records were created.')
    console.log('Run with --apply when you are ready.')
    return
  }
  // Save credentials before creating database records.
// This prevents losing passwords if seeding fails midway.

await writeFile(
  'demo-credentials.json',
  JSON.stringify(
    {
      project: 'PUMPING IRON',
      generated_at: new Date().toISOString(),
      accounts: credentials,
    },
    null,
    2,
  ),
  { flag: 'wx' },
)

console.log('Credentials saved locally.')

  // 4. Create Auth users. The database trigger creates profiles.

  console.log('\nCreating demo accounts...')

  const members = []

  for (let i = 0; i < credentials.length; i++) {
    const account = credentials[i]

    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: {
        full_name: account.name,
        phone: `+88017${String(10000000 + i).slice(-8)}`,
        date_of_birth: `${randomNumber(1995, 2005)}-${pad(randomNumber(1, 12))}-${pad(randomNumber(1, 28))}`,
        gender: i % 4 === 0 ? 'Female' : 'Male',
        height_cm: randomNumber(155, 190),
        weight_kg: randomNumber(48, 95),
        demo_seed: DEMO_TAG,
      },
    })

    checkError(error, `Could not create ${account.email}`)

    const profile = await waitForProfile(data.user.id)

    if (profile.role !== 'member') {
      throw new Error(`Unexpected role for ${account.email}`)
    }

    members.push({
      id: data.user.id,
      ...account,
    })

    console.log(`Created ${i + 1}/${DEMO_COUNT}: ${account.name}`)
  }

  // 5. Create memberships.



console.log('\nCreating memberships...')

const finitePlans = plans.filter(
  (plan) => !plan.is_lifetime && plan.duration_months !== null,
)

const lifetimePlans = plans.filter((plan) => plan.is_lifetime)

if (!finitePlans.length || !lifetimePlans.length) {
  throw new Error(
    'Both finite-duration and lifetime membership plans are required.',
  )
}

const membershipRows = members.map((member, index) => {
  const status =
    index < 12 ? 'active' :
    index < 16 ? 'expired' :
    'pending_payment'

  // Expired memberships must have a finite duration.
  const plan =
    status === 'expired'
      ? finitePlans[index % finitePlans.length]
      : plans[index % plans.length]

  let startDate = monthStart

  if (status === 'expired') {
    // Membership ends on the last day of the previous month.
    // Calculate its start date using the actual plan duration.
    startDate = shiftMonths(monthStart, -plan.duration_months)
  }

  const endDate = plan.is_lifetime
    ? null
    : endOfMembership(startDate, plan.duration_months)

  return {
    user_id: member.id,
    plan_id: plan.id,
    plan_name_snapshot: plan.name,
    duration_months_snapshot: plan.duration_months,
    is_lifetime_snapshot: plan.is_lifetime,
    amount_paid:
      status === 'pending_payment'
        ? 0
        : Number(plan.discounted_price),
    start_date: startDate,
    end_date: endDate,
    status,
  }
})

const memberships = await insertRows('memberships', membershipRows)

  // 6. Create payments.

  console.log('Creating payments...')

  const paymentRows = memberships.map((membership, index) => {
    const confirmed = membership.status === 'active' ||
      membership.status === 'expired'

    const paymentMethod = ['bkash', 'nagad', 'cash'][index % 3]

    return {
      membership_id: membership.id,
      user_id: membership.user_id,
      amount: Number(membership.amount_paid),
      payment_method: paymentMethod,
      transaction_id: paymentMethod === 'cash'
        ? null
        : `DEMO-${Date.now()}-${index + 1}`,
      status: confirmed ? 'confirmed' : 'pending',
      confirmed_by: confirmed ? ownerId : null,
      confirmed_at: confirmed ? new Date().toISOString() : null,
    }
  })

  await insertRows('payments', paymentRows)

  // 7. Create membership events.

  console.log('Creating membership events...')

  const eventRows = []

  memberships.forEach((membership) => {
    eventRows.push({
      membership_id: membership.id,
      user_id: membership.user_id,
      event_type: 'requested',
      description: 'Demo membership request.',
    })

    if (membership.status === 'active') {
      eventRows.push({
        membership_id: membership.id,
        user_id: membership.user_id,
        event_type: 'activated',
        description: 'Demo payment confirmed and membership activated.',
      })
    }

    if (membership.status === 'expired') {
      eventRows.push({
        membership_id: membership.id,
        user_id: membership.user_id,
        event_type: 'activated',
        description: 'Demo membership activated.',
      })

      eventRows.push({
        membership_id: membership.id,
        user_id: membership.user_id,
        event_type: 'expired',
        description: 'Demo membership expired.',
      })
    }
  })

  await insertRows('membership_events', eventRows)

  // 8. Create bookings.

  console.log('Creating bookings...')

  const bookingRows = []

  members.forEach((member, index) => {
    const dates = [
      shiftDate(today, -(1 + (index % 10))),
      shiftDate(today, 1 + (index % 12)),
    ]

    dates.forEach((date, bookingIndex) => {
      const hour = 6 + ((index * 3 + bookingIndex * 5) % 16)
      const cancelled = index % 10 === 0 && bookingIndex === 1

      bookingRows.push({
        user_id: member.id,
        booking_date: date,
        start_time: `${pad(hour)}:00:00`,
        end_time: `${pad(hour + 1)}:00:00`,
        status: cancelled ? 'cancelled' : 'booked',
        cancelled_at: cancelled ? new Date().toISOString() : null,
      })
    })
  })

  await insertRows('bookings', bookingRows)

  // 9. Create assigned workout plans.

  console.log('Creating workout plans...')

  const workoutPlanRows = members.slice(0, 8).map((member, index) => ({
    user_id: member.id,
    title: [
      'Strength Foundation',
      'Muscle Building Program',
      'Push Pull Legs',
      'Beginner Fitness Plan',
      'Upper Lower Split',
      'Hypertrophy Program',
      'Strength and Conditioning',
      'Full Body Training',
    ][index],
    structure_mode: 'by_day',
    plan_type: 'assigned',
  }))

  const workoutPlans = await insertRows(
    'workout_plans',
    workoutPlanRows,
  )

  const planExerciseRows = []

  workoutPlans.forEach((plan) => {
    weeklyPlans.forEach((day) => {
      day.exercises.forEach((exerciseName, index) => {
        const exercise = exercises.find(
          (item) => item.name === exerciseName,
        )

        planExerciseRows.push({
          plan_id: plan.id,
          exercise_name: exercise.name,
          day_name: day.day,
          instructions: exercise.instructions,
          sort_order: index,
        })
      })
    })
  })

  await insertRows('plan_exercises', planExerciseRows)

  // 10. Create workout history.

  console.log('Creating workout history...')

  const workoutLogRows = members.slice(0, 12).flatMap((member, index) => {
    return [1, 2].map((offset) => ({
      user_id: member.id,
      workout_date: shiftDate(today, -(offset + index)),
      notes: [
        'Good training session. Focused on controlled repetitions.',
        'Completed planned exercises. Feeling stronger.',
        'Consistent workout with improved performance.',
      ][(index + offset) % 3],
    }))
  })

  const workoutLogs = await insertRows('workout_logs', workoutLogRows)

  const workoutExerciseRows = []

  workoutLogs.forEach((log, index) => {
    workoutExerciseRows.push(
      {
        workout_log_id: log.id,
        exercise_name: 'Bench Press',
        sort_order: 0,
      },
      {
        workout_log_id: log.id,
        exercise_name: 'Lat Pulldown',
        sort_order: 1,
      },
      {
        workout_log_id: log.id,
        exercise_name: 'Barbell Squat',
        sort_order: 2,
      },
    )
  })

  const workoutExercises = await insertRows(
    'workout_log_exercises',
    workoutExerciseRows,
  )

  const workoutSetRows = []

  workoutExercises.forEach((exercise, index) => {
    for (let set = 1; set <= 3; set++) {
      workoutSetRows.push({
        exercise_log_id: exercise.id,
        set_number: set,
        reps: randomNumber(8, 12),
        weight_kg: randomNumber(15, 80),
      })
    }
  })

  await insertRows('workout_log_sets', workoutSetRows)

  // 11. Save credentials locally .removed

  

  console.log('\n======================================')
  console.log('DEMO DATA CREATED SUCCESSFULLY')
  console.log('======================================')
  console.log(`Demo members: ${members.length}`)
  console.log(`Memberships: ${memberships.length}`)
  console.log(`Payments: ${paymentRows.length}`)
  console.log(`Membership events: ${eventRows.length}`)
  console.log(`Bookings: ${bookingRows.length}`)
  console.log(`Workout plans: ${workoutPlans.length}`)
  console.log(`Plan exercises: ${planExerciseRows.length}`)
  console.log(`Workout logs: ${workoutLogs.length}`)
  console.log(`Workout log exercises: ${workoutExerciseRows.length}`)
  console.log(`Workout sets: ${workoutSetRows.length}`)
  console.log('\nCredentials saved to demo-credentials.json')
  console.log('Keep that file private.')
  console.log('\nCredentials saved to demo-credentials.json')
console.log('Keep that file private.')
}

main().catch((error) => {
  console.error('\nSEEDING STOPPED:')
  console.error(error.message)
  console.error(
    '\nDo not run the script again blindly. Check Supabase for partially created demo records first.',
  )
  process.exit(1)
})