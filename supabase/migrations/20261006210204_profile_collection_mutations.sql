-- Stage 3C.3 / Etapa 1. Only server code may choose the profile identity.
-- Slot semantics: an occupied destination swaps items; deletion leaves a gap.
-- All six mutations use the same profile lock, so full lists can be reordered.
CREATE OR REPLACE FUNCTION public.mutate_profile_collection(
  p_profile_id uuid,
  p_collection text,
  p_operation text,
  p_anime_id uuid,
  p_position integer DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_table text;
  v_limit integer;
  v_source_position integer;
  v_destination_id uuid;
BEGIN
  IF p_profile_id IS NULL OR p_anime_id IS NULL
     OR p_collection IS NULL OR p_collection NOT IN ('favorites', 'pinned')
     OR p_operation IS NULL OR p_operation NOT IN ('add', 'remove', 'reorder') THEN
    RETURN 'INVALID_INPUT';
  END IF;

  IF p_collection = 'favorites' THEN
    v_table := 'profile_favorites';
    v_limit := 10;
  ELSE
    v_table := 'profile_pinned_anime';
    v_limit := 6;
  END IF;

  IF p_operation <> 'remove'
     AND (p_position IS NULL OR p_position < 1 OR p_position > v_limit) THEN
    RETURN 'INVALID_INPUT';
  END IF;

  -- No key is changed. NO KEY UPDATE permits unrelated FK key-share locks.
  -- This lock is held only for this database transaction, never across API calls.
  PERFORM id FROM public.profiles WHERE id = p_profile_id FOR NO KEY UPDATE;
  IF NOT FOUND THEN
    RETURN 'NOT_FOUND';
  END IF;

  -- Table names come exclusively from the allowlist above; values are parameters.
  EXECUTE format(
    'SELECT position FROM public.%I WHERE profile_id = $1 AND anime_id = $2 FOR UPDATE',
    v_table
  ) INTO v_source_position USING p_profile_id, p_anime_id;

  IF p_operation = 'add' THEN
    IF v_source_position IS NOT NULL THEN
      RETURN 'ALREADY_EXISTS';
    END IF;
    PERFORM id FROM public.anime WHERE id = p_anime_id FOR KEY SHARE;
    IF NOT FOUND THEN
      RETURN 'NOT_FOUND';
    END IF;
    EXECUTE format(
      'SELECT anime_id FROM public.%I WHERE profile_id = $1 AND position = $2 FOR UPDATE',
      v_table
    ) INTO v_destination_id USING p_profile_id, p_position;
    IF v_destination_id IS NOT NULL THEN
      RETURN 'POSITION_CONFLICT';
    END IF;
    EXECUTE format(
      'INSERT INTO public.%I (profile_id, anime_id, position) VALUES ($1, $2, $3)',
      v_table
    ) USING p_profile_id, p_anime_id, p_position;
    RETURN 'OK';
  END IF;

  IF v_source_position IS NULL THEN
    RETURN 'NOT_FOUND';
  END IF;

  IF p_operation = 'remove' THEN
    EXECUTE format('DELETE FROM public.%I WHERE profile_id = $1 AND anime_id = $2', v_table)
      USING p_profile_id, p_anime_id;
    RETURN 'OK';
  END IF;

  IF v_source_position = p_position THEN
    RETURN 'OK';
  END IF;

  EXECUTE format(
    'SELECT anime_id FROM public.%I WHERE profile_id = $1 AND position = $2 FOR UPDATE',
    v_table
  ) INTO v_destination_id USING p_profile_id, p_position;

  IF v_destination_id IS NULL THEN
    EXECUTE format(
      'UPDATE public.%I SET position = $3 WHERE profile_id = $1 AND anime_id = $2',
      v_table
    ) USING p_profile_id, p_anime_id, p_position;
  ELSE
    -- Both rows are restored in the same transaction. No temporary out-of-range
    -- position or constraint change is needed, even when every slot is occupied.
    EXECUTE format(
      'DELETE FROM public.%I WHERE profile_id = $1 AND anime_id IN ($2, $3)', v_table
    ) USING p_profile_id, p_anime_id, v_destination_id;
    EXECUTE format(
      'INSERT INTO public.%I (profile_id, anime_id, position) VALUES ($1, $2, $4), ($1, $3, $5)',
      v_table
    ) USING p_profile_id, p_anime_id, v_destination_id, p_position, v_source_position;
  END IF;
  RETURN 'OK';
EXCEPTION
  -- PL/pgSQL rolls back all changes in this block before handling an exception.
  WHEN unique_violation THEN RETURN 'POSITION_CONFLICT';
  WHEN foreign_key_violation THEN RETURN 'NOT_FOUND';
END;
$function$;

REVOKE ALL ON FUNCTION public.mutate_profile_collection(uuid, text, text, uuid, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mutate_profile_collection(uuid, text, text, uuid, integer)
  TO service_role;

COMMENT ON FUNCTION public.mutate_profile_collection(uuid, text, text, uuid, integer)
  IS 'Server-only profile collection mutations. Identity is supplied by getSession, never by the browser. Occupied destinations swap; removal preserves other positions.';
