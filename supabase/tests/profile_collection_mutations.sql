-- Real database regression checks. Fixtures are rolled back by a subtransaction;
-- no existing profile, anime, or collection is modified, even on assertion failure.
DO $test$
DECLARE
  v_profile uuid := gen_random_uuid();
  v_anime_a uuid := gen_random_uuid();
  v_anime_b uuid := gen_random_uuid();
  v_anime_c uuid := gen_random_uuid();
  v_kind text;
  v_table text;
  v_limit integer;
  v_before jsonb;
  v_after jsonb;
  v_function regprocedure := 'public.mutate_profile_collection(uuid,text,text,uuid,integer)'::regprocedure;
BEGIN
  IF has_function_privilege('anon', v_function, 'EXECUTE')
     OR has_function_privilege('authenticated', v_function, 'EXECUTE')
     OR NOT has_function_privilege('service_role', v_function, 'EXECUTE') THEN
    RAISE EXCEPTION 'RPC privileges are incorrect';
  END IF;

  BEGIN
    INSERT INTO public.profiles (id, username)
      VALUES (v_profile, 'v3rollback_' || left(replace(v_profile::text, '-', ''), 12));
    INSERT INTO public.anime (id, anilist_id, title_romaji) VALUES
      (v_anime_a, -2100000001, 'V3 rollback fixture A'),
      (v_anime_b, -2100000002, 'V3 rollback fixture B'),
      (v_anime_c, -2100000003, 'V3 rollback fixture C');

    FOREACH v_kind IN ARRAY ARRAY['favorites', 'pinned'] LOOP
      v_table := CASE v_kind WHEN 'favorites' THEN 'profile_favorites' ELSE 'profile_pinned_anime' END;
      v_limit := CASE v_kind WHEN 'favorites' THEN 10 ELSE 6 END;
      IF public.mutate_profile_collection(v_profile, v_kind, 'add', v_anime_a, 1) <> 'OK'
         OR public.mutate_profile_collection(v_profile, v_kind, 'add', v_anime_b, v_limit) <> 'OK' THEN
        RAISE EXCEPTION 'Failed to create isolated collection';
      END IF;

      -- PostgreSQL must reject direct inserts too, independently of the action/RPC.
      BEGIN
        EXECUTE format('INSERT INTO public.%I (profile_id, anime_id, position) VALUES ($1,$2,$3)', v_table)
          USING v_profile, v_anime_c, v_limit + 1;
        RAISE EXCEPTION 'Out-of-range position accepted';
      EXCEPTION WHEN check_violation THEN NULL;
      END;
      BEGIN
        EXECUTE format('INSERT INTO public.%I (profile_id, anime_id, position) VALUES ($1,$2,0)', v_table)
          USING v_profile, v_anime_c;
        RAISE EXCEPTION 'Zero position accepted';
      EXCEPTION WHEN check_violation THEN NULL;
      END;
      BEGIN
        EXECUTE format('INSERT INTO public.%I (profile_id, anime_id, position) VALUES ($1,$2,1)', v_table)
          USING v_profile, v_anime_c;
        RAISE EXCEPTION 'Duplicate position accepted';
      EXCEPTION WHEN unique_violation THEN NULL;
      END;
      BEGIN
        EXECUTE format('INSERT INTO public.%I (profile_id, anime_id, position) VALUES ($1,$2,2)', v_table)
          USING v_profile, v_anime_a;
        RAISE EXCEPTION 'Duplicate anime accepted';
      EXCEPTION WHEN unique_violation THEN NULL;
      END;
      BEGIN
        EXECUTE format('INSERT INTO public.%I (profile_id, anime_id, position) VALUES ($1,$2,2)', v_table)
          USING v_profile, gen_random_uuid();
        RAISE EXCEPTION 'Missing anime accepted';
      EXCEPTION WHEN foreign_key_violation THEN NULL;
      END;

      EXECUTE format('SELECT jsonb_agg(to_jsonb(t) ORDER BY position) FROM public.%I t WHERE profile_id=$1', v_table)
        INTO v_before USING v_profile;
      BEGIN
        IF public.mutate_profile_collection(v_profile, v_kind, 'reorder', v_anime_a, v_limit) <> 'OK' THEN
          RAISE EXCEPTION 'Swap failed before rollback test';
        END IF;
        EXECUTE format('SELECT jsonb_agg(to_jsonb(t) ORDER BY position) FROM public.%I t WHERE profile_id=$1', v_table)
          INTO v_after USING v_profile;
        IF v_before = v_after THEN RAISE EXCEPTION 'Swap made no change'; END IF;
        -- Simulate failure in the transaction after the real swap completed.
        RAISE EXCEPTION USING ERRCODE = 'P0004', MESSAGE = 'Intentional rollback probe';
      EXCEPTION WHEN SQLSTATE 'P0004' THEN NULL;
      END;
      EXECUTE format('SELECT jsonb_agg(to_jsonb(t) ORDER BY position) FROM public.%I t WHERE profile_id=$1', v_table)
        INTO v_after USING v_profile;
      IF v_after IS DISTINCT FROM v_before THEN
        RAISE EXCEPTION 'Failed transaction did not restore the original collection';
      END IF;
    END LOOP;

    IF public.mutate_profile_collection(v_profile, 'unknown', 'add', v_anime_c, 2) <> 'INVALID_INPUT'
       OR public.mutate_profile_collection(v_profile, 'favorites', 'unknown', v_anime_c, 2) <> 'INVALID_INPUT'
       OR public.mutate_profile_collection(gen_random_uuid(), 'favorites', 'add', v_anime_c, 2) <> 'NOT_FOUND' THEN
      RAISE EXCEPTION 'Invalid RPC contract accepted';
    END IF;
    RAISE EXCEPTION USING ERRCODE = 'P0004', MESSAGE = 'Rollback all test fixtures';
  EXCEPTION WHEN SQLSTATE 'P0004' THEN NULL;
  END;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_profile)
     OR EXISTS (SELECT 1 FROM public.anime WHERE id IN (v_anime_a, v_anime_b, v_anime_c)) THEN
    RAISE EXCEPTION 'Rollback left test fixtures behind';
  END IF;
END;
$test$;

SELECT 'PASS: RPC privileges, constraints, contract errors, rollback of both collections and fixture cleanup' AS result;
