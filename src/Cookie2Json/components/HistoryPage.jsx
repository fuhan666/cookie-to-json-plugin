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
  searchKeyword,
  setSearchKeyword,
  handleSearchInput,
}) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const nameInputRef = useRef(null);
  const historyContainerRef = useRef(null);
  // 添加一个标记，避免滚动状态循环更新
  const isManualScrolling = useRef(false);
  // 添加标记，记录是否已经初始化过子输入框
  const hasInitializedSubInput = useRef(false);

  // 子输入框管理函数
  const setupSubInput = (keyword = searchKeyword) => {
    window.utools.setSubInput(handleSearchInput, "搜索历史记录...", false);
    if (keyword) {
      window.utools.setSubInputValue(keyword);
    }
  };

  // 聚焦子输入框函数
  const focusSubInput = (delay = 100) => {
    setTimeout(() => {
      window.utools.subInputFocus();
    }, delay);
  };

  // 设置子输入框
  useEffect(() => {
    if (editingItem) {
      // 编辑模式下不显示子输入框
      window.utools.subInputBlur();
      window.utools.removeSubInput();
      return () => {
        // 确保在编辑模式下不会意外显示子输入框
        if (animationDirection !== "slideRight") {
          // 只有在非编辑状态下，才恢复子输入框
          if (searchKeyword) {
            setupSubInput(searchKeyword);
            focusSubInput();
          } else {
            window.utools.removeSubInput();
          }
        }
      };
    } else {
      setupSubInput();

      // 尝试聚焦子输入框，但仅在动画方向为 slideLeft 时（即从转换页面切换过来时）
      if (
        animationDirection === "slideLeft" &&
        !hasInitializedSubInput.current
      ) {
        // 延迟一点聚焦，等动画完成
        setTimeout(() => {
          window.utools.subInputFocus();
          hasInitializedSubInput.current = true;
        }, 200);
      }
    }

    // 页面卸载时清除子输入框
    return () => {
      // 如果是切换到转换页面，在index.jsx中处理子输入框的移除
      if (animationDirection !== "slideRight") {
        window.utools.removeSubInput();
      }
    };
  }, [editingItem, searchKeyword, animationDirection, handleSearchInput]);

  // 当从编辑状态返回非编辑状态时，重新聚焦子输入框
  useEffect(() => {
    if (!editingItem && hasInitializedSubInput.current) {
      focusSubInput();
    }
  }, [editingItem]);

  // 滚动相关函数
  const scrollElementIntoView = (
    element,
    container,
    padding = 20,
    behavior = "smooth"
  ) => {
    if (!element || !container) return;

    const rect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    isManualScrolling.current = true;

    // 如果元素顶部不可见或太靠近顶部，向上滚动
    if (rect.top < containerRect.top + padding) {
      const scrollOffset =
        container.scrollTop + (rect.top - containerRect.top - padding);
      container.scrollTo({
        top: scrollOffset,
        behavior,
      });
    }
    // 如果元素底部超出可视区域，向下滚动
    else if (rect.bottom > containerRect.bottom - padding) {
      const scrollOffset =
        container.scrollTop + (rect.bottom - containerRect.bottom + padding);
      container.scrollTo({
        top: scrollOffset,
        behavior,
      });
    }

    // 滚动完成后重新启用状态更新
    setTimeout(() => {
      isManualScrolling.current = false;
      setHistoryScrollPosition(container.scrollTop);
    }, 300);
  };

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

      if (editingItemElement) {
        scrollElementIntoView(editingItemElement, container);
      }
    }, 100); // 给DOM更新一些时间
  }, [editingItem]);

  // 监听搜索关键字变化
  useEffect(() => {
    // 当搜索关键字被清空但不是通过清除搜索按钮时，也需要重新聚焦
    if (
      searchKeyword === "" &&
      !editingItem &&
      hasInitializedSubInput.current
    ) {
      focusSubInput(50);
    }
  }, [searchKeyword, history, editingItem]);

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
          scrollElementIntoView(
            editingItemElement,
            containerElement,
            20,
            "smooth"
          );
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

          // 滚动到编辑项可见位置
          const containerElement = historyContainerRef.current;
          if (containerElement) {
            scrollElementIntoView(editingItemElement, containerElement);
          }
        }
      }
    }, 0);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingItem(null);
    setEditName("");
    setEditContent("");

    // 恢复搜索框状态
    if (searchKeyword && animationDirection !== "slideRight") {
      setTimeout(() => {
        setupSubInput(searchKeyword);
        focusSubInput(50);
      }, 0);
    }
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

      // 保存当前搜索关键字
      const currentSearchKeyword = searchKeyword;

      // 退出编辑模式
      cancelEdit();

      // 如果有搜索关键字并且不是在向转换页面切换，确保搜索框状态正确恢复
      if (currentSearchKeyword && animationDirection !== "slideRight") {
        setTimeout(() => {
          setupSubInput(currentSearchKeyword);
          focusSubInput(50);
        }, 0);
      }
    } else {
      showToastMessage("修改失败：" + (result?.message || "未知错误"));
    }
  };

  // 清除搜索
  const clearSearch = () => {
    setSearchKeyword("");
    window.utools.setSubInputValue("");

    // 添加对父组件的History状态的引用
    const allHistory = window.utools.db.allDocs("cookie2json/") || [];
    const historyData = allHistory
      .map((doc) => ({
        id: doc._id.replace("cookie2json/", ""),
        content: doc.data.content,
        timestamp: doc.data.timestamp,
        name: doc.data.name,
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 1000);

    // 更新父组件中的history状态
    setHistory(historyData);

    // 确保清除搜索后重新聚焦到子输入框
    focusSubInput(50);
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

  // 删除操作的通用函数
  const handleDeleteResult = (success, newHistory, message) => {
    if (success) {
      // 删除成功，通过状态更新让React管理DOM
      setHistory(newHistory);

      // 如果删除了所有搜索结果，自动清除搜索关键字
      if (searchKeyword && newHistory.length === 0) {
        clearSearch();
      }
      showToastMessage(message);
    } else {
      // 删除失败，移除动画类
      document.querySelectorAll(".history-item.deleting").forEach((item) => {
        item.classList.remove("deleting");
      });
      showToastMessage("删除失败");
    }
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
        const newHistory = history.filter((h) => !selectedItems.has(h.id));
        setSelectedItems(new Set());

        handleDeleteResult(
          true,
          newHistory,
          `成功删除${successCount}条记录${
            failCount > 0 ? `，${failCount}条删除失败` : ""
          }`
        );
      } else {
        handleDeleteResult(false, history, "删除失败");
      }
    }, 250);
  };

  // 删除单条历史记录
  const deleteHistory = (e, item) => {
    e.stopPropagation();

    // 获取点击的记录项元素
    const historyItem = e.currentTarget.closest(".history-item");
    if (historyItem) {
      historyItem.classList.add("deleting");

      // 等待动画完成后再删除
      setTimeout(() => {
        const docId = `cookie2json/${item.id}`;
        const result = window.utools.db.remove(docId);

        if (result?.ok) {
          const newHistory = history.filter((h) => h.id !== item.id);
          handleDeleteResult(true, newHistory, "删除成功");
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
        handleDeleteResult(true, newHistory, "删除成功");
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
      {!editingItem && (
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
            {history.length > 0 && (
              <>
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
              </>
            )}
            {searchKeyword && (
              <button
                className="clear-search-button"
                onClick={clearSearch}
                title="清除搜索"
              >
                <span>清除搜索</span>
              </button>
            )}
          </div>
          {history.length > 0 && (
            <button
              className="batch-delete-button"
              onClick={deleteSelectedHistory}
              disabled={selectedItems.size === 0}
            >
              <span>删除选中({selectedItems.size})</span>
            </button>
          )}
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
            {searchKeyword ? "未找到匹配的历史记录" : "暂无历史记录"}
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
