export function parseDeviceName(ua: string): string | null {
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /iPhone/.test(ua)
      ? 'iPhone'
      : /iPad/.test(ua)
        ? 'iPad'
        : /Mac OS X/.test(ua)
          ? 'macOS'
          : /Android/.test(ua)
            ? 'Android'
            : /Linux/.test(ua)
              ? 'Linux'
              : null;

  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera\//.test(ua)
      ? 'Opera'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Safari\//.test(ua)
            ? 'Safari'
            : null;

  if (!os && !browser) return null;
  if (!os) return browser;
  if (!browser) return os;
  return `${browser} on ${os}`;
}