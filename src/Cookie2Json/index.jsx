import { useState, useEffect } from "react";
import "./style.css";

export default function Cookie2Json({ enterAction }) {
  const [cookieString, setCookieString] = useState("");
  const [jsonResult, setJsonResult] = useState("");
  const [highlightedJson, setHighlightedJson] = useState("");
  const [theme, setTheme] = useState("light");
  const [showToast, setShowToast] = useState(false);

  // 监听系统主题变化
  useEffect(() => {
    // 初始化主题
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(isDark ? "dark" : "light");
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light"
    );

    // 监听主题切换
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleThemeChange = (e) => {
      const newTheme = e.matches ? "dark" : "light";
      setTheme(newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
    };

    mediaQuery.addEventListener("change", handleThemeChange);

    // 清理监听器
    return () => {
      mediaQuery.removeEventListener("change", handleThemeChange);
    };
  }, []);

  function convertCookieToJson(cookieString) {
    if (!cookieString) return {};
    const obj = {};
    // 分割每个Cookie键值对
    const cookies = cookieString.split(";");

    cookies.forEach((cookie) => {
      const trimmedCookie = cookie.trim();
      if (!trimmedCookie) return; // 跳过空字符串

      // 分割键和值（处理值中包含等号的情况）
      const equalIndex = trimmedCookie.indexOf("=");
      let key, value;

      if (equalIndex === -1) {
        key = trimmedCookie;
        value = "";
      } else {
        key = trimmedCookie.slice(0, equalIndex);
        value = trimmedCookie.slice(equalIndex + 1);
      }

      // 解码并存储到对象
      try {
        obj[key.trim()] = decodeURIComponent(value);
      } catch (e) {
        obj[key.trim()] = value; // 解码失败则保留原值
      }
    });

    return obj;
  }

  // 高亮JSON语法
  function highlightJson(json) {
    if (!json) return "";

    // 处理错误信息
    if (json.startsWith("转换出错")) {
      return `<span class="json-error">${json}</span>`;
    }

    // 替换JSON的不同部分
    return (
      json
        // 替换键和冒号
        .replace(
          /"([^"]+)":/g,
          '<span class="json-key">"$1"</span><span class="json-colon">:</span>'
        )
        // 替换字符串值
        .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
        // 替换数字值
        .replace(
          /: ([0-9]+)([,}\n])/g,
          ': <span class="json-number">$1</span>$2'
        )
        // 替换布尔值和null
        .replace(
          /: (true|false|null)([,}\n])/g,
          ': <span class="json-boolean">$1</span>$2'
        )
        // 替换括号
        .replace(/[{]/g, '<span class="json-bracket">{</span>')
        .replace(/[}]/g, '<span class="json-bracket">}</span>')
        .replace(/\[/g, '<span class="json-bracket">[</span>')
        .replace(/\]/g, '<span class="json-bracket">]</span>')
    );
  }

  function extractCookieFromCurl(value) {
    if (value.startsWith("curl --location")) {
      const match = value.match(/--header 'Cookie: (.+?)'/g);
      if (match) {
        return match[0].replace(/--header 'Cookie: (.+?)'/g, "$1");
      }
    }
    return value;
  }

  // 处理输入框内容变化
  const handleInputChange = (e) => {
    const value = e.target.value;
    setCookieString(value);
    try {
      let cookieStr = value;
      cookieStr = extractCookieFromCurl(value);

      const result = convertCookieToJson(cookieStr);
      const formattedJson = JSON.stringify(result, null, 2);
      setJsonResult(formattedJson);
      setHighlightedJson(highlightJson(formattedJson));
    } catch (error) {
      const errorMessage = "转换出错：" + error.message;
      setJsonResult(errorMessage);
      setHighlightedJson(highlightJson(errorMessage));
    }
  };

  // 复制JSON到剪贴板
  const copyToClipboard = () => {
    if (!jsonResult) return;
    window.utools.copyText(jsonResult);
    // 显示自定义Toast提示
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  // 清除输入内容
  const clearInput = () => {
    setCookieString("");
    setJsonResult("");
    setHighlightedJson("");
  };

  return (
    <div className={`cookie2json-container ${theme}`}>
      {showToast && <div className="toast-message">复制成功</div>}
      <div className="input-container">
        <textarea
          className="cookie-input"
          placeholder="请输入Cookie字符串，例如：name=value; name2=value2"
          value={cookieString}
          onChange={handleInputChange}
        />
        <div className="button-container">
          <button
            className="clear-button"
            onClick={clearInput}
            disabled={!cookieString}
          >
            清空
          </button>
        </div>
      </div>
      <div className="output-container">
        <pre
          className="json-output"
          dangerouslySetInnerHTML={{ __html: highlightedJson }}
        ></pre>
        <div className="button-container">
          <button
            className="copy-button"
            onClick={copyToClipboard}
            disabled={!jsonResult}
          >
            复制
          </button>
        </div>
      </div>
    </div>
  );
}
