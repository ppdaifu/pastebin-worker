import { v4 as uuidv4 } from 'uuid';

export const params = {
  RAND_LEN : 8,  // 用于短链接，UUID的前八位
  PRIVATE_RAND_LEN : 32,  // 用于长链接，完整的UUID (去掉 "-" 符号)
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
  // 生成UUID并转换为小写字母
  const uuid = uuidv4().replace(/-/g, "").toLowerCase();  // 移除UUID中的"-"并转为小写
  return uuid.slice(0, len);  // 根据传入的长度参数截取相应长度的字符串
}

export function parsePath(pathname) {
  pathname = pathname.slice(1,);  // strip the leading slash

  let role = "", ext = "", filename = undefined
  if (pathname[1] === "/") {
    role = pathname[0]
    pathname = pathname.slice(2)
  }

  let startOfFilename = pathname.lastIndexOf("/")
  if (startOfFilename >= 0) {
    filename = pathname.slice(startOfFilename + 1)
    pathname = pathname.slice(0, startOfFilename)
  }

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
