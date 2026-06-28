import type { StatusMessage } from "../types";

/**
 * 盤面操作・ソルバー実行結果のステータスメッセージを1行で表示する。
 * status が null のときは透明テキストで領域だけ確保し、レイアウトのガタつきを防ぐ。
 */
export function StatusBar({ status }: { status: StatusMessage | null }) {
  return (
    <div
      className={`h-6 mb-2 text-center text-sm font-bold whitespace-nowrap overflow-hidden text-ellipsis transition-all ${
        status ? status.color : "text-transparent"
      }`}
    >
      {status ? status.text : "Ready"}
    </div>
  );
}