export function convertCookieToJson(cookieString) {
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

export function extractCookieFromCurl(value) {
	if (typeof value !== "string") return value;

	if (value.startsWith("curl --location")) {
		const match = value.match(/--header 'Cookie: (.+?)'/g);
		if (match) {
			return match[0].replace(/--header 'Cookie: (.+?)'/g, "$1");
		}
	}
	return value;
}

// 高亮JSON语法
export function highlightJson(json) {
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
			.replace(/: ([0-9]+)([,}\n])/g, ': <span class="json-number">$1</span>$2')
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