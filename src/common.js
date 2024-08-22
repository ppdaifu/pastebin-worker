export const params = {
  CHAR_GEN: "abcdefghijklmnopqrstuvwxyz0123456789",
  NAME_REGEX: /^[a-zA-Z0-9+_\-\[\]]{3,}$/,  // 恢复原来的正则表达式
  RAND_LEN: 8,  // 短链接长度（UUID 的前 8 个字符）
  PRIVATE_RAND_LEN: 32,  // 完整 UUID 长度（不带连字符）
  ADMIN_PATH_LEN: 32,  // 更改为匹配完整 UUID 长度
  SEP: ":",
  MAX_LEN: 25 * 1024 * 1024,
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
  return crypto.randomUUID().replace(/-/g, '').substring(0, len);
}

export function parsePath(pathname) {
  // 路径示例 (SEP=':')。注意：这里不处理查询字符串
  // > example.com/~stocking
  // > example.com/~stocking:uLE4Fhb/d3414adlW653Vx0VSVw=
  // > example.com/abcd
  // > example.com/abcd.jpg
  // > example.com/abcd/myphoto.jpg
  // > example.com/u/abcd
  // > example.com/abcd:3ffd2e7ff214989646e006bd9ad36c58d447065e
  pathname = pathname.slice(1,)  // 去掉开头的斜杠

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

  // 如果有文件名，从文件名解析扩展名，否则从剩余路径名解析
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
  if (endOfShort < 0) endOfShort = pathname.length // 当没有 SEP 时，passwd 为空
  const short = pathname.slice(0, endOfShort)
  const passwd = pathname.slice(endOfShort + 1)
  return { role, short, passwd, ext, filename }
}

export function parseExpiration(expirationStr) {
  const EXPIRE_REGEX = /^[\d\.]+\s*[smhdwM]?$/
  if (!EXPIRE_REGEX.test(expirationStr)) {
    throw new WorkerError(400, `'${expirationStr}' 不是有效的过期时间规范`)
  }

  let expirationSeconds = parseFloat(expirationStr)
  const lastChar = expirationStr[expirationStr.length - 1]
  if (lastChar === 'm') expirationSeconds *= 60
  else if (lastChar === 'h') expirationSeconds *= 3600
  else if (lastChar === 'd') expirationSeconds *= 3600 * 24
  else if (lastChar === 'w') expirationSeconds *= 3600 * 24 * 7
  else if (lastChar === 'M') expirationSeconds *= 3600 * 24 * 30  // 更改为 30 天
  return Math.round(expirationSeconds)  // 四舍五入到最近的整数
}

export function escapeHtml(str) {
  const tagsToReplace = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#x27;"
  }
  return str.replace(/[&<>"']/g, function(tag) {
    return tagsToReplace[tag] || tag
  })
}

// 参考：https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
export function encodeRFC5987ValueChars(str) {
  return encodeURIComponent(str)
    .replace(/['()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%(7C|60|5E)/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// 从 Content-Disposition 字段解码文件名
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
