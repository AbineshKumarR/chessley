/**
 * Persistent Storage Utilities for Offline Match History and Settings
 */

const MATCH_HISTORY_KEY = 'chess_match_history';

/**
 * Retrieve match history list from localStorage.
 * @returns {Array<object>} List of match records (newest first)
 */
export function getMatchHistory() {
  try {
    const raw = localStorage.getItem(MATCH_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to parse match history:', err);
    return [];
  }
}

/**
 * Save a new completed match to match history.
 * @param {object} matchRecord - { id, date, opponentName, opponentRating, opponentAvatar, userColor, result, reason, moveCount, pgn }
 */
export function saveMatch(matchRecord) {
  try {
    const history = getMatchHistory();
    const newEntry = {
      id: matchRecord.id || `match_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      date: matchRecord.date || new Date().toISOString(),
      opponentName: matchRecord.opponentName || 'Chess Bot',
      opponentRating: matchRecord.opponentRating || 1200,
      opponentAvatar: matchRecord.opponentAvatar || '🤖',
      userColor: matchRecord.userColor || 'w',
      result: matchRecord.result || 'Draw', // 'Win' | 'Loss' | 'Draw'
      reason: matchRecord.reason || 'Completed',
      moveCount: matchRecord.moveCount || 0,
      pgn: matchRecord.pgn || ''
    };

    const updated = [newEntry, ...history].slice(0, 50); // Keep latest 50 matches
    localStorage.setItem(MATCH_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save match:', err);
    return [];
  }
}

/**
 * Clear all match history records.
 */
export function clearMatchHistory() {
  try {
    localStorage.removeItem(MATCH_HISTORY_KEY);
  } catch (err) {
    console.error('Failed to clear match history:', err);
  }
}
