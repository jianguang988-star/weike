export function getCurrentDateContext() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  return [
    `当前日期时间：${formatter.format(now)}（北京时间）`,
    "所有推荐跟进时间必须以当前日期为基准。",
    "不得输出早于当前日期的年份或日期。",
    "如果用户说“今天/明天/后天/周末”，必须换算到当前年份。"
  ].join("\n");
}
