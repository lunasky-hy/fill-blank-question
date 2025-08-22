import { useState, useMemo } from "react";

const DEFAULT_MARKDOWN = "ここにマークダウンテキストを貼り付け";


function App() {
  // モードを管理するstate ('select' or 'quiz')
  const [viewMode, setViewMode] = useState('select');
  // テキストエディタの原文を保持するstate
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  // 作成された穴埋め問題を保持するstate
  const [quizText, setQuizText] = useState('');
  // 穴埋め対象として選択された単語を保持するstate
  const [selections, setSelections] = useState(new Set());
  // 問題番号と答えの単語を格納するstate
  const [quizAnswers, setQuizAnswers] = useState([]);

  /**
   * プレビューエリアでテキストが選択されたときに呼ばれるハンドラ
   */
  const handleSelection = () => {
    // 単語セレクトモード以外では選択を無効にする
    if (viewMode !== 'select') return;
    
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      setSelections(prev => new Set(prev).add(selectedText));
    }
  };

  /**
   * プレビューエリアがクリックされたときに呼ばれるハンドラ
   */
  const handlePreviewClick = (e) => {
    // 単語セレクトモードで、かつ<mark>タグがクリックされた場合のみ処理
    if (viewMode === 'select' && e.target.tagName === 'MARK') {
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
   * 穴埋め問題のテキストを生成し、答えをstateに保存する関数
   */
  const generateAndSetQuiz = () => {
    if (selections.size === 0) return;

    const wordsToReplace = Array.from(selections);
    let newQuizText = markdown;
    let questionCounter = 1;
    const newAnswers = []; // 解答を一時的に格納する配列

    wordsToReplace.forEach(word => {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedWord, 'g');
      
      // 問題文を生成
      newQuizText = newQuizText.replace(regex, `**( No.${questionCounter} )**`);
      
      // 解答リストに追加
      newAnswers.push({ number: questionCounter, word: word });
      
      questionCounter++;
    });

    setQuizText(newQuizText);
    setQuizAnswers(newAnswers); // 解答リストをstateに保存
    setViewMode('quiz'); // モードを切り替え
  };

  /**
   * プレビュー用に、選択された単語をハイライトしたテキストを生成
   */
  const highlightedText = useMemo(() => {
    if (selections.size === 0) {
      return markdown.replace(/\n/g, '<br />');
    }
    let tempText = markdown;
    const wordsToHighlight = Array.from(selections);
    
    wordsToHighlight.forEach(word => {
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedWord, 'g');
      tempText = tempText.replace(regex, `<mark class="bg-yellow-300 px-1 rounded cursor-pointer">${word}</mark>`);
    });

    return tempText.replace(/\n/g, '<br />');
  }, [markdown, selections]);

  /**
   * 表示するテキストを現在のモードに応じて決定
   */
  const previewContent = useMemo(() => {
    if (viewMode === 'quiz') {
      return quizText.replace(/\n/g, '<br />');
    }
    return highlightedText;
  }, [viewMode, quizText, highlightedText]);

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100 font-sans text-gray-800">
      {/* ヘッダー */}
      <header className="bg-white shadow-md p-4 z-10">
        <h1 className="text-2xl font-bold text-gray-900">Markdown 穴埋め問題メーカー</h1>
        <p className="text-sm text-gray-600">テキストを貼り付け、プレビュー上の単語を選択して問題を作成します。</p>
      </header>

      {/* メインコンテンツ */}
      <main className="flex flex-1 min-h-0 p-4 gap-4">
        {/* 左パネル: テキストエディタ */}
        <div className="flex flex-col w-1/2">
          <div className="flex h-12 justify-between items-center mb-2">
            <label htmlFor="markdown-editor" className="text-lg items-center font-semibold text-gray-700">
              テキストエディタ
            </label>
          </div>
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
          <div className="flex h-12 justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-700">プレビュー</h2>
            {/* モード切替ボタン */}
            <div className="flex rounded-lg border border-gray-300">
              <button
                onClick={() => setViewMode('select')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg transition ${
                  viewMode === 'select' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                単語セレクトモード
              </button>
              <button
                onClick={generateAndSetQuiz}
                disabled={selections.size === 0}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg transition ${
                  viewMode === 'quiz' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                } disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed`}
              >
                穴埋め問題表示モード
              </button>
            </div>
          </div>
          {/* プレビューと解答のコンテナ */}
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            {/* プレビューボックス */}
            <div
              onMouseUp={handleSelection}
              onClick={handlePreviewClick}
              className="flex-1 p-6 border border-gray-300 rounded-lg bg-white shadow-inner overflow-y-auto"
            >
              <div
                  className="break-words"
                  dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            </div>
            {/* 解答ボックス */}
            {viewMode === 'quiz' && quizAnswers.length > 0 && (
              <div className="flex-shrink-0 p-6 border border-gray-300 rounded-lg bg-white shadow-inner overflow-y-auto max-h-48">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">解答</h3>
                <ul className="list-disc list-inside space-y-1">
                  {quizAnswers.map(answer => (
                    <li key={answer.number}>
                      <strong>( No.{answer.number} )</strong>: {answer.word}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App
