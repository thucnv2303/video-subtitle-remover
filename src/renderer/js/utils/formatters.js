/**
 * Formatters — Các hàm định dạng dùng chung
 */

/**
 * Format số giây thành chuỗi MM:SS hoặc HH:MM:SS
 * @param {number} seconds
 * @returns {string}
 */
export function fmtTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';
  const h   = Math.floor(seconds / 3600);
  const m   = Math.floor((seconds % 3600) / 60);
  const s   = Math.floor(seconds % 60);
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format số giây thành chuỗi HH:MM:SS (luôn có giờ)
 * @param {number} seconds
 * @returns {string}
 */
export function fmtTimeFull(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format bytes thành chuỗi dễ đọc (KB, MB, GB)
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Format tiến độ thành chuỗi phần trăm
 * @param {number} value — 0..100
 * @returns {string}
 */
export function fmtPercent(value) {
  return `${Math.round(value || 0)}%`;
}

/**
 * Format timestamp milliseconds thành SRT time string
 * @param {number} ms
 * @returns {string} — HH:MM:SS,mmm
 */
export function msToSrtTime(ms) {
  const h   = Math.floor(ms / 3600000);
  const m   = Math.floor((ms % 3600000) / 60000);
  const s   = Math.floor((ms % 60000) / 1000);
  const mil = ms % 1000;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(mil).padStart(3,'0')}`;
}

/**
 * Truncate chuỗi dài với dấu ...
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
export function truncate(str, maxLen = 50) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen - 3) + '...' : str;
}
