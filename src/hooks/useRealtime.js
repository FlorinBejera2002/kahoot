import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtimeTable(table, filter, event, callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!filter) return;

    const channel = supabase
      .channel(`${table}:${filter}`)
      .on('postgres_changes', {
        event: event || '*',
        schema: 'public',
        table,
        filter,
      }, (payload) => {
        callbackRef.current(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, event]);
}

export function useRealtimeGameSession(gameSessionId, callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!gameSessionId) return;

    const channel = supabase
      .channel(`game-session:${gameSessionId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${gameSessionId}`,
      }, (payload) => {
        callbackRef.current(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameSessionId]);
}

export function useRealtimePlayers(gameSessionId, onInsert, onUpdate) {
  const insertRef = useRef(onInsert);
  const updateRef = useRef(onUpdate);
  insertRef.current = onInsert;
  updateRef.current = onUpdate;

  useEffect(() => {
    if (!gameSessionId) return;

    const channel = supabase
      .channel(`players:${gameSessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'player_sessions',
        filter: `game_session_id=eq.${gameSessionId}`,
      }, (payload) => {
        insertRef.current?.(payload.new);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'player_sessions',
        filter: `game_session_id=eq.${gameSessionId}`,
      }, (payload) => {
        updateRef.current?.(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameSessionId]);
}
