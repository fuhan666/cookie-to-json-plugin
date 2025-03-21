export default function HistoryPage({
  history,
  setHistory,
  selectedItems,
  setSelectedItems,
  loadFromHistory,
  showToastMessage,
}) {
  // 全选功能
  const selectAll = () => {
    const allIds = history.map((item) => item.id);
    setSelectedItems(new Set(allIds));
  };

  // 取消全选功能
  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  // 批量删除选中的历史记录
  const deleteSelectedHistory = () => {
    const results = Array.from(selectedItems).map((id) => {
      const docId = `cookie2json/${id}`;
      return window.utools.db.remove(docId);
    });

    const successCount = results.filter((result) => result.ok).length;
    const failCount = results.length - successCount;

    if (successCount > 0) {
      const newHistory = history.filter((h) => !selectedItems.has(h.id));
      setHistory(newHistory);
      setSelectedItems(new Set()); // 清空选中项
      showToastMessage(
        `成功删除${successCount}条记录${
          failCount > 0 ? `，${failCount}条删除失败` : ""
        }`
      );
    } else {
      showToastMessage("删除失败");
    }
  };

  // 删除单条历史记录
  const deleteHistory = (e, item) => {
    e.stopPropagation(); // 阻止触发loadFromHistory
    const docId = `cookie2json/${item.id}`;
    const result = window.utools.db.remove(docId);
    if (result.ok) {
      const newHistory = history.filter((h) => h.id !== item.id);
      setHistory(newHistory);
      showToastMessage("已删除该记录");
    } else {
      showToastMessage("删除失败：" + (result.message || "未知错误"));
    }
  };

  // 添加选择/取消选择项目的处理函数
  const toggleSelectItem = (e, item) => {
    e.stopPropagation(); // 阻止触发loadFromHistory
    const newSelected = new Set(selectedItems);
    if (newSelected.has(item.id)) {
      newSelected.delete(item.id);
    } else {
      newSelected.add(item.id);
    }
    setSelectedItems(newSelected);
  };

  return (
    <div className="history-container">
      {history.length > 0 && (
        <div className="history-actions">
          <div className="history-actions-left">
            <button
              className="select-all-button"
              onClick={selectAll}
              disabled={history.length === 0}
            >
              全选
            </button>
            <button
              className="deselect-all-button"
              onClick={deselectAll}
              disabled={selectedItems.size === 0}
            >
              取消选择
            </button>
          </div>
          <button
            className="batch-delete-button"
            onClick={deleteSelectedHistory}
            disabled={selectedItems.size === 0}
          >
            删除选中({selectedItems.size})
          </button>
        </div>
      )}
      {history.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            color: "var(--text-color)",
          }}
        >
          暂无历史记录
        </div>
      ) : (
        history.map((item) => (
          <div
            key={item.id}
            className="history-item"
            onClick={(e) => {
              // 如果点击的是复选框区域或删除按钮，不触发加载
              if (
                e.target.closest(".history-item-checkbox") ||
                e.target.closest(".delete-button")
              ) {
                return;
              }
              loadFromHistory(item);
            }}
          >
            <div
              className={`history-item-checkbox ${
                selectedItems.size > 0 ? "show" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                toggleSelectItem(e, item);
              }}
            >
              <input
                type="checkbox"
                checked={selectedItems.has(item.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleSelectItem(e, item);
                }}
              />
            </div>
            <div className="history-item-time">
              {new Date(item.timestamp).toLocaleString()}
              {item.name && (
                <span className="history-item-name">{item.name}</span>
              )}
            </div>
            <div className="history-item-content">{item.content}</div>
            <button
              className="delete-button"
              onClick={(e) => deleteHistory(e, item)}
            >
              ×
            </button>
          </div>
        ))
      )}
    </div>
  );
}
