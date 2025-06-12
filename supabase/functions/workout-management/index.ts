import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateWorkoutRequest {
  title: string;
  estimated_duration?: number;
  notes?: string;
  exercises: {
    exercise_id: string;
    order_index: number;
    set_count: number;
    rep_min?: number;
    rep_max?: number;
    reps?: string;
    default_weight?: string;
    rest_seconds?: number;
    notes?: string;
  }[];
}

interface UpdateWorkoutRequest {
  title?: string;
  estimated_duration?: number;
  notes?: string;
  exercises?: {
    id?: string; // 既存のエクササイズを更新する場合
    exercise_id: string;
    order_index: number;
    set_count: number;
    rep_min?: number;
    rep_max?: number;
    reps?: string;
    default_weight?: string;
    rest_seconds?: number;
    notes?: string;
  }[];
}

serve(async (req) => {
  // CORS対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // ユーザー認証確認
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const method = req.method
    const pathSegments = url.pathname.split('/').filter(Boolean)
    
    // GET /workout-management - 全ワークアウト取得
    if (method === 'GET' && pathSegments.length === 1) {
      const { data: workouts, error } = await supabaseClient
        .from('user_workouts')
        .select(`
          *,
          exercises:user_workout_exercises(
            *,
            exercise:exercises(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // エクササイズをorder_indexでソート
      const sortedWorkouts = workouts.map(workout => ({
        ...workout,
        exercises: workout.exercises.sort((a, b) => a.order_index - b.order_index)
      }))

      return new Response(
        JSON.stringify({ workouts: sortedWorkouts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /workout-management/{id} - 特定ワークアウト取得
    if (method === 'GET' && pathSegments.length === 2) {
      const workoutId = pathSegments[1]
      
      const { data: workout, error } = await supabaseClient
        .from('user_workouts')
        .select(`
          *,
          exercises:user_workout_exercises(
            *,
            exercise:exercises(*)
          )
        `)
        .eq('id', workoutId)
        .eq('user_id', user.id)
        .single()

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // エクササイズをorder_indexでソート
      workout.exercises = workout.exercises.sort((a, b) => a.order_index - b.order_index)

      return new Response(
        JSON.stringify({ workout }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /workout-management - 新しいワークアウト作成
    if (method === 'POST' && pathSegments.length === 1) {
      const body: CreateWorkoutRequest = await req.json()

      // トランザクション開始
      const { data: workout, error: workoutError } = await supabaseClient
        .from('user_workouts')
        .insert({
          user_id: user.id,
          title: body.title,
          estimated_duration: body.estimated_duration,
          notes: body.notes
        })
        .select()
        .single()

      if (workoutError) {
        return new Response(
          JSON.stringify({ error: workoutError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // エクササイズを追加
      if (body.exercises && body.exercises.length > 0) {
        const exercisesToInsert = body.exercises.map(exercise => ({
          user_workout_id: workout.id,
          exercise_id: exercise.exercise_id,
          order_index: exercise.order_index,
          set_count: exercise.set_count,
          rep_min: exercise.rep_min,
          rep_max: exercise.rep_max,
          reps: exercise.reps || '0',
          default_weight: exercise.default_weight,
          rest_seconds: exercise.rest_seconds || 60,
          notes: exercise.notes
        }))

        const { error: exercisesError } = await supabaseClient
          .from('user_workout_exercises')
          .insert(exercisesToInsert)

        if (exercisesError) {
          // ワークアウトを削除してロールバック
          await supabaseClient
            .from('user_workouts')
            .delete()
            .eq('id', workout.id)

          return new Response(
            JSON.stringify({ error: exercisesError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // 作成されたワークアウトを取得（エクササイズ含む）
      const { data: createdWorkout, error: fetchError } = await supabaseClient
        .from('user_workouts')
        .select(`
          *,
          exercises:user_workout_exercises(
            *,
            exercise:exercises(*)
          )
        `)
        .eq('id', workout.id)
        .single()

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: fetchError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      createdWorkout.exercises = createdWorkout.exercises.sort((a, b) => a.order_index - b.order_index)

      return new Response(
        JSON.stringify({ workout: createdWorkout }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // PUT /workout-management/{id} - ワークアウト更新
    if (method === 'PUT' && pathSegments.length === 2) {
      const workoutId = pathSegments[1]
      const body: UpdateWorkoutRequest = await req.json()

      // ワークアウト基本情報を更新
      const updateData: any = {}
      if (body.title !== undefined) updateData.title = body.title
      if (body.estimated_duration !== undefined) updateData.estimated_duration = body.estimated_duration
      if (body.notes !== undefined) updateData.notes = body.notes

      if (Object.keys(updateData).length > 0) {
        const { error: workoutError } = await supabaseClient
          .from('user_workouts')
          .update(updateData)
          .eq('id', workoutId)
          .eq('user_id', user.id)

        if (workoutError) {
          return new Response(
            JSON.stringify({ error: workoutError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // エクササイズを更新
      if (body.exercises) {
        // 既存のエクササイズを削除
        await supabaseClient
          .from('user_workout_exercises')
          .delete()
          .eq('user_workout_id', workoutId)

        // 新しいエクササイズを追加
        if (body.exercises.length > 0) {
          const exercisesToInsert = body.exercises.map(exercise => ({
            user_workout_id: workoutId,
            exercise_id: exercise.exercise_id,
            order_index: exercise.order_index,
            set_count: exercise.set_count,
            rep_min: exercise.rep_min,
            rep_max: exercise.rep_max,
            reps: exercise.reps || '0',
            default_weight: exercise.default_weight,
            rest_seconds: exercise.rest_seconds || 60,
            notes: exercise.notes
          }))

          const { error: exercisesError } = await supabaseClient
            .from('user_workout_exercises')
            .insert(exercisesToInsert)

          if (exercisesError) {
            return new Response(
              JSON.stringify({ error: exercisesError.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }
      }

      // 更新されたワークアウトを取得
      const { data: updatedWorkout, error: fetchError } = await supabaseClient
        .from('user_workouts')
        .select(`
          *,
          exercises:user_workout_exercises(
            *,
            exercise:exercises(*)
          )
        `)
        .eq('id', workoutId)
        .single()

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: fetchError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      updatedWorkout.exercises = updatedWorkout.exercises.sort((a, b) => a.order_index - b.order_index)

      return new Response(
        JSON.stringify({ workout: updatedWorkout }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // DELETE /workout-management/{id} - ワークアウト削除
    if (method === 'DELETE' && pathSegments.length === 2) {
      const workoutId = pathSegments[1]

      const { error } = await supabaseClient
        .from('user_workouts')
        .delete()
        .eq('id', workoutId)
        .eq('user_id', user.id)

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ message: 'Workout deleted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not Found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 