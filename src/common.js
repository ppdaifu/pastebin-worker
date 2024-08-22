import { v4 as uuidv4 } from 'uuid';

export const params = {
  CHAR_GEN : "abcdefghijklmnopqrstuvwxyz0123456789",
  NAME_REGEX : /^[a-zA-Z0-9+_\-\[\]*$@,;]{3,}$/,
  RAND_LEN : 4,
  PRIVATE_RAND_LEN : 24,
  ADMIN_PATH_LEN : 24,
  SEP : ":",
  MAX_LEN : 25 * 1024 * 1024,
}

export function decode(arrayBuffer) {
  return new TextDecoder().decode(arrayBuffer)
}

export class WorkerError extends Error {
  constructor(statusCode, ...params) {
    super(...params)
    this.statusCode = statusCode
  }
}

export function genRandStr(len) {
  // 生成随机字符串
  let str = uuidv4().replace(/-/g, '').slice(0, len);
  return str;
}

export function parsePath(pathname) {
  pathname = pathname.slice(1,)  // 去掉前导斜杠

  let role = "", ext = "", filename = undefined
  if (pathname[1] === "/") {
    role = pathname[0]
    pathname = pathname.slice(2)
  }

  // 解析文件名
  let startOfFilename = pathname.lastIndexOf("/")
  if (startOfFilename >= 0) {
    filename = pathname.slice(startOfFilename + 1)
    pathname = pathname.slice(0, startOfFilename)
  }

  // 如果有文件名，从文件名解析扩展名，否则从路径解析扩展名
  if (filename) {
    let startOfExt = filename.indexOf(".")
    if (startOfExt >= 0) {
      ext = filename.slice(startOfExt)
    }
  } else {
    let startOfExt = pathname.indexOf(".")
    if (startOfExt >= 0) {
      ext = pathname.slice(startOfExt)
      pathname = pathname.slice(0, startOfExt)
    }
  }

  let endOfShort = pathname.indexOf(params.SEP)
  if (endOfShort < 0) endOfShort = pathname.length
  const short = pathname.slice(0, endOfShort)
  const passwd = pathname.slice(endOfShort + 1)
  return { role, short, passwd, ext, filename }
}

export function parseExpiration(expirationStr) {
  const EXPIRE_REGEX = /^[\d\.]+\s*[smhdwM]?$/
  if (!EXPIRE_REGEX.test(expirationStr)) {
    throw new WorkerError(400, `‘${expirationStr}’ is not a valid expiration specification`)
  }

  let expirationSeconds = parseFloat(expirationStr)
  const lastChar = expirationStr[expirationStr.length - 1]
  if (lastChar === 'm') expirationSeconds *= 60
  else if (lastChar === 'h') expirationSeconds *= 3600
  else if (lastChar === 'd') expirationSeconds *= 3600 * 24
  else if (lastChar === 'w') expirationSeconds *= 3600 * 24 * 7
  else if (lastChar === 'M') expirationSeconds *= 3600 * 24 * 7 * 30
  return expirationSeconds
}

export function escapeHtml(str) {
  const tagsToReplace = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot",
    "'": "&#x27"
  }
  return str.replace(/[&<>]/g, function (tag) {
    return tagsToReplace[tag] || tag
  })
}

export function encodeRFC5987ValueChars(str) {
  return (
    encodeURIComponent(str)
      .replace(
        /['()*]/g,
        (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
      )
      .replace(/%(7C|60|5E)/g, (str, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      )
  );
}

export function getDispFilename(fields) {
  if ('filename' in fields) {
    return fields['filename']
  } else if ('filename*' in fields) {
    return decodeURIComponent(fields['filename*'])
  } else {
    return undefined
  }
}

export function isLegalUrl(url) {
  return URL.canParse(url)
}
