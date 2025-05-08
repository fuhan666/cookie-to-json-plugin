import { useState, useEffect } from "react";
import ConvertPage from "./components/ConvertPage";
import HistoryPage from "./components/HistoryPage";
import {
  cookieStringToJson,
  extractCookieString,
  highlightJson,
} from "./utils/cookieUtils";
import "./style.css";

export default function Cookie2Json({ enterAction }) {
  const [cookieString, setCookieString] = useState("");
  const [jsonResult, setJsonResult] = useState("");
  const [highlightedJson, setHighlightedJson] = useState("");
  const [theme, setTheme] = useState("light");
  const [showToast, setShowToast] = useState("");
  const [activeTab, setActiveTab] = useState("convert"); // 'convert' or 'history'
  const [history, setHistory] = useState([]);
  const [lastInputContent, setLastInputContent] = useState(""); // 添加新的状态来保存最后的输入内容
  const [selectedItems, setSelectedItems] = useState(new Set()); // 添加选中项的状态
  const [animationDirection, setAnimationDirection] = useState("fadeIn"); // 'fadeIn', 'slideLeft', 'slideRight'
  // 记录编辑历史记录状态
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [editContent, setEditContent] = useState("");

  const [historyScrollPosition, setHistoryScrollPosition] = useState(0); // 记录历史记录页面滚动位置
  // 搜索相关状态
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filteredHistory, setFilteredHistory] = useState([]);

  // 处理通过正则匹配进入插件时的自动填充
  useEffect(() => {
    if (enterAction && enterAction.type === "regex" && enterAction.payload) {
      const inputText = enterAction.payload;

      try {
        let cookieStr = extractCookieString(inputText);
        const result = cookieStringToJson(cookieStr);
        const formattedJson = JSON.stringify(result, null, 2);

        // 更新所有状态，但标记为非用户输入引起的变化
        setCookieString(inputText);
        setLastInputContent(inputText);
        setJsonResult(formattedJson);
        setHighlightedJson(highlightJson(formattedJson));
      } catch (error) {
        const errorMessage = "转换出错：" + error.message;
        setJsonResult(errorMessage);
        setHighlightedJson(highlightJson(errorMessage));
      }
    }
  }, [enterAction]);

  // 初始化时从数据库加载历史记录
  useEffect(() => {
    const allDocs = window.utools.db.allDocs("cookie2json/") || [];
    const historyData = allDocs
      .map((doc) => ({
        id: doc._id.replace("cookie2json/", ""),
        content: doc.data.content,
        timestamp: doc.data.timestamp,
        name: doc.data.name,
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 1000); // 只保留最近1000条记录
    setHistory(historyData);
    setFilteredHistory(historyData); // 初始化过滤后的历史记录

    if (activeTab === "convert") {
      window.utools.removeSubInput();
    }
  }, [activeTab]);

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

  // 处理搜索关键字变化，过滤历史记录
  useEffect(() => {
    if (searchKeyword.trim() === "") {
      setFilteredHistory(history);
      return;
    }

    const keyword = searchKeyword.toLowerCase();
    const filtered = history.filter((item) => {
      return (
        (item.content && item.content.toLowerCase().includes(keyword)) ||
        (item.name && item.name.toLowerCase().includes(keyword))
      );
    });

    setFilteredHistory(filtered);
  }, [searchKeyword, history]);

  // 处理搜索输入变化
  const handleSearchInput = ({ text }) => {
    setSearchKeyword(text);
    // 确保搜索框在删除文字后保持聚焦
    if (activeTab === "history" && text === "") {
      setTimeout(() => {
        window.utools.subInputFocus();
      }, 10);
    }
  };

  // 显示Toast消息
  const showToastMessage = (message) => {
    setShowToast(message);
    setTimeout(() => setShowToast(""), 2000);
  };

  // 保存到历史记录
  const saveToHistory = (name = "") => {
    if (!cookieString) return;

    const timestamp = Date.now();
    const docId = `cookie2json/${timestamp}`;
    const doc = {
      _id: docId,
      data: {
        content: cookieString,
        timestamp: timestamp,
        name: name,
      },
    };

    const result = window.utools.db.put(doc);
    if (result?.ok) {
      const newHistory = [
        {
          id: timestamp,
          content: cookieString,
          timestamp: timestamp,
          name: name,
        },
        ...history,
      ].slice(0, 1000); // 只保留最近1000条记录

      // 如果历史记录超过1000条，删除多余的记录
      if (history.length >= 1000) {
        const oldDocs = window.utools.db
          .allDocs("cookie2json/")
          .sort((a, b) => b.data.timestamp - a.data.timestamp)
          .slice(1000);
        oldDocs.forEach((doc) => {
          window.utools.db.remove(doc._id);
        });
      }

      setHistory(newHistory);
      setFilteredHistory(newHistory); // 更新过滤后的历史记录
      showToastMessage("已保存到历史记录");
    } else {
      showToastMessage("保存失败：" + (result?.message || "未知错误"));
    }
  };

  // 从历史记录中加载
  const loadFromHistory = (item) => {
    setAnimationDirection("slideRight");
    setActiveTab("convert");
    setLastInputContent(item.content);
    handleInputChange({ target: { innerText: item.content } });
    window.utools.removeSubInput();
  };

  // 处理输入框内容变化
  const handleInputChange = (e) => {
    const value = e.target?.innerText || "";
    setCookieString(value);
    setLastInputContent(value); // 保存最后的输入内容
    try {
      let cookieStr = extractCookieString(value);
      const result = cookieStringToJson(cookieStr);
      const formattedJson = JSON.stringify(result, null, 2);
      setJsonResult(formattedJson);
      setHighlightedJson(highlightJson(formattedJson));
    } catch (error) {
      const errorMessage = "转换出错：" + error.message;
      setJsonResult(errorMessage);
      setHighlightedJson(highlightJson(errorMessage));
    }
  };

  return (
    <div className="cookie2json-container">
      {showToast && <div className="toast-message">{showToast}</div>}

      <div className="tab-container">
        <div
          className={`tab-item ${activeTab === "convert" ? "active" : ""}`}
          onClick={() => {
            if (activeTab !== "convert") {
              setAnimationDirection("slideRight"); // 从历史记录切换到转换页面
              setActiveTab("convert");
              setSelectedItems(new Set());
              window.utools.removeSubInput();
            }
          }}
        >
          转JSON
        </div>
        <div
          className={`tab-item ${activeTab === "history" ? "active" : ""}`}
          onClick={() => {
            if (activeTab !== "history") {
              setAnimationDirection("slideLeft"); // 从转换页面切换到历史记录
              setActiveTab("history");
            }
          }}
        >
          历史记录
        </div>
      </div>

      {activeTab === "convert" && (
        <ConvertPage
          cookieString={cookieString}
          setCookieString={setCookieString}
          jsonResult={jsonResult}
          setJsonResult={setJsonResult}
          highlightedJson={highlightedJson}
          setHighlightedJson={setHighlightedJson}
          lastInputContent={lastInputContent}
          setLastInputContent={setLastInputContent}
          showToastMessage={showToastMessage}
          handleInputChange={handleInputChange}
          saveToHistory={saveToHistory}
          animationDirection={animationDirection}
        />
      )}

      {activeTab === "history" && (
        <HistoryPage
          history={filteredHistory}
          setHistory={setHistory}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          loadFromHistory={loadFromHistory}
          showToastMessage={showToastMessage}
          animationDirection={animationDirection}
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          editName={editName}
          setEditName={setEditName}
          editContent={editContent}
          setEditContent={setEditContent}
          historyScrollPosition={historyScrollPosition}
          setHistoryScrollPosition={setHistoryScrollPosition}
          searchKeyword={searchKeyword}
          setSearchKeyword={setSearchKeyword}
          handleSearchInput={handleSearchInput}
        />
      )}
    </div>
  );
}
