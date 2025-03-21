import { useState, useEffect } from "react";
import ConvertPage from "./components/ConvertPage";
import HistoryPage from "./components/HistoryPage";
import {
  convertCookieToJson,
  extractCookieFromCurl,
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

  // 初始化时从数据库加载历史记录
  useEffect(() => {
    const allDocs = window.utools.db.allDocs("cookie2json/") || [];
    const historyData = allDocs
      .map((doc) => ({
        id: doc._id.replace("cookie2json/", ""),
        content: doc.data.content,
        timestamp: doc.data.timestamp,
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 1000); // 只保留最近1000条记录
    setHistory(historyData);
  }, []);

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
    if (result.ok) {
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
      showToastMessage("已保存到历史记录");
    } else {
      showToastMessage("保存失败：" + (result.message || "未知错误"));
    }
  };

  // 从历史记录中加载
  const loadFromHistory = (item) => {
    setActiveTab("convert");
    setLastInputContent(item.content);
    handleInputChange({ target: { innerText: item.content } });
  };

  // 处理输入框内容变化
  const handleInputChange = (e) => {
    const value = e.target?.innerText || "";
    setCookieString(value);
    setLastInputContent(value); // 保存最后的输入内容
    try {
      let cookieStr = extractCookieFromCurl(value);
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

  return (
    <div className="cookie2json-container">
      {showToast && <div className="toast-message">{showToast}</div>}

      <div className="tab-container">
        <div
          className={`tab-item ${activeTab === "convert" ? "active" : ""}`}
          onClick={() => {
            if (activeTab !== "convert") {
              setActiveTab("convert");
              setSelectedItems(new Set()); // 清空选中状态
            }
          }}
        >
          转JSON
        </div>
        <div
          className={`tab-item ${activeTab === "history" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("history");
          }}
        >
          历史记录
        </div>
      </div>

      {activeTab === "convert" ? (
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
        />
      ) : (
        <HistoryPage
          history={history}
          setHistory={setHistory}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          loadFromHistory={loadFromHistory}
          showToastMessage={showToastMessage}
        />
      )}
    </div>
  );
}
