import React, { useState, useEffect, useRef } from "react";

export default function HistoryPage({
  history,
  setHistory,
  selectedItems,
  setSelectedItems,
  loadFromHistory,
  showToastMessage,
  animationDirection,
  editingItem,
  setEditingItem,
  editName,
  setEditName,
  editContent,
  setEditContent,
  historyScrollPosition,
  setHistoryScrollPosition,
}) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const nameInputRef = useRef(null);
  const historyContainerRef = useRef(null);
  // 添加一个标记，避免滚动状态循环更新
  const isManualScrolling = useRef(false);

  // 监听滚动事件并保存滚动位置
  useEffect(() => {
    const container = historyContainerRef.current;
    if (!container) return;

    // 恢复保存的滚动位置，但只在初次渲染时
    if (historyScrollPosition > 0 && !isManualScrolling.current) {
      container.scrollTop = historyScrollPosition;
    }

    const handleScroll = () => {
      // 当滚动位置大于100px时显示按钮，否则隐藏
      setShowScrollTop(container.scrollTop > 100);

      // 只有当不是手动滚动时才更新滚动位置状态
      if (!isManualScrolling.current) {
        setHistoryScrollPosition(container.scrollTop);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [historyScrollPosition, setHistoryScrollPosition]);

  // 如果正在编辑项目，确保编辑项在视图中
  useEffect(() => {
    if (!editingItem || !historyContainerRef.current) return;

    // 找到要编辑的项
    const container = historyContainerRef.current;
    setTimeout(() => {
      const editingItemElement = document.querySelector(
        `.history-item[data-id="${editingItem.id}"]`
      );

      if (editingItemElement && container) {
        // 获取编辑项的位置信息
        const rect = editingItemElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // 计算需要的额外空间
        const padding = 20;

        // 如果编辑项顶部不可见或太靠近顶部，向上滚动
        if (rect.top < containerRect.top + padding) {
          isManualScrolling.current = true;
          const scrollOffset =
            container.scrollTop + (rect.top - containerRect.top - padding);
          container.scrollTo({
            top: scrollOffset,
            behavior: "smooth",
          });

          // 滚动完成后重新启用状态更新
          setTimeout(() => {
            isManualScrolling.current = false;
            setHistoryScrollPosition(container.scrollTop);
          }, 300);
        }
        // 如果编辑项底部超出可视区域，向下滚动
        else if (rect.bottom > containerRect.bottom - padding) {
          isManualScrolling.current = true;
          const scrollOffset =
            container.scrollTop +
            (rect.bottom - containerRect.bottom + padding);
          container.scrollTo({
            top: scrollOffset,
            behavior: "smooth",
          });

          // 滚动完成后重新启用状态更新
          setTimeout(() => {
            isManualScrolling.current = false;
            setHistoryScrollPosition(container.scrollTop);
          }, 300);
        }
      }
    }, 100); // 给DOM更新一些时间
  }, [editingItem]);

  // 返回顶部功能
  const scrollToTop = () => {
    if (historyContainerRef.current) {
      isManualScrolling.current = true; // 设置标记，防止滚动事件处理程序中的状态更新

      historyContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      // 监听滚动完成
      const checkScrollEnd = () => {
        if (historyContainerRef.current.scrollTop <= 10) {
          // 已接近顶部，确保完全滚动到顶部
          if (historyContainerRef.current.scrollTop !== 0) {
            historyContainerRef.current.scrollTop = 0;
          }

          // 重置标记并更新状态
          isManualScrolling.current = false;
          setHistoryScrollPosition(0);
        } else {
          // 继续检查直到滚动完成
          setTimeout(checkScrollEnd, 100);
        }
      };

      // 开始检查滚动是否完成
      setTimeout(checkScrollEnd, 100);
    }
  };

  // 自动调整文本框高度
  const adjustTextareaHeight = (textarea) => {
    if (textarea) {
      // 保存当前滚动位置
      const containerElement = textarea.closest(".history-container");
      const scrollTop = containerElement ? containerElement.scrollTop : 0;

      // 临时禁用过渡
      const originalTransition = textarea.style.transition;
      textarea.style.transition = "none";

      // 设置为自动高度来获取内容实际高度
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;

      // 重置为当前高度以准备动画
      const currentHeight = textarea.offsetHeight;
      textarea.style.height = `${currentHeight}px`;

      // 强制浏览器重绘
      void textarea.offsetHeight;

      // 恢复过渡效果并设置新高度
      textarea.style.transition = originalTransition;
      const newHeight = Math.min(scrollHeight, window.innerHeight * 0.5);
      textarea.style.height = `${newHeight}px`;

      // 恢复滚动位置
      if (containerElement) {
        containerElement.scrollTop = scrollTop;
      }

      // 在动画结束后检查文本框位置并滚动
      setTimeout(() => {
        const editingItemElement = textarea.closest(".history-item");
        if (editingItemElement && containerElement) {
          isManualScrolling.current = true; // 设置标记，防止滚动事件处理程序中的状态更新

          // 获取编辑项的位置信息
          const rect = editingItemElement.getBoundingClientRect();
          const containerRect = containerElement.getBoundingClientRect();

          // 如果编辑项底部超出可视区域，向下滚动
          if (rect.bottom > containerRect.bottom - 20) {
            const scrollOffset = rect.bottom - containerRect.bottom + 20;
            containerElement.scrollBy({
              top: scrollOffset,
              behavior: "smooth",
            });

            // 滚动完成后更新状态并重置标记
            setTimeout(() => {
              isManualScrolling.current = false;
              setHistoryScrollPosition(containerElement.scrollTop);
            }, 300);
          } else {
            // 如果不需要滚动，直接重置标记
            isManualScrolling.current = false;
          }
        }
      }, 80); // 与过渡动画时间匹配
    }
  };

  // 处理文本框内容变化
  const handleContentChange = (e) => {
    setEditContent(e.target.value);
    adjustTextareaHeight(e.target);
  };

  // 开始编辑
  const startEdit = (item) => {
    // 先设置编辑状态，触发UI更新
    setEditingItem(item);
    setEditName(item.name || "");
    setEditContent(item.content);

    // 使用 setTimeout 确保在 DOM 更新后再聚焦和滚动
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();

        // 获取编辑项的DOM元素
        const editingItemElement =
          nameInputRef.current.closest(".history-item");
        if (editingItemElement) {
          editingItemElement.classList.add("editing-start");

          // 获取编辑项的位置信息
          const rect = editingItemElement.getBoundingClientRect();
          const containerElement =
            editingItemElement.closest(".history-container");
          const containerRect = containerElement.getBoundingClientRect();

          // 设置标记，防止滚动事件处理程序中的状态更新
          isManualScrolling.current = true;

          // 计算需要的额外空间
          const padding = 20;

          // 如果编辑项顶部不可见或太靠近顶部，向上滚动
          if (rect.top < containerRect.top + padding) {
            const scrollOffset =
              containerElement.scrollTop +
              (rect.top - containerRect.top - padding);
            containerElement.scrollTo({
              top: scrollOffset,
              behavior: "smooth",
            });
          }
          // 如果编辑项底部超出可视区域，向下滚动
          else if (rect.bottom > containerRect.bottom - padding) {
            const scrollOffset =
              containerElement.scrollTop +
              (rect.bottom - containerRect.bottom + padding);
            containerElement.scrollTo({
              top: scrollOffset,
              behavior: "smooth",
            });
          }

          // 滚动完成后，更新状态并重置标记
          setTimeout(() => {
            isManualScrolling.current = false;
            setHistoryScrollPosition(containerElement.scrollTop);
          }, 300);
        }
      }
    }, 0);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingItem(null);
    setEditName("");
    setEditContent("");
  };

  // 保存编辑
  const saveEdit = (item) => {
    const docId = `cookie2json/${item.id}`;
    // 先获取当前文档
    const currentDoc = window.utools.db.get(docId);
    if (!currentDoc) {
      showToastMessage("修改失败：找不到原始记录");
      return;
    }

    const doc = {
      _id: docId,
      _rev: currentDoc._rev,
      data: {
        content: editContent,
        timestamp: item.timestamp,
        name: editName,
      },
    };

    const result = window.utools.db.put(doc);
    if (result?.ok) {
      const newHistory = history.map((h) => {
        if (h.id === item.id) {
          return {
            ...h,
            content: editContent,
            name: editName,
          };
        }
        return h;
      });
      setHistory(newHistory);
      showToastMessage("修改成功");
      cancelEdit();
    } else {
      showToastMessage("修改失败：" + (result?.message || "未知错误"));
    }
  };

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
    // 为选中的条目添加删除动画类
    document.querySelectorAll(".history-item").forEach((item) => {
      const id = parseInt(item.getAttribute("data-id"));
      if (selectedItems.has(id)) {
        item.classList.add("deleting");
      }
    });

    // 等待动画完成后再删除
    setTimeout(() => {
      const results = Array.from(selectedItems).map((id) => {
        const docId = `cookie2json/${id}`;
        return window.utools.db.remove(docId);
      });

      const successCount = results.filter((result) => result?.ok).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        // 删除成功，通过状态更新让React管理DOM
        const newHistory = history.filter((h) => !selectedItems.has(h.id));
        setHistory(newHistory);
        setSelectedItems(new Set());
        showToastMessage(
          `成功删除${successCount}条记录${
            failCount > 0 ? `，${failCount}条删除失败` : ""
          }`
        );
      } else {
        // 删除失败，移除动画类
        document.querySelectorAll(".history-item.deleting").forEach((item) => {
          item.classList.remove("deleting");
        });
        showToastMessage("删除失败");
      }
    }, 250);
  };

  // 删除单条历史记录
  const deleteHistory = (e, item) => {
    e.stopPropagation();

    // 首先添加按钮点击动画
    const deleteButton = e.currentTarget;

    // 获取点击的记录项元素
    const historyItem = deleteButton.closest(".history-item");
    if (historyItem) {
      historyItem.classList.add("deleting");

      // 等待动画完成后再删除
      setTimeout(() => {
        const docId = `cookie2json/${item.id}`;
        const result = window.utools.db.remove(docId);

        if (result?.ok) {
          const newHistory = history.filter((h) => h.id !== item.id);
          setHistory(newHistory);
          showToastMessage("删除成功");
        } else {
          historyItem.classList.remove("deleting");
          showToastMessage("删除失败：" + (result?.message || "未知错误"));
        }
      }, 250);
    } else {
      // 如果没有找到元素，直接删除
      const docId = `cookie2json/${item.id}`;
      const result = window.utools.db.remove(docId);
      if (result?.ok) {
        const newHistory = history.filter((h) => h.id !== item.id);
        setHistory(newHistory);
        showToastMessage("删除成功");
      } else {
        showToastMessage("删除失败：" + (result?.message || "未知错误"));
      }
    }
  };

  // 添加选择/取消选择项目的处理函数
  const toggleSelectItem = (e, item) => {
    e.stopPropagation();
    const newSelected = new Set(selectedItems);
    if (newSelected.has(item.id)) {
      newSelected.delete(item.id);
    } else {
      newSelected.add(item.id);
    }
    setSelectedItems(newSelected);
  };

  return (
    <>
      {history.length > 0 && !editingItem && (
        <div className="history-actions">
          <div className="history-actions-left">
            {showScrollTop && (
              <button
                className="scroll-top-button"
                onClick={scrollToTop}
                title="返回顶部"
              >
                <span>返回顶部</span>
              </button>
            )}
            <button
              className="select-all-button"
              onClick={selectAll}
              disabled={history.length === 0}
            >
              <span>全选</span>
            </button>
            <button
              className="deselect-all-button"
              onClick={deselectAll}
              disabled={selectedItems.size === 0}
            >
              <span>取消选择</span>
            </button>
          </div>
          <button
            className="batch-delete-button"
            onClick={deleteSelectedHistory}
            disabled={selectedItems.size === 0}
          >
            <span>删除选中({selectedItems.size})</span>
          </button>
        </div>
      )}

      <div
        className={`history-container ${animationDirection}`}
        ref={historyContainerRef}
      >
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
              data-id={item.id}
              className={`history-item ${
                editingItem?.id === item.id ? "editing" : ""
              }`}
              onClick={(e) => {
                if (
                  e.target.closest(".history-item-checkbox") ||
                  e.target.closest(".delete-button") ||
                  e.target.closest(".edit-button") ||
                  editingItem?.id === item.id
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
                  if (editingItem) return;
                  e.stopPropagation();
                  toggleSelectItem(e, item);
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={(e) => {
                    if (editingItem) return;
                    e.stopPropagation();
                    toggleSelectItem(e, item);
                  }}
                />
              </div>
              {editingItem?.id === item.id ? (
                <div
                  className="history-item-edit-form"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="history-item-edit-row">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="输入名称（可选）"
                      className="history-item-name-input"
                    />
                    <div className="history-item-edit-buttons">
                      <button
                        onClick={() => saveEdit(item)}
                        className="save-button"
                      >
                        保存
                      </button>
                      <button onClick={cancelEdit} className="cancel-button">
                        取消
                      </button>
                    </div>
                  </div>
                  <div className="history-item-edit-row">
                    <textarea
                      value={editContent}
                      onChange={handleContentChange}
                      className="history-item-content-input"
                      onFocus={(e) => adjustTextareaHeight(e.target)}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="history-item-time">
                    {new Date(item.timestamp).toLocaleString()}
                    {item.name && (
                      <span className="history-item-name">{item.name}</span>
                    )}
                  </div>
                  <div className="history-item-content">{item.content}</div>
                  <button
                    className="edit-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(item);
                    }}
                  >
                    ✎
                  </button>
                  <button
                    className="delete-button"
                    onClick={(e) => deleteHistory(e, item)}
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
