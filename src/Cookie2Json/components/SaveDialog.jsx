import React, { useState, useRef, useEffect } from "react";

export default function SaveDialog({ onSave, onCancel }) {
  const [name, setName] = useState("");
  const dialogRef = useRef(null);
  const inputRef = useRef(null);

  const updateDialogPosition = () => {
    if (dialogRef.current) {
      const saveButton = document.querySelector(
        ".output-container .button-container .save-button"
      );
      if (saveButton) {
        const rect = saveButton.getBoundingClientRect();
        const dialog = dialogRef.current;
        dialog.style.right = `${window.innerWidth - rect.right}px`;
      }
    }
  };

  useEffect(() => {
    // 初始化位置
    updateDialogPosition();

    // 添加窗口大小变化监听器
    window.addEventListener("resize", updateDialogPosition);

    // 清理监听器
    return () => {
      window.removeEventListener("resize", updateDialogPosition);
    };
  }, []);

  const handleSave = () => {
    onSave(name);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="save-dialog-overlay" onClick={handleOverlayClick}>
      <div className="save-dialog" ref={dialogRef}>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入名称（可选）"
          className="save-dialog-input"
          autoFocus
        />
        <div className="save-dialog-buttons">
          <button onClick={handleSave} className="save-button">
            保存
          </button>
          <button onClick={onCancel} className="cancel-button">
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
