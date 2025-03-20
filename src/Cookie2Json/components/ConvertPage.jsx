import { useRef, useEffect } from "react";

export default function ConvertPage({
  cookieString,
  setCookieString,
  jsonResult,
  setJsonResult,
  highlightedJson,
  setHighlightedJson,
  lastInputContent,
  setLastInputContent,
  showToastMessage,
  handleInputChange,
  saveToHistory,
}) {
  const inputRef = useRef(null);

  // 监听 lastInputContent 变化，更新输入框内容
  useEffect(() => {
    if (inputRef.current && lastInputContent !== inputRef.current.innerText) {
      inputRef.current.innerText = lastInputContent;
    }
  }, [lastInputContent]);

  // 复制JSON到剪贴板
  const copyToClipboard = () => {
    if (!jsonResult) return;
    window.utools.copyText(jsonResult);
    showToastMessage("复制成功");
  };

  // 清除输入内容
  const clearInput = () => {
    setCookieString("");
    setJsonResult("");
    setHighlightedJson("");
    setLastInputContent(""); // 清空时也更新lastInputContent
    if (inputRef.current) {
      inputRef.current.innerText = "";
    }
  };

  // 处理粘贴事件
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    if (inputRef.current) {
      handleInputChange({ target: inputRef.current });
    }
  };

  return (
    <div className="content-container">
      <div className="input-container">
        <div
          ref={inputRef}
          className="cookie-input"
          contentEditable
          onInput={(e) => handleInputChange({ target: e.target })}
          onPaste={handlePaste}
          suppressContentEditableWarning={true}
          placeholder="请输入Cookie字符串，例如：name=value; name2=value2"
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
          <button
            className="save-button"
            onClick={saveToHistory}
            disabled={!cookieString}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
