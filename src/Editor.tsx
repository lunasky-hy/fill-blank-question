import { useState, useMemo } from "react";

const DEFAULT_MARKDOWN = "ここにマークダウンテキストを貼り付け";

export default function Editor() {
  // マークダウンの原文を保持するstate
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  // 穴埋め対象として選択された単語を保持するstate（Setで重複を防止）
  const [selections, setSelections] = useState(new Set());

  /**
   * プレビューエリアでテキストが選択されたときに呼ばれるハンドラ
   */
  const handleSelection = () => {
    const selectedText = window.getSelection().toString().trim();
    // 選択されたテキストが存在する場合のみ、Setに追加
    if (selectedText) {
      setSelections(prev => new Set(prev).add(selectedText));
    }
  };

  /**
   * プレビューエリアがクリックされたときに呼ばれるハンドラ
   * ハイライトされた単語（<mark>タグ）がクリックされた場合、その単語をハイライトから除外する
   */
  const handlePreviewClick = (e) => {
    if (e.target.tagName === 'MARK') {
      const word = e.target.innerText;
      if (word) {
        setSelections(prev => {
          const newSelections = new Set(prev);
          newSelections.delete(word);
          return newSelections;
        });
      }
    }
  };

  /**
   * 「問題作成」ボタンが押されたときに呼ばれるハンドラ
   */
  const createQuiz = () => {
    if (selections.size === 0) return;

    const wordsToReplace = Array.from(selections);
    // 正規表現で使われる特殊文字をエスケープ
    const escapedWords = wordsToReplace.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    // 選択された全ての単語にマッチする正規表現を作成
    const regex = new RegExp(`(${escapedWords.join('|')})`, 'g');

    let questionCounter = 1;
    // 元のマークダウンテキストに対して、選択された単語を ({番号}) に置換
    const newMarkdown = markdown.replace(regex, (match) => {
      if (wordsToReplace.includes(match)) {
        return `({${questionCounter++}})`;
      }
      return match;
    });

    // stateを更新
    setMarkdown(newMarkdown);
    setSelections(new Set()); // 選択をクリア
  };

  /**
   * プレビュー用に、選択された単語を<mark>タグで囲んだテキストを生成する
   * useMemoを使い、markdownかselectionsが変更された場合のみ再計算する
   */
  const highlightedText = useMemo(() => {
    if (selections.size === 0) {
      // 改行を<br>タグに変換してHTMLとして表示できるようにする
      return markdown.replace(/\n/g, '<br />');
    }

    let tempText = markdown;
    const wordsToHighlight = Array.from(selections);
    
    wordsToHighlight.forEach((word) => {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedWord, 'g');
      // スタイル付きの<mark>タグで単語を囲む
      tempText = tempText.replace(regex, `<mark class="bg-yellow-300 px-1 rounded cursor-pointer">${word}</mark>`);
    });

    // 改行を<br>タグに変換
    return tempText.replace(/\n/g, '<br />');
  }, [markdown, selections]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans text-gray-800">
      {/* ヘッダー */}
      <header className="bg-white shadow-md p-4 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Markdown 穴埋め問題メーカー</h1>
        <p className="text-sm text-gray-600">テキストを貼り付け、プレビュー上の単語を選択して問題を作成します。</p>
      </header>

      {/* メインコンテンツ */}
      <main className="flex flex-1 min-h-0 p-4 gap-4">
        {/* 左パネル: テキストエディタ */}
        <div className="flex flex-col w-1/2">
          <label htmlFor="markdown-editor" className="text-lg font-semibold mb-2 text-gray-700">
            テキストエディタ
          </label>
          <textarea
            id="markdown-editor"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="flex-1 p-4 border border-gray-300 rounded-lg shadow-inner resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            placeholder="ここにテキストを貼り付け..."
          />
        </div>

        {/* 右パネル: プレビューと操作 */}
        <div className="flex flex-col w-1/2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-700">プレビュー</h2>
            <button
              onClick={createQuiz}
              disabled={selections.size === 0}
              className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              問題作成
            </button>
          </div>
          <div
            onMouseUp={handleSelection}
            onClick={handlePreviewClick}
            className="flex-1 p-6 border border-gray-300 rounded-lg bg-white shadow-inner overflow-y-auto"
          >
            {/* テキストをHTMLとして直接表示 */}
            <div
                className="break-words"
                dangerouslySetInnerHTML={{ __html: highlightedText }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}