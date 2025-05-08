import { useRef, useEffect, useState } from "react";
import SaveDialog from "./SaveDialog";

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
  animationDirection,
}) {
  const inputRef = useRef(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);

  // 监听 lastInputContent 变化，但只在非用户输入时更新输入框内容
  useEffect(() => {
    if (
      inputRef.current &&
      !isUserTyping &&
      lastInputContent !== inputRef.current.innerText
    ) {
      inputRef.current.innerText = lastInputContent;
    }
  }, [lastInputContent, isUserTyping]);

  useEffect(() => {
    if (inputRef.current && lastInputContent) {
      inputRef.current.innerText = lastInputContent;
    }
  }, []);

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
    setLastInputContent("");
    if (inputRef.current) {
      inputRef.current.innerText = "";
    }
  };

  // 处理粘贴事件
  const handlePaste = (e) => {
    e.preventDefault();
    setIsUserTyping(true);
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    if (inputRef.current) {
      handleInputChange({ target: inputRef.current });
    }
    setTimeout(() => setIsUserTyping(false), 0);
  };

  // 处理用户输入
  const handleUserInput = (e) => {
    setIsUserTyping(true);
    handleInputChange({ target: e.target });
    setTimeout(() => setIsUserTyping(false), 0);
  };

  const handleSave = () => {
    setShowSaveDialog(true);
  };

  const handleSaveConfirm = (name) => {
    saveToHistory(name);
    setShowSaveDialog(false);
  };

  const handleSaveCancel = () => {
    setShowSaveDialog(false);
  };

  return (
    <div className={`content-container ${animationDirection}`}>
      {showSaveDialog && (
        <SaveDialog onSave={handleSaveConfirm} onCancel={handleSaveCancel} />
      )}
      <div className="input-container">
        <div
          ref={inputRef}
          className="cookie-input"
          contentEditable
          onInput={handleUserInput}
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
            onClick={handleSave}
            disabled={!cookieString}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
