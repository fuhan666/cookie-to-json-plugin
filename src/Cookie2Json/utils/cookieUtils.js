export function cookieStringToJson(cookieString) {
	if (!cookieString) return {};
	const obj = {};
	// 分割每个Cookie键值对
	const cookies = cookieString.split("; ");

	cookies.forEach((cookie) => {
		const trimmedCookie = cookie.trim();
		if (!trimmedCookie) return; // 跳过空字符串

		// 分割键和值（处理值中包含等号的情况）
		const equalIndex = trimmedCookie.indexOf("=");
		let key, value;

		if (equalIndex === -1) {
			return
		}
		key = trimmedCookie.slice(0, equalIndex);
		value = trimmedCookie.slice(equalIndex + 1);
		try {
			obj[key.trim()] = decodeURIComponent(value);
		} catch (e) {
			obj[key.trim()] = value;
		}
	});

	return obj;
}

function unescapeString(str, escapeChar) {
	if (!str || !escapeChar) {
		return str;
	}

	let result = '';
	let i = 0;
	while (i < str.length) {
		// 如果当前字符是转译符，且下一个字符存在
		if (str[i] === escapeChar && i + 1 < str.length) {
			// 将转译后的字符添加到结果（跳过转译符本身）
			result += str[i + 1];
			i += 2; // 跳过转译符和转译后的字符
		} else {
			// 直接添加非转译字符或末尾的孤立转译符
			result += str[i];
			i += 1;
		}
	}
	return result;
}

// 删除多余的转义字符
function fixEscapedValue(value) {
	// 处理转义的双引号 \" 变成 "
	value = value.replace(/\\"/g, '"');

	// 处理多重转义的问题 \\" 变成 \"
	value = value.replace(/\\\\/g, '\\');

	return value;
}

export function extractCookieString(str) {
	if (!str.startsWith('curl ')) {
		return str;
	}
	// 处理curl(cmd)中的转义字符
	if (str.startsWith('curl ^"')) {
		str = unescapeString(str, '^');
	}

	const cookies = [];
	const lines = str.split('\n').map(line => line.trim());

	for (const line of lines) {
		// -H 'Cookie: 一些cookie' \
		// --header 'Cookie: 一些cookie' \
		// -H "Cookie: 一些cookie" \
		// --header "Cookie: 一些cookie" \
		const headerMatch = line.match(/(?:-H|--header)\s+(['"]?)(Cookie:\s*.*?)(?=\1\s*(?:\\|,|$)|$)/);
		if (headerMatch) {
			const cookieValue = headerMatch[2].substring("Cookie:".length).trim();
			cookies.push(fixEscapedValue(cookieValue));
			continue;
		}
		// -b '一些cookie'
		// --cookie '一些cookie'
		// -b "一些cookie"
		// --cookie "一些cookie"
		const cookieFlagMatch = line.match(/(?:-b|--cookie)\s+(['"]?)(.*)\1/i);
		if (cookieFlagMatch) {
			cookies.push(fixEscapedValue(cookieFlagMatch[2]));
			continue;
		}
	}

	return cookies.length > 0 ? cookies.join("; ") : str;
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
				/"([^"]+[^\\])":/g,
				'<span class="json-key">"$1"</span><span class="json-colon">:</span>'
			)
			// 替换字符串值
			.replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
	);
} 